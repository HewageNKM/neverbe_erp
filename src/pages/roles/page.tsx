import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Role } from "@/model/Role";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../components/container/PageContainer";
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconShield,
} from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import {
  Table,
  Button,
  Tag,
  Space,
  Card,
  Typography,
  Spin,
  Tooltip,
} from "antd";

const { Title, Text } = Typography;

type RoleWithPermissions = Role & { permissions: string[] };

const RolesPage = () => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showConfirmation } = useConfirmationDialog();

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await api.get("/api/v1/erp/users/roles");
      setRoles(response.data.roles || []);
    } catch (error) {
      console.error("Failed to fetch roles", error);
      toast.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    showConfirmation({
      title: "Delete Role",
      message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onSuccess: async () => {
        setDeleting(id);
        try {
          const token = await auth.currentUser?.getIdToken();
          await api.delete(`/api/v1/erp/users/roles/${id}`);
          toast.success("Role deleted");
          fetchRoles();
        } catch (e) {
          toast.error("Failed to delete role");
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: RoleWithPermissions) => (
        <div className="flex flex-col">
          <Text strong>{text}</Text>
          {record.isSystem && (
            <Text type="secondary" className="text-xs">
              System Role
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Role ID",
      dataIndex: "id",
      key: "id",
      render: (text: string) => <Tag>{text}</Tag>,
    },
    {
      title: "Permissions",
      key: "permissions",
      render: (_: any, record: RoleWithPermissions) => (
        <Space wrap size={[0, 8]}>
          {record.permissions.slice(0, 4).map((p) => (
            <Tag key={p} bordered={false}>
              {p}
            </Tag>
          ))}
          {record.permissions.length > 4 && (
            <Tag color="blue">+{record.permissions.length - 4} MORE</Tag>
          )}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: RoleWithPermissions) =>
        !record.isSystem && (
          <Space>
            <Tooltip title="Edit">
              <Button
                icon={<IconPencil size={18} />}
                onClick={() => navigate(`/roles/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Button
                danger
                icon={<IconTrash size={18} />}
                loading={deleting === record.id}
                onClick={() => handleDelete(record.id, record.name)}
              />
            </Tooltip>
          </Space>
        ),
    },
  ];

  return (
    <PageContainer
      title="Roles"
      description="Manage user roles and permissions"
    >
      <Space direction="vertical" size="large" className="w-full">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <Space align="center" size="small">
              <IconShield size={20} className="text-gray-500" />
              <Title level={2} className="!m-0">
                Role Management
              </Title>
            </Space>
            <Text type="secondary" className="block mt-1">
              Access Control
            </Text>
          </div>
          <Button
            type="primary"
            icon={<IconPlus size={18} />}
            onClick={() => navigate("/roles/create")}
          >
            New Role
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          locale={{ emptyText: "No Roles Found" }}
        />
      </Space>
    </PageContainer>
  );
};

export default RolesPage;
