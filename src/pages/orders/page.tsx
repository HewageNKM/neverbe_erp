import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  IconEye,
  IconFileInvoice,
  IconEdit,
  IconCheck,
  IconAlertCircle,
  IconSearch,
  IconFilter,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import PageContainer from "../components/container/PageContainer";
import toast from "react-hot-toast";
import { getToken } from "@/firebase/firebaseClient";
import { useAppSelector } from "@/lib/hooks";
import { Order } from "@/model/Order";
import {
  Table,
  Button,
  Input,
  Select,
  DatePicker,
  Tag,
  Space,
  Tooltip,
  Form,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

const OrdersPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [form] = Form.useForm();

  // --- Pagination state ---
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // --- Orders state ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Fetch orders from API ---
  const fetchOrders = async (values?: any) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();

      params.append("page", String(pagination.current));
      params.append("size", String(pagination.pageSize));

      const filters = values || form.getFieldsValue();

      if (filters.payment && filters.payment !== "all")
        params.append("payment", filters.payment);
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.search) params.append("search", filters.search.trim());

      if (filters.dateRange) {
        if (filters.dateRange[0])
          params.append("from", filters.dateRange[0].format("YYYY-MM-DD"));
        if (filters.dateRange[1])
          params.append("to", filters.dateRange[1].format("YYYY-MM-DD"));
      }

      const token = await getToken();
      const { data } = await axios.get(
        `/api/v1/orders?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setOrders(data.dataList);
      setPagination((prev) => ({
        ...prev,
        total: data.total,
      }));
    } catch (err: any) {
      console.error(err);
      toast(
        err?.response?.data?.message || "Failed to fetch orders",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Re-fetch when pagination changes
  useEffect(() => {
    if (currentUser) fetchOrders();
  }, [pagination.current, pagination.pageSize, currentUser]);

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
  };

  const handleFilterSubmit = (values: any) => {
    setPagination((prev) => ({ ...prev, current: 1 }));
    // We need to wait for state update or pass values directly.
    // fetchOrders uses form.getFieldsValue() so verify if values are synced or pass explicitly.
    // Ideally, pass explicitly to fetchOrders or let useEffect trigger (but useEffect depends on pagination).
    // Best: Update pagination, then fetch. But fetch depends on pagination state.
    // We'll call fetchOrders directly with the new pagination (reset to 1) and values.
    // NOTE: fetchOrders uses 'pagination.current' from state. We must manually override in params or wait.
    // Simpler approach: Just reset page to 1, and let useEffect trigger? No, useEffect depends on [pagination.current].
    // If page is already 1, it won't trigger.
    // So we call fetchOrders manually passing the values, and override page param logic inside if needed, or just setPagination(1) and if it's already 1 call fetch.

    if (pagination.current === 1) {
      fetchOrders(values);
    } else {
      setPagination((prev) => ({ ...prev, current: 1 }));
      // useEffect will trigger fetchOrders
    }
  };

  const handleClearFilters = () => {
    form.resetFields();
    handleFilterSubmit({});
  };

  // Helper for Status Badges
  const getStatusTagColor = (
    status: string | undefined,
    type: "payment" | "order",
  ) => {
    if (!status) return "default";
    const s = status.toLowerCase();

    if (type === "payment") {
      if (s === "paid") return "success";
      if (s === "pending") return "default";
      if (s === "failed") return "error";
      if (s === "refunded") return "warning";
    } else {
      if (s === "completed") return "success";
      if (s === "processing") return "processing";
    }
    return "default";
  };

  const columns: ColumnsType<Order> = [
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, order) => (
        <Space>
          <Tooltip title="Invoice">
            <Button
              type="text"
              icon={<IconFileInvoice size={18} />}
              onClick={() => navigate(`/orders/${order.orderId}/invoice`)}
            />
          </Tooltip>
          {/* View Button Removed/Redundant? The legacy code had view button. Keeping it. */}
          <Tooltip title="View">
            <Button
              type="text"
              icon={<IconEye size={18} />}
              onClick={() => navigate(`/orders/${order.orderId}/view`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<IconEdit size={16} />}
              size="small"
              onClick={() => navigate(`/orders/${order.orderId}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Order Details",
      key: "details",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>#{order.orderId}</Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {order.createdAt
              ? new Date(order.createdAt as any).toLocaleString()
              : "-"}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            via {order.from}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, order) => (
        <div className="flex flex-col">
          <Typography.Text strong>
            {order.customer?.name || "N/A"}
          </Typography.Text>
          <Typography.Text type="secondary" className="text-xs">
            {order.items?.length || 0} Items
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Payment",
      key: "payment",
      align: "center",
      render: (_, order) => (
        <div className="flex flex-col items-center">
          <Tag color={getStatusTagColor(order.paymentStatus, "payment")}>
            {order.paymentStatus || "N/A"}
          </Tag>
          <span className="text-xs text-gray-400 mt-1">
            {order.paymentMethod || "—"}
          </span>
        </div>
      ),
    },
    {
      title: "Total",
      key: "total",
      align: "right",
      render: (_, order) => (
        <Typography.Text strong>
          LKR {order.total?.toLocaleString()}
        </Typography.Text>
      ),
    },
    {
      title: "Status",
      key: "status",
      align: "center",
      render: (_, order) => (
        <Tag color={getStatusTagColor(order.status, "order")}>
          {order.status}
        </Tag>
      ),
    },
    {
      title: "Check",
      key: "check",
      align: "center",
      render: (_, order) =>
        order.integrity ? (
          <IconCheck size={18} className="text-green-600 mx-auto" />
        ) : (
          <IconAlertCircle size={18} className="text-red-600 mx-auto" />
        ),
    },
  ];

  return (
    <PageContainer title="Orders" description="Manage Customer Orders">
      <Space direction="vertical" size="large" className="w-full">
        {/* Header - Kept simpler or matched layout? Let's use standard AntD layout logic if possible, 
            but kept the header visual style consistently with other refactored pages if any. 
            The legacy header had a refresh button. */}
        <div className="flex justify-between items-center">
          <div>
            <Typography.Title level={2} className="!m-0">
              Orders
            </Typography.Title>
            <Typography.Text type="secondary">
              {pagination.total} Total Orders
            </Typography.Text>
          </div>
          <Button
            icon={<IconRefresh size={18} />}
            onClick={() => fetchOrders()}
            loading={isLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card size="small" className="bg-gray-50/50">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFilterSubmit}
            initialValues={{ payment: "all", status: "all" }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} md={6}>
                <Form.Item name="search" label="Search">
                  <Input
                    prefix={<IconSearch size={16} className="text-gray-400" />}
                    placeholder="Order ID..."
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="payment" label="Payment">
                  <Select>
                    <Option value="all">All Payment</Option>
                    <Option value="Paid">Paid</Option>
                    <Option value="Pending">Pending</Option>
                    <Option value="Failed">Failed</Option>
                    <Option value="Refunded">Refunded</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={12} md={4}>
                <Form.Item name="status" label="Status">
                  <Select>
                    <Option value="all">All Status</Option>
                    <Option value="Processing">Processing</Option>
                    <Option value="Completed">Completed</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item name="dateRange" label="Date Range">
                  <RangePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col xs={24} md={4} className="flex items-end pb-6 gap-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<IconFilter size={16} />}
                  block
                >
                  Filter
                </Button>
                <Button
                  icon={<IconX size={16} />}
                  onClick={handleClearFilters}
                />
              </Col>
            </Row>
          </Form>
        </Card>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="orderId"
          pagination={pagination}
          loading={isLoading}
          onChange={handleTableChange}
          scroll={{ x: 1000 }}
          bordered
        />
      </Space>
    </PageContainer>
  );
};

export default OrdersPage;
