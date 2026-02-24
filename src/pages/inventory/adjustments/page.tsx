import type { ColumnsType } from 'antd/es/table';
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Form, Input, Select, Button, Space, Spin, Table, Tag } from "antd";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconAdjustments,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import {
  ADJUSTMENT_STATUS_COLORS,
  ADJUSTMENT_STATUS_LABELS,
  AdjustmentStatus,
} from "@/model/InventoryAdjustment";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  reason: string;
  items: { productName: string; quantity: number }[];
  status: AdjustmentStatus;
  createdAt: string;
}

const TYPE_LABELS: Record<AdjustmentType, string> = {
  add: "Stock Addition",
  remove: "Stock Removal",
  damage: "Damaged Goods",
  return: "Customer Return",
  transfer: "Stock Transfer",
};

const TYPE_COLORS: Record<AdjustmentType, string> = {
  add: "bg-green-100 text-green-800",
  remove: "bg-red-100 text-red-800",
  damage: "bg-orange-100 text-orange-800",
  return: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
};

const AdjustmentsPage = () => {
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [form] = Form.useForm();

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      const res = await api.get<Adjustment[]>(
        "/api/v1/erp/inventory/adjustments",
        { params },
      );
      setAdjustments(res.data);
    } catch {
      toast.error("Failed to fetch adjustments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, typeFilter]);

  const filteredAdjustments = adjustments.filter(
    (a) =>
      a.adjustmentNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.reason.toLowerCase().includes(search.toLowerCase()),
  );
  const columns: ColumnsType<any> = [
    {title: 'Adjustment #', key: 'adjustment', render: (_, adj) => (<><span className="font-mono font-bold text-gray-900">
                          {adj.adjustmentNumber}
                        </span></>) },
    {title: 'Type', key: 'type', render: (_, adj) => (<><span
                          className={`px-2 py-1 text-xs font-bold  ${
                            TYPE_COLORS[adj.type] || "bg-gray-100"
                          }`}
                        >
                          {TYPE_LABELS[adj.type] || adj.type}
                        </span></>) },
    {title: 'Status', key: 'status', render: (_, adj) => (<><span
                          className={`px-2 py-1 text-xs font-bold  rounded-full ${
                            ADJUSTMENT_STATUS_COLORS[adj.status] ||
                            "bg-gray-100"
                          }`}
                        >
                          {ADJUSTMENT_STATUS_LABELS[adj.status] || adj.status}
                        </span></>) },
    {title: 'Reason', key: 'reason', render: (_, adj) => (<>{adj.reason}</>) },
    {title: 'Items', key: 'items', render: (_, adj) => (<>{adj.items?.length || 0} items</>) },
    {title: 'Actions', key: 'actions', render: (_, adj) => (<><Link
                          to={`/inventory/adjustments/${adj.id}`}
                          className="p-2 hover:bg-gray-100 inline-flex transition-colors"
                        >
                          <IconEye size={16} />
                        </Link></>) },
  ];

  return (
    <PageContainer title="Inventory Adjustments">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold  tracking-tight text-gray-900">
              Inventory Adjustments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage stock additions, removals, and transfers
            </p>
          </div>
          <Link
            to="/inventory/adjustments/new"
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            New Adjustment
          </Link>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={(values) => {
              setSearch(values.search || "");
              setTypeFilter(values.type || "");
            }}
            initialValues={{ search: "", type: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search by ID or reason..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-44">
              <Select>
                <Select.Option value="">All Types</Select.Option>
                <Select.Option value="add">Stock Addition</Select.Option>
                <Select.Option value="remove">Stock Removal</Select.Option>
                <Select.Option value="damage">Damaged Goods</Select.Option>
                <Select.Option value="return">Customer Return</Select.Option>
                <Select.Option value="transfer">Stock Transfer</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={() => {
                    form.resetFields();
                    setSearch("");
                    setTypeFilter("");
                  }}
                >
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex justify-center py-12"><Spin size="large" /></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table 
            columns={columns}
            dataSource={filteredAdjustments}
            rowKey={(r: any) => r.id || r.date || r.month || Math.random().toString()}
            pagination={{ pageSize: 15 }}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
          />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default AdjustmentsPage;
