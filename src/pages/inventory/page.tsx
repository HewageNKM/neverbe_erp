import React, { useState, useEffect } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconSearch,
  IconX,
  IconStack2,
  IconFilter,
  IconEdit,
} from "@tabler/icons-react";
import { useAppSelector } from "@/lib/hooks";
import api from "@/lib/api";
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
      fetchDropdown("/api/v1/erp/master/products/dropdown", setProducts);
      fetchDropdown("/api/v1/erp/master/sizes/dropdown", setSizes);
      fetchDropdown("/api/v1/erp/master/stocks/dropdown", setStockLocations);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchInventory();
    }
  }, [pagination.current, pagination.pageSize]);

  const fetchInventory = async (values?: Record<string, unknown>) => {
    setLoading(true);
    try {
      const filters = values || form.getFieldsValue();
      const params: Record<string, unknown> = {
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

      const response = await api.get("/api/v1/erp/inventory", { params });
      setInventoryItems(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch {
      toast.error("Failed to fetch inventory");
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
    } catch {
      console.error(`Failed to fetch dropdown data from ${url}`);
    }
  };

  const fetchVariantsDropdown = async (productId: string) => {
    setVariantLoading(true);
    setVariants([]);
    try {
      const response = await api.get(
        `/api/v1/erp/master/products/${productId}/variants/dropdown`,
      );
      setVariants(response.data || []);
    } catch {
      console.error(`Failed to fetch variants for product ${productId}`);
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
    const { productId, variantId, size, stockId, quantity } = itemData;
    const payload = { productId, variantId, size, stockId, quantity };
    const isEditing = !!editingItem;
    try {
      if (isEditing) {
        await api.put(`/api/v1/erp/inventory/${editingItem!.id}`, payload);
      } else {
        await api.post("/api/v1/erp/inventory", payload);
      }
      handleCloseModal();
      fetchInventory();
      toast.success("Stock item saved successfully");
    } catch {
      toast.error("Error saving stock item");
    }
  };

  const handleTableChange = (newPagination: {
    current?: number;
    pageSize?: number;
    total?: number;
  }) => {
    setPagination(newPagination as typeof pagination);
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
              className="w-8 h-8 object-cover rounded-lg border border-gray-100"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-100 rounded-lg"></div>
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
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Inventory Control
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Stock Management
              </h2>
            </div>
          </div>
          <Space>
            <Button
              icon={<IconStack2 size={18} />}
              onClick={() => setIsBulkModalOpen(true)}
              className="rounded-xl h-11 px-4"
            >
              Bulk Add
            </Button>
            <Button
              type="primary"
              icon={<IconPlus size={18} />}
              onClick={handleOpenCreateModal}
              className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
            >
              New Entry
            </Button>
          </Space>
        </div>

        <Card size="small" className="shadow-sm">
          <Form
            form={form}
            layout="inline"
            onFinish={handleFilterSubmit}
            initialValues={{ variantId: "all", size: "all", stockId: "all" }}
            className="flex flex-wrap gap-2 w-full"
          >
            <Form.Item name="productId" className="!mb-0 flex-1 min-w-[160px]">
              <Select
                showSearch
                placeholder="All Products"
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
            <Form.Item name="variantId" className="!mb-0 w-40">
              <Select
                disabled={!form.getFieldValue("productId") || variantLoading}
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
            <Form.Item name="size" className="!mb-0 w-32">
              <Select>
                <Option value="all">All Sizes</Option>
                {sizes.map((s) => (
                  <Option key={s.id} value={s.label}>
                    {s.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="stockId" className="!mb-0 w-40">
              <Select>
                <Option value="all">All Locations</Option>
                {stockLocations.map((l) => (
                  <Option key={l.id} value={l.id}>
                    {l.label}
                  </Option>
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

        <div className="mt-6">
          <Table
            scroll={{ x: 1000 }}
                      bordered
            columns={columns}
            dataSource={inventoryItems}
            rowKey="id"
            pagination={{ ...pagination, position: ["bottomRight"] }}
            loading={loading}
            onChange={handleTableChange}
          />
        </div>
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
