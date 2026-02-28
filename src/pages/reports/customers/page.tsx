import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconUsers,
  IconUserPlus,
  IconRepeat,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface CustomerAnalytics {
  period: { from: string; to: string };
  overview: {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageOrderValue: number;
    ordersPerCustomer: number;
  };
  topCustomers: {
    name: string;
    email?: string;
    phone?: string;
    totalOrders: number;
    totalSpent: number;
  }[];
  acquisitionBySource: { source: string; count: number; percentage: number }[];
}

const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

const CustomerAnalyticsPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CustomerAnalytics | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    setLoading(true);
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }
    try {
      const res = await api.get<CustomerAnalytics>(
        "/api/v1/erp/reports/customers",
        {
          params: { from: fromDate, to: toDate },
        },
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch customer analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs().startOf("month"), dayjs()] });
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report) {
      toast("No data to export");
      return;
    }

    const overviewData = [
      { Metric: "Total Customers", Value: report.overview.totalCustomers },
      { Metric: "New Customers", Value: report.overview.newCustomers },
      {
        Metric: "Returning Customers",
        Value: report.overview.returningCustomers,
      },
      {
        Metric: "Average Order Value",
        Value: report.overview.averageOrderValue,
      },
      {
        Metric: "Orders Per Customer",
        Value: report.overview.ordersPerCustomer,
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, ws1, "Overview");

    const ws2 = XLSX.utils.json_to_sheet(
      report.topCustomers.map((c) => ({
        Name: c.name,
        Email: c.email || "",
        Phone: c.phone || "",
        Orders: c.totalOrders,
        "Total Spent": c.totalSpent,
      })),
    );
    XLSX.utils.book_append_sheet(wb, ws2, "Top Customers");

    XLSX.writeFile(wb, `customer_analytics_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };
  const columns: ColumnsType<any> = [
    {
      title: "#",
      key: "col0",
      render: (_, __, idx) => <>{idx + 1}</>,
    },
    {
      title: "Customer",
      key: "customer",
      render: (_, customer) => <>{customer.name}</>,
    },
    {
      title: "Contact",
      key: "contact",
      render: (_, customer) => <>{customer.email || customer.phone || "-"}</>,
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, customer) => <>{customer.totalOrders}</>,
    },
    {
      title: "Total Spent",
      key: "totalSpent",
      render: (_, customer) => <>Rs {customer.totalSpent.toLocaleString()}</>,
    },
  ];

  return (
    <PageContainer title="Customer Analytics">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Customer Analytics
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Customer acquisition, retention, and spending insights.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Space>
                    <Button
                      htmlType="submit"
                      type="primary"
                      icon={<IconFilter size={15} />}
                    >
                      Filter
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>

            <button
              onClick={handleExportExcel}
              disabled={!report}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-900 text-xs font-bold   rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              <IconDownload size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconUsers size={16} className="text-gray-400" />
                  <p className="text-xs font-bold   text-gray-500">
                    Total Customers
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {report.overview.totalCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconUserPlus size={16} className="text-green-500" />
                  <p className="text-xs font-bold   text-gray-500">
                    New Customers
                  </p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {report.overview.newCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconRepeat size={16} className="text-green-500" />
                  <p className="text-xs font-bold   text-gray-500">Returning</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {report.overview.returningCustomers}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Avg Order Value
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs {report.overview.averageOrderValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-600 p-6">
                <p className="text-xs font-bold   text-gray-400 mb-2">
                  Orders/Customer
                </p>
                <p className="text-2xl font-bold text-white">
                  {report.overview.ordersPerCustomer}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* New vs Returning */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold   text-gray-900 mb-4">
                  New vs Returning Customers
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "New",
                            value: report.overview.newCustomers,
                          },
                          {
                            name: "Returning",
                            value: report.overview.returningCustomers,
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        <Cell fill="#10B981" />
                        <Cell fill="#3B82F6" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Acquisition by Source */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold   text-gray-900 mb-4">
                  Orders by Source
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={report.acquisitionBySource}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="source" type="category" width={80} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#111827" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Top Customers Table */}
            {report.topCustomers.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold   text-gray-900">
                    Top 10 Customers
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table
                    scroll={{ x: "max-content" }}
                    bordered
                    columns={columns}
                    dataSource={report.topCustomers}
                    rowKey={(r: any) =>
                      r.id || r.date || r.month || Math.random().toString()
                    }
                    pagination={{ pageSize: 15, position: ["bottomRight"] }}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CustomerAnalyticsPage;
