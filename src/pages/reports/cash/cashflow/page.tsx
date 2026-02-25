import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Card, Form, Spin, Table, Tag } from "antd";
import React, { useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DailyCashFlow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(report.length / rowsPerPage);

  const fetchReport = async (evt?: React.FormEvent) => {
    evt.preventDefault();

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diffTime = toDate.getTime() - fromDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;

    if (diffDays > MAX_RANGE_DAYS) {
      toast.error(`Date range cannot exceed ${MAX_RANGE_DAYS} days.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/cash/cashflow", {
        params: { from, to },
      });

      setReport(res.data.summary?.daily || []);
      setSummary(res.data.summary || null);
      setPage(0);
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
                layout="inline"
                onFinish={() => fetchReport()}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item className="!mb-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      required
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:border-gray-200"
                    />
                    <span className="text-gray-400 font-medium">-</span>
                    <input
                      type="date"
                      required
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:outline-none focus:border-gray-200"
                    />
                  </div>
                </Form.Item>
                <Form.Item className="!mb-0">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <IconFilter size={15} />
                    Filter
                  </button>
                </Form.Item>
              </Form>
            </Card>

            <button
              onClick={handleExportExcel}
              disabled={!report.length}
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
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
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
