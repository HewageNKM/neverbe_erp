import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import {
  IconLoader,
  IconAlertTriangle,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Spin,
  Space,
  Alert,
  Divider,
} from "antd";

const { Title, Text } = Typography;

const OrderView = ({ orderId }: { orderId: string }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchOrder();
  }, [currentUser]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      setOrder(res.data || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to fetch order");
    } finally {
      setLoadingOrder(false);
    }
  };

  const subtotal =
    (order?.total || 0) +
    (order?.discount || 0) -
    (order?.shippingFee || 0) -
    (order?.fee || 0);

  const discount = order?.discount || 0;
  const fee = order?.fee || 0;
  const shippingFee = order?.shippingFee || 0;

  if (loadingOrder) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Spin size="large" tip="Loading Order Details..." />
      </div>
    );
  }

  // --- Helpers for Status Colors ---
  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "orange";
      default:
        return "default";
    }
  };

  const getOrderStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "success";
      case "processing":
        return "processing";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  // --- Table Columns ---
  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: any) => (
        <div className="flex flex-col">
          <Text strong>{text}</Text>
          {record.isComboItem && (
            <Tag color="purple" className="w-fit mt-1 text-[10px]">
              BIN: {record.comboName}
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: "Variant",
      dataIndex: "variantName",
      key: "variantName",
      render: (text: string) => <Text type="secondary">{text || "-"}</Text>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      align: "center" as const,
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      align: "center" as const,
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      render: (price: number, record: any) => (
        <div>
          <Text>{price.toLocaleString()}</Text>
          {record.discount > 0 && (
            <div className="text-xs text-red-500">
              -{record.discount.toLocaleString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Total",
      key: "total",
      align: "right" as const,
      render: (_: any, record: any) => (
        <Text strong>
          {(
            (record.quantity || 0) *
            ((record.price || 0) - (record.discount || 0))
          ).toLocaleString()}
        </Text>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-gray-500">
        <Link to="/orders" className="hover:text-green-600 transition-colors">
          Orders
        </Link>
        <span>/</span>
        <Text strong>#{order?.orderId}</Text>
      </div>

      {/* Integrity Alert */}
      {order && order.integrity === false && (
        <Alert
          message="Security Integrity Check Failed"
          description="This order has failed system integrity checks. Please review manually."
          type="error"
          showIcon
          icon={<IconAlertTriangle />}
          className="mb-4"
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 pb-6">
        <div>
          <Text
            type="secondary"
            className="block text-xs uppercase tracking-wider mb-1"
          >
            Order Detail
          </Text>
          <Title level={2} style={{ margin: 0 }}>
            #{order?.orderId}
          </Title>
        </div>
        <Space>
          <Tag
            color={getPaymentStatusColor(order?.paymentStatus)}
            className="px-3 py-1 text-sm"
          >
            {order?.paymentStatus?.toUpperCase()}
          </Tag>
          <Tag
            color={getOrderStatusColor(order?.status)}
            className="px-3 py-1 text-sm"
          >
            {order?.status?.toUpperCase()}
          </Tag>
        </Space>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-8">
          <Card
            title={`Order Items (${order?.items?.length || 0})`}
            className="shadow-sm"
          >
            <Table
              dataSource={order?.items || []}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => `${record.productId}_${index}`}
              summary={(pageData) => {
                // Determine combos for grouping visually in summary if needed,
                // but standard table summary row is usually just totals.
                // We'll skip complex summary row here as the financial card covers it.
                return null;
              }}
            />
          </Card>

          <Card title="Transaction Details" className="shadow-sm">
            <Descriptions
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
            >
              <Descriptions.Item label="Payment Method">
                {order?.paymentMethod}{" "}
                <Text type="secondary" className="text-xs">
                  ({order?.paymentMethodId})
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                <Text code>{order?.paymentId || "N/A"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {order?.createdAt
                  ? new Date(order.createdAt as any).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {order?.updatedAt
                  ? new Date(order.updatedAt as any).toLocaleString()
                  : "N/A"}
              </Descriptions.Item>
              <Descriptions.Item label="Stock Source">
                {order?.from || "-"} / {order?.stockId || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Integrity">
                {order?.integrity ? (
                  <Tag color="success" icon={<IconCheck size={12} />}>
                    Verified
                  </Tag>
                ) : (
                  <Tag color="error" icon={<IconX size={12} />}>
                    Failed
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Right Column: Financials & Customer */}
        <div className="lg:col-span-1 space-y-8">
          <Card title="Financial Summary" className="shadow-sm bg-gray-50">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <Text>Subtotal</Text>
                <Text strong>{subtotal.toLocaleString()} LKR</Text>
              </div>

              {order?.couponCode && (order?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <Text type="success">Coupon ({order.couponCode})</Text>
                  <Text type="success">
                    - {(order.couponDiscount || 0).toLocaleString()} LKR
                  </Text>
                </div>
              )}

              {(order?.promotionDiscount || 0) > 0 && (
                <div className="flex justify-between text-blue-600">
                  <Text type="secondary" className="text-blue-600">
                    Auto Promotion
                  </Text>
                  <Text type="secondary" className="text-blue-600">
                    - {(order.promotionDiscount || 0).toLocaleString()} LKR
                  </Text>
                </div>
              )}

              {/* General Discount Fallback */}
              {discount >
                (order?.couponDiscount || 0) +
                  (order?.promotionDiscount || 0) && (
                <div className="flex justify-between text-red-500">
                  <Text type="danger">Other Discounts</Text>
                  <Text type="danger">
                    -{" "}
                    {(
                      discount -
                      ((order?.couponDiscount || 0) +
                        (order?.promotionDiscount || 0))
                    ).toLocaleString()}{" "}
                    LKR
                  </Text>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <Text>Shipping</Text>
                <Text>{shippingFee.toLocaleString()} LKR</Text>
              </div>

              <div className="flex justify-between text-gray-600">
                <Text>Processing Fee</Text>
                <Text>{fee.toLocaleString()} LKR</Text>
              </div>

              <Divider className="my-2" />

              <div className="flex justify-between items-end">
                <Title level={4} style={{ margin: 0 }}>
                  Total
                </Title>
                <Title level={3} style={{ margin: 0 }}>
                  {(order?.total || 0).toLocaleString()}{" "}
                  <span className="text-sm font-normal text-gray-400">LKR</span>
                </Title>
              </div>
            </div>
          </Card>

          {order?.customer && (
            <Card title="Customer Details" className="shadow-sm">
              <Space direction="vertical" size="large" className="w-full">
                <div>
                  <Text
                    type="secondary"
                    className="text-xs uppercase font-bold mb-2 block"
                  >
                    Contact Info
                  </Text>
                  <div className="pl-2 border-l-2 border-gray-200">
                    <Text strong className="block">
                      {order.customer.name}
                    </Text>
                    <Text className="block text-gray-500">
                      {order.customer.email}
                    </Text>
                    <Text className="block text-gray-500">
                      {order.customer.phone}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text
                    type="secondary"
                    className="text-xs uppercase font-bold mb-2 block"
                  >
                    Shipping Address
                  </Text>
                  <div className="pl-2 border-l-2 border-blue-500">
                    <Text strong className="block">
                      {order.customer.shippingName}
                    </Text>
                    <Text className="block text-gray-600">
                      {order.customer.shippingAddress}
                    </Text>
                    <Text className="block text-gray-600">
                      {order.customer.shippingCity} {order.customer.shippingZip}
                    </Text>
                  </div>
                </div>
              </Space>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderView;
