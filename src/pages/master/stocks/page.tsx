import React, { useState, useEffect } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconBuildingWarehouse,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";
import { Stock } from "@/model/Stock";
import PageContainer from "../../components/container/PageContainer";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Switch,
  Space,
  Card,
  Tag,
  Typography,
  Tooltip,
} from "antd";
import { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;
const { Option } = Select;

const StockPage: React.FC = () => {
  const [locations, setLocations] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const { showConfirmation } = useConfirmationDialog();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Stock | null>(null);
  const [saving, setSaving] = useState(false);

  // Form instance
  const [form] = Form.useForm();

  // --- Data Fetching ---
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status === "active";

      const response = await api.get("/api/v1/erp/catalog/stocks", { params });
      setLocations(response.data.dataList || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.rowCount || 0,
      }));
    } catch (e) {
      console.error("Failed to fetch stock locations", e);
      toast.error("Failed to fetch stock locations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) {
      fetchLocations();
    }
  }, [pagination.page, pagination.size, currentUser, authLoading]); // Added dependencies

  // --- Handlers ---
  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLocations();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchLocations, 0); // Re-fetch after state update essentially
  };

  const handleOpenCreateModal = () => {
    setEditingLocation(null);
    form.resetFields();
    form.setFieldsValue({ status: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (location: Stock) => {
    setEditingLocation(location);
    form.setFieldsValue({
      name: location.name,
      address: location.address || "",
      status: location.status,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLocation(null);
    form.resetFields();
  };

  const handleSaveLocation = async (values: Record<string, unknown>) => {
    setSaving(true);
    const isEditing = !!editingLocation;
    try {
      if (isEditing) {
        await api.put(
          `/api/v1/erp/catalog/stocks/${editingLocation!.id}`,
          values,
        );
      } else {
        await api.post("/api/v1/erp/catalog/stocks", values);
      }
      toast.success(`Location ${isEditing ? "updated" : "added"}`);
      handleCloseModal();
      fetchLocations();
    } catch (error: unknown) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(err.response?.data?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    showConfirmation({
      title: "DELETE LOCATION?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/catalog/stocks/${id}`);
          toast.success("Location deleted");
          fetchLocations();
        } catch (error: unknown) {
          const err = error as { response?: { data?: { message?: string } } };
          toast.error(
            err.response?.data?.message || "Failed to delete location",
          );
        }
      },
    });
  };

  const columns: ColumnsType<Stock> = [
    {
      title: "Stock ID",
      dataIndex: "id",
      key: "id",
      width: 150,
      render: (text) => (
        <Text type="secondary" code>
          {text}
        </Text>
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      ellipsis: true,
      render: (text) => <Text type="secondary">{text || "N/A"}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      align: "center",
      render: (status) => (
        <Tag color={status ? "green" : "default"}>
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right",
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
              onClick={() => handleDeleteLocation(record.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title="Stock Locations"
      description="Manage Warehouses and Stores"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title level={2} style={{ margin: 0 }}>
              Stock Locations
            </Title>
            <Text type="secondary" className="flex items-center gap-1">
              <IconBuildingWarehouse size={16} /> Warehouse Management
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={handleOpenCreateModal}
            className="bg-green-600 hover:bg-green-500"
          >
            New Location
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm !mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-gray-400" />}
                placeholder="Search locations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onPressEnter={handleFilterSearch}
                allowClear
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={status}
                onChange={setStatus}
                style={{ width: "100%" }}
              >
                <Option value="all">All Status</Option>
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                type="primary"
                icon={<IconFilter size={15} />}
                onClick={handleFilterSearch}
              >
                Filter
              </Button>
              <Button icon={<IconX size={15} />} onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={locations}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.size,
            total: pagination.total,
            onChange: (page, size) =>
              setPagination((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
          }}
          className="border border-gray-200 rounded-md overflow-hidden bg-white"
        />

        {/* Modal */}
        <Modal
          title={editingLocation ? "Modify Location" : "New Location"}
          open={isModalOpen}
          onCancel={handleCloseModal}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Location"
          maskClosable={false}
        >
          <Form form={form} layout="vertical" onFinish={handleSaveLocation}>
            <Form.Item
              name="name"
              label="Location Name"
              rules={[
                { required: true, message: "Please enter location name" },
              ]}
            >
              <Input placeholder="E.g. Main Warehouse" />
            </Form.Item>

            <Form.Item name="address" label="Address">
              <Input.TextArea rows={3} placeholder="Full address..." />
            </Form.Item>

            <Form.Item name="status" label="Status" valuePropName="checked">
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

export default StockPage;
