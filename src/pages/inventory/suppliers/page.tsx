import type { ColumnsType } from 'antd/es/table';
import { Spin, Button, Table, Tag } from "antd";
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
    {title: 'Name', key: 'name', render: (_, supplier) => (<><div className="font-medium text-gray-900">
                          {supplier.name}
                        </div>
                        {supplier.city && (
                          <div className="text-xs text-gray-500">
                            {supplier.city}
                          </div>
                        )}</>) },
    {title: 'Contact', key: 'contact', render: (_, supplier) => (<>{supplier.contactPerson || "-"}</>) },
    {title: 'Phone', key: 'phone', render: (_, supplier) => (<>{supplier.phone || "-"}</>) },
    {title: 'Payment Terms', key: 'paymentTerms', render: (_, supplier) => (<>{supplier.paymentTerms || "-"}</>) },
    {title: 'Status', key: 'status', render: (_, supplier) => (<><span
                          className={`px-2 py-1 text-xs font-bold  ${
                            supplier.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {supplier.status}
                        </span></>) },
    {title: 'Actions', key: 'actions', render: (_, supplier) => (<><div className="flex items-center justify-end gap-2">
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
                        </div></>) },
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
          <Button type="primary" size="large" onClick={handleAdd}>Add Supplier</Button>
        </div>

        {/* Search */}
        <div className="relative">
          <IconSearch
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 text-gray-900 focus:outline-none focus:border-gray-200"
          />
        </div>

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
            dataSource={filteredSuppliers}
            rowKey={(r: any) => r.id || r.date || r.month || Math.random().toString()}
            pagination={{ pageSize: 15 }}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
          />
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-green-600/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold   text-gray-900">
                  {editingSupplier ? "Edit Supplier" : "Add Supplier"}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold   text-gray-500 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contactPerson || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold   text-gray-500 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold   text-gray-500 mb-2">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms || "COD"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentTerms: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200"
                    >
                      <option value="COD">Cash on Delivery</option>
                      <option value="Advance">Advance Payment</option>
                      <option value="Net 7">Net 7 Days</option>
                      <option value="Net 15">Net 15 Days</option>
                      <option value="Net 30">Net 30 Days</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold   text-gray-500 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold   text-gray-500 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-gray-200 resize-none"
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 text-xs font-bold   hover:bg-gray-100"
                >
                  Cancel
                </button>
                <Button type="primary" size="large" onClick={handleSave} disabled={saving}>{saving && <Spin size="small" />}
                  {editingSupplier ? "Update" : "Create"}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SuppliersPage;
