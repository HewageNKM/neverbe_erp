
import React, { useEffect, useState } from "react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconTruckDelivery,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { ShippingRule } from "@/model/ShippingRule";
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
  Checkbox,
  Card,
} from "antd";

const { Title, Text } = Typography;

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
    <PageContainer title="Shipping" description="Manage Dynamic Shipping Rates">
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex justify-between items-end">
          <div>
            <Space align="center" size="small">
              <IconTruckDelivery size={20} className="text-gray-500" />
              <Title level={2} className="!m-0">
                Shipping Rates
              </Title>
            </Space>
            <Text type="secondary" className="block mt-1">
              Logistics Configuration
            </Text>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => handleOpenDialog()}
          >
            New Rule
          </Button>
        </div>

        <Table scroll={{ x: 'max-content' }}
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No Active Rules" }}
        />
      </Space>

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
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
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
    </PageContainer>
  );
};

export default ShippingSettingsPage;
