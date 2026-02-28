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
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconShoppingCart,
  IconTrendingUp,
  IconPackages,
  IconPercentage,
  IconCurrencyDollar,
  IconTruckDelivery,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const Page = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM-DD") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM-DD") || dateRange[1];
    const status = values?.status || "Paid";

    // --- Date range validation (max 62 days to be safer with months) ---
    const start = new Date(from);
    const end = new Date(to);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      toast.error("'To' date must be after 'From' date");
      return;
    }

    if (diffDays > 62) {
      toast.error(`Max allowed range is 62 days for daily summary`);
      return;
    }
    // ----------------------------------------------------

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/daily-summary", {
        params: { from, to, status },
      });
      setSummary(res.data.summary || null);
    } catch (e: any) {
      console.log(e);
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
        dateRange: [dayjs(dateRange[0]), dayjs(dateRange[1])],
        status: "Paid",
      });
      fetchReport(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!summary?.daily || summary.daily.length === 0) return;

    const exportData = summary.daily.map((d: any) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Total Sales (Rs)": d.sales.toFixed(2),
      "Total Net Sales": d.netSales.toFixed(2),
      "Total COGS (Rs)": (d.cogs || 0).toFixed(2),
      "Total Gross Profit (Rs)": (d.grossProfit || 0).toFixed(2),
      "Gross Profit Margin (%)": (d.grossProfitMargin || 0).toFixed(2),
      "Avg Order Value (Rs)": (d.averageOrderValue || 0).toFixed(2),
      "Shipping (Rs)": d.shipping.toFixed(2),
      "Discount (Rs)": d.discount.toFixed(2),
      "Transaction Fee (Rs)": d.transactionFee.toFixed(2),
      "Items Sold": d.itemsSold,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Summary");
    XLSX.writeFile(wb, `daily_summary_${dateRange[0]}_${dateRange[1]}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (!summary?.daily?.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Daily Sales Summary",
        subtitle: "Comprehensive daily sales and profit breakdown",
        period: `${dateRange[0]} – ${dateRange[1]}`,
        summaryItems: [
          { label: "Total Orders", value: String(summary.totalOrders) },
          { label: "Total Sales", value: `LKR ${fmt(summary.totalSales)}` },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(summary.totalGrossProfit || 0)}`,
            sub: `${(summary.totalGrossProfitMargin || 0).toFixed(1)}% margin`,
          },
          {
            label: "Avg Order Value",
            value: `LKR ${fmt(summary.averageOrderValue || 0)}`,
          },
        ],
        chartSpecs: [
          { title: "Daily Sales Trend", elementId: "daily-sales-trend-chart" },
        ],
        tables: [
          {
            title: "Daily Breakdown",
            columns: [
              "Date",
              "Orders",
              "Net Sales",
              "COGS",
              "Profit",
              "Shipping",
            ],
            rows: summary.daily.map((d: any) => [
              d.date,
              String(d.orders),
              fmt(d.netSales),
              fmt(d.cogs || 0),
              fmt(d.grossProfit || 0),
              fmt(d.shipping),
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `daily_sales_summary_${dateRange[0]}_${dateRange[1]}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF", { id: toastId });
    }
  };

  const SummaryCard = ({
    title,
    value,
    sub,
    icon,
    color,
    bg,
  }: {
    title: string;
    value: string | number;
    sub?: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
  }) => (
    <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}
      >
        <span className={color}>{icon}</span>
      </div>
      <p className="text-[10px] uppercase font-black tracking-[0.1em] text-gray-400 mb-1">
        {title}
      </p>
      <p className={`text-xl font-black tracking-tight ${color} leading-none`}>
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-gray-400 mt-1 font-medium">{sub}</p>
      )}
    </div>
  );

  const columns: ColumnsType<any> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
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
      render: (text) => (
        <Tag className="font-mono text-[10px] font-bold m-0">{text}</Tag>
      ),
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      align: "right",
      render: (val) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(val)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "netSales",
      key: "netSales",
      align: "right",
      render: (val) => (
        <span className="text-gray-700 font-mono text-xs">LKR {fmt(val)}</span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      key: "cogs",
      align: "right",
      render: (val) => (
        <span className="text-red-500 font-mono text-xs">
          (LKR {fmt(val || 0)})
        </span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (val) => (
        <span
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${val >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
        >
          {val < 0 ? "(" : ""}LKR {fmt(Math.abs(val || 0))}
          {val < 0 ? ")" : ""}
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
        <span className="text-gray-500 font-mono text-xs">LKR {fmt(val)}</span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales Report" description="Daily Sales Summary">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Sales Analysis
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Daily Summary
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {dateRange[0]} &nbsp;–&nbsp; {dateRange[1]}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
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

            <Space>
              <Button
                onClick={handleExportExcel}
                disabled={!summary?.daily?.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!summary?.daily?.length}
                icon={<IconFileTypePdf size={16} />}
                danger
              >
                PDF
              </Button>
            </Space>
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="Total Orders"
                value={summary.totalOrders.toLocaleString()}
                icon={<IconShoppingCart size={20} />}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Sales"
                value={`LKR ${fmt(summary.totalSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-gray-900"
                bg="bg-gray-100"
              />
              <SummaryCard
                title="Net Sales"
                value={`LKR ${fmt(summary.totalNetSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <SummaryCard
                title="Items Sold"
                value={summary.totalItemsSold.toLocaleString()}
                icon={<IconPackages size={20} />}
                color="text-amber-600"
                bg="bg-amber-50"
              />
              <SummaryCard
                title="Gross Profit"
                value={`LKR ${fmt(summary.totalGrossProfit || 0)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
                sub={`${(summary.totalGrossProfitMargin || 0).toFixed(1)}% margin`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`LKR ${fmt(summary.averageOrderValue || 0)}`}
                icon={<IconCurrencyDollar size={20} />}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <SummaryCard
                title="Shipping Total"
                value={`LKR ${fmt(summary.totalShipping)}`}
                icon={<IconTruckDelivery size={20} />}
                color="text-gray-500"
                bg="bg-gray-50"
              />
              <SummaryCard
                title="Total Discount"
                value={`LKR ${fmt(summary.totalDiscount)}`}
                icon={<IconPercentage size={20} />}
                color="text-red-500"
                bg="bg-red-50"
              />
            </div>

            {/* Charts Section */}
            {summary.daily && summary.daily.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  id="daily-sales-trend-chart"
                  className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm"
                >
                  <p className="text-[10px] tracking-widest uppercase font-black text-gray-400 mb-4">
                    Daily Sales Trend
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={summary.daily}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="date"
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
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ stroke: "#f3f4f6", strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sales"
                          name="Sales"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "#111827", strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: "#111827" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-[10px] tracking-widest uppercase font-black text-gray-400 mb-4">
                    Daily Items Sold
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.daily}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="date"
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
                          }}
                          itemStyle={{ color: "#F9FAFB" }}
                          cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                        />
                        <Bar
                          dataKey="itemsSold"
                          name="Items"
                          fill="#111827"
                          radius={[2, 2, 0, 0]}
                          barSize={20}
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
                    Daily Subtotals
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {summary.daily?.length} entries
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
                dataSource={summary.daily || []}
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

export default Page;
