import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Role } from "@/model/Role";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "@/firebase/firebaseClient";
import PageContainer from "../components/container/PageContainer";
import { IconPlus, IconPencil, IconTrash } from "@tabler/icons-react";
import { useConfirmationDialog } from "@/contexts/ConfirmationDialogContext";
import { Table, Button, Typography, Tooltip, Space, Tag } from "antd";

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
      render: (text: string) => (
        <span className="text-[11px] font-black tracking-widest text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100 uppercase">
          {text}
        </span>
      ),
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
    <PageContainer title="Roles" description="Permission Control">
      <div className="space-y-6">
        {/* PREMIUM HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-rose-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                Security Administration
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                Roles & Permissions
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<IconPlus size={18} />}
            onClick={() => navigate("/roles/create")}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            New Role
          </Button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-none">
          <Table
            scroll={{ x: "max-content" }}
            columns={columns}
            dataSource={roles}
            rowKey="id"
            loading={loading}
            locale={{ emptyText: "No Roles Found" }}
            pagination={false}
            className="role-table"
          />
        </div>
      </div>

      <style>{`
        .role-table .ant-table-thead > tr > th {
          background: #fcfcfc !important;
          color: #9ca3af !important;
          font-size: 11px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          font-weight: 800 !important;
          border-bottom: 1px solid #f3f4f6 !important;
          padding: 16px 24px !important;
        }
        .role-table .ant-table-cell {
          padding: 16px 24px !important;
          border-bottom: 1px solid #f9f9f9 !important;
        }
        .role-table .ant-table-row:hover .ant-table-cell {
          background: #fdfdfd !important;
        }
      `}</style>
    </PageContainer>
  );
};

export default RolesPage;
