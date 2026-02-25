import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { Card, Form, Input, Select, Button, Space, Table } from "antd";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
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
import NewAdjustmentModal from "./components/NewAdjustmentModal";

type AdjustmentType = "add" | "remove" | "damage" | "return" | "transfer";

interface Adjustment {
  id: string;
  adjustmentNumber: string;
  type: AdjustmentType;
  reason: string;
  items: { productName: string; quantity: number }[];
  status: AdjustmentStatus;
  createdAt: string;
  adjustedByName?: string;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 15,
    total: 0,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchAdjustments = useCallback(
    async (values?: any) => {
      setLoading(true);
      try {
        const filters = values || form.getFieldsValue();
        const params: Record<string, any> = {
          page: pagination.current,
          size: pagination.pageSize,
        };

        if (filters.search) params.search = filters.search;
        if (filters.type) params.type = filters.type;
        if (filters.status) params.status = filters.status;

        const res = await api.get<{ dataList: Adjustment[]; rowCount: number }>(
          "/api/v1/erp/inventory/adjustments",
          { params },
        );
        setAdjustments(res.data.dataList || []);
        setPagination((prev) => ({
          ...prev,
          total: res.data.rowCount || 0,
        }));
      } catch {
        toast.error("Failed to fetch adjustments");
      } finally {
        setLoading(false);
      }
    },
    [pagination.current, pagination.pageSize, form],
  );

  useEffect(() => {
    if (currentUser) fetchAdjustments();
  }, [currentUser, fetchAdjustments]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchAdjustments(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };
  const columns: ColumnsType<Adjustment> = [
    {
      title: "Adjustment #",
      key: "adjustment",
      render: (_, adj) => (
        <>
          <span className="font-mono font-bold text-gray-900">
            {adj.adjustmentNumber}
          </span>
        </>
      ),
    },
    {
      title: "Date",
      key: "date",
      render: (_, adj) => dayjs(adj.createdAt).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "Type",
      key: "type",
      render: (_, adj) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              TYPE_COLORS[adj.type] || "bg-gray-100"
            }`}
          >
            {TYPE_LABELS[adj.type] || adj.type}
          </span>
        </>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, adj) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              ADJUSTMENT_STATUS_COLORS[adj.status] || "bg-gray-100"
            }`}
          >
            {ADJUSTMENT_STATUS_LABELS[adj.status] || adj.status}
          </span>
        </>
      ),
    },
    { title: "Reason", key: "reason", render: (_, adj) => <>{adj.reason}</> },
    {
      title: "Adjusted By",
      key: "adjustedBy",
      render: (_, adj) => (
        <span className="text-gray-600">{adj.adjustedByName || "-"}</span>
      ),
    },
    {
      title: "Items",
      key: "items",
      render: (_, adj) => <>{adj.items?.length || 0} items</>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, adj) => (
        <>
          <Link
            to={`/inventory/adjustments/${adj.id}`}
            className="p-2 hover:bg-gray-100 inline-flex rounded-lg transition-colors"
          >
            <IconEye size={16} />
          </Link>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Inventory Adjustments">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-gray-100 pb-8">
          <div>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-green-600 mb-2">
              Inventory Control
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-gray-900 m-0">
              Inventory Adjustments
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage stock additions, removals, and transfers
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
            className="rounded-full px-6 font-bold text-xs uppercase tracking-wider bg-green-600 hover:bg-green-700 border-none h-auto py-3"
          >
            New Adjustment
          </Button>
        </div>

        <NewAdjustmentModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchAdjustments();
          }}
        />

        {/* Filters */}
        <Card
          size="small"
          className="border-none bg-gray-50/50 rounded-2xl shadow-none mt-6"
        >
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", type: "" }}
            className="flex flex-wrap items-center gap-3 w-full p-2"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[240px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search by ID or reason..."
                allowClear
                className="rounded-xl border-gray-200 h-10"
              />
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-48">
              <Select className="h-10 rounded-xl" placeholder="Select Type">
                <Select.Option value="">All Types</Select.Option>
                <Select.Option value="add">Stock Addition</Select.Option>
                <Select.Option value="remove">Stock Removal</Select.Option>
                <Select.Option value="damage">Damaged Goods</Select.Option>
                <Select.Option value="return">Customer Return</Select.Option>
                <Select.Option value="transfer">Stock Transfer</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-44">
              <Select className="h-10 rounded-xl" placeholder="Select Status">
                <Select.Option value="">All Status</Select.Option>
                <Select.Option value="DRAFT">Draft</Select.Option>
                <Select.Option value="SUBMITTED">Submitted</Select.Option>
                <Select.Option value="APPROVED">Approved</Select.Option>
                <Select.Option value="REJECTED">Rejected</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item className="!mb-0">
              <Space size="middle">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={15} />}
                  className="rounded-xl h-10 font-bold px-6 bg-gray-900 border-none hover:bg-black"
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={15} />}
                  onClick={handleClearFilters}
                  className="rounded-xl h-10 font-bold border-gray-200"
                >
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Table Container */}
        <div className="mt-8 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={adjustments}
            loading={loading}
            rowKey={(r: Adjustment) => r.id}
            pagination={pagination}
            onChange={handleTableChange}
            size="middle"
            className="rounded-2xl overflow-hidden ant-table-fluid"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default AdjustmentsPage;
