import type { ColumnsType } from "antd/es/table";
import { Spin, Table, Tag } from "antd";
import { Card, Form, Input, Select, Button, Space } from "antd";
import React, { useState, useEffect } from "react";
import {
  IconEye,
  IconPlus,
  IconTrash,
  IconPencil,
  IconFilter,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconLoader,
  IconWallet,
  IconSearch,
} from "@tabler/icons-react";
import { PettyCash } from "@/model/PettyCash";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { EXPENSE_CATEGORIES } from "@/utils/expenseCategories";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import PettyCashFormModal from "./components/PettyCashFormModal";
import PettyCashViewModal from "./components/PettyCashViewModal";
import PageContainer from "../../components/container/PageContainer";

// --- STYLES ---
const styles = {
  label: "block text-xs font-bold text-gray-500   mb-2",
  input:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none placeholder:text-gray-400",
  select:
    "block w-full bg-[#f5f5f5] text-gray-900 text-sm font-medium px-4 py-3 rounded-lg border border-transparent focus:bg-white focus:border-gray-200 transition-all duration-200 outline-none appearance-none cursor-pointer",
  filterButton:
    "flex items-center justify-center px-6 py-3 bg-green-600 text-white text-xs font-bold   hover:bg-gray-800 transition-all",
  clearButton:
    "flex items-center justify-center px-6 py-3 border border-gray-200 rounded-lg text-gray-500 text-xs font-bold   hover:border-gray-200 hover:text-black transition-all bg-white",
  iconBtn:
    "w-8 h-8 flex items-center justify-center border border-gray-200 hover:bg-green-600 hover:border-gray-200 hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-300",
};

export default function PettyCashList() {
  const [pettyCashList, setPettyCashList] = useState<PettyCash[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PettyCash | null>(null);

  // Filters state
  const [form] = Form.useForm();

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    status: "ALL",
    type: "ALL",
    category: "ALL",
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const { showConfirmation } = useConfirmationDialog();

  useEffect(() => {
    if (currentUser) fetchPettyCash();
  }, [page, currentUser, appliedFilters]);

  const fetchPettyCash = async () => {
    try {
      setLoading(true);
      let url = `/api/v1/erp/finance/petty-cash?page=${page}&size=10`;

      if (appliedFilters.search)
        url += `&search=${encodeURIComponent(appliedFilters.search)}`;
      if (appliedFilters.status !== "ALL")
        url += `&status=${appliedFilters.status}`;
      if (appliedFilters.type !== "ALL") url += `&type=${appliedFilters.type}`;
      if (appliedFilters.category !== "ALL")
        url += `&category=${encodeURIComponent(appliedFilters.category)}`;

      const res = await fetch(url);

      const data = await res.json();
      setPettyCashList(data.data || []);
      setTotalPages(Math.ceil((data.total || 0) / 10));
    } catch (error) {
      console.error("Failed to fetch petty cash list", error);
      toast.error("Failed to fetch entries");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (values: Record<string, any>) => {
    setAppliedFilters({
      search: values.search || "",
      status: values.status || "ALL",
      type: values.type || "ALL",
      category: values.category || "ALL",
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    form.resetFields();
    setAppliedFilters({
      search: "",
      status: "ALL",
      type: "ALL",
      category: "ALL",
    });
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE ENTRY?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          setDeletingId(id);
          await fetch(`/api/v1/erp/finance/petty-cash/${id}`, {
            method: "DELETE",
          });
          toast.success("ENTRY DELETED");
          fetchPettyCash();
        } catch (error) {
          console.error("Failed to delete entry", error);
          toast.error("Failed to delete entry");
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

  const handleOpenCreate = () => {
    setSelectedEntry(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setFormModalOpen(true);
  };

  const handleOpenView = (entry: PettyCash) => {
    setSelectedEntry(entry);
    setViewModalOpen(true);
  };

  const handleModalClose = () => {
    setFormModalOpen(false);
    setViewModalOpen(false);
    setSelectedEntry(null);
  };

  // Helper for Status Badges
  const renderStatus = (status: string) => {
    const map = {
      APPROVED: "bg-green-600 text-white border-gray-200",
      PENDING: "bg-white text-black border-gray-200 border-2",
      REJECTED: "bg-white text-gray-400 border-gray-200 line-through",
    };
    const style = map[status as keyof typeof map] || map.PENDING;
    return (
      <span className={`px-2 py-1 text-xs font-bold   ${style}`}>{status}</span>
    );
  };
  const columns: ColumnsType<any> = [
    {
      title: "Details",
      key: "details",
      render: (_, entry) => (
        <>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-gray-900 leading-tight line-clamp-2 max-w-[250px]">
              {entry.note || "NO NOTE"}
            </span>
            <span className="text-xs text-gray-400 font-bold  ">
              {new Date(entry.createdAt as string).toLocaleDateString()}
            </span>
          </div>
        </>
      ),
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, entry) => (
        <>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                entry.type === "income" ? "bg-green-500" : "bg-red-500"
              }`}
            ></span>
            <span className="font-bold text-lg font-mono tracking-tight">
              {Number(entry.amount).toLocaleString()}
            </span>
          </div>
        </>
      ),
    },
    {
      title: "Category",
      key: "category",
      render: (_, entry) => (
        <>
          <span className="font-bold text-xs   text-gray-700 bg-gray-100 px-2 py-1">
            {entry.category}
          </span>
        </>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, entry) => <>{renderStatus(entry.status)}</>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, entry) => (
        <>
          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => handleOpenView(entry)}
              className={styles.iconBtn}
              title="View"
            >
              <IconEye size={16} stroke={2} />
            </button>
            <button
              onClick={() => handleOpenEdit(entry)}
              disabled={entry.status === "APPROVED"}
              className={styles.iconBtn}
              title="Edit"
            >
              <IconPencil size={16} stroke={2} />
            </button>
            <button
              onClick={() => handleDelete(entry.id!)}
              disabled={entry.status === "APPROVED" || deletingId === entry.id}
              className={`${styles.iconBtn} hover:border-red-600 hover:bg-red-600`}
              title="Delete"
            >
              {deletingId === entry.id ? (
                <Spin size="small" />
              ) : (
                <IconTrash size={16} stroke={2} />
              )}
            </button>
          </div>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Petty Cash" description="Manage Expenses">
      <div className="w-full space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-gray-200 pb-6">
          <div className="flex flex-col">
            <span className="text-xs font-bold  text-gray-500  mb-1">
              Financial Records
            </span>
            <h2 className="text-4xl font-bold text-black  tracking-tighter leading-none">
              Petty Cash
            </h2>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={16} />}
            onClick={handleOpenCreate}
          >
            Create Entry
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              search: "",
              status: "ALL",
              type: "ALL",
              category: "ALL",
            }}
            className="flex flex-wrap items-center gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[150px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search Notes..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-32">
              <Select>
                <Select.Option value="ALL">All Status</Select.Option>
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="APPROVED">Approved</Select.Option>
                <Select.Option value="REJECTED">Rejected</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="type" className="!mb-0 w-32">
              <Select>
                <Select.Option value="ALL">All Types</Select.Option>
                <Select.Option value="expense">Expense</Select.Option>
                <Select.Option value="income">Income</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" className="!mb-0 w-44">
              <Select>
                <Select.Option value="ALL">All Categories</Select.Option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Select.Option key={cat.name} value={cat.name}>
                    {cat.name.toUpperCase()}
                  </Select.Option>
                ))}
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

        {/* Table Content */}
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center">
            <Spin size="small" />
            <p className="text-xs font-bold   text-gray-400">
              Loading Records...
            </p>
          </div>
        ) : pettyCashList.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center">
            <IconWallet className="text-gray-300 mb-4" size={48} />
            <p className="text-lg font-bold  tracking-tighter text-gray-300">
              No Entries Found
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-sm">
            <Table
              scroll={{ x: "max-content" }}
              columns={columns}
              dataSource={pettyCashList}
              rowKey={(r: any) =>
                r.id || r.date || r.month || Math.random().toString()
              }
              pagination={{ pageSize: 15 }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
            />
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={styles.iconBtn + " w-10 h-10"}
              >
                <IconChevronLeft size={18} />
              </button>
              <div className="px-6 font-bold text-sm ">
                PAGE {page} <span className="text-gray-400">/</span>{" "}
                {totalPages}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className={styles.iconBtn + " w-10 h-10"}
              >
                <IconChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PettyCashFormModal
        open={formModalOpen}
        onClose={handleModalClose}
        onSave={fetchPettyCash}
        entry={selectedEntry}
      />

      <PettyCashViewModal
        open={viewModalOpen}
        onClose={handleModalClose}
        onStatusChange={fetchPettyCash}
        entry={selectedEntry}
      />
    </PageContainer>
  );
}
