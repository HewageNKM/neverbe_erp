import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Permission } from "@/model/Role";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../../components/container/PageContainer";
import {
  IconArrowLeft,
  IconShield,
} from "@tabler/icons-react";
import {
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Checkbox,
  Row,
  Col,
  Spin,
} from "antd";

const { Title, Text } = Typography;

const CreateRolePage = () => {
  const navigate = useNavigate();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const res = await api.get("/api/v1/erp/users/roles");
        setPermissionsList(res.data.permissions || []);
      } catch (error) {
        toast.error("Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        id: values.id.replace(/\s+/g, "_").toLowerCase(),
        name: values.name,
        permissions: values.permissions || [],
      };
      const token = await auth.currentUser?.getIdToken();
      await api.post("/api/v1/erp/users/roles", payload);
      toast.success("Role created successfully");
      navigate("/roles");
    } catch (error) {
      toast.error("Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissionsList.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <PageContainer
      title="Create Role"
      description="Create a new role with permissions"
    >
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <Button
              type="link"
              onClick={() => navigate(-1)}
              icon={<IconArrowLeft size={16} />}
              className="px-0 text-gray-500 hover:text-black mb-2"
            >
              Back to Roles
            </Button>
            <Space align="center" size="small">
              <IconShield size={24} className="text-gray-500" />
              <Title level={2} className="!m-0">
                Create New Role
              </Title>
            </Space>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ permissions: [] }}
        >
          <Card className="mb-6 shadow-sm">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Role ID"
                  name="id"
                  rules={[{ required: true, message: "Role ID is required" }]}
                  help="Lowercase, no spaces. Used internally by the system."
                >
                  <Input placeholder="e.g. inventory_manager" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Role Name"
                  name="name"
                  rules={[{ required: true, message: "Role Name is required" }]}
                >
                  <Input placeholder="e.g. Inventory Manager" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Permissions" className="mb-6 shadow-sm">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Spin size="large" />
              </div>
            ) : (
              <Form.Item name="permissions">
                <Checkbox.Group className="w-full">
                  <div className="space-y-6 w-full">
                    {Object.entries(groupedPermissions).map(([group, perms]) => (
                      <div key={group}>
                        <Text strong className="block mb-3 text-gray-500">
                          {group.toUpperCase()}
                        </Text>
                        <Row gutter={[16, 16]}>
                          {perms.map((perm) => (
                            <Col xs={24} sm={12} md={8} key={perm.key}>
                              <Checkbox value={perm.key}>{perm.label}</Checkbox>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))}
                  </div>
                </Checkbox.Group>
              </Form.Item>
            )}
          </Card>

          <div className="flex justify-end gap-3">
            <Button size="large" onClick={() => navigate(-1)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={saving}
            >
              Create Role
            </Button>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default CreateRolePage;
