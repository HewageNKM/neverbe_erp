import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {  Card, Form, Input, Select, Button, Space , Spin } from "antd";
import {
  IconPlus,
  IconEye,
  IconSearch,
  IconFilter,
  IconShoppingCart,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { PO_STATUS_COLORS, PO_STATUS_LABELS } from "@/model/PurchaseOrder";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: string;
  totalAmount: number;
  expectedDate?: string;
  createdAt: string;
}

// --- NIKE AESTHETIC STYLES ---
const styles = {
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium pl-12 pr-8 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer ",
  primaryBtn:
    "flex items-center justify-center px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-all rounded-lg shadow-sm hover:shadow-md",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-green-600 hover:border-gray-200 hover:text-white transition-colors",
};

const PurchaseOrdersPage = () => {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: any) => {
    setSearch(values.search || "");
    setStatusFilter(values.status || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
    setStatusFilter("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<PurchaseOrder[]>(
        "/api/v1/erp/procurement/purchase-orders",
        { params },
      );
      setOrders(res.data);
    } catch {
      toast.error("Failed to fetch purchase orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [currentUser, statusFilter]);

  const filteredOrders = orders.filter(
    (o) =>
      o.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer title="Purchase Orders">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-gray-200 pb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold  text-gray-500  mb-1 flex items-center gap-2">
              <IconShoppingCart size={14} /> Procurement
            </span>
            <h2 className="text-4xl font-bold text-black  tracking-tighter leading-none">
              Purchase Orders
            </h2>
          </div>
          <Link
            to="/inventory/purchase-orders/new"
            className={styles.primaryBtn}
          >
            <IconPlus size={16} className="mr-2" />
            New Order
          </Link>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "", status: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search PO Number or Supplier..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-40">
              <Select>
                <Select.Option value="">All Status</Select.Option>
                <Select.Option value="draft">Draft</Select.Option>
                <Select.Option value="sent">Sent</Select.Option>
                <Select.Option value="partial">Partial</Select.Option>
                <Select.Option value="received">Received</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
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
                <Button icon={<IconX size={15} />} onClick={handleClearFilters}>
                  Clear
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex justify-center py-12"><Spin size="large" /></div>
            <span className="text-xs font-bold   text-gray-400 mt-4">
              Loading Orders
            </span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-white text-xs font-bold text-gray-400   border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-5">PO Number</th>
                    <th className="px-6 py-5">Supplier</th>
                    <th className="px-6 py-5 text-center">Status</th>
                    <th className="px-6 py-5 text-right">Amount</th>
                    <th className="px-6 py-5 text-right">Expected</th>
                    <th className="px-6 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-20 text-center text-gray-400 text-xs font-bold  "
                      >
                        No purchase orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((po) => (
                      <tr
                        key={po.id}
                        className="hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <span className="font-mono font-bold text-black text-xs  tracking-wide">
                            {po.poNumber}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-bold text-gray-700  text-xs tracking-wide">
                          {po.supplierName}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span
                            className={`px-3 py-1 text-xs font-bold   border ${
                              PO_STATUS_COLORS[po.status] ||
                              "bg-gray-100 border-gray-200"
                            }`}
                          >
                            {PO_STATUS_LABELS[po.status] || po.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right font-bold text-black">
                          Rs {po.totalAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-5 text-right text-gray-500 text-xs font-bold ">
                          {po.expectedDate || "-"}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all">
                            <Link
                              to={`/inventory/purchase-orders/${po.id}`}
                              className={styles.iconBtn}
                              title="View Details"
                            >
                              <IconEye size={16} stroke={2} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default PurchaseOrdersPage;
