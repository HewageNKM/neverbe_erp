import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Tag } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IconArrowLeft, IconCheck } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface GRNItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  size: string;
  orderedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
  stockId: string;
}

interface GRN {
  id: string;
  grnNumber: string;
  purchaseOrderId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: GRNItem[];
  totalAmount: number;
  notes?: string;
  receivedBy?: string;
  receivedDate: string;
  inventoryUpdated: boolean;
}

const ViewGRNPage = () => {
  const navigate = useNavigate();
  const params = useParams();
  const grnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [grn, setGRN] = useState<GRN | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRN = async () => {
    setLoading(true);
    try {
      const res = await api.get<GRN>(`/api/v1/erp/inventory/grn/${grnId}`);
      setGRN(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch GRN");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && grnId) fetchGRN();
  }, [currentUser, grnId]);

  if (loading) {
    return (
      <PageContainer title="GRN">
        <div className="flex justify-center py-20">
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN">
        <div className="text-center py-20 text-gray-500">GRN not found</div>
      </PageContainer>
    );
  }

  const columns: ColumnsType<GRNItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, item) => <>{item.productName}</>,
    },
    { title: "Size", key: "size", render: (_, item) => <>{item.size}</> },
    {
      title: "Ordered",
      key: "ordered",
      align: "right",
      render: (_, item) => <>{item.orderedQuantity}</>,
    },
    {
      title: "Received",
      key: "received",
      align: "right",
      render: (_, item) => <>{item.receivedQuantity}</>,
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
    <PageContainer title={grn.grnNumber}>
      <div className="w-full space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <IconArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold  tracking-tight text-gray-900">
                {grn.grnNumber}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                PO: {grn.poNumber} | {grn.supplierName}
              </p>
            </div>
          </div>
          {grn.inventoryUpdated && (
            <span className="px-4 py-2 bg-green-100 text-green-800 text-xs font-bold  flex items-center gap-2">
              <IconCheck size={14} />
              Inventory Updated
            </span>
          )}
        </div>

        {/* Details */}
        <div className="bg-white border border-gray-200 p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold  text-gray-500">Supplier</p>
              <p className="font-medium text-gray-900">{grn.supplierName}</p>
            </div>
            <div>
              <p className="text-xs font-bold  text-gray-500">PO Number</p>
              <p className="font-mono font-medium text-gray-900">
                {grn.poNumber}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold  text-gray-500">Received Date</p>
              <p className="font-medium text-gray-900">{grn.receivedDate}</p>
            </div>
            <div>
              <p className="text-xs font-bold  text-gray-500">Total Value</p>
              <p className="font-bold text-gray-900 text-lg">
                Rs {grn.totalAmount.toLocaleString()}
              </p>
            </div>
          </div>
          {grn.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-bold  text-gray-500">Notes</p>
              <p className="text-gray-600">{grn.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-bold   text-gray-900">
              Received Items
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={grn.items}
              rowKey={(r: any) =>
                r.id || r.date || r.month || Math.random().toString()
              }
              pagination={{ pageSize: 15 }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewGRNPage;
