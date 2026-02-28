import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import {
  Card,
  Form,
  Spin,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
} from "antd";
import React, { useState, useEffect } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#E5E7EB",
];

const SalesByCategoryPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM-DD") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM-DD") || dateRange[1];
    const status = values?.status || "Paid";

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-category", {
        params: { from, to, status },
      });
      setCategories(res.data.categories || []);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.error || e.message || "Failed to fetch report",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      dateRange: [dayjs(dateRange[0]), dayjs(dateRange[1])],
      status: "Paid",
    });
    fetchReport(form.getFieldsValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportExcel = () => {
    if (!categories.length) return;

    const exportData = categories.map((c) => ({
      Category: c.category,
      "Total Orders": c.totalOrders,
      "Total Quantity Sold": c.totalQuantity,
      "Total Sales (Rs)": c.totalSales.toFixed(2),
      "Total Net Sale": c.totalNetSales.toFixed(2),
      "Total COGS (Rs)": (c.totalCOGS || 0).toFixed(2),
      "Total Profit (Rs)": (c.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (c.grossProfitMargin || 0).toFixed(2),
      "Total Discount (Rs)": c.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales by Category");
    XLSX.writeFile(
      wb,
      `sales_by_category_${dateRange[0]}_${dateRange[1]}.xlsx`,
    );
  };
  const columns: ColumnsType<any> = [
    {
      title: "Category",
      key: "category",
      render: (_, c) => (
        <span className="font-medium text-gray-900">{c.category}</span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, c) => <span className="text-gray-600">{c.totalOrders}</span>,
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "right",
      render: (_, c) => (
        <span className="font-medium text-gray-900">{c.totalQuantity}</span>
      ),
    },
    {
      title: "Sales",
      key: "sales",
      align: "right",
      render: (_, c) => (
        <span className="font-medium text-gray-900">
          Rs {(c.totalSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Sale",
      key: "netSale",
      align: "right",
      render: (_, c) => (
        <span className="text-gray-600">
          Rs {(c.totalNetSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, c) => (
        <span className="text-gray-600">
          Rs {(c.totalCOGS || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Profit",
      key: "profit",
      align: "right",
      render: (_, c) => (
        <span className="font-medium text-green-600">
          Rs {(c.totalGrossProfit || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, c) => (
        <span className="text-gray-600">
          {(c.grossProfitMargin || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, c) => (
        <span className="text-red-500">
          Rs {(c.totalDiscount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales by Category">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Sales by Category
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View sales totals aggregated by product category.
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
                  <DatePicker.RangePicker allowClear={false} />
                </Form.Item>
                <Form.Item name="status" className="mb-0! w-32">
                  <Select>
                    <Select.Option value="Paid">Paid</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Refunded">Refunded</Select.Option>
                    <Select.Option value="all">All</Select.Option>
                  </Select>
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
              onClick={exportExcel}
              disabled={!categories.length}
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
        {!loading && categories.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Sales Comparison
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categories}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7280", fontSize: 10 }}
                        width={60}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "4px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                        cursor={{ fill: "#F3F4F6", opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#111827"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalNetSales"
                        name="Net Sale"
                        fill="#22C55E"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDiscount"
                        name="Discount"
                        fill="#EF4444"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Quantity Distribution
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="totalQuantity"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                      >
                        {categories.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "4px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={categories}
              rowKey={(r: any) => r.category}
              pagination={{ pageSize: 15, position: ["bottomRight"] }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
              scroll={{ x: 1000 }}
              bordered
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SalesByCategoryPage;
