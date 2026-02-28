import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Space,
  Spin,
  Table,
  Tag,
  Progress,
} from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconMinus,
  IconWallet,
  IconListDetails,
  IconChartBar,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
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

const PIE_COLORS = [
  "#111827",
  "#059669",
  "#DC2626",
  "#7C3AED",
  "#B45309",
  "#0891B2",
];

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

const ExpenseReportPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
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
      "Amount (LKR)": e.amount,
      Status: e.status,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expense_report_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = () => {
    if (!report || !report.expenses.length) {
      toast("No data to export");
      return;
    }
    window.print();
  };

  const columns: ColumnsType<ExpenseItem> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">{v}</span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (v) => <Tag className="text-[10px] font-bold uppercase">{v}</Tag>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (v) => <span className="text-gray-600 text-sm">{v}</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      align: "right",
      render: (v) => (
        <span className="font-mono font-bold text-red-600">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (v) => (
        <Tag
          color={v === "APPROVED" ? "success" : "warning"}
          className="text-[10px] font-bold uppercase"
        >
          {v}
        </Tag>
      ),
    },
  ];

  const avgPerTx =
    report && report.summary.count > 0
      ? Math.round(report.summary.total / report.summary.count)
      : 0;

  return (
    <PageContainer title="Expense Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-red-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Financial Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Expenses
            </h2>
            {report && (
              <p className="text-xs text-gray-400 mt-1.5 font-mono">
                {report.period.from} &nbsp;–&nbsp; {report.period.to}
              </p>
            )}
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
                disabled={!report?.expenses.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!report?.expenses.length}
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

        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  label: "Total Expenses",
                  value: `LKR ${fmt(report.summary.total)}`,
                  icon: <IconWallet size={20} />,
                  color: "text-red-600",
                  bg: "bg-red-50",
                },
                {
                  label: "Total Transactions",
                  value: report.summary.count.toLocaleString(),
                  icon: <IconListDetails size={20} />,
                  color: "text-gray-900",
                  bg: "bg-gray-100",
                },
                {
                  label: "Avg. per Transaction",
                  value: `LKR ${fmt(avgPerTx)}`,
                  icon: <IconChartBar size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
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
                    className={`text-xl font-black tracking-tight ${c.color} leading-none`}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div
                id="expense-pie-chart"
                className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Expense Distribution
                </p>
                {report.summary.byCategory.length > 0 ? (
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={report.summary.byCategory}
                          dataKey="amount"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={40}
                        >
                          {report.summary.byCategory.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartTooltip
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-20 text-sm">
                    No data
                  </p>
                )}
              </div>

              {/* Category Breakdown */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Category Breakdown
                </p>
                <div className="space-y-3">
                  {report.summary.byCategory.map((cat, i) => (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span className="text-xs font-semibold text-gray-700">
                            {cat.category}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-red-600">
                            LKR {fmt(cat.amount)}
                          </span>
                          <span className="text-[10px] text-gray-400 ml-2">
                            {cat.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        percent={cat.percentage}
                        showInfo={false}
                        strokeColor={PIE_COLORS[i % PIE_COLORS.length]}
                        trailColor="#f9fafb"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expense Table */}
            {report.expenses.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Expense Ledger
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {report.expenses.length} entries
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
                  dataSource={report.expenses}
                  rowKey={(r) => r.id || r.date || Math.random().toString()}
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

        {!loading && !report && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range and click Filter to load the report.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ExpenseReportPage;
