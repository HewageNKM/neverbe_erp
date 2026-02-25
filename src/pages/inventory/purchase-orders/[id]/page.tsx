import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Tag } from "antd";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconPackage,
  IconLoader2,
  IconSend,
  IconX,
  IconFileInvoice,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { useParams } from "react-router-dom";
import {
  PurchaseOrder,
  PO_STATUS_COLORS,
  PO_STATUS_LABELS,
  PurchaseOrderStatus,
} from "@/model/PurchaseOrder";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";

// --- NIKE AESTHETIC STYLES ---
const styles = {
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-all rounded-lg shadow-sm hover:shadow-md disabled:opacity-50",
  secondaryBtn:
    "flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg shadow-sm text-green-700 bg-green-50 hover:bg-green-100 text-xs font-bold   hover:bg-gray-50 transition-all rounded-lg disabled:opacity-50",
  dangerBtn:
    "flex items-center justify-center px-6 py-3 border border-transparent bg-red-600 text-white text-xs font-bold   hover:bg-red-700 transition-all rounded-lg disabled:opacity-50",
};

const ViewPurchaseOrderPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const poId = params.id as string;
  const { showConfirmation } = useConfirmationDialog();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [po, setPO] = useState<PurchaseOrder | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchPO = async () => {
    setLoading(true);
    try {
      const res = await api.get<PurchaseOrder>(
        `/api/v1/erp/procurement/purchase-orders/${poId}`,
      );
      setPO(res.data);
    } catch (error) {
      console.error(error);
      toast.success("Failed to fetch purchase order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && poId) fetchPO();
  }, [currentUser, poId]);

  const handleUpdateStatus = (status: PurchaseOrderStatus) => {
    const action = status === "sent" ? "Send to Supplier" : "Cancel Order";
    const isDestructive = status === "cancelled";

    showConfirmation({
      title: `${action.toUpperCase()}?`,
      message: `Are you sure you want to ${action.toLowerCase()}? ${
        status === "sent"
          ? "This will mark the order as sent."
          : "This action cannot be undone."
      }`,
      variant: isDestructive ? "danger" : "default",
      onSuccess: async () => {
        setUpdating(true);
        try {
          await api.put(`/api/v1/erp/procurement/purchase-orders/${poId}`, {
            status,
          });
          toast.error(`Order ${status === "sent" ? "Sent" : "Cancelled"}`);
          fetchPO();
        } catch (error) {
          console.error(error);
          toast("Failed to update status");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-40">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
          <span className="text-xs font-bold   text-gray-400 mt-4">
            Loading Order Details
          </span>
        </div>
      </PageContainer>
    );
  }

  if (!po) {
    return (
      <PageContainer title="Purchase Order">
        <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-gray-200 m-8">
          <IconFileInvoice className="text-gray-300 mb-4" size={48} />
          <div className="text-center text-gray-400 font-bold  ">
            Purchase order not found
          </div>
        </div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<any> = [
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
      align: "center",
      render: (_, item) => <>{item.quantity}</>,
    },
    {
      title: "Received",
      key: "received",
      render: (_, item) => (
        <>
          <span
            className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full ${
              (item.receivedQuantity || 0) >= item.quantity
                ? "bg-green-100 text-green-700"
                : (item.receivedQuantity || 0) > 0
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-gray-100 text-gray-400"
            }`}
          >
            {item.receivedQuantity || 0}
          </span>
        </>
      ),
    },
    {
      title: "Unit Cost",
      key: "unitCost",
      align: "right",
      render: (_, item) => <>Rs {item.unitCost}</>,
    },
    {
      title: "Total",
      key: "total",
      render: (_, item) => <>Rs {item.totalCost.toLocaleString()}</>,
    },
  ];

  return (
    <PageContainer title={po.poNumber}>
      <div className="w-full space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-gray-200 pb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center border border-gray-200 text-green-600 hover:bg-green-600 hover:text-white transition-colors"
            >
              <IconArrowLeft size={20} stroke={2} />
            </button>
            <div>
              <span className="text-xs font-bold  text-gray-500  mb-1 flex items-center gap-2">
                <IconFileInvoice size={14} /> Purchase Order
              </span>
              <h2 className="text-3xl font-bold  tracking-tighter text-black leading-none">
                {po.poNumber}
              </h2>
              <p className="text-sm font-bold text-gray-500 mt-1  tracking-wide">
                {po.supplierName}
              </p>
            </div>
          </div>
          <span
            className={`px-4 py-2 text-xs font-bold   border ${
              PO_STATUS_COLORS[po.status] || "bg-gray-100 border-gray-200"
            }`}
          >
            {PO_STATUS_LABELS[po.status] || po.status}
          </span>
        </div>

        {/* Details Grid */}
        <div className="bg-white border border-gray-200 p-8 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-xs font-bold   text-gray-400 mb-1">Supplier</p>
              <p className="font-bold text-black  tracking-wide text-sm">
                {po.supplierName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold   text-gray-400 mb-1">
                Expected Date
              </p>
              <p className="font-bold text-black  tracking-wide text-sm">
                {po.expectedDate || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold   text-gray-400 mb-1">
                Total Amount
              </p>
              <p className="font-bold text-black text-lg tracking-tight">
                Rs {po.totalAmount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold   text-gray-400 mb-1">Notes</p>
              <p className="font-medium text-gray-600 text-sm truncate">
                {po.notes || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="text-xs font-bold   text-gray-400">Order Items</h3>
            <span className="text-xs font-bold text-black  tracking-wide">
              {po.items.length} Items
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table scroll={{ x: 'max-content' }}
              columns={columns}
              dataSource={po.items}
              rowKey={(r: any) =>
                r.id || r.date || r.month || Math.random().toString()
              }
              pagination={{ pageSize: 15 }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-4 p-6 bg-gray-50 border border-gray-200">
          {po.status === "draft" && (
            <>
              <button
                onClick={() => handleUpdateStatus("sent")}
                disabled={updating}
                className={styles.primaryBtn}
              >
                {updating ? (
                  <Spin size="small" />
                ) : (
                  <IconSend size={16} className="mr-2" />
                )}
                Send to Supplier
              </button>
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                disabled={updating}
                className={`${styles.dangerBtn} bg-red-600 border-red-600 hover:bg-red-700`}
              >
                <IconX size={16} className="mr-2" />
                Cancel Order
              </button>
            </>
          )}
          {(po.status === "sent" || po.status === "partial") && (
            <Link
              to={`/inventory/grn/new?poId=${po.id}`}
              className={styles.primaryBtn}
            >
              <IconPackage size={16} className="mr-2" />
              Receive Goods (GRN)
            </Link>
          )}
          {po.status === "received" && (
            <div className="flex items-center text-green-700 font-bold   text-xs bg-green-50 px-4 py-2 border border-gray-200">
              <IconPackage size={16} className="mr-2" />
              Order Fully Received
            </div>
          )}
          {po.status === "cancelled" && (
            <div className="flex items-center text-red-700 font-bold   text-xs bg-red-50 px-4 py-2 border border-red-200">
              <IconX size={16} className="mr-2" />
              Order Cancelled
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewPurchaseOrderPage;
