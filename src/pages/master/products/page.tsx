import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconFilter,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { Product } from "@/model/Product";
import ProductFormModal from "./components/ProductFormModal";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Tooltip,
  Form,
  Card,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";

export interface DropdownOption {
  id: string;
  label: string;
}

const { Option } = Select;

const ProductPage = () => {
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );
  const { showConfirmation } = useConfirmationDialog();
  const [form] = Form.useForm();

  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [categories, setCategories] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchProducts();
      fetchDropdown("/api/v1/erp/catalog/brands/dropdown", setBrands);
      fetchDropdown("/api/v1/erp/catalog/categories/dropdown", setCategories);
      fetchDropdown("/api/v1/erp/catalog/sizes/dropdown", setSizes);
    }
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (currentUser) fetchProducts();
  }, [pagination.current, pagination.pageSize]);

  const fetchProducts = async (values?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const filters = values || form.getFieldsValue();
      const params: Record<string, unknown> = {
        page: pagination.current,
        size: pagination.pageSize,
      };
      if (filters.search) params.search = filters.search;
      if (filters.brand && filters.brand !== "all")
        params.brand = filters.brand;
      if (filters.category && filters.category !== "all")
        params.category = filters.category;
      if (filters.status && filters.status !== "all")
        params.status = filters.status;
      if (filters.listing && filters.listing !== "all")
        params.listing = filters.listing;

      const response = await api.get("/api/v1/erp/catalog/products", {
        params,
      });
      setProducts(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e) {
      console.error("Failed to fetch products", e);
      toast.error("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async (
    url: string,
    setData: (data: DropdownOption[]) => void,
  ) => {
    try {
      const response = await api.get(url);
      setData(response.data || []);
    } catch (e) {
      console.error("Failed to fetch dropdown data", e);
    }
  };

  // --- Handlers ---
  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchProducts(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  // --- CRUD ---
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (productData: Product, file: File | null) => {
    setIsSaving(true);
    const isEditing = !!productData.productId;
    const url = isEditing
      ? `/api/v1/erp/catalog/products/${productData.productId}`
      : "/api/v1/erp/catalog/products";

    try {
      const formData = new FormData();
      if (file) formData.append("thumbnail", file);
      else if (isEditing && productData.thumbnail)
        formData.append("thumbnail", JSON.stringify(productData.thumbnail));

      for (const [key, value] of Object.entries(productData)) {
        if (key === "thumbnail") continue;
        if (key === "variants" || key === "tags")
          formData.append(key, JSON.stringify(value));
        else formData.append(key, String(value));
      }

      if (isEditing) {
        await api.put(url, formData);
      } else {
        await api.post(url, formData);
      }

      toast.success(isEditing ? "Product updated" : "Product created");
      handleCloseModal();
      fetchProducts();
    } catch (error: unknown) {
      const err = error as Error;
      toast.error(err.message || "Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (itemId: string) => {
    showConfirmation({
      title: "DELETE PRODUCT?",
      message: "This action cannot be undone. Confirm deletion?",
      variant: "danger",
      onSuccess: async () => {
        setLoading(true);
        try {
          await api.delete(`/api/v1/erp/catalog/products/${itemId}`);
          toast.success("Product deleted");
          fetchProducts();
        } catch (error: unknown) {
          const err = error as Error;
          toast.error(err.message || "Error deleting product");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const columns: ColumnsType<Product> = [
    {
      title: "Product Details",
      key: "details",
      render: (_, record) => (
        <Space>
          {record.thumbnail ? (
            <img
              src={record.thumbnail.url}
              alt="thumb"
              className="w-10 h-10 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
          )}
          <div>
            <Typography.Text strong className="block">
              {record.name}
            </Typography.Text>
            <Space size={4} className="mt-1">
              <Tag className="m-0 text-[10px] uppercase border-gray-200">
                {record.brand}
              </Tag>
              <Tag className="m-0 text-[10px] uppercase border-gray-200">
                {record.category}
              </Tag>
            </Space>
          </div>
        </Space>
      ),
    },

    {
      title: "Price (LKR)",
      dataIndex: "sellingPrice",
      key: "price",
      align: "right",
      render: (price) => (
        <Typography.Text strong>{price?.toLocaleString()}</Typography.Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: boolean) => (
        <Tag color={status ? "success" : "error"}>
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Listing",
      dataIndex: "listing",
      key: "listing",
      render: (listing: boolean) => (
        <Tag color={listing ? "processing" : "default"}>
          {listing ? "LISTED" : "UNLISTED"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => handleOpenEditModal(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDeleteProduct(record.productId!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Products" description="Products Management">
      <Space direction="vertical" size="large" className="w-full">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Catalog Management
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Products
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Product
          </Button>
        </div>

        {/* Filter bar */}
        <Card size="small" className="shadow-sm !mb-4">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{
              brand: "all",
              category: "all",
              status: "all",
              listing: "all",
            }}
            className="flex flex-wrap gap-2 w-full"
          >
            <Form.Item name="search" className="!mb-0 flex-1 min-w-[160px]">
              <Input
                prefix={<IconSearch size={15} className="text-gray-400" />}
                placeholder="Search products..."
                allowClear
              />
            </Form.Item>
            <Form.Item name="category" className="!mb-0 w-40">
              <Select>
                <Option value="all">All Categories</Option>
                {categories.map((c) => (
                  <Option key={c.id} value={c.label}>
                    {c.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="brand" className="!mb-0 w-36">
              <Select>
                <Option value="all">All Brands</Option>
                {brands.map((b) => (
                  <Option key={b.id} value={b.label}>
                    {b.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="status" className="!mb-0 w-32">
              <Select>
                <Option value="all">All Status</Option>
                <Option value="true">Active</Option>
                <Option value="false">Inactive</Option>
              </Select>
            </Form.Item>
            <Form.Item name="listing" className="!mb-0 w-32">
              <Select>
                <Option value="all">All Listing</Option>
                <Option value="true">Listed</Option>
                <Option value="false">Unlisted</Option>
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

        {/* Table */}
        <Table
          scroll={{ x: 1000 }}
                    bordered
          columns={columns}
          dataSource={products}
          rowKey="productId"
          pagination={{ ...pagination, position: ["bottomRight"] }}
          loading={loading}
          onChange={handleTableChange}
          size="small"
          className="rounded-lg overflow-hidden border border-gray-100"
        />
      </Space>

      <ProductFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProduct}
        product={editingProduct}
        brands={brands}
        categories={categories}
        sizes={sizes}
        saving={isSaving}
      />
    </PageContainer>
  );
};

export default ProductPage;
