
import React from "react";
import { ComboProduct } from "@/model/ComboProduct";
import { Table, Button, Tag, Space, Typography, Tooltip, Avatar } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
} from "@ant-design/icons";


const { Text } = Typography;

interface Props {
  items: ComboProduct[];
  loading: boolean;
  onEdit: (combo: ComboProduct) => void;
  onDelete?: (combo: ComboProduct) => void;
}

const ComboListTable: React.FC<Props> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Asset",
      key: "asset",
      width: 80,
      render: (_: any, record: ComboProduct) => (
        <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded flex items-center justify-center overflow-hidden">
          {record.thumbnail?.url ? (
            <img
              src={record.thumbnail.url}
              alt={record.name}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          ) : (
            <PictureOutlined className="text-gray-300 text-lg" />
          )}
        </div>
      ),
    },
    {
      title: "Bundle Info",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: ComboProduct) => (
        <div className="flex flex-col">
          <Text strong className="text-base">
            {text}
          </Text>
          <Text type="secondary" className="text-xs truncate max-w-[200px]">
            {record.description || "No description"}
          </Text>
        </div>
      ),
    },
    {
      title: "Details",
      key: "details",
      render: (_: any, record: ComboProduct) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.type === "BUNDLE" ? "blue" : "purple"}>
            {record.type}
          </Tag>
          <Text type="secondary" className="text-xs">
            {record.items?.length || 0} Items
          </Text>
        </Space>
      ),
    },
    {
      title: "Pricing",
      key: "pricing",
      align: "right" as const,
      render: (_: any, record: ComboProduct) => (
        <div className="flex flex-col items-end">
          <Text strong>Rs. {record.comboPrice.toLocaleString()}</Text>
          {record.originalPrice > record.comboPrice && (
            <Text delete type="secondary" className="text-xs">
              Rs. {record.originalPrice.toLocaleString()}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      align: "center" as const,
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "default"}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right" as const,
      render: (_: any, record: ComboProduct) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {onDelete && (
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={items}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
};

export default ComboListTable;
