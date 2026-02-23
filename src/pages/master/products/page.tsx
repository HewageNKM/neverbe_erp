import React, { useState, useEffect } from "react";
import PageContainer from "../../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconFilter,
  IconEdit,
  IconTrash,
  IconCopy,
} from "@tabler/icons-react";
import { Product } from "@/model/Product";
import ProductFormModal from "./components/ProductFormModal";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
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
  Row,
  Col,
  Card,
  Typography,
  Switch,
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

  const fetchProducts = async (values?: any) => {
    setLoading(true);
    try {
      const token = await getToken();
      const filters = values || form.getFieldsValue();

      const params: any = {
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

      const response = await axios.get("/api/v1/erp/catalog/products", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      setProducts(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch products", e);
      toast.error(
        e.response?.data?.message || "Failed to fetch products",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async (
    url: string,
    setData: (data: DropdownOption[]) => void,
  ) => {
    try {
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    // ... (Logic implementation identical to original, just triggering API)
    setIsSaving(true);
    const isEditing = !!productData.productId;
    const url = isEditing
      ? `/api/v1/erp/catalog/products/${productData.productId}`
      : "/api/v1/erp/catalog/products";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = await getToken();
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

      const response = await fetch(url, {
        method: method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to save product");
      }

      toast(
        isEditing ? "PRODUCT UPDATED" : "PRODUCT CREATED",
        "success",
      );
      handleCloseModal();
      fetchProducts();
    } catch (error: any) {
      toast(error.message || "Error saving product");
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
          const token = await getToken();
          const response = await axios.delete(
            `/api/v1/erp/catalog/products/${itemId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          if (response.status !== 200)
            throw new Error("Failed to delete product");
          toast.success("PRODUCT DELETED");
          fetchProducts();
        } catch (error: any) {
          toast.error(error.message || "Error deleting product");
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
              className="w-10 h-10 object-cover rounded-sm border border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-100 rounded-sm"></div>
          )}
          <div>
            <Typography.Text strong className="block">
              {record.name}
            </Typography.Text>
            <Space size={4}>
              {record.tags?.[0] && (
                <Tag className="m-0 text-[10px]">{record.tags[0]}</Tag>
              )}
              <Tag className="m-0 text-[10px]">{record.category}</Tag>
            </Space>
          </div>
        </Space>
      ),
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
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
      dataIndex: "isActive",
      key: "status",
      render: (isActive) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "ACTIVE" : "INACTIVE"}
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
        <div className="flex justify-between items-center">
          <div>
            <Typography.Title level={2} className="!m-0">
              Products
            </Typography.Title>
            <Typography.Text type="secondary">
              Catalog Management
            </Typography.Text>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
          >
            New Product
          </Button>
        </div>

        <Card size="small" className="bg-gray-50/50">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ brand: "all", category: "all", status: "all" }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={8}>
                <Form.Item name="search" label="Search">
                  <Input
                    prefix={<IconSearch size={16} className="text-gray-400" />}
                    placeholder="Product Name..."
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="category" label="Category">
                  <Select>
                    <Option value="all">All Categories</Option>
                    {categories.map((c) => (
                      <Option key={c.id} value={c.label}>
                        {c.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="brand" label="Brand">
                  <Select>
                    <Option value="all">All Brands</Option>
                    {brands.map((b) => (
                      <Option key={b.id} value={b.label}>
                        {b.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="status" label="Status">
                  <Select>
                    <Option value="all">All Status</Option>
                    <Option value="true">Active</Option>
                    <Option value="false">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={4} className="flex items-end pb-6 gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={16} />}
                  block
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={16} />}
                  onClick={handleClearFilters}
                />
              </Col>
            </Row>
          </Form>
        </Card>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="productId"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
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
