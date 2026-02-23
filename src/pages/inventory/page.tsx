import React, { useState, useEffect } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconStack2,
  IconFilter,
  IconRefresh,
  IconEdit,
} from "@tabler/icons-react";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import { DropdownOption } from "../master/products/page";
import { InventoryItem } from "@/model/InventoryItem";
import InventoryFormModal from "./components/InventoryFormModal";
import BulkInventoryFormModal from "./components/BulkInventoryFormModal";
import toast from "react-hot-toast";
import {
  Table,
  Button,
  Select,
  Form,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";

interface StockLocationOption extends DropdownOption {}

const { Option } = Select;

const InventoryPage = () => {
  const [form] = Form.useForm();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<DropdownOption[]>([]);
  const [variants, setVariants] = useState<DropdownOption[]>([]);
  const [sizes, setSizes] = useState<DropdownOption[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocationOption[]>(
    [],
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [variantLoading, setVariantLoading] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Data Fetching ---
  useEffect(() => {
    if (currentUser) {
      fetchInventory(); // Initial fetch
      fetchDropdown("/api/v1/erp/catalog/products/dropdown", setProducts);
      fetchDropdown("/api/v1/erp/catalog/sizes/dropdown", setSizes);
      fetchDropdown("/api/v1/erp/catalog/stocks/dropdown", setStockLocations);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchInventory();
    }
  }, [pagination.current, pagination.pageSize]);

  const fetchInventory = async (values?: any) => {
    setLoading(true);
    try {
      const token = await getToken();
      const filters = values || form.getFieldsValue();

      const params: any = {
        page: pagination.current,
        size: pagination.pageSize,
      };

      if (filters.productId) params.productId = filters.productId;
      if (filters.variantId && filters.variantId !== "all")
        params.variantId = filters.variantId;
      if (filters.size && filters.size !== "all")
        params.variantSize = filters.size;
      if (filters.stockId && filters.stockId !== "all")
        params.stockId = filters.stockId;

      const response = await axios.get("/api/v1/inventory", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      setInventoryItems(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e: any) {
      console.error("Failed to fetch inventory", e);
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdown = async (url: string, setData: (data: any[]) => void) => {
    try {
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(response.data || []);
    } catch (e) {
      console.error(`Failed to fetch dropdown data from ${url}`, e);
    }
  };

  const fetchVariantsDropdown = async (productId: string) => {
    setVariantLoading(true);
    setVariants([]);
    try {
      const url = `/api/v1/erp/catalog/products/${productId}/variants/dropdown`;
      const token = await getToken();
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVariants(response.data || []);
    } catch (e) {
      console.error(`Failed to fetch variants for product ${productId}`, e);
    } finally {
      setVariantLoading(false);
    }
  };

  // --- Handlers ---
  const handleFilterSubmit = (values: any) => {
    if (pagination.current === 1) {
      fetchInventory(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    setVariants([]);
    handleFilterSubmit({});
  };

  const handleProductChange = (productId: string) => {
    if (productId) {
      fetchVariantsDropdown(productId);
    } else {
      setVariants([]);
    }
    form.setFieldsValue({ variantId: "all" });
  };

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveStock = async (itemData: InventoryItem) => {
    // ... logic remains same, just calling API
    const { productId, variantId, size, stockId, quantity } = itemData;
    const payload = { productId, variantId, size, stockId, quantity };
    const isEditing = !!editingItem;
    const url = isEditing
      ? `/api/v1/erp/inventory/${editingItem!.id}`
      : "/api/v1/inventory";
    const method = isEditing ? "PUT" : "POST";

    try {
      const token = await getToken();
      await axios({
        method,
        url,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });
      handleCloseModal();
      fetchInventory();
      toast.success("Stock item saved successfully");
    } catch (error) {
      toast.error("Error saving stock item");
    }
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const columns: ColumnsType<InventoryItem> = [
    {
      title: "Product",
      key: "product",
      render: (_, record) => (
        <Space>
          {(record as any).thumbnail ? (
            <img
              src={(record as any).thumbnail}
              alt="thumbnail"
              className="w-8 h-8 object-cover rounded-sm border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded-sm"></div>
          )}
          <div>
            <Typography.Text strong className="block">
              {(record as any).productName}
            </Typography.Text>
            <Typography.Text type="secondary" className="text-xs">
              {(record as any).variantName}
            </Typography.Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      width: 100,
      render: (size) => <Tag>{size}</Tag>,
    },
    {
      title: "Location",
      dataIndex: "stockName",
      key: "location",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (qty) => (
        <span
          className={`font-bold ${qty <= 5 ? "text-red-500" : "text-black"}`}
        >
          {qty}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 80,
      render: (_, record) => (
        <Tooltip title="Edit Stock">
          <Button
            type="text"
            icon={<IconEdit size={18} />}
            onClick={() => handleOpenEditModal(record)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <PageContainer title="Stocks" description="Stock Management">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <Typography.Title level={2} className="!m-0">
              Stock Management
            </Typography.Title>
            <Typography.Text type="secondary">IM Control</Typography.Text>
          </div>
          <Space>
            <Button
              icon={<IconStack2 size={18} />}
              onClick={() => setIsBulkModalOpen(true)}
            >
              Bulk Add
            </Button>
            <Button
              type="primary"
              icon={<IconPlus size={18} />}
              onClick={handleOpenCreateModal}
            >
              New Entry
            </Button>
          </Space>
        </div>

        <Card size="small" className="bg-gray-50/50">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ variantId: "all", size: "all", stockId: "all" }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={6}>
                <Form.Item name="productId" label="Product">
                  <Select
                    showSearch
                    placeholder="Select Product"
                    optionFilterProp="children"
                    onChange={handleProductChange}
                    allowClear
                  >
                    {products.map((p) => (
                      <Option key={p.id} value={p.id}>
                        {p.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="variantId" label="Variant">
                  <Select
                    disabled={
                      !form.getFieldValue("productId") || variantLoading
                    }
                    loading={variantLoading}
                  >
                    <Option value="all">All Variants</Option>
                    {variants.map((v) => (
                      <Option key={v.id} value={v.id}>
                        {v.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="size" label="Size">
                  <Select>
                    <Option value="all">All Sizes</Option>
                    {sizes.map((s) => (
                      <Option key={s.id} value={s.label}>
                        {s.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="stockId" label="Location">
                  <Select>
                    <Option value="all">All Locations</Option>
                    {stockLocations.map((l) => (
                      <Option key={l.id} value={l.id}>
                        {l.label}
                      </Option>
                    ))}
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
          dataSource={inventoryItems}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
          bordered
        />
      </Space>

      <InventoryFormModal
        open={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveStock}
        item={editingItem}
        products={products}
        sizes={sizes}
        stockLocations={stockLocations}
      />

      <BulkInventoryFormModal
        open={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSave={() => fetchInventory()}
        products={products}
        stockLocations={stockLocations}
      />
    </PageContainer>
  );
};

export default InventoryPage;
