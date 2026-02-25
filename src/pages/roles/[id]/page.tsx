import {
  Spin,
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  Row,
  Col,
  Breadcrumb,
} from "antd";
import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Permission, Role } from "@/model/Role";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import { IconDeviceFloppy } from "@tabler/icons-react";
import PageContainer from "../../components/container/PageContainer";

const { Text } = Typography;

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
      <div className="w-full max-w-5xl mx-auto space-y-8 py-4">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumb
            separator={<span className="text-gray-300 mx-1">/</span>}
            items={[
              {
                title: (
                  <Link
                    to="/settings"
                    className="text-gray-400 hover:text-green-600 transition-colors font-bold text-[10px] uppercase tracking-widest"
                  >
                    Settings
                  </Link>
                ),
              },
              {
                title: (
                  <Link
                    to="/roles"
                    className="text-gray-400 hover:text-green-600 transition-colors font-bold text-[10px] uppercase tracking-widest"
                  >
                    Roles
                  </Link>
                ),
              },
              {
                title: (
                  <span className="text-gray-900 font-bold text-[10px] uppercase tracking-widest">
                    {roleId}
                  </span>
                ),
              },
            ]}
          />
        </div>

        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-green-500 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Access Control
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                {roleId.toUpperCase()}
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            className="rounded-xl px-12 font-bold"
            loading={saving}
            onClick={() => form.submit()}
          >
            Save Changes
          </Button>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ permissions: [] }}
        >
          <Card
            className="border-gray-100 rounded-2xl bg-white shadow-none"
            styles={{ body: { padding: "24px" } }}
          >
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item
                  label={
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      Role Name
                    </span>
                  }
                  name="name"
                  rules={[{ required: true, message: "Role Name is required" }]}
                >
                  <Input
                    placeholder="e.g. Inventory Manager"
                    size="large"
                    className="rounded-xl border-gray-100 font-medium"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card
            title={
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gray-300 rounded-full" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Permission Matrix
                </span>
              </div>
            }
            className="mt-8 border-gray-100 rounded-2xl bg-white shadow-none"
          >
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
