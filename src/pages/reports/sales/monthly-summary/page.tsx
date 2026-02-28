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
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const MAX_MONTHS_RANGE = 12;

const MonthlySummaryPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  // Initialize with last 12 months
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(12, "month").format("YYYY-MM"),
    dayjs().format("YYYY-MM"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM") || dateRange[1];
    const status = values?.status || "Paid";

    if (!from || !to) return;

    const fromDate = new Date(from + "-01");
    const toDate = new Date(to + "-01");
    toDate.setMonth(toDate.getMonth() + 1);
    toDate.setDate(0);
    toDate.setHours(23, 59, 59, 999);

    // check max months
    const monthDiff =
      toDate.getFullYear() * 12 +
      toDate.getMonth() -
      (fromDate.getFullYear() * 12 + fromDate.getMonth()) +
      1;

    if (monthDiff > MAX_MONTHS_RANGE) {
      toast.error(`Date range cannot exceed ${MAX_MONTHS_RANGE} months.`);
      return;
    }

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/monthly-summary", {
        params: {
          from: fromDate.toISOString().split("T")[0],
          to: toDate.toISOString().split("T")[0],
          status,
        },
      });
      setSummary(res.data.summary || null);
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
    if (currentUser) {
      form.setFieldsValue({
        dateRange: [
          dayjs(dateRange[0], "YYYY-MM"),
          dayjs(dateRange[1], "YYYY-MM"),
        ],
        status: "Paid",
      });
      fetchReport(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!summary?.monthly || summary.monthly.length === 0) return;

    const exportData = summary.monthly.map((m: any) => ({
      Month: m.month,
      "Total Orders": m.orders,
      "Total Sales (Rs)": m.sales.toFixed(2),
      "Total Net Sales": m.netSales.toFixed(2),
      "Total COGS (Rs)": (m.cogs || 0).toFixed(2),
      "Total Gross Profit (Rs)": (m.grossProfit || 0).toFixed(2),
      "Gross Profit Margin (%)": (m.grossProfitMargin || 0).toFixed(2),
      "Avg Order Value (Rs)": (m.averageOrderValue || 0).toFixed(2),
      "Shipping (Rs)": m.shipping.toFixed(2),
      "Discount (Rs)": m.discount.toFixed(2),
      "Transaction Fee (Rs)": m.transactionFee.toFixed(2),
      "Items Sold": m.itemsSold,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Monthly Summary");
    XLSX.writeFile(wb, `monthly_summary_${dateRange[0]}_${dateRange[1]}.xlsx`);
  };

  const SummaryCard = ({
    title,
    value,
  }: {
    title: string;
    value: string | number;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold   text-gray-500 mb-2">{title}</p>
      <p className="text-xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );

  const columns: ColumnsType<any> = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      render: (text) => (
        <span className="font-medium text-gray-900 whitespace-nowrap">
          {text}
        </span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      align: "right",
      render: (val) => (
        <span className="font-medium text-gray-900">Rs {val.toFixed(2)}</span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "netSales",
      key: "netSales",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {val.toFixed(2)}</span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      key: "cogs",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {(val || 0).toFixed(2)}</span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (val) => (
        <span className="font-medium text-green-600">
          Rs {(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "itemsSold",
      key: "itemsSold",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Shipping",
      dataIndex: "shipping",
      key: "shipping",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {val.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <PageContainer title="Monthly Sales Summary">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Monthly Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Filter sales by month range (Max 12 months)
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
                  <DatePicker.RangePicker allowClear={false} picker="month" />
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
              onClick={handleExportExcel}
              disabled={!summary?.monthly?.length}
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
        {!loading && summary && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Total Orders" value={summary.totalOrders} />
              <SummaryCard
                title="Total Sales"
                value={`Rs ${summary.totalSales.toFixed(2)}`}
              />
              <SummaryCard
                title="Net Sales"
                value={`Rs ${summary.totalNetSales.toFixed(2)}`}
              />
              <SummaryCard title="Items Sold" value={summary.totalItemsSold} />
              <SummaryCard
                title="Gross Profit"
                value={`Rs ${(summary.totalGrossProfit || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Profit Margin"
                value={`${(summary.totalGrossProfitMargin || 0).toFixed(2)}%`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`Rs ${(summary.averageOrderValue || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Shipping"
                value={`Rs ${summary.totalShipping.toFixed(2)}`}
              />
            </div>

            {/* Charts Section */}
            {summary.monthly && summary.monthly.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                    Monthly Sales Trend
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.monthly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "none",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                            fontSize: "12px",
                            fontWeight: "bold",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ stroke: "#f3f4f6", strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke="#1976d2"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#1976d2", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#1976d2" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                    Monthly Items Sold
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.monthly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="month"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          allowDecimals={false}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#111827",
                            border: "none",
                            borderRadius: "8px",
                            color: "#F9FAFB",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                        />
                        <Bar
                          dataKey="itemsSold"
                          name="Items"
                          fill="#1976d2"
                          radius={[2, 2, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Monthly Subtotals
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {summary.monthly?.length} entries
                  </p>
                </div>
                <Tag
                  color="default"
                  className="text-[10px] font-bold uppercase"
                >
                  LKR
                </Tag>
              </div>
              <Table
                columns={columns}
                dataSource={summary.monthly || []}
                rowKey={(record, index) => index as number}
                pagination={{
                  pageSize: 15,
                  position: ["bottomRight"],
                  showSizeChanger: true,
                }}
                size="small"
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default MonthlySummaryPage;
