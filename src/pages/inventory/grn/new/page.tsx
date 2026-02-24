import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Tag } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  IconArrowLeft,
  IconLoader2,
  IconPackage,
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
};

interface POItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  quantity: number;
  receivedQuantity?: number;
  unitCost: number;
  totalCost: number;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: POItem[];
  stockId?: string;
}

interface Stock {
  id: string;
  label: string;
}

interface GRNItemInput {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  previouslyReceived: number;
  unitCost: number;
  stockId: string;
}

const NewGRNPageContent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPOId = searchParams.get("poId");
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);

  const [selectedPOId, setSelectedPOId] = useState(preselectedPOId || "");
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // Default fields
  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GRNItemInput[]>([]);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [posRes, stocksRes] = await Promise.all([
        api.get<PurchaseOrder[]>(
          "/api/v1/erp/procurement/purchase-orders?pending=true",
        ),
        api.get<Stock[]>("/api/v1/erp/catalog/stocks/dropdown"),
      ]);
      setPendingPOs(posRes.data);
      setStocks(stocksRes.data);

      if (preselectedPOId) {
        const po = posRes.data.find((p) => p.id === preselectedPOId);
        if (po) loadPOItems(po);
      }
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

  const loadPOItems = (po: PurchaseOrder) => {
    setSelectedPO(po);
    // Use PO's stock ID as default for items update if logic permits,
    // but individual items might go to different stocks conceptually.
    // Here we'll default all items to the PO's preferred stock or the first available one.
    const defaultStockId =
      po.stockId || (stocks.length > 0 ? stocks[0].id : "");

    const grnItems: GRNItemInput[] = po.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      variantId: item.variantId,
      variantName: item.variantName,
      size: item.size,
      orderedQuantity: item.quantity,
      previouslyReceived: item.receivedQuantity || 0,
      receivedQuantity: item.quantity - (item.receivedQuantity || 0), // Default to remaining qty
      unitCost: item.unitCost,
      stockId: defaultStockId,
    }));

    setItems(grnItems);
  };

  const handlePOChange = (poId: string) => {
    setSelectedPOId(poId);
    const po = pendingPOs.find((p) => p.id === poId);
    if (po) {
      loadPOItems(po);
    } else {
      setSelectedPO(null);
      setItems([]);
    }
  };

  const handleQuantityChange = (index: number, value: number) => {
    const remaining =
      items[index].orderedQuantity - items[index].previouslyReceived;
    const qty = Math.max(0, Math.min(value, remaining));

    setItems(
      items.map((item, i) =>
        i === index ? { ...item, receivedQuantity: qty } : item,
      ),
    );
  };

  const handleStockChange = (index: number, value: string) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, stockId: value } : item,
      ),
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.receivedQuantity * item.unitCost,
    0,
  );

  const handleSave = async () => {
    if (!selectedPO) {
      toast("Please select a purchase order");
      return;
    }

    const validItems = items.filter((item) => item.receivedQuantity > 0);
    if (validItems.length === 0) {
      toast("Please enter received quantities");
      return;
    }

    for (const item of validItems) {
      if (!item.stockId) {
        toast.success(`Please select stock location for ${item.productName}`);
        return;
      }
    }

    showConfirmation({
      title: "CONFIRM GRN CREATION?",
      message: `Are you sure you want to receive these goods? Total Value: Rs ${totalAmount.toLocaleString()}. This will update inventory levels.`,
      variant: "default",
      onSuccess: async () => {
        setSaving(true);
        try {
          await api.post("/api/v1/erp/inventory/grn", {
            purchaseOrderId: selectedPO.id,
            poNumber: selectedPO.poNumber,
            supplierId: selectedPO.supplierId,
            supplierName: selectedPO.supplierName,
            receivedDate,
            notes,
            items: validItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              variantId: item.variantId,
              variantName: item.variantName,
              size: item.size,
              orderedQuantity: item.orderedQuantity,
              receivedQuantity: item.receivedQuantity,
              unitCost: item.unitCost,
              totalCost: item.receivedQuantity * item.unitCost,
              stockId: item.stockId,
            })),
          });

          toast("GRN CREATED SUCCESSFULLY");
          navigate("/inventory/grn");
        } catch (error) {
          console.error(error);
          toast.error("Failed to create GRN");
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="New GRN">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
          <span className="text-xs font-bold   text-gray-400 mt-4">
            Loading Pending Orders
          </span>
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<GRNItemInput> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => <>{item.productName}</>,
    },
    {
      title: "Variant",
      key: "variant",
      render: (_, item) => <>{item.variantName || "-"}</>,
    },
    {
      title: "Size",
      key: "size",
      align: "center",
      render: (_, item) => <>{item.size}</>,
    },
    {
      title: "Ordered",
      key: "ordered",
      align: "right",
      render: (_, item) => <>{item.orderedQuantity}</>,
    },
    {
      title: "Prev",
      key: "prev",
      align: "right",
      render: (_, item) => <>{item.previouslyReceived}</>,
    },
    {
      title: "Receiving",
      key: "receiving",
      render: (_, item, index) => {
        const remaining = item.orderedQuantity - item.previouslyReceived;
        return (
          <div className="flex items-center justify-center">
            <input
              type="number"
              min={0}
              max={remaining}
              value={item.receivedQuantity}
              onChange={(e) =>
                handleQuantityChange(index, Number(e.target.value))
              }
              className="w-24 bg-white border border-gray-200 rounded-lg focus:border-gray-200 px-3 py-2 text-center font-bold outline-none transition-colors rounded-lg"
            />
            <span className="ml-2 text-xs text-gray-400 font-bold">
              / {remaining}
            </span>
          </div>
        );
      },
    },
    {
      title: "Location",
      key: "location",
      render: (_, item, index) => (
        <select
          value={item.stockId}
          onChange={(e) => handleStockChange(index, e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg focus:border-gray-200 px-2 py-2 text-xs font-medium outline-none transition-colors rounded-lg "
        >
          <option value="">Select</option>
          {stocks.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      title: "Total",
      key: "total",
      render: (_, item) => (
        <>Rs {(item.receivedQuantity * item.unitCost).toLocaleString()}</>
      ),
    },
  ];

  return (
    <PageContainer title="New GRN">
      <div className="w-full space-y-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 border-b-2 border-gray-200 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center border border-gray-200 hover:bg-green-600 hover:text-white transition-colors"
          >
            <IconArrowLeft size={20} stroke={2} />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-bold  text-gray-500  mb-1 flex items-center gap-2">
              <IconShoppingCart size={14} /> Procurement
            </span>
            <h2 className="text-3xl font-bold  tracking-tighter text-black leading-none">
              Receive Goods (GRN)
            </h2>
          </div>
        </div>

        {/* PO Selection & Details */}
        <div className="bg-white p-6 border border-gray-200 shadow-sm">
          <h3 className="text-xs font-bold   text-gray-400 mb-6 border-b border-gray-100 pb-2">
            Order Selection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={styles.label}>
                Purchase Order <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedPOId}
                onChange={(e) => handlePOChange(e.target.value)}
                className={styles.select}
              >
                <option value="">SELECT PENDING ORDER</option>
                {pendingPOs.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} - {po.supplierName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.label}>Received Date</label>
              <input
                type="date"
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className={styles.input}
              />
            </div>
            <div>
              <label className={styles.label}>Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="OPTIONAL..."
                className={styles.input}
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        {selectedPO && items.length > 0 && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-xs font-bold   text-gray-400">
                Receive Items
              </h3>
            </div>

            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={items}
                rowKey={(r: any) =>
                  r.id || r.date || r.month || Math.random().toString()
                }
                pagination={{ pageSize: 15 }}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
              />
            </div>
          </div>
        )}

        {/* Action Panel */}
        {selectedPO && (
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className={styles.primaryBtn}
            >
              {saving ? (
                <Spin size="small" />
              ) : (
                <IconPackage size={18} className="mr-2" />
              )}
              CONFIRM RECEIPT & UPDATE INVENTORY
            </button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

const NewGRNPage = () => {
  return (
    <Suspense
      fallback={
        <PageContainer title="New GRN">
          <div className="flex justify-center py-20">
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          </div>
        </PageContainer>
      }
    >
      <NewGRNPageContent />
    </Suspense>
  );
};

export default NewGRNPage;
