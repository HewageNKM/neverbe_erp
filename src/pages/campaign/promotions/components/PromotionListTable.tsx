import React from "react";
import { Promotion } from "@/model/Promotion";
import { Table, Button, Tag, Space, Typography, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

const { Text } = Typography;

interface Props {
  items: Promotion[];
  loading: boolean;
  pagination: any;
  onChange: (pagination: any) => void;
  onEdit: (promotion: Promotion) => void;
  onDelete?: (promotion: Promotion) => void;
}

const PromotionListTable: React.FC<Props> = ({
  items,
  loading,
  pagination,
  onChange,
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
        const parseDate = (d: any) => {
          if (!d) return null;
          if (d.seconds) return dayjs(d.toDate());
          if (typeof d === "string" && d.includes("/")) {
            const parsed = dayjs(d, "DD/MM/YYYY, hh:mm:ss a");
            if (parsed.isValid()) return parsed;
          }
          return dayjs(d);
        };

        const start = parseDate(record.startDate);
        const end = parseDate(record.endDate);

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
      pagination={{ ...pagination, position: ["bottomRight"] }}
      onChange={onChange}
    />
  );
};

export default PromotionListTable;
