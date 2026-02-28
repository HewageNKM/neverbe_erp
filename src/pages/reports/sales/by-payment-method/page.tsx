import {
  Card,
  Form,
  Spin,
  Table,
  Button,
  Space,
  Tag,
  DatePicker,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconTrendingUp,
  IconCreditCard,
  IconCash,
  IconReceipt2,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

const COLORS = [
  "#111827",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#6366F1",
];

const fmt = (v: number) =>
  v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

const SalesByPaymentMethod = () => {
  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);
  const [form] = Form.useForm();
  const [from, setFrom] = useState(
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
  );
  const [to, setTo] = useState(dayjs().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        dateRange: [dayjs(from), dayjs(to)],
      });
      fetchReport(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchReport = async (values?: any) => {
    let fromDate = from;
    let toDate = to;
    if (values?.dateRange) {
      fromDate = values.dateRange[0]?.format("YYYY-MM-DD");
      toDate = values.dateRange[1]?.format("YYYY-MM-DD");
      setFrom(fromDate);
      setTo(toDate);
    }

    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-payment-method", {
        params: { from: fromDate, to: toDate },
      });
      const data = res.data.paymentMethods || [];
      setRows(data);

      if (data.length > 0) {
        setSummary({
          totalAmount: data.reduce(
            (sum: number, r: any) => sum + (r.totalAmount || 0),
            0,
          ),
          totalOrders: data.reduce(
            (sum: number, r: any) => sum + (r.totalOrders || 0),
            0,
          ),
          totalTransactions: data.reduce(
            (sum: number, r: any) => sum + (r.transactions || 0),
            0,
          ),
        });
      } else {
        setSummary(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!rows.length) return;
    const formatted = rows.map((r) => ({
      "Payment Method": r.paymentMethod,
      "Total Amount (LKR)": r.totalAmount.toFixed(2),
      "Total Orders": r.totalOrders,
      "Total Transactions": r.transactions,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment Methods");
    XLSX.writeFile(wb, `sales_by_payment_method_${from}_${to}.xlsx`);
    toast.success("Excel exported!");
  };

  const handleExportPDF = async () => {
    if (!rows.length) {
      toast.error("No data to export");
      return;
    }

    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Sales by Payment Method",
        subtitle: "Breakdown of sales and orders by payment type",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Payment Methods", value: String(rows.length) },
          { label: "Total Sale", value: `LKR ${fmt(summary.totalAmount)}` },
          { label: "Total Orders", value: String(summary.totalOrders) },
        ],
        chartSpecs: [
          {
            title: "Sales by Payment Method",
            elementId: "payment-method-sales-chart",
          },
        ],
        tables: [
          {
            title: "Detailed Statistics",
            columns: ["Method", "Orders", "Transactions", "Total Sale"],
            rows: rows.map((r: any) => [
              r.paymentMethod,
              String(r.totalOrders),
              String(r.transactions),
              fmt(r.totalAmount),
            ]),
            boldCols: [0],
          },
        ],
        filename: `sales_by_payment_method_${from}_${to}`,
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
      title: "Payment Method",
      key: "paymentMethod",
      render: (_, r) => (
        <span className="font-semibold text-gray-900">{r.paymentMethod}</span>
      ),
    },
    {
      title: "Total Orders",
      key: "totalOrders",
      align: "right",
      render: (_, r) => (
        <Tag className="font-mono text-[10px] font-bold m-0">
          {r.totalOrders}
        </Tag>
      ),
    },
    {
      title: "Transactions",
      key: "transactions",
      align: "right",
      render: (_, r) => <span className="text-gray-500">{r.transactions}</span>,
    },
    {
      title: "Total Amount",
      key: "totalAmount",
      align: "right",
      render: (_, r) => (
        <span className="font-semibold text-blue-700 font-mono text-xs">
          LKR {fmt(r.totalAmount || 0)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales by Payment Method">
      <div className="w-full space-y-6">
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
              By Payment Method
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {from} &nbsp;–&nbsp; {to}
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
                onClick={exportExcel}
                disabled={!rows.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!rows.length}
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
            <Spin size="large" />
          </div>
        )}

        {/* Content */}
        {!loading && rows.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SummaryCard
                title="Total Sales"
                value={`LKR ${fmt(summary?.totalAmount || 0)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-blue-700"
                bg="bg-blue-50"
              />
              <SummaryCard
                title="Total Orders"
                value={String(summary?.totalOrders || 0)}
                icon={<IconReceipt2 size={20} />}
                color="text-emerald-700"
                bg="bg-emerald-50"
              />
              <SummaryCard
                title="Transactions"
                value={String(summary?.totalTransactions || 0)}
                icon={<IconCreditCard size={20} />}
                color="text-indigo-700"
                bg="bg-indigo-50"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                id="payment-method-sales-chart"
                className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm"
              >
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                  Total Sales by Method
                </p>
                <div className="h-[300px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f3f4f6"
                      />
                      <XAxis
                        dataKey="paymentMethod"
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
                        tickFormatter={(v) =>
                          v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                        }
                      />
                      <RechartTooltip {...TOOLTIP_STYLE} />
                      <Bar
                        dataKey="totalAmount"
                        fill="#3B82F6"
                        name="Sales"
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                  Order Distribution
                </p>
                <div className="h-[300px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={rows}
                        dataKey="totalOrders"
                        nameKey="paymentMethod"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {rows.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartTooltip {...TOOLTIP_STYLE} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Payment Method Details
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {rows.length} methods used
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
                dataSource={rows}
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

export default SalesByPaymentMethod;
