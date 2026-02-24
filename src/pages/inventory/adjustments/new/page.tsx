import { Spin, Button } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconArrowLeft,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconAdjustments,
  IconChevronDown} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Product {
  id: string;
  label: string;
  variants: {
    variantId: string;
    variantName: string;
    sizes: string[];
  }[];
  availableSizes: string[];
}

interface Stock {
  id: string;
  label: string;
}

interface AdjustmentItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  stockId: string;
  stockName: string;
  destinationStockId?: string;
  destinationStockName?: string;
}

const TYPE_OPTIONS: { value: AdjustmentType; label: string }[] = [
  { value: "add", label: "Stock Addition" },
  { value: "remove", label: "Stock Removal" },
  { value: "damage", label: "Damaged Goods" },
  { value: "return", label: "Customer Return" },
  { value: "transfer", label: "Stock Transfer" },
];

const NewAdjustmentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [type, setType] = useState<AdjustmentType>("add");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<AdjustmentItem[]>([]);

  // Item form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [stockId, setStockId] = useState("");
  const [destinationStockId, setDestinationStockId] = useState("");

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {

      const [productsRes, stocksRes] = await Promise.all([
        api.get<Product[]>("/api/v1/erp/catalog/products/dropdown"),
        api.get<Stock[]>("/api/v1/erp/catalog/stocks/dropdown"),
      ]);

      setProducts(productsRes.data);
      setStocks(stocksRes.data);
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

  const handleAddItem = () => {
    if (!selectedProduct || !size || quantity <= 0 || !stockId) {
      toast("Please fill all item fields");
      return;
    }

    if (type === "transfer" && !destinationStockId) {
      toast.error("Please select destination stock for transfer");
      return;
    }

    const product = products.find((p) => p.id === selectedProduct);
    const stock = stocks.find((s) => s.id === stockId);
    const destStock = stocks.find((s) => s.id === destinationStockId);

    // Find variant name if selected
    let variantName = "";
    if (selectedVariant && product) {
      const v = product.variants.find((v) => v.variantId === selectedVariant);
      if (v) variantName = v.variantName;
    }

    if (!product || !stock) return;

    const newItem: AdjustmentItem = {
      productId: product.id,
      productName: product.label,
      variantId: selectedVariant || undefined,
      variantName: variantName || undefined,
      size,
      quantity,
      stockId: stock.id,
      stockName: stock.label,
      ...(type === "transfer" && destStock
        ? {
            destinationStockId: destStock.id,
            destinationStockName: destStock.label}
        : {})};

    setItems([...items, newItem]);
    setSelectedProduct("");
    setSelectedVariant("");
    setSize("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async (status: "DRAFT" | "SUBMITTED") => {
    if (!reason.trim()) {
      toast("Please enter a reason");
      return;
    }
    if (items.length === 0) {
      toast("Please add at least one item");
      return;
    }

    setSaving(true);
    try {

      await api.post(
        "/api/v1/erp/inventory/adjustments",
        { type, reason, notes, items, status }
      );

      toast.error(
        `Adjustment ${status === "DRAFT" ? "saved as draft" : "submitted"}`);
      navigate("/inventory/adjustments");
    } catch (error) {
      console.error(error);
      toast("Failed to create adjustment");
    } finally {
      setSaving(false);
    }
  };

  // Helper to get available sizes
  const getAvailableSizes = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return [];

    if (selectedVariant) {
      const v = product.variants.find((v) => v.variantId === selectedVariant);
      return v ? v.sizes : [];
    }

    // If product has variants but none selected, show nothing or all?
    // Usually if variants exist, user MUST select variant.
    if (product.variants && product.variants.length > 0) return [];

    return product.availableSizes || [];
  };

  const currentProduct = products.find((p) => p.id === selectedProduct);
  const showVariantSelect =
    currentProduct &&
    currentProduct.variants &&
    currentProduct.variants.length > 0;
  const availableSizes = getAvailableSizes();

  if (loading) {
    return (
      <PageContainer title="New Adjustment">
        <div className="flex justify-center py-20">
          <div className="flex justify-center py-12"><Spin size="large" /></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="New Adjustment">
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <IconArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-lg md:text-2xl font-bold  tracking-tight text-gray-900">
              New Adjustment
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Adjust stock levels
            </p>
          </div>
        </div>

        {/* Type & Reason */}
        <div className="bg-white border border-gray-200 p-4 md:p-6 space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block text-xs font-bold   text-gray-500 mb-1.5 md:mb-2">
                Adjustment Type *
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as AdjustmentType)}
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <IconChevronDown size={16} />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold   text-gray-500 mb-1.5 md:mb-2">
                Reason *
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Physical count correction"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold   text-gray-500 mb-1.5 md:mb-2">
              Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional additional notes"
              className="w-full px-3 md:px-4 py-2.5 md:py-3 border border-gray-300 text-sm focus:outline-none focus:border-gray-200"
            />
          </div>
        </div>

        {/* Add Item - Mobile Stacked, Desktop Grid */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-xs md:text-sm font-bold   text-gray-900">
              Add Items
            </h3>
          </div>
          <div className="p-4 md:p-6 space-y-3 md:space-y-0 md:grid md:grid-cols-6 md:gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1 md:hidden">
                Product
              </label>
              <div className="relative">
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    setSelectedVariant("");
                    setSize("");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <IconChevronDown size={16} />
                </div>
              </div>
            </div>

            {showVariantSelect && (
              <div className="md:col-span-1">
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Variant
                </label>
                <div className="relative">
                  <select
                    value={selectedVariant}
                    onChange={(e) => {
                      setSelectedVariant(e.target.value);
                      setSize("");
                    }}
                    className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                  >
                    <option value="">Select Variant</option>
                    {currentProduct?.variants.map((v) => (
                      <option key={v.variantId} value={v.variantId}>
                        {v.variantName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <IconChevronDown size={16} />
                  </div>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-2 gap-3 md:contents`}>
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Size
                </label>
                {/* Dynamic Size Input Logic */}
                {(() => {
                  // Case 1: Product has variants, but none selected yet -> Disabled Select
                  if (
                    currentProduct &&
                    currentProduct.variants &&
                    currentProduct.variants.length > 0 &&
                    !selectedVariant
                  ) {
                    return (
                      <div className="relative">
                        <select
                          disabled
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none bg-gray-50 appearance-none text-gray-400"
                        >
                          <option>Select Variant First</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-400">
                          <IconChevronDown size={16} />
                        </div>
                      </div>
                    );
                  }

                  // Case 2: Available sizes exist (either from variant or simple product with sizes) -> Select
                  if (availableSizes.length > 0) {
                    return (
                      <div className="relative">
                        <select
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                        >
                          <option value="">Select Size</option>
                          {availableSizes.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                          <IconChevronDown size={16} />
                        </div>
                      </div>
                    );
                  }

                  // Case 3: No sizes available (simple product without pre-defined sizes) -> Text Input
                  // Note: We might want to still encourage a size for adjustments?
                  // If product/variant selected but no fixed sizes, user types it manually.
                  return (
                    <input
                      type="text"
                      placeholder="Size (e.g. XL, 42)"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200"
                    />
                  );
                })()}
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Qty
                </label>
                <input
                  type="number"
                  placeholder="Qty"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1 md:hidden">
                Stock Location
              </label>
              <div className="relative">
                <select
                  value={stockId}
                  onChange={(e) => setStockId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                >
                  <option value="">Select Stock</option>
                  {stocks.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                  <IconChevronDown size={16} />
                </div>
              </div>
            </div>
            {type === "transfer" && (
              <div>
                <label className="block text-xs text-gray-500 mb-1 md:hidden">
                  Destination
                </label>
                <div className="relative">
                  <select
                    value={destinationStockId}
                    onChange={(e) => setDestinationStockId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:border-gray-200 appearance-none bg-white"
                  >
                    <option value="">To Stock</option>
                    {stocks
                      .filter((s) => s.id !== stockId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                    <IconChevronDown size={16} />
                  </div>
                </div>
              </div>
            )}
            <div className={type === "transfer" ? "md:col-span-6" : ""}>
              <Button type="primary" size="large" onClick={handleAddItem}>Add</Button>
            </div>
          </div>
        </div>

        {/* Items - Card on Mobile, Table on Desktop */}
        {items.length > 0 && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500  bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold ">
                      Product
                    </th>
                    <th className="px-6 py-3 font-bold ">Size</th>
                    <th className="px-6 py-3 font-bold  text-right">
                      Qty
                    </th>
                    <th className="px-6 py-3 font-bold ">
                      Stock
                    </th>
                    {type === "transfer" && (
                      <th className="px-6 py-3 font-bold ">
                        Destination
                      </th>
                    )}
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {item.productName}
                        {item.variantName && (
                          <span className="block text-xs text-gray-500 font-normal">
                            {item.variantName}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">{item.size}</td>
                      <td className="px-6 py-4 text-right font-bold">
                        {type === "add" || type === "return" ? "+" : "-"}
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4">{item.stockName}</td>
                      {type === "transfer" && (
                        <td className="px-6 py-4">
                          {item.destinationStockName}
                        </td>
                      )}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-red-600 hover:bg-red-50"
                        >
                          <IconTrash size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex justify-between items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {item.productName}
                      {item.variantName && (
                        <span className="block text-xs text-gray-500 font-normal">
                          {item.variantName}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Size: {item.size} • {item.stockName}
                      {type === "transfer" && ` → ${item.destinationStockName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm ${
                        type === "add" || type === "return"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {type === "add" || type === "return" ? "+" : "-"}
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={() => handleSave("DRAFT")}
            disabled={saving}
            className="w-full md:w-auto px-6 md:px-8 py-3 border border-gray-200 text-black text-xs font-bold   hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 mr-2"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave("SUBMITTED")}
            disabled={saving}
            className="w-full md:w-auto px-6 md:px-8 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Spin size="small" />
            ) : (
              <IconAdjustments size={14} />
            )}
            Submit Adjustment
          </button>
        </div>
      </div>
    </PageContainer>
  );
};

export default NewAdjustmentPage;
