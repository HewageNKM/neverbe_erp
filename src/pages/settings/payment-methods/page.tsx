import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import toast from "react-hot-toast";
import { PaymentMethod } from "@/model/PaymentMethod";
import { auth } from "@/firebase/firebaseClient";
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Switch,
  InputNumber,
  Space,
  Typography,
  Tooltip,
} from "antd";

const { Title, Text } = Typography;
const { TextArea } = Input;

const PaymentMethodsPage = () => {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [form] = Form.useForm();

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch("/api/v1/erp/finance/payment-methods");
      if (res.ok) {
        const data = await res.json();
        // Filter out deleted if API doesn't already
        const validData = data.filter((m: any) => !m.isDeleted);
        setMethods(validData);
      } else {
        toast.error("Failed to fetch payment methods");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching methods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      fetchMethods();
    }
  }, [auth.currentUser]);

  const handleOpenDialog = (method?: PaymentMethod) => {
    if (method) {
      setEditingMethod(method);
      form.setFieldsValue({
        name: method.name,
        fee: method.fee,
        status: method.status,
        description: method.description || "",
        paymentId: method.paymentId || "",
        available: method.available || ["Store"],
      });
    } else {
      setEditingMethod(null);
      form.resetFields();
      form.setFieldsValue({
        fee: 0,
        status: true,
        available: ["Store"],
      });
    }
    setOpen(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const payload = {
        ...values,
      };

      if (editingMethod) {
        const res = await fetch(
          `/api/v1/erp/finance/payment-methods/${editingMethod.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (res.ok) {
          toast.success("METHOD UPDATED");
        } else {
          throw new Error("Failed to update");
        }
      } else {
        const res = await fetch("/api/v1/erp/finance/payment-methods", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          toast.success("METHOD CREATED");
        } else {
          throw new Error("Failed to create");
        }
      }
      setOpen(false);
      fetchMethods();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this payment method?"))
      return;
    setDeletingId(id);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(`/api/v1/erp/finance/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("METHOD DELETED");
        fetchMethods();
      } else {
        toast.error("Failed to delete method");
      }
    } catch (error) {
      toast.error("Error deleting method");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Method Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: PaymentMethod) => (
        <div>
          <Text strong>{text}</Text>
          <div className="text-xs text-gray-400">
            ID: {record.paymentId || "-"}
          </div>
        </div>
      ),
    },
    {
      title: "Channels",
      dataIndex: "available",
      key: "available",
      render: (channels: string[]) => (
        <Space wrap>
          {channels?.map((ch) => (
            <Tag key={ch}>{ch}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Processing Fee",
      dataIndex: "fee",
      key: "fee",
      render: (fee: number) =>
        fee > 0 ? (
          <Tag color="orange">{fee}% Fee</Tag>
        ) : (
          <Text type="secondary">No Fee</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: boolean) => (
        <Tag color={status ? "green" : "default"}>
          {status ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: PaymentMethod) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<IconEdit size={16} />}
              onClick={() => handleOpenDialog(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<IconTrash size={16} />}
              loading={deletingId === record.id}
              onClick={() => handleDelete(record.id!)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Payment Methods" description="POS Configuration">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                POS Configuration
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Payment Methods
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
            New Method
          </Button>
        </div>

        <Table
          scroll={{ x: "max-content" }}
          columns={columns}
          dataSource={methods}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No Payment Methods" }}
        />

        <Modal
          open={open}
          title={editingMethod ? "Edit Method" : "New Method"}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Method"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{ status: true, fee: 0, available: ["Store"] }}
          >
            <Form.Item
              name="name"
              label="Method Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. VISAMASTER" />
            </Form.Item>

            <Form.Item
              name="paymentId"
              label="Payment ID"
              rules={[{ required: true }]}
            >
              <Input
                placeholder="e.g. PM-001"
                disabled={!!editingMethod}
                onChange={(e) => {
                  form.setFieldsValue({
                    paymentId: e.target.value.toUpperCase(),
                  });
                }}
              />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={3} placeholder="Brief description..." />
            </Form.Item>

            <Form.Item name="available" label="Available Channels">
              <SelectMultiple options={["Store", "Website"]} />
            </Form.Item>

            <Form.Item
              name="fee"
              label="Processing Fee (%)"
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                className="w-full"
                addonAfter="%"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="ACTIVE" unCheckedChildren="INACTIVE" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </PageContainer>
  );
};

// Simple Multi-Select Component Helper because AntD Checkbox Group is cleaner usually but Select is asked
import { Select } from "antd";
const SelectMultiple = ({ value, onChange, options }: any) => {
  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      placeholder="Select channels"
    >
      {options.map((o: string) => (
        <Select.Option key={o} value={o}>
          {o}
        </Select.Option>
      ))}
    </Select>
  );
};

export default PaymentMethodsPage;
