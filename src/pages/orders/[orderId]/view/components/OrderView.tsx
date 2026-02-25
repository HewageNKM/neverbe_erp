import api from "@/lib/api";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Order } from "@/model/Order";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Typography,
  Space,
  Alert,
  Divider,
} from "antd";

const { Title, Text } = Typography;

const OrderView = ({
  orderId,
  onLoadingChange,
}: {
  orderId: string;
  onLoadingChange?: (loading: boolean) => void;
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchOrder();
  }, [currentUser]);

  const fetchOrder = async () => {
    try {
      setLoadingOrder(true);
      onLoadingChange?.(true);
      const res = await api.get(`/api/v1/erp/orders/${orderId}`);
      setOrder(res.data || null);
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to fetch order");
    } finally {
      setLoadingOrder(false);
      onLoadingChange?.(false);
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

  if (loadingOrder) return null;

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
      title: "Price Breakdown",
      dataIndex: "price",
      key: "price",
      align: "right" as const,
      width: 180,
      render: (price: number, record: any) => {
        const disc = record.discount || 0;
        const sold = price - disc;
        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <Text type="secondary" className="text-[10px] uppercase">
                Retail
              </Text>
              <Text className="text-xs line-through text-gray-400">
                {price.toLocaleString()}
              </Text>
            </div>
            {disc > 0 && (
              <div className="flex items-center gap-2">
                <Text type="secondary" className="text-[10px] uppercase">
                  Disc
                </Text>
                <Text className="text-xs text-red-500 font-medium">
                  -{disc.toLocaleString()}
                </Text>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-gray-100 border-dashed w-full justify-end">
              <Text
                type="secondary"
                className="text-[10px] uppercase font-bold text-green-700"
              >
                Sold
              </Text>
              <Text strong className="text-green-700">
                {sold.toLocaleString()}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Line Total",
      key: "total",
      align: "right" as const,
      width: 120,
      render: (_: any, record: any) => (
        <div className="bg-gray-50 px-2 py-1 rounded">
          <Text strong className="text-sm">
            {(
              (record.quantity || 0) *
              ((record.price || 0) - (record.discount || 0))
            ).toLocaleString()}
          </Text>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Link
          to="/orders"
          className="!text-green-600 hover:!text-green-700 font-medium transition-colors"
        >
          Orders
        </Link>
        <span className="text-gray-300">/</span>
        <Text strong className="text-gray-700">
          Order #{order?.orderId}
        </Text>
      </div>

      {/* Integrity Alert */}
      {order && order.integrity === false && (
        <Alert
          message="Security Integrity Check Failed"
          description="This order has failed system integrity checks. Please exercise extreme caution before proceeding."
          type="error"
          showIcon
          className="shadow-sm"
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
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card
            title={`Order Items (${order?.items?.length || 0})`}
            className="shadow-sm border border-gray-100 rounded-xl overflow-hidden"
          >
            <Table
              dataSource={order?.items || []}
              columns={columns}
              pagination={false}
              rowKey={(record, index) => `${record.productId}_${index}`}
              size="small"
              className="rounded-lg overflow-hidden"
              summary={(pageData) => {
                // Determine combos for grouping visually in summary if needed,
                // but standard table summary row is usually just totals.
                // We'll skip complex summary row here as the financial card covers it.
                return null;
              }}
            />
          </Card>

          <Card
            title="Transaction & Processing"
            className="shadow-sm border border-gray-100 rounded-xl overflow-hidden border-t-2 border-t-green-600"
          >
            <Descriptions
              bordered
              column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
              size="small"
              labelStyle={{
                fontWeight: 600,
                background: "#f8fafc",
                width: "140px",
              }}
            >
              <Descriptions.Item label="Payment Method">
                <Space direction="vertical" size={0}>
                  <Text strong>{order?.paymentMethod}</Text>
                  <Text type="secondary" className="text-[10px]">
                    ID: {order?.paymentMethodId}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Transaction ID">
                <Text
                  code
                  className="bg-green-50 text-green-700 border-green-100"
                >
                  {order?.paymentId || "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Placement Date">
                <Space size={4}>
                  <Text>
                    {order?.createdAt ? String(order.createdAt) : "N/A"}
                  </Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Last Update">
                <Text>
                  {order?.updatedAt ? String(order.updatedAt) : "N/A"}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Inventory Source">
                <Tag color="cyan">
                  {order?.from || "-"} / {order?.stockId || "-"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="System Check">
                {order?.integrity ? (
                  <Tag color="success" bordered={false}>
                    INTEGRITY VERIFIED
                  </Tag>
                ) : (
                  <Tag color="error" bordered={false}>
                    CHECKS FAILED
                  </Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>

        {/* Right Column: Financials & Customer */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card
            title={<span className="font-semibold">Financial Summary</span>}
            className="shadow-sm bg-gray-50/50 border border-gray-100 rounded-xl overflow-hidden"
          >
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
                <div className="flex justify-between text-green-600">
                  <Text type="secondary" className="text-green-600">
                    Auto Promotion
                  </Text>
                  <Text type="secondary" className="text-green-600">
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

              <div className="border-t-2 border-green-200 pt-4 mt-4 flex justify-between items-end">
                <span className="text-sm font-bold tracking-tight text-green-800">
                  Total Due
                </span>
                <span className="text-xl font-bold font-mono tracking-tighter text-green-700">
                  {order?.total?.toLocaleString()}{" "}
                  <span className="text-xs text-green-400 font-bold align-top">
                    LKR
                  </span>
                </span>
              </div>
            </div>
          </Card>

          {order?.customer && (
            <Card
              title={<span className="font-semibold">Customer Details</span>}
              className="shadow-sm border border-gray-100 rounded-xl overflow-hidden"
            >
              <Space direction="vertical" size="large" className="w-full">
                {(order.customer.address || order.customer.city) && (
                  <div>
                    <Text
                      type="secondary"
                      className="text-[10px] uppercase font-bold text-green-600 block mb-2"
                    >
                      Contact Info
                    </Text>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col">
                        <Text strong className="text-sm">
                          {order.customer.name}
                        </Text>
                        <Text className="text-gray-500 text-xs leading-relaxed">
                          {order.customer.address}
                          <br />
                          {order.customer.city} {order.customer.zip}
                        </Text>
                        {order.customer.phone && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Text className="text-gray-600 text-[11px] font-medium">
                              {order.customer.phone}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {order.customer.shippingAddress && (
                  <div className="pt-4 border-t border-gray-50">
                    <Text
                      type="secondary"
                      className="text-[10px] uppercase font-bold text-green-600 block mb-2"
                    >
                      Shipping Address
                    </Text>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col">
                        <Text strong className="text-sm">
                          {order.customer.shippingName || order.customer.name}
                        </Text>
                        <Text className="text-gray-500 text-xs leading-relaxed">
                          {order.customer.shippingAddress}
                          <br />
                          {order.customer.shippingCity}{" "}
                          {order.customer.shippingZip}
                        </Text>
                        {(order.customer.shippingPhone ||
                          order.customer.phone) && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <Text className="text-gray-600 text-[11px] font-medium">
                              {order.customer.shippingPhone ||
                                order.customer.phone}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Space>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderView;
