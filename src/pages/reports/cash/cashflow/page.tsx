import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState } from "react";
import dayjs from "dayjs";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import * as XLSX from "xlsx";
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
      "Cash In (Rs)": d.cashIn.toFixed(2),
      "Transaction Fees (Rs)": d.transactionFees.toFixed(2),
      "Expenses (Rs)": d.expenses.toFixed(2),
      "Net Cash Flow (Rs)": d.netCashFlow.toFixed(2),
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
      const totalCashIn = report.reduce((s, d) => s + d.cashIn, 0);
      const totalFees = report.reduce((s, d) => s + d.transactionFees, 0);
      const totalExpenses = report.reduce((s, d) => s + d.expenses, 0);
      const totalNetCashFlow = report.reduce((s, d) => s + d.netCashFlow, 0);
      await exportReportPDF({
        title: "Cashflow Report",
        subtitle: "Daily cash in, fees, expenses, and net cash flow",
        period: `${from} – ${to}`,
        summaryItems: [
          {
            label: "Total Cash In",
            value: `Rs ${totalCashIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "Transaction Fees",
            value: `Rs ${totalFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "Total Expenses",
            value: `Rs ${totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
          {
            label: "Net Cash Flow",
            value: `Rs ${totalNetCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
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
              `Rs ${d.cashIn.toFixed(2)}`,
              `Rs ${d.transactionFees.toFixed(2)}`,
              `Rs ${d.expenses.toFixed(2)}`,
              `Rs ${d.netCashFlow.toFixed(2)}`,
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
    { title: "Date", key: "date", render: (_, day) => <>{day.date}</> },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, day) => <>{day.orders}</>,
    },
    {
      title: "Cash In",
      key: "cashIn",
      render: (_, day) => <>Rs {day.cashIn.toFixed(2)}</>,
    },
    {
      title: "Trans. Fee",
      key: "transFee",
      render: (_, day) => <>Rs {day.transactionFees.toFixed(2)}</>,
    },
    {
      title: "Expenses",
      key: "expenses",
      render: (_, day) => <>Rs {day.expenses.toFixed(2)}</>,
    },
    {
      title: "Net Cash Flow",
      key: "netCashFlow",
      render: (_, day) => <>Rs {day.netCashFlow.toFixed(2)}</>,
    },
  ];

  return (
    <PageContainer title="Cashflow Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Cashflow Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View cash in, transaction fees, and net cash flow within a date
              range (Max {MAX_RANGE_DAYS} days).
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <SummaryCard title="Total Orders" value={summary.totalOrders} />
              <SummaryCard
                title="Total Cash In"
                value={`Rs ${(summary.totalCashIn || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Transaction Fees"
                value={`Rs ${(summary.totalTransactionFees || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Total Expenses"
                value={`Rs ${(summary.totalExpenses || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Net Cash Flow"
                value={`Rs ${(summary.totalNetCashFlow || 0).toFixed(2)}`}
              />
            </div>

            {/* Charts */}
            {report.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div
                  id="cashflow-chart-1"
                  className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm"
                >
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Cash Flow Trend
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
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
                          dataKey="cashIn"
                          name="Cash In"
                          stroke="#111827"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="netCashFlow"
                          name="Net Cash Flow"
                          stroke="#22C55E"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Fees & Expenses Breakdown
                  </h3>
                  <div className="h-[350px] w-full text-xs font-semibold">
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
                          dataKey="transactionFees"
                          name="Transaction Fees"
                          fill="#EF4444"
                          radius={[2, 2, 0, 0]}
                        />
                        <Bar
                          dataKey="expenses"
                          name="Expenses"
                          fill="#F59E0B"
                          radius={[2, 2, 0, 0]}
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

export default CashFlowPage;
