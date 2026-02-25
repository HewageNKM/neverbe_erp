import { Spin, Button, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconPlus,
  IconTrash,
  IconLoader2,
  IconArrowLeft,
  IconShoppingCart,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  label: "block text-xs font-bold text-gray-500   mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer ",
  primaryBtn:
    "flex items-center justify-center px-6 py-4 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-all rounded-lg shadow-sm hover:shadow-md disabled:opacity-50",
  secondaryBtn:
    "flex items-center justify-center px-6 py-4 border border-gray-200 rounded-lg shadow-sm text-green-700 bg-green-50 hover:bg-green-100 text-xs font-bold   hover:bg-gray-50 transition-all rounded-lg disabled:opacity-50",
  iconBtn:
    "w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-green-600 hover:border-gray-200 hover:text-white transition-colors disabled:opacity-30",
};

interface Supplier {
  id: string;
  label: string;
}

interface Product {
  id: string;
  label: string;
  buyingPrice?: number;
}

interface Stock {
  id: string;
  label: string;
}

interface Variant {
  id: string;
  label: string;
  sizes?: string[];
}

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

const NewPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dropdown Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [availableVariants, setAvailableVariants] = useState<Variant[]>([]);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [globalSizes, setGlobalSizes] = useState<string[]>([]); // Store global sizes
  const [productsMap, setProductsMap] = useState<Record<string, Product>>({});

  // Form State
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [stockId, setStockId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<POItem[]>([]);

  // Item Entry State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [suppliersRes, productsRes, stocksRes, sizesRes] =
        await Promise.all([
          api.get<Supplier[]>(
            "/api/v1/erp/procurement/suppliers?dropdown=true",
          ),
          api.get<Product[]>("/api/v1/erp/catalog/products/dropdown"),
          api.get<Stock[]>("/api/v1/erp/catalog/stocks/dropdown"),
          api.get<{ id: string; label: string }[]>(
            "/api/v1/erp/catalog/sizes/dropdown",
          ),
        ]);
      setSuppliers(suppliersRes.data);
      setProducts(productsRes.data);
      setStocks(stocksRes.data);

      const allSizes = sizesRes.data.map((s) => s.label);
      setGlobalSizes(allSizes);
      setAvailableSizes(allSizes);

      const map: Record<string, Product> = {};
      productsRes.data.forEach((p) => {
        map[p.id] = p;
      });
      setProductsMap(map);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  // Fetch variants when product changes
  useEffect(() => {
    const fetchVariants = async () => {
      setAvailableVariants([]);

      if (selectedProduct) {
        try {
          // Fetch variants
          const variantsRes = await api.get<Variant[]>(
            `/api/v1/erp/catalog/products/${selectedProduct}/variants/dropdown`,
          );
          setAvailableVariants(variantsRes.data || []);
        } catch (e) {
          console.error("Failed to fetch product details", e);
        }
      }
    };

    if (selectedProduct) {
      fetchVariants();
    } else {
      setAvailableVariants([]);
    }

    // Reset dependant fields
    setSelectedVariant("");
    setSelectedSize("");
    setAvailableSizes(globalSizes); // Reset to global sizes initially
  }, [selectedProduct, globalSizes]);

  // Update sizes when variant changes
  useEffect(() => {
    if (selectedVariant && availableVariants.length > 0) {
      // Find selected variant
      const variant = availableVariants.find((v) => v.id === selectedVariant);
      if (variant && variant.sizes && variant.sizes.length > 0) {
        setAvailableSizes(variant.sizes);
      } else {
        // Fallback to global sizes if no specific sizes on variant
        setAvailableSizes(globalSizes);
      }
    } else {
      // If no variant selected, use global sizes
      setAvailableSizes(globalSizes);
    }
  }, [selectedVariant, availableVariants, globalSizes]);

  const handleSupplierChange = (id: string) => {
    setSupplierId(id);
    const supplier = suppliers.find((s) => s.id === id);
    setSupplierName(supplier?.label || "");
  };

  const handleProductChange = (id: string) => {
    setSelectedProduct(id);
    const product = productsMap[id];
    setUnitCost(product?.buyingPrice || 0);
  };

  const handleAddItem = () => {
    if (!selectedProduct || !selectedSize || quantity <= 0) {
      toast("Please select Product, Size and valid Quantity");
      return;
    }

    const product = productsMap[selectedProduct];
    if (!product) return;

    // Find variant name if selected
    const variant = availableVariants.find((v) => v.id === selectedVariant);

    const newItem: POItem = {
      productId: product.id,
      productName: product.label,
      variantId: selectedVariant || undefined,
      variantName: variant?.label, // Use label as variant name
      size: selectedSize,
      quantity,
      unitCost,
      totalCost: quantity * unitCost,
    };

    setItems([...items, newItem]);

    setQuantity(1);
    // Keep Unit Cost same
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.totalCost, 0);

  const handleSave = async (status: "draft" | "sent") => {
    if (!supplierId) {
      toast("Please select a supplier");
      return;
    }
    if (items.length === 0) {
      toast("Please add at least one item");
      return;
    }

    const action = status === "draft" ? "Save Draft" : "Create & Send";

    showConfirmation({
      title: `${action.toUpperCase()} PURCHASE ORDER?`,
      message: `Are you sure you want to ${
        status === "draft" ? "save this draft" : "create and send this order"
      }? Total amount: Rs ${totalAmount.toLocaleString()}`,
      variant: "default",
      onSuccess: async () => {
        setSaving(true);
        try {
          await api.post("/api/v1/erp/procurement/purchase-orders", {
            supplierId,
            supplierName,
            stockId,
            expectedDate,
            notes,
            items,
            status,
          });
          toast.error(
            status === "draft" ? "PO SAVED AS DRAFT" : "PO CREATED AND SENT",
          );
          navigate("/inventory/purchase-orders");
        } catch (error) {
          console.error(error);
          toast("Failed to create PO");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="New Purchase Order">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
          <span className="text-xs font-bold   text-gray-400 mt-4">
            Loading Resources
          </span>
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<POItem> = [
    {
      title: "Product",
      dataIndex: "productName",
      key: "productName",
      render: (text) => <span className="font-bold text-black">{text}</span>,
    },
    {
      title: "Variant",
      dataIndex: "variantName",
      key: "variantName",
      render: (text) => (
        <span className="text-gray-600 text-xs">{text || "-"}</span>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center",
      render: (text) => <span className="font-mono text-xs">{text}</span>,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center",
      render: (qty) => <span className="font-bold">{qty}</span>,
    },
    {
      title: "Unit Range",
      dataIndex: "unitCost",
      key: "unitCost",
      align: "right",
      render: (cost) => (
        <span className="font-mono text-xs text-gray-500">Rs {cost}</span>
      ),
    },
    {
      title: "Total",
      dataIndex: "totalCost",
      key: "totalCost",
      align: "right",
      render: (total) => (
        <span className="font-bold">Rs {total.toLocaleString()}</span>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      render: (_, __, idx) => (
        <button
          onClick={() => handleRemoveItem(idx as number)}
          className="text-gray-400 hover:text-red-600 transition-colors"
        >
          <IconTrash size={16} />
        </button>
      ),
    },
  ];

  return (
    <PageContainer title="New Purchase Order">
      <div className="w-full space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-gray-200 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-bold  text-gray-500  mb-1 flex items-center gap-2">
              <IconShoppingCart size={14} /> Procurement
            </span>
            <h2 className="text-3xl font-bold  tracking-tighter text-black leading-none">
              New Purchase Order
            </h2>
          </div>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* 1. Supplier & Logistics */}
            <div className="bg-white p-6 border border-gray-200 shadow-sm">
              <h3 className="text-xs font-bold   text-gray-400 mb-6 border-b border-gray-100 pb-2">
                Logistics Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={styles.label}>
                    Supplier <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">SELECT SUPPLIER</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Receive to Stock</label>
                  <select
                    value={stockId}
                    onChange={(e) => setStockId(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">SELECT WAREHOUSE/STORE</option>
                    {stocks.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.label}>Expected Date</label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div>
                  <label className={styles.label}>Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="OPTIONAL NOTES..."
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* 2. Item Entry */}
            <div className="bg-gray-50 p-6 border border-gray-200">
              <h3 className="text-xs font-bold   text-gray-400 mb-6 border-b border-gray-200 pb-2">
                Add Products
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-4">
                  <label className={styles.label}>Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => handleProductChange(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">SELECT PRODUCT</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={styles.label}>Variant</label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className={styles.select}
                    disabled={availableVariants.length === 0}
                  >
                    <option value="">
                      {availableVariants.length > 0 ? "SELECT..." : "NONE"}
                    </option>
                    {availableVariants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={styles.label}>Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className={styles.select}
                    disabled={!selectedProduct}
                  >
                    <option value="">SELECT</option>
                    {availableSizes.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={styles.label}>Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className={styles.input}
                  />
                </div>

                <div className="md:col-span-2">
                  <Button
                    type="primary"
                    size="large"
                    onClick={handleAddItem}
                  ></Button>
                </div>
              </div>

              {/* Additional Cost Field Row if needed, for now putting unit cost below or next to qty if space permits */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <label className={styles.label}>Unit Cost (Rs)</label>
                  <input
                    type="number"
                    min={0}
                    value={unitCost}
                    onChange={(e) =>
                      setUnitCost(parseFloat(e.target.value) || 0)
                    }
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="bg-white border border-gray-200">
              <Table
                columns={columns}
                dataSource={items}
                rowKey={(item, idx) => idx as number}
                pagination={false}
                summary={() => {
                  if (items.length === 0) return null;
                  return (
                    <Table.Summary>
                      <Table.Summary.Row className="bg-gray-50 text-xs text-right font-bold border-t-2 border-gray-200">
                        <Table.Summary.Cell
                          index={0}
                          colSpan={5}
                          className="p-4"
                        >
                          Total Amount
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} className="p-4 text-xl">
                          Rs {totalAmount.toLocaleString()}
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  );
                }}
              />
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-green-600 text-white p-6 shadow-xl">
                <h4 className="text-sm font-bold   mb-2 opacity-70">
                  Estimated Total
                </h4>
                <div className="text-4xl font-bold tracking-tighter leading-none mb-1">
                  Rs {(totalAmount / 1000).toFixed(1)}k
                </div>
                <div className="text-sm opacity-50 font-mono">
                  {totalAmount.toLocaleString()} LKR
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 space-y-4">
                <button
                  onClick={() => handleSave("sent")}
                  disabled={saving}
                  className={`${styles.primaryBtn} w-full`}
                >
                  {saving ? <Spin size="small" /> : "CREATE & SEND ORDER"}
                </button>
                <button
                  onClick={() => handleSave("draft")}
                  disabled={saving}
                  className={`${styles.secondaryBtn} w-full`}
                >
                  SAVE AS DRAFT
                </button>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 text-xs text-yellow-800  font-bold tracking-wide leading-relaxed">
                <span className="block mb-1 text-lg">⚠️</span>
                Please verify all quantities and costs before sending. Once
                sent, the order cannot be edited directly; distinct GRNs must be
                created.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default NewPurchaseOrderPage;
