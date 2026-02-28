import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ExpenseItem {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: string;
}

interface ExpenseReport {
  period: { from: string; to: string };
  expenses: ExpenseItem[];
  summary: {
    total: number;
    byCategory: { category: string; amount: number; percentage: number }[];
    count: number;
  };
}

const COLORS = [
  "#111827",
  "#374151",
  "#6B7280",
  "#9CA3AF",
  "#D1D5DB",
  "#E5E7EB",
];

const ExpenseReportPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ExpenseReport | null>(null);

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
      const res = await api.get<ExpenseReport>("/api/v1/erp/reports/expenses", {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch expense report");
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
    if (!report || report.expenses.length === 0) {
      toast("No data to export");
      return;
    }

    const exportData = report.expenses.map((e) => ({
      Date: e.date,
      Category: e.category,
      Description: e.description,
      Amount: e.amount,
      Status: e.status,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expense_report_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const columns: ColumnsType<any> = [
    { title: "Date", key: "date", render: (_, exp) => <>{exp.date}</> },
    {
      title: "Category",
      key: "category",
      render: (_, exp) => <>{exp.category}</>,
    },
    {
      title: "Description",
      key: "description",
      render: (_, exp) => <>{exp.description}</>,
    },
    {
      title: "Amount",
      key: "amount",
      render: (_, exp) => <>Rs {exp.amount.toLocaleString()}</>,
    },
    {
      title: "Status",
      key: "status",
      render: (_, exp) => (
        <>
          <span
            className={`px-2 py-1 text-xs font-bold  ${
              exp.status === "APPROVED"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {exp.status}
          </span>
        </>
      ),
    },
  ];

  return (
    <PageContainer title="Expense Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Expense Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Detailed breakdown of all expenses by category.
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
              disabled={!report?.expenses.length}
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold text-red-600">
                  Rs {report.summary.total.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Transactions
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.count}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Avg. Per Transaction
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs{" "}
                  {report.summary.count > 0
                    ? Math.round(
                        report.summary.total / report.summary.count,
                      ).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>

            {/* Chart & Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-sm font-bold   text-gray-900 mb-4">
                  By Category
                </h3>
                {report.summary.byCategory.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.summary.byCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ category, percentage }: any) =>
                            `${category} (${percentage}%)`
                          }
                          labelLine={false}
                        >
                          {report.summary.byCategory.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) =>
                            `Rs ${value.toLocaleString()}`
                          }
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-20">No expenses</p>
                )}
              </div>

              {/* Category List */}
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold   text-gray-900">
                    Category Breakdown
                  </h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {report.summary.byCategory.map((cat, idx) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4"
                          style={{
                            backgroundColor: COLORS[idx % COLORS.length],
                          }}
                        ></div>
                        <span className="font-medium text-gray-900">
                          {cat.category}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          Rs {cat.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {cat.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expense Table */}
            {report.expenses.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    bordered
                    columns={columns}
                    dataSource={report.expenses}
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

export default ExpenseReportPage;
