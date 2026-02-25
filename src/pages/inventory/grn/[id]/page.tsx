import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Card, Descriptions, Tag, Typography } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { IconCheck } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

import { GRN_STATUS_COLORS, GRN_STATUS_LABELS } from "@/model/GRN";

const { Text, Title } = Typography;

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
  status: string;
}

const ViewGRNPage = () => {
  const params = useParams();
  const grnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [grn, setGRN] = useState<GRN | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRN = useCallback(async () => {
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
  }, [grnId]);

  useEffect(() => {
    if (currentUser && grnId) fetchGRN();
  }, [currentUser, grnId, fetchGRN]);

  if (loading) {
    return (
      <PageContainer title="GRN">
        <div className="flex justify-center py-20">
          <Spin size="large" />
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
      <div className="space-y-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Link
            to="/inventory/grn"
            className="!text-green-600 hover:!text-green-700 font-medium transition-colors"
          >
            Goods Received
          </Link>
          <span className="text-gray-300">/</span>
          <Text strong className="text-gray-700">
            GRN #{grn.grnNumber}
          </Text>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 pb-8">
          <div>
            <Text className="block text-[10px] uppercase font-bold tracking-widest text-green-600 mb-2">
              Goods Received Note Overview
            </Text>
            <Title
              level={2}
              className="!m-0 !text-3xl font-black tracking-tight text-gray-900"
            >
              #{grn.grnNumber}
            </Title>
          </div>
          <div className="flex items-center gap-3">
            {grn.inventoryUpdated && (
              <Tag
                color="success"
                className="px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider flex items-center gap-2"
              >
                <IconCheck size={14} />
                Inventory Updated
              </Tag>
            )}
            <Tag
              className={`px-4 py-1.5 text-xs font-bold rounded-full border-none uppercase tracking-wider ${
                GRN_STATUS_COLORS[grn.status as any] ||
                "bg-blue-100 text-blue-800"
              }`}
            >
              {GRN_STATUS_LABELS[grn.status as any] || grn.status}
            </Tag>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  Received Items ({grn.items?.length || 0})
                </span>
              }
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none"
              styles={{
                header: {
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                },
              }}
            >
              <div className="overflow-x-auto">
                <Table
                  columns={columns}
                  dataSource={grn.items}
                  rowKey={(r: GRNItem) =>
                    r.productId + (r.variantId || "") + r.size
                  }
                  pagination={false}
                  size="small"
                  className="rounded-xl overflow-hidden ant-table-fluid"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Insight */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            <Card
              title={
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  GRN Insight
                </span>
              }
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-none border-t-4 border-t-green-500"
              styles={{
                header: {
                  borderBottom: "1px solid #f1f5f9",
                  background: "#f8fafc",
                },
              }}
            >
              <Descriptions
                bordered
                column={1}
                size="small"
                labelStyle={{
                  fontWeight: 600,
                  background: "#f8fafc",
                  width: "140px",
                  fontSize: "11px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#64748b",
                }}
              >
                <Descriptions.Item label="Supplier">
                  <Text strong className="text-gray-900 uppercase text-[10px]">
                    {grn.supplierName}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="PO Number">
                  <Link
                    to={`/inventory/purchase-orders/${grn.purchaseOrderId}`}
                    className="!text-green-600 font-bold text-xs"
                  >
                    #{grn.poNumber}
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="Received By">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-[10px] font-bold text-green-600 border border-green-100">
                      {(grn.receivedBy || "S").charAt(0)}
                    </div>
                    <Text className="text-xs font-bold text-gray-700">
                      {grn.receivedBy || "System Admin"}
                    </Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Received Date">
                  <Text className="text-xs font-medium text-gray-600">
                    {grn.receivedDate}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Total Value">
                  <Text className="text-xl font-black text-green-700">
                    Rs {grn.totalAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                {grn.notes && (
                  <Descriptions.Item label="Reception Notes">
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 border-dashed">
                      <Text className="text-sm text-gray-600 leading-relaxed italic">
                        "{grn.notes}"
                      </Text>
                    </div>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ViewGRNPage;
