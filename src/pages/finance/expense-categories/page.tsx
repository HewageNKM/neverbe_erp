import type { ColumnsType } from "antd/es/table";
import { Spin, Button, Table, Input, Select, Switch, Modal } from "antd";
import api from "@/lib/api";

import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconLoader2,
  IconCategory,
  IconSearch,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  type: "expense" | "income";
  status: boolean;
}

const ExpenseCategoriesPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [typeFilter, setTypeFilter] = useState<"all" | "expense" | "income">(
    "all",
  );

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "expense" as "expense" | "income",
    status: true,
  });

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const url =
        typeFilter === "all"
          ? "/api/v1/erp/finance/expense-categories"
          : `/api/v1/erp/finance/expense-categories?type=${typeFilter}`;

      const res = await api.get<ExpenseCategory[]>(url);
      setCategories(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchCategories();
  }, [currentUser, typeFilter]);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", description: "", type: "expense", status: true });
    setShowModal(true);
  };

  const openEditModal = (category: ExpenseCategory) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || "",
      type: category.type,
      status: category.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast("Please enter a category name");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.put(
          `/api/v1/erp/finance/expense-categories/${editingId}`,
          formData,
        );
        toast.success("Category updated");
      } else {
        await api.post("/api/v1/erp/finance/expense-categories", formData);
        toast.success("Category created");
      }

      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save category");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      await api.delete(`/api/v1/erp/finance/expense-categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete category");
    }
  };
  const columns: ColumnsType<any> = [
    { title: "Name", key: "name", render: (_, cat) => <>{cat.name}</> },
    {
      title: "Description",
      key: "description",
      render: (_, cat) => <>{cat.description || "-"}</>,
    },
    {
      title: "Type",
      key: "type",
      render: (_, cat) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              cat.type === "expense"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {cat.type}
          </span>
        </>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, cat) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold rounded-lg ${
              cat.status
                ? "bg-green-50 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {cat.status ? "Active" : "Inactive"}
          </span>
        </>
      ),
    },
    {
      title: "",
      key: "col4",
      render: (_, cat) => (
        <>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openEditModal(cat)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <IconEdit size={16} />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Expense Categories">
      <div className="w-full space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-2xl font-bold  tracking-tight text-gray-900">
              Expense Categories
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              Manage expense and income categories
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={16} />}
            onClick={openAddModal}
          >
            Add Category
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {["all", "expense", "income"].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type as any)}
              className={`px-4 py-2 text-xs font-bold   border rounded-lg transition-colors ${
                typeFilter === type
                  ? "bg-green-600 text-white border-gray-200"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {type === "all" ? "All" : type}
            </button>
          ))}
        </div>

        {/* List */}
        {!loading && categories.length === 0 ? (
          <div className="bg-white border border-gray-100 p-12 text-center rounded-2xl shadow-sm">
            <IconCategory size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No categories found</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 overflow-hidden rounded-2xl shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <Table
                scroll={{ x: "max-content" }}
                columns={columns}
                dataSource={categories}
                loading={loading}
                rowKey={(r: any) =>
                  r.id || r.date || r.month || Math.random().toString()
                }
                pagination={{ pageSize: 15 }}
                className="overflow-hidden bg-white"
              />
            </div>
            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {categories.map((cat) => (
                <div key={cat.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {cat.description || "No description"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            cat.type === "expense"
                              ? "bg-red-50 text-red-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {cat.type}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-lg ${
                            cat.status
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cat.status ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Modal
          open={showModal}
          title={editingId ? "Edit Category" : "Add Category"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                Save
              </Button>
            </div>
          }
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Office Supplies"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Type *
              </label>
              <Select
                className="w-full"
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
                options={[
                  { value: "expense", label: "Expense" },
                  { value: "income", label: "Income" },
                ]}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.status}
                onChange={(checked) =>
                  setFormData({ ...formData, status: checked })
                }
              />
              <span className="text-sm text-gray-700">Active</span>
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default ExpenseCategoriesPage;
