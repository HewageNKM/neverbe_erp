import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Form, Input, Button, Space, Table } from "antd";
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
import NewGRNModal from "./components/NewGRNModal";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleFilterSubmit = (values: { search: string }) => {
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
  const columns: ColumnsType<GRN> = [
    {
      title: "GRN Number",
      key: "gRNNumber",
      render: (_, grn) => (
        <>
          <span className="font-mono font-bold text-gray-900">
            {grn.grnNumber}
          </span>
        </>
      ),
    },
    {
      title: "PO Number",
      key: "pONumber",
      render: (_, grn) => (
        <>
          <span className="font-mono text-gray-600">{grn.poNumber}</span>
        </>
      ),
    },
    {
      title: "Supplier",
      key: "supplier",
      render: (_, grn) => <>{grn.supplierName}</>,
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, grn) => <>Rs {grn.totalAmount.toLocaleString()}</>,
    },
    {
      title: "Received Date",
      key: "receivedDate",
      align: "right",
      render: (_, grn) => <>{grn.receivedDate}</>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, grn) => (
        <>
          <Link
            to={`/inventory/grn/${grn.id}`}
            className="p-2 hover:bg-gray-100 inline-flex rounded-lg transition-colors"
          >
            <IconEye size={16} />
          </Link>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Goods Received Notes">
      <div className="w-full space-y-6">
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-green-500 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Inventory Control
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Goods Received Notes
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl h-11 px-6 bg-green-600 hover:bg-green-700 border-none"
          >
            New GRN
          </Button>
        </div>

        <NewGRNModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchGRNs();
          }}
        />

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

        {/* Table */}
        <div className="mt-6">
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={filteredGRNs}
            loading={loading}
            rowKey={(r: GRN) => r.id}
            pagination={{ pageSize: 15 }}
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm"
          />
        </div>
      </div>
    </PageContainer>
  );
};

export default GRNListPage;
