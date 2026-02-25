import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { ShippingRule } from "@/model/ShippingRule";
import {
  Modal,
  Form,
  Input,
  Button,
  Table,
  Switch,
  InputNumber,
  Tag,
  Space,
  Tooltip,
  Checkbox,
  Card,
  Typography,
} from "antd";

const { Text, Title } = Typography;
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";

const ShippingSettingsPage = () => {
  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const [form] = Form.useForm();
  const isIncremental = Form.useWatch("isIncremental", form);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/erp/procurement/shipping-rules");
      if (res.ok) {
        const data = await res.json();
        data.sort(
          (a: ShippingRule, b: ShippingRule) => a.minWeight - b.minWeight,
        );
        setRules(data);
      } else {
        toast.error("Failed to fetch shipping rules");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error fetching rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleOpenDialog = (rule?: ShippingRule) => {
    if (rule) {
      setEditingRule(rule);
      form.setFieldsValue({
        name: rule.name,
        minWeight: rule.minWeight,
        maxWeight: rule.maxWeight,
        rate: rule.rate,
        isActive: rule.isActive,
        isIncremental: rule.isIncremental || false,
        baseWeight: rule.baseWeight || 1,
        perKgRate: rule.perKgRate || 0,
      });
    } else {
      setEditingRule(null);
      form.resetFields();
      form.setFieldsValue({
        minWeight: 0,
        maxWeight: 0,
        rate: 0,
        isActive: true,
        baseWeight: 1,
        perKgRate: 0,
      });
    }
    setOpen(true);
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        minWeight: parseFloat(values.minWeight),
        maxWeight: parseFloat(values.maxWeight),
        rate: parseFloat(values.rate),
        isActive: values.isActive,
        isIncremental: values.isIncremental,
        baseWeight: values.isIncremental
          ? parseFloat(values.baseWeight)
          : undefined,
        perKgRate: values.isIncremental
          ? parseFloat(values.perKgRate)
          : undefined,
      };

      if (editingRule) {
        const res = await fetch(`/api/v1/shipping-rules/${editingRule.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          toast.success("RULE UPDATED");
        } else {
          throw new Error("Failed to update");
        }
      } else {
        const res = await fetch("/api/v1/erp/procurement/shipping-rules", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
        if (res.ok) {
          toast.success("RULE CREATED");
        } else {
          throw new Error("Failed to create");
        }
      }
      setOpen(false);
      fetchRules();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/v1/shipping-rules/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("RULE DELETED");
        fetchRules();
      } else {
        toast.error("Failed to delete rule");
      }
    } catch (error) {
      toast.error("Error deleting rule");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: "Calculation",
      key: "calculation",
      render: (_: any, record: ShippingRule) => (
        <div>
          <div>{record.isIncremental ? "Incremental" : "Flat Rate"}</div>
          <Text type="secondary" className="text-xs">
            {record.minWeight}kg - {record.maxWeight}kg
          </Text>
        </div>
      ),
    },
    {
      title: "Rates",
      key: "rates",
      render: (_: any, record: ShippingRule) =>
        record.isIncremental ? (
          <div>
            <div>
              Base: Rs. {record.rate}{" "}
              <small>(UP TO {record.baseWeight}kg)</small>
            </div>
            <small className="text-gray-500">
              + Rs. {record.perKgRate}/kg (EXTRA)
            </small>
          </div>
        ) : (
          <Text strong>Rs. {record.rate.toLocaleString()}</Text>
        ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "default"}>
          {active ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: ShippingRule) => (
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
    <PageContainer title="Shipping" description="Logistics Configuration">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Logistics Configuration
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Shipping Rates
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
            New Rule
          </Button>
        </div>

        <Table
          scroll={{ x: 1000 }}
                    bordered
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No Active Rules" }}
        />

        <Modal
          open={open}
          title={editingRule ? "Edit Rule" : "New Rule"}
          onCancel={() => setOpen(false)}
          onOk={() => form.submit()}
          confirmLoading={saving}
          okText="Save Rule"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={{
              isActive: true,
              minWeight: 0,
              maxWeight: 0,
              rate: 0,
              isIncremental: false,
            }}
          >
            <Form.Item
              name="name"
              label="Rule Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="e.g. STANDARD DELIVERY" />
            </Form.Item>

            <Form.Item name="isIncremental" valuePropName="checked">
              <Checkbox>Incremental Calculation (Base + Per Kg)</Checkbox>
            </Form.Item>

            <Space className="w-full flex gap-4">
              <Form.Item
                name="minWeight"
                label="Min Weight (kg)"
                rules={[{ required: true }]}
                className="flex-1"
              >
                <InputNumber min={0} step={0.01} className="w-full" />
              </Form.Item>
              <Form.Item
                name="maxWeight"
                label="Max Weight (kg)"
                rules={[{ required: true }]}
                className="flex-1"
              >
                <InputNumber min={0} step={0.01} className="w-full" />
              </Form.Item>
            </Space>

            <Form.Item
              name="rate"
              label={isIncremental ? "Base Rate (LKR)" : "Flat Rate (LKR)"}
              rules={[{ required: true }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            {isIncremental && (
              <Card
                size="small"
                className="bg-gray-50 mb-4 border-2 border-gray-200"
              >
                <Space direction="vertical" className="w-full">
                  <Form.Item
                    name="baseWeight"
                    label="Base Weight Limit (kg)"
                    rules={[{ required: isIncremental }]}
                    className="mb-2"
                  >
                    <InputNumber min={0} step={0.1} className="w-full" />
                  </Form.Item>
                  <Form.Item
                    name="perKgRate"
                    label="Extra Cost Per Kg (LKR)"
                    rules={[{ required: isIncremental }]}
                    className="mb-0"
                  >
                    <InputNumber min={0} className="w-full" />
                  </Form.Item>
                </Space>
              </Card>
            )}

            <Form.Item
              name="isActive"
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

export default ShippingSettingsPage;
