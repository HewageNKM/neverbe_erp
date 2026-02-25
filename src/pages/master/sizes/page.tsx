import React, { useEffect, useState } from "react";
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconRuler,
  IconFilter,
  IconX,
} from "@tabler/icons-react";
import api from "@/lib/api";
import PageContainer from "../../components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import { Size } from "@/model/Size";
import toast from "react-hot-toast";
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

const SizePage: React.FC = () => {
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [pagination, setPagination] = useState({ page: 1, size: 10, total: 0 });

  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice,
  );

  const { showConfirmation } = useConfirmationDialog();

  const [open, setOpen] = useState(false);
  const [editingSize, setEditingSize] = useState<Size | null>(null);

  const [form] = Form.useForm();

  // Fetch Sizes
  const fetchSizes = async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: pagination.page,
        size: pagination.size,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const { data } = await api.get("/api/v1/erp/catalog/sizes", { params });
      setSizes(data.dataList || []);
      setPagination((prev) => ({ ...prev, total: data.rowCount }));
    } catch (e) {
      console.error("Failed to fetch sizes", e);
      toast.error("Failed to fetch sizes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && !authLoading) fetchSizes();
  }, [pagination.page, pagination.size, currentUser]);

  const handleOpenDialog = (size?: Size) => {
    if (size) {
      setEditingSize(size);
      form.setFieldsValue({ name: size.name, status: size.status });
    } else {
      setEditingSize(null);
      form.resetFields();
      form.setFieldsValue({ status: true });
    }
    setOpen(true);
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      if (editingSize) {
        await api.put(`/api/v1/erp/catalog/sizes/${editingSize.id}`, values);
      } else {
        await api.post("/api/v1/erp/catalog/sizes", values);
      }
      await fetchSizes();
      setOpen(false);
      toast.success(editingSize ? "Size updated" : "Size added");
    } catch (e) {
      console.error("Failed to save size", e);
      toast.error("Failed to save size");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirmation({
      title: "DELETE SIZE?",
      message: "This action cannot be undone.",
      variant: "danger",
      onSuccess: async () => {
        try {
          await api.delete(`/api/v1/erp/catalog/sizes/${id}`);
          await fetchSizes();
          toast.success("Size deleted");
        } catch (e) {
          console.error("Failed to delete size", e);
          toast.error("Failed to delete size");
        }
      },
    });
  };

  const handleFilterSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchSizes();
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("all");
    setPagination((prev) => ({ ...prev, page: 1 }));
    setTimeout(fetchSizes, 0);
  };

  const columns: ColumnsType<Size> = [
    {
      title: "Size Name",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <Text strong className="text-lg">
          {text}
        </Text>
      ),
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
              onClick={() => handleOpenDialog(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => handleDelete(record.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Sizes" description="Size Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Product Attributes
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Size Chart
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={() => handleOpenDialog()}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Size
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="shadow-sm !mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                prefix={<IconSearch size={16} className="text-gray-400" />}
                placeholder="Search sizes..."
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
          scroll={{ x: 1000 }}
          bordered
          columns={columns}
          dataSource={sizes}
          loading={loading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.size,
            total: pagination.total,
            onChange: (page, size) =>
              setPagination((prev) => ({ ...prev, page, size })),
            showSizeChanger: true,
            position: ["bottomRight"],
          }}
          className="border border-gray-200 rounded-md overflow-hidden bg-white"
        />

        {/* Modal */}
        <Modal
          title={editingSize ? "Edit Size" : "New Size"}
          open={open}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Size"
          maskClosable={false}
          width={400}
        >
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="name"
              label="Size Name (e.g. XL, 42)"
              rules={[{ required: true, message: "Please enter size name" }]}
            >
              <Input placeholder="Enter Size..." />
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

export default SizePage;
