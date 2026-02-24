import {
  Spin,
  Form,
  Input,
  Button,
  Card,
  Space,
  Typography,
  Checkbox,
  Row,
  Col,
} from "antd";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Permission, Role } from "@/model/Role";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import {
  IconDeviceFloppy,
  IconArrowLeft,
  IconShield,
} from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

const { Title, Text } = Typography;

const EditRolePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
  const [roleId, setRoleId] = useState<string>(id || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    async function init() {
      if (!id) return;

      try {
        const token = await auth.currentUser?.getIdToken();
        const [permRes, roleRes] = await Promise.all([
          api.get("/api/v1/erp/users/roles"),
          api.get(`/api/v1/erp/users/roles/${id}`),
        ]);

        setPermissionsList(permRes.data.permissions || []);
        const roleData = roleRes.data as Role;

        form.setFieldsValue({
          name: roleData.name,
          permissions: roleData.permissions,
        });
      } catch (e) {
        toast.error("Failed to load data");
        navigate("/roles");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, navigate, form]);

  const onFinish = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        permissions: values.permissions || [],
      };
      const token = await auth.currentUser?.getIdToken();
      await api.put(`/api/v1/erp/users/roles/${roleId}`, payload);
      toast.success("Role updated successfully");
      navigate("/roles");
    } catch (error) {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = permissionsList.reduce(
    (acc, perm) => {
      if (!acc[perm.group]) acc[perm.group] = [];
      acc[perm.group].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  if (loading) {
    return (
      <PageContainer title="Edit Role" description="Loading...">
        <div className="flex flex-col items-center justify-center py-32">
          <Spin size="large" />
          <Text type="secondary" className="mt-4">
            Loading Role...
          </Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Role" description={`Editing role: ${roleId}`}>
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
              <div>
                <Title level={4} className="!m-0 text-gray-400">
                  ROLE EDIT
                </Title>
                <Title level={2} className="!m-0">
                  {roleId.toUpperCase()}
                </Title>
              </div>
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
                  label="Role Name"
                  name="name"
                  rules={[{ required: true, message: "Role Name is required" }]}
                >
                  <Input placeholder="e.g. Inventory Manager" size="large" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="Permissions" className="mb-6 shadow-sm">
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
              icon={<IconDeviceFloppy size={18} />}
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </div>
    </PageContainer>
  );
};

export default EditRolePage;
