import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {  Card, Form, Input, Button, Space , Spin } from "antd";
import {
  IconEye,
  IconSearch,
  IconPlus,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface GRN {
  id: string;
  grnNumber: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  receivedDate: string;
  receivedBy?: string;
}

const GRNListPage = () => {
  const [loading, setLoading] = useState(true);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [search, setSearch] = useState("");
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: any) => {
    setSearch(values.search || "");
  };

  const handleClearFilters = () => {
    form.resetFields();
    setSearch("");
  };

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchGRNs = async () => {
    setLoading(true);
    try {
      const res = await api.get<GRN[]>("/api/v1/erp/inventory/grn");
      setGRNs(res.data);
    } catch {
      toast.error("Failed to fetch GRNs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchGRNs();
  }, [currentUser]);

  const filteredGRNs = grns.filter(
    (g) =>
      g.grnNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      g.supplierName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageContainer title="Goods Received Notes">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold  tracking-tight text-gray-900">
              Goods Received Notes
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Track received goods from suppliers
            </p>
          </div>
          <Link
            to="/inventory/grn/new"
            className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
          >
            <IconPlus size={16} />
            New GRN
          </Link>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ search: "" }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[200px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search by GRN#, PO#, or supplier..."
                allowClear
              />
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
          <div className="flex justify-center py-20">
            <div className="flex justify-center py-12"><Spin size="large" /></div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500  bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-bold ">GRN Number</th>
                    <th className="px-6 py-3 font-bold ">PO Number</th>
                    <th className="px-6 py-3 font-bold ">Supplier</th>
                    <th className="px-6 py-3 font-bold  text-right">Amount</th>
                    <th className="px-6 py-3 font-bold ">Received Date</th>
                    <th className="px-6 py-3 font-bold  text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredGRNs.map((grn) => (
                    <tr
                      key={grn.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-gray-900">
                          {grn.grnNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-gray-600">
                          {grn.poNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {grn.supplierName}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900">
                        Rs {grn.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {grn.receivedDate}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/inventory/grn/${grn.id}`}
                          className="p-2 hover:bg-gray-100 inline-flex transition-colors"
                        >
                          <IconEye size={16} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {filteredGRNs.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No GRNs found
                      </td>
                    </tr>
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

export default GRNListPage;
