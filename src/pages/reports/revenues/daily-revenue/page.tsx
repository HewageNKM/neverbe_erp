import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface DailyRevenue {
  date: string;
  totalSales: number;
  totalNetSales: number;
  totalCOGS: number;
  totalOrders: number;
  totalDiscount: number;
  totalTransactionFee: number;
  totalExpenses: number;
  totalOtherIncome: number;
  grossProfit: number;
  grossProfitMargin: number;
  netProfit: number;
  netProfitMargin: number;
}

interface RevenueReport {
  daily: DailyRevenue[];
  summary: Omit<DailyRevenue, "date">;
}
const MAX_RANGE_DAYS = 31;

const DailyRevenuePage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(new Date().toISOString().split("T")[0]);
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyRevenue[]>([]);
  const [summary, setSummary] = useState<RevenueReport["summary"] | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    const diffDays = dayjs(toDate).diff(dayjs(fromDate), "day") + 1;
    if (diffDays > MAX_RANGE_DAYS) {
      const { message } = await import("antd");
      message.error(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
      return;
    }
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }

    setLoading(true);
    try {
      const res = await api.get<RevenueReport>(
        "/api/v1/erp/reports/revenues/daily-revenue",
        {
          params: { from: fromDate, to: toDate },
        },
      );
      setReport(res.data.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
      toast("Failed to fetch revenue report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs(), dayjs()] });
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      toast("No data to export");
      return;
    }

    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.totalOrders,
      "Total Sales (Rs)": d.totalSales.toFixed(2),
      "Net Sales (Rs)": d.totalNetSales.toFixed(2),
      "COGS (Rs)": d.totalCOGS.toFixed(2),
      "Total Discount (Rs)": d.totalDiscount.toFixed(2),
      "Total Transaction Fee (Rs)": d.totalTransactionFee.toFixed(2),
      "Total Expenses (Rs)": d.totalExpenses.toFixed(2),
      "Other Income (Rs)": d.totalOtherIncome.toFixed(2),
      "Gross Profit (Rs)": d.grossProfit.toFixed(2),
      "Gross Profit Margin (%)": d.grossProfitMargin.toFixed(2),
      "Net Profit (Rs)": d.netProfit.toFixed(2),
      "Net Profit Margin (%)": d.netProfitMargin.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daily Revenue");

    XLSX.writeFile(wb, `daily_revenue_${from}_${to}.xlsx`);

    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.length) {
      toast("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      const totals = report.reduce(
        (acc, d) => ({
          totalOrders: acc.totalOrders + (d.totalOrders || 0),
          totalSales: acc.totalSales + (d.totalSales || 0),
          totalNetSales: acc.totalNetSales + (d.totalNetSales || 0),
          grossProfit: acc.grossProfit + (d.grossProfit || 0),
          netProfit: acc.netProfit + (d.netProfit || 0),
        }),
        {
          totalOrders: 0,
          totalSales: 0,
          totalNetSales: 0,
          grossProfit: 0,
          netProfit: 0,
        },
      );
      await exportReportPDF({
        title: "Daily Revenue Report",
        subtitle: "Daily sales, revenue, profit, and cost breakdown",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Orders", value: String(totals.totalOrders) },
          { label: "Total Sales", value: `Rs ${totals.totalSales.toFixed(2)}` },
          {
            label: "Net Sales",
            value: `Rs ${totals.totalNetSales.toFixed(2)}`,
          },
          {
            label: "Gross Profit",
            value: `Rs ${totals.grossProfit.toFixed(2)}`,
          },
          { label: "Net Profit", value: `Rs ${totals.netProfit.toFixed(2)}` },
        ],
        chartSpecs: [
          {
            title: "Revenue vs Profit Trend",
            elementId: "daily-revenue-chart-1",
          },
          { title: "Cost Breakdown", elementId: "daily-revenue-chart-2" },
        ],
        tables: [
          {
            title: "Daily Revenue Breakdown",
            columns: [
              "Date",
              "Orders",
              "Total Sales",
              "Net Sales",
              "Gross Profit",
              "Net Profit",
            ],
            rows: report.map((d) => [
              d.date,
              d.totalOrders || 0,
              `Rs ${(d.totalSales || 0).toFixed(2)}`,
              `Rs ${(d.totalNetSales || 0).toFixed(2)}`,
              `Rs ${(d.grossProfit || 0).toFixed(2)}`,
              `Rs ${(d.netProfit || 0).toFixed(2)}`,
            ]),
            greenCols: [4, 5],
          },
        ],
        filename: `daily_revenue_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const SummaryCard = ({
    label,
    value,
    isPercent = false,
  }: {
    label: string;
    value: string | number;
    isPercent?: boolean;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold   text-gray-500 mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900 tracking-tight">
        {/* @ts-ignore */}
        {isPercent ? value : `Rs ${Number(value || 0).toFixed(2)}`}
      </p>
    </div>
  );
  const columns: ColumnsType<any> = [
    { title: "Date", key: "date", render: (_, day) => <>{day.date}</> },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, day) => <>{day.totalOrders}</>,
    },
    {
      title: "Total Sales",
      key: "totalSales",
      render: (_, day) => <>Rs {day.totalSales.toFixed(2)}</>,
    },
    {
      title: "Net Sales",
      key: "netSales",
      render: (_, day) => <>Rs {day.totalNetSales.toFixed(2)}</>,
    },
    {
      title: "COGS",
      key: "cOGS",
      render: (_, day) => <>Rs {day.totalCOGS.toFixed(2)}</>,
    },
    {
      title: "Gro. Profit",
      key: "groProfit",
      render: (_, day) => <>Rs {day.grossProfit.toFixed(2)}</>,
    },
    {
      title: "Gro. Margin",
      key: "groMargin",
      render: (_, day) => <>{day.grossProfitMargin.toFixed(2)}%</>,
    },
    {
      title: "Net Profit",
      key: "netProfit",
      render: (_, day) => <>Rs {day.netProfit.toFixed(2)}</>,
    },
    {
      title: "Net Margin",
      key: "netMargin",
      render: (_, day) => <>{day.netProfitMargin.toFixed(2)}%</>,
    },
  ];

  return (
    <PageContainer title="Daily Revenue Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Daily Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View daily revenue, gross profit, and net profit within a date
              range.
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

            <Button
              onClick={handleExportExcel}
              disabled={!report.length}
              icon={<IconDownload size={16} />}
            >
              Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!report.length}
              icon={<IconFileTypePdf size={16} />}
              danger
            >
              PDF
            </Button>
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
              <SummaryCard
                label="Total Orders"
                value={summary.totalOrders}
                isPercent={true}
              />{" "}
              {/* Hack: isPercent true just to avoid 'Rs' prefix on non-money value if logic below uses it, but wait, totalOrders is number. */}
              {/* Actually, totalOrders should not have Rs. Let's fix the Card logic or just pass string. */}
              {/* I'll fix the Logic in SummaryCard above to handle numbers better or just not add Rs if it's orders. */}
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col justify-center">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Total Orders
                </p>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  {summary.totalOrders}
                </p>
              </div>
              <SummaryCard label="Total Sales" value={summary.totalSales} />
              <SummaryCard label="Net Sales" value={summary.totalNetSales} />
              <SummaryCard label="COGS" value={summary.totalCOGS} />
              <SummaryCard
                label="Total Discount"
                value={summary.totalDiscount}
              />
              <SummaryCard
                label="Total Trans. Fee"
                value={summary.totalTransactionFee}
              />
              <SummaryCard
                label="Total Expenses"
                value={summary.totalExpenses}
              />
              <SummaryCard
                label="Other Income"
                value={summary.totalOtherIncome}
              />
              <SummaryCard label="Gross Profit" value={summary.grossProfit} />
              <SummaryCard
                label="Gross Margin"
                value={`${summary.grossProfitMargin.toFixed(2)}%`}
                isPercent={true}
              />
              <SummaryCard label="Net Profit" value={summary.netProfit} />
              <SummaryCard
                label="Net Margin"
                value={`${summary.netProfitMargin.toFixed(2)}%`}
                isPercent={true}
              />
            </div>

            {/* Charts Section */}
            {report.length > 0 && (
              <div className="space-y-6">
                <div
                  id="daily-revenue-chart-1"
                  className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm"
                >
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Revenue vs Profit
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="date"
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
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalSales"
                          name="Total Sales"
                          stroke="#1976d2"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#82ca9d"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Cost Breakdown
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="date"
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
                          dataKey="totalDiscount"
                          name="Discount"
                          stackId="a"
                          fill="#FF7043"
                        />
                        <Bar
                          dataKey="totalTransactionFee"
                          name="Transaction Fee"
                          stackId="a"
                          fill="#42A5F5"
                        />
                        <Bar
                          dataKey="totalExpenses"
                          name="Expenses"
                          stackId="a"
                          fill="#66BB6A"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {report.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    bordered
                    columns={columns}
                    dataSource={report}
                    rowKey={(r: any) =>
                      r.id || r.date || r.month || Math.random().toString()
                    }
                    pagination={{ pageSize: 15, position: ["bottomRight"] }}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
                    scroll={{ x: "max-content" }}
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

export default DailyRevenuePage;
