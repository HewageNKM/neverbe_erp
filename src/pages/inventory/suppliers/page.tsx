import type { ColumnsType } from "antd/es/table";
import { Spin, Button, Table, Input, Select, Modal } from "antd";
import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconLoader2,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface Supplier {
  id?: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  paymentTerms?: string;
  notes?: string;
  status: "active" | "inactive";
}

const DEFAULT_SUPPLIER: Supplier = {
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  paymentTerms: "COD",
  notes: "",
  status: "active",
};

const SuppliersPage = () => {
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<Supplier>(DEFAULT_SUPPLIER);
  const [saving, setSaving] = useState(false);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await api.get<Supplier[]>(
        "/api/v1/erp/procurement/suppliers",
      );
      setSuppliers(res.data);
    } catch {
      toast.error("Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSuppliers();
  }, [currentUser]);

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData(DEFAULT_SUPPLIER);
    setShowModal(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast("Supplier name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingSupplier?.id) {
        await api.put(
          `/api/v1/erp/procurement/suppliers/${editingSupplier.id}`,
          formData,
        );
        toast.success("Supplier updated");
      } else {
        await api.post("/api/v1/erp/procurement/suppliers", formData);
        toast.success("Supplier created");
      }
      setShowModal(false);
      fetchSuppliers();
    } catch {
      toast.error("Failed to save supplier");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this supplier?")) return;
    try {
      await api.delete(`/api/v1/erp/procurement/suppliers/${id}`);
      toast.success("Supplier deactivated");
      fetchSuppliers();
    } catch {
      toast.error("Failed to delete supplier");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search),
  );
  const columns: ColumnsType<any> = [
    {
      title: "Name",
      key: "name",
      render: (_, supplier) => (
        <>
          <div className="font-medium text-gray-900">{supplier.name}</div>
          {supplier.city && (
            <div className="text-xs text-gray-500">{supplier.city}</div>
          )}
        </>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, supplier) => <>{supplier.contactPerson || "-"}</>,
    },
    {
      title: "Phone",
      key: "phone",
      render: (_, supplier) => <>{supplier.phone || "-"}</>,
    },
    {
      title: "Payment Terms",
      key: "paymentTerms",
      render: (_, supplier) => <>{supplier.paymentTerms || "-"}</>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, supplier) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold  ${
              supplier.status === "active"
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {supplier.status}
          </span>
        </>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, supplier) => (
        <>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleEdit(supplier)}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <IconEdit size={16} />
            </button>
            <button
              onClick={() => handleDelete(supplier.id!)}
              className="p-2 hover:bg-red-50 text-red-600 transition-colors"
            >
              <IconTrash size={16} />
            </button>
          </div>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Suppliers">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold  tracking-tight text-gray-900">
              Suppliers
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your suppliers and vendors
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={16} />}
            onClick={handleAdd}
          >
            Add Supplier
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Input
            prefix={<IconSearch size={18} className="text-gray-400" />}
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
          />
        </div>

        {/* Table */}
        <div className="mt-6">
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={filteredSuppliers}
            loading={loading}
            rowKey={(r: any) =>
              r.id || r.date || r.month || Math.random().toString()
            }
            pagination={{ pageSize: 15 }}
            className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm"
          />
        </div>

        <Modal
          open={showModal}
          title={editingSupplier ? "Edit Supplier" : "Add Supplier"}
          onCancel={() => setShowModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <Button onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="primary" onClick={handleSave} loading={saving}>
                {editingSupplier ? "Update" : "Create"}
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
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Contact Person
                </label>
                <Input
                  value={formData.contactPerson || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Phone
                </label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Email
              </label>
              <Input
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  City
                </label>
                <Input
                  value={formData.city || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2">
                  Payment Terms
                </label>
                <Select
                  className="w-full"
                  value={formData.paymentTerms || "COD"}
                  onChange={(val) =>
                    setFormData({ ...formData, paymentTerms: val })
                  }
                  options={[
                    { value: "COD", label: "Cash on Delivery" },
                    { value: "Advance", label: "Advance Payment" },
                    { value: "Net 7", label: "Net 7 Days" },
                    { value: "Net 15", label: "Net 15 Days" },
                    { value: "Net 30", label: "Net 30 Days" },
                  ]}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Address
              </label>
              <Input.TextArea
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">
                Notes
              </label>
              <Input.TextArea
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
          </div>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default SuppliersPage;
