import React from "react";
import { ProductVariant } from "@/model/ProductVariant";
import { Table, Button, Badge, Space, Tooltip, Empty } from "antd";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { ColumnsType } from "antd/es/table";

interface VariantListProps {
  variants: ProductVariant[];
  onAddVariant: () => void;
  onEditVariant: (index: number) => void;
  onDeleteVariant: (index: number) => void;
}

const VariantList: React.FC<VariantListProps> = ({
  variants,
  onAddVariant,
  onEditVariant,
  onDeleteVariant,
}) => {
  const columns: ColumnsType<ProductVariant> = [
    {
      title: "Variant Name",
      dataIndex: "variantName",
      key: "variantName",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Sizes",
      dataIndex: "sizes",
      key: "sizes",
      render: (sizes: string[]) => (
        <Space wrap>
          {sizes.length > 0 ? (
            sizes.map((size) => (
              <span
                key={size}
                className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-xs text-gray-600 font-mono"
              >
                {size}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-xs italic">No sizes</span>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      width: 100,
      render: (status: boolean) => (
        <Badge
          status={status ? "success" : "error"}
          text={status ? "Active" : "Inactive"}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      width: 120,
      render: (_, __, index) => (
        <Space size="small">
          <Tooltip title="Edit Variant">
            <Button
              size="small"
              icon={<IconEdit size={16} />}
              onClick={() => onEditVariant(index)}
            />
          </Tooltip>
          <Tooltip title="Remove Variant">
            <Button
              size="small"
              danger
              icon={<IconTrash size={16} />}
              onClick={() => onDeleteVariant(index)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide m-0">
          Product Variants
        </h4>
        <Button
          type="primary"
          size="small"
          onClick={onAddVariant}
          className="bg-green-600 hover:bg-green-500"
        >
          Add Variant
        </Button>
      </div>

      <Table scroll={{ x: 'max-content' }}
        dataSource={variants}
        columns={columns}
        rowKey={(record) => record.variantId || Math.random().toString()}
        pagination={false}
        size="small"
        bordered
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No variants added yet"
            />
          ),
        }}
        className="border border-gray-200 rounded-md overflow-hidden"
      />
    </div>
  );
};

export default VariantList;
