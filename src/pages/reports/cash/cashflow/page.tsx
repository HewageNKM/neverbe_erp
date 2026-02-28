import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import { Button, Card, DatePicker, Form, Space, Spin, Table, Tag } from "antd";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconMinus,
  IconCashBanknote,
  IconArrowDownRight,
  IconArrowUpRight,
  IconTrendingUp,
} from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";

interface DailyCashFlow {
  date: string;
  orders: number;
  cashIn: number;
  transactionFees: number;
  expenses: number;
  netCashFlow: number;
}

interface CashFlowSummary {
  totalOrders: number;
  totalCashIn: number;
  totalTransactionFees: number;
  totalExpenses: number;
  totalNetCashFlow: number;
  daily: DailyCashFlow[];
}

const MAX_RANGE_DAYS = 31;
const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "#111827",
    border: "none",
    borderRadius: "8px",
    color: "#F9FAFB",
    fontSize: "12px",
  },
  itemStyle: { color: "#F9FAFB" },
};

const CashFlowPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyCashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);

  const fetchReport = async (values?: any) => {
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD");
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD");
    if (!fromDate || !toDate) return;
    const diffDays = dayjs(toDate).diff(dayjs(fromDate), "day") + 1;
    if (diffDays > MAX_RANGE_DAYS) {
      const { message } = await import("antd");
      message.error(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
      return;
    }
    setFrom(fromDate);
    setTo(toDate);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/cash/cashflow", {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data.summary?.daily || []);
      setSummary(res.data.summary || null);
    } catch (error) {
      console.error(error);
      toast("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!report || report.length === 0) {
      toast("No data to export");
      return;
    }
    const exportData = report.map((d) => ({
      Date: d.date,
      "Total Orders": d.orders,
      "Cash In (LKR)": d.cashIn.toFixed(2),
      "Transaction Fees (LKR)": d.transactionFees.toFixed(2),
      "Expenses (LKR)": d.expenses.toFixed(2),
      "Net Cash Flow (LKR)": d.netCashFlow.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cash Flow");
    XLSX.writeFile(wb, `cashflow_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.length) {
      toast("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      const totalCashIn =
        summary?.totalCashIn ?? report.reduce((s, d) => s + d.cashIn, 0);
      const totalFees =
        summary?.totalTransactionFees ??
        report.reduce((s, d) => s + d.transactionFees, 0);
      const totalExpenses =
        summary?.totalExpenses ?? report.reduce((s, d) => s + d.expenses, 0);
      const totalNetCashFlow =
        summary?.totalNetCashFlow ??
        report.reduce((s, d) => s + d.netCashFlow, 0);
      await exportReportPDF({
        title: "Cashflow Report",
        subtitle: "Daily cash in, fees, expenses & net cash flow",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Cash In", value: `LKR ${fmt(totalCashIn)}` },
          { label: "Transaction Fees", value: `LKR ${fmt(totalFees)}` },
          { label: "Total Expenses", value: `LKR ${fmt(totalExpenses)}` },
          {
            label: "Net Cash Flow",
            value: `LKR ${fmt(totalNetCashFlow)}`,
            sub: totalNetCashFlow >= 0 ? "Positive" : "Negative",
          },
        ],
        chartSpecs: [
          { title: "Net Cash Flow Trend", elementId: "cashflow-chart-1" },
          { title: "Cost Breakdown", elementId: "cashflow-chart-2" },
        ],
        tables: [
          {
            title: "Daily Cashflow Breakdown",
            columns: [
              "Date",
              "Orders",
              "Cash In",
              "Trans. Fee",
              "Expenses",
              "Net Cash Flow",
            ],
            rows: report.map((d) => [
              d.date,
              d.orders,
              `LKR ${fmt(d.cashIn)}`,
              `LKR ${fmt(d.transactionFees)}`,
              `LKR ${fmt(d.expenses)}`,
              `LKR ${fmt(d.netCashFlow)}`,
            ]),
            greenCols: [5],
          },
        ],
        filename: `cashflow_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<DailyCashFlow> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">{v}</span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "right",
      render: (v) => <Tag className="font-mono text-[10px] font-bold">{v}</Tag>,
    },
    {
      title: "Cash In",
      dataIndex: "cashIn",
      key: "cashIn",
      align: "right",
      render: (v) => (
        <span className="font-mono font-semibold text-emerald-700">
          LKR {fmt(v)}
        </span>
      ),
    },
    {
      title: "Trans. Fee",
      dataIndex: "transactionFees",
      key: "transactionFees",
      align: "right",
      render: (v) => (
        <span className="font-mono text-red-500">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Expenses",
      dataIndex: "expenses",
      key: "expenses",
      align: "right",
      render: (v) => (
        <span className="font-mono text-amber-700">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Net Cash Flow",
      dataIndex: "netCashFlow",
      key: "netCashFlow",
      align: "right",
      render: (v) => (
        <span
          className={`font-mono font-bold ${v >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {v < 0 && "("}LKR {fmt(Math.abs(v))}
          {v < 0 && ")"}
        </span>
      ),
    },
  ];

  const net = summary?.totalNetCashFlow ?? 0;

  return (
    <PageContainer title="Cashflow Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Financial Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Cashflow
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Daily breakdown · max {MAX_RANGE_DAYS} days
              {from && to && (
                <span className="font-mono ml-2">
                  {from} – {to}
                </span>
              )}
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
                  <DatePicker.RangePicker size="middle" />
                </Form.Item>
                <Form.Item className="mb-0!">
                  <Button
                    htmlType="submit"
                    type="primary"
                    icon={<IconFilter size={15} />}
                  >
                    Filter
                  </Button>
                </Form.Item>
              </Form>
            </Card>
            <Space>
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
            </Space>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        )}

        {!loading && summary && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  label: "Total Orders",
                  value: summary.totalOrders.toLocaleString(),
                  icon: <IconTrendingUp size={20} />,
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  label: "Total Cash In",
                  value: `LKR ${fmt(summary.totalCashIn)}`,
                  icon: <IconCashBanknote size={20} />,
                  color: "text-emerald-700",
                  bg: "bg-emerald-50",
                },
                {
                  label: "Transaction Fees",
                  value: `LKR ${fmt(summary.totalTransactionFees)}`,
                  icon: <IconArrowDownRight size={20} />,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  label: "Total Expenses",
                  value: `LKR ${fmt(summary.totalExpenses)}`,
                  icon: <IconArrowDownRight size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                },
                {
                  label: "Net Cash Flow",
                  value: `LKR ${fmt(Math.abs(net))}`,
                  icon:
                    net >= 0 ? (
                      <IconArrowUpRight size={20} />
                    ) : (
                      <IconArrowDownRight size={20} />
                    ),
                  color: net >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: net >= 0 ? "bg-emerald-50" : "bg-red-50",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.bg}`}
                  >
                    <span className={c.color}>{c.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {c.label}
                  </p>
                  <p
                    className={`text-lg font-black tracking-tight ${c.color} leading-none`}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            {report.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  id="cashflow-chart-1"
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Cash Flow Trend
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={report}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={70}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cashIn"
                          name="Cash In"
                          stroke="#059669"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netCashFlow"
                          name="Net Cash Flow"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  id="cashflow-chart-2"
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Fees & Expenses Breakdown
                  </p>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report} barCategoryGap="30%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={70}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                          cursor={{ fill: "#F9FAFB" }}
                        />
                        <Legend />
                        <Bar
                          dataKey="transactionFees"
                          name="Transaction Fees"
                          fill="#EF4444"
                          radius={[3, 3, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#F59E0B"
                          radius={[3, 3, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {report.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Daily Breakdown
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {report.length} days
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
                  dataSource={report}
                  rowKey={(r) => r.date || Math.random().toString()}
                  pagination={{
                    pageSize: 15,
                    position: ["bottomRight"],
                    showSizeChanger: true,
                  }}
                  size="small"
                  scroll={{ x: "max-content" }}
                />
              </div>
            )}
          </div>
        )}

        {!loading && !summary && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range (max {MAX_RANGE_DAYS} days) and click Filter.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default CashFlowPage;
