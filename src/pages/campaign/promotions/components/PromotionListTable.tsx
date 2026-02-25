import React from "react";
import { Promotion } from "@/model/Promotion";
import { Table, Button, Tag, Space, Typography, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  items: Promotion[];
  loading: boolean;
  onEdit: (promotion: Promotion) => void;
  onDelete?: (promotion: Promotion) => void;
}

const PromotionListTable: React.FC<Props> = ({
  items,
  loading,
  onEdit,
  onDelete,
}) => {
  const columns = [
    {
      title: "Campaign Info",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Promotion) => (
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
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag>{type?.replace("_", " ")}</Tag>,
    },
    {
      title: "Timeline",
      key: "timeline",
      render: (_: any, record: Promotion) => {
        const sRaw: any = record.startDate;
        const eRaw: any = record.endDate;
        const start = sRaw
          ? sRaw.seconds
            ? dayjs(sRaw.toDate())
            : dayjs(sRaw)
          : null;
        const end = eRaw
          ? eRaw.seconds
            ? dayjs(eRaw.toDate())
            : dayjs(eRaw)
          : null;

        return (
          <div className="flex flex-col">
            <Space size={4}>
              <Text className="text-xs">Start:</Text>
              <Text strong className="text-xs">
                {start ? start.format("DD MMM YYYY") : "-"}
              </Text>
            </Space>
            <Space size={4}>
              <Text className="text-xs">End:</Text>
              <Text strong className="text-xs">
                {end ? end.format("DD MMM YYYY") : "-"}
              </Text>
            </Space>
          </div>
        );
      },
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      align: "center" as const,
      render: (priority: number) => (
        <Tag color="gold" className="font-bold">
          {priority}
        </Tag>
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
      render: (_: any, record: Promotion) => (
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
      scroll={{ x: "max-content" }}
      bordered
      columns={columns}
      dataSource={items}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 10, position: ["bottomRight"] }}
    />
  );
};

export default PromotionListTable;
