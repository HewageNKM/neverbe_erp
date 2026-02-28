import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { IconFilter } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface MonthlyRow {
  month?: string;
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

interface SummaryType {
  totalSales?: number;
  totalNetSales?: number;
  totalCOGS?: number;
  totalOrders?: number;
  totalDiscount?: number;
  totalTransactionFee?: number;
  totalExpenses?: number;
  totalOtherIncome?: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  netProfit?: number;
  netProfitMargin?: number;
}

const MAX_MONTH_RANGE = 12;

export default function MonthlyRevenuePage() {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 7));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyRow[]>([]);
  const [summary, setSummary] = useState<SummaryType | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const getMonthStart = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    return `${y}-${m}-01`;
  };

  const getMonthEnd = (monthStr: string | null | undefined) => {
    if (!monthStr || !monthStr.includes("-")) return "";
    const [y, m] = monthStr.split("-");
    const lastDay = new Date(Number(y), Number(m), 0).getDate();
    return `${y}-${m}-${lastDay}`;
  };

  const validateRange = () => {
    if (!from || !to) return "Please select From & To months.";

    const start = new Date(getMonthStart(from));
    const end = new Date(getMonthEnd(to));

    if (isNaN(start.getTime()) || isNaN(end.getTime()))
      return "Invalid date range.";

    if (start > end) return "From month cannot be after To month.";

    const diffMonths =
      end.getFullYear() * 12 +
      end.getMonth() -
      (start.getFullYear() * 12 + start.getMonth());

    if (diffMonths > MAX_MONTH_RANGE)
      return `Maximum range is ${MAX_MONTH_RANGE} months.`;

    return null;
  };

  const fetchReport = async (values?: any) => {
    let fromMonth = from;
    let toMonth = to;
    if (values?.monthRange) {
      fromMonth = values.monthRange[0]?.format("YYYY-MM") || from;
      toMonth = values.monthRange[1]?.format("YYYY-MM") || to;
      setFrom(fromMonth);
      setTo(toMonth);
    }
    const err = validateRange();
    if (err) {
      toast(err);
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(
        "/api/v1/erp/reports/revenues/monthly-revenue",
        {
          params: {
            from: getMonthStart(fromMonth),
            to: getMonthEnd(toMonth),
          },
        },
      );

      setRows(Array.isArray(res.data?.monthly) ? res.data.monthly : []);
      setSummary(res.data?.summary || null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ monthRange: [dayjs(), dayjs()] });
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const safeMoney = (v?: number) => `Rs ${Number(v ?? 0).toFixed(2)}`;
  const safePercent = (v?: number) => `${Number(v ?? 0).toFixed(2)}%`;

  const SummaryCard = ({
    label,
    value,
  }: {
    label: string;
    value: string | number;
  }) => (
    <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col justify-center">
      <p className="text-xs font-bold   text-gray-500 mb-2">{label}</p>
      <p className="text-xl font-bold text-gray-900 tracking-tight">{value}</p>
    </div>
  );
  const columns: ColumnsType<any> = [
    { title: "Month", key: "month", render: (_, r) => <>{r.month ?? "—"}</> },
    {
      title: "Orders",
      key: "orders",
      render: (_, r) => <>{r.totalOrders ?? 0}</>,
    },
    {
      title: "Total Sales",
      key: "totalSales",
      render: (_, r) => <>{safeMoney(r.totalSales)}</>,
    },
    {
      title: "Net Sales",
      key: "netSales",
      render: (_, r) => <>{safeMoney(r.totalNetSales)}</>,
    },
    {
      title: "COGS",
      key: "cOGS",
      render: (_, r) => <>{safeMoney(r.totalCOGS)}</>,
    },
    {
      title: "Discount",
      key: "discount",
      render: (_, r) => <>{safeMoney(r.totalDiscount)}</>,
    },
    {
      title: "Trans. Fee",
      key: "transFee",
      render: (_, r) => <>{safeMoney(r.totalTransactionFee)}</>,
    },
    {
      title: "Expenses",
      key: "expenses",
      render: (_, r) => <>{safeMoney(r.totalExpenses)}</>,
    },
    {
      title: "Other Income",
      key: "otherIncome",
      render: (_, r) => <>{safeMoney(r.totalOtherIncome)}</>,
    },
    {
      title: "Gross Profit",
      key: "grossProfit",
      render: (_, r) => <>{safeMoney(r.grossProfit)}</>,
    },
    {
      title: "Margin",
      key: "margin",
      render: (_, r) => <>{safePercent(r.grossProfitMargin)}</>,
    },
    {
      title: "Net Profit",
      key: "netProfit",
      render: (_, r) => <>{safeMoney(r.netProfit)}</>,
    },
    {
      title: "Net Margin",
      key: "netMargin",
      render: (_, r) => <>{safePercent(r.netProfitMargin)}</>,
    },
  ];

  return (
    <PageContainer title="Monthly Revenue Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Monthly Revenue Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View monthly revenue, gross profit, and net profit.
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
                <Form.Item name="monthRange" className="mb-0!">
                  <DatePicker.RangePicker picker="month" size="middle" />
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
                value={summary.totalOrders ?? 0}
              />
              <SummaryCard
                label="Total Sales"
                value={safeMoney(summary.totalSales)}
              />
              <SummaryCard
                label="Net Sales"
                value={safeMoney(summary.totalNetSales)}
              />
              <SummaryCard label="COGS" value={safeMoney(summary.totalCOGS)} />
              <SummaryCard
                label="Total Discount"
                value={safeMoney(summary.totalDiscount)}
              />
              <SummaryCard
                label="Total Trans. Fee"
                value={safeMoney(summary.totalTransactionFee)}
              />
              <SummaryCard
                label="Total Expenses"
                value={safeMoney(summary.totalExpenses)}
              />
              <SummaryCard
                label="Other Income"
                value={safeMoney(summary.totalOtherIncome)}
              />
              <SummaryCard
                label="Gross Profit"
                value={safeMoney(summary.grossProfit)}
              />
              <SummaryCard
                label="Gross Margin"
                value={safePercent(summary.grossProfitMargin)}
              />
              <SummaryCard
                label="Net Profit"
                value={safeMoney(summary.netProfit)}
              />
              <SummaryCard
                label="Net Margin"
                value={safePercent(summary.netProfitMargin)}
              />
            </div>

            {/* Charts Section */}
            {rows.length > 0 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Revenue vs Profit
                  </h3>
                  <div className="h-[400px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={rows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="month"
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
                      <BarChart data={rows}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="month"
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
            {rows.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table
                    bordered
                    columns={columns}
                    dataSource={rows}
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
}
