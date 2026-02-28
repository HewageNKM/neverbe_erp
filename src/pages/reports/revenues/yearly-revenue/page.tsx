import api from "@/lib/api";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import toast from "react-hot-toast";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { Card, Spin, Tag, Progress, Button, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconMinus,
  IconTrendingUp,
  IconTrendingDown,
  IconShoppingCart,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const fmt = (v?: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v ?? 0);

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

const SummaryCard = ({
  label,
  value,
  icon,
  color,
  bg,
  bar,
  barLabel,
  barColor,
}: any) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}
    >
      <span className={color}>{icon}</span>
    </div>
    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
      {label}
    </p>
    <p className={`text-lg font-black tracking-tight ${color} leading-none`}>
      {value}
    </p>
    {bar !== null && bar !== undefined && (
      <div className="mt-3">
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-400 font-bold">
            {barLabel}
          </span>
          <span className={`text-[10px] font-black ${color}`}>
            {bar.toFixed(1)}%
          </span>
        </div>
        <Progress
          percent={Math.min(Math.abs(bar), 100)}
          showInfo={false}
          strokeColor={barColor}
          trailColor="#f3f4f6"
          size="small"
          strokeLinecap="square"
        />
      </div>
    )}
  </div>
);

const YearRevenuePage = () => {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);
  const [yearly, setYearly] = useState<any[]>([]);

  const fetchReport = async (evt?: React.FormEvent) => {
    evt?.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    try {
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await api.get("/api/v1/erp/reports/revenues/yearly-revenue", {
        params: { from: fromDate, to: toDate },
      });
      setSummary(res.data.summary || null);
      setYearly(res.data.yearly || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!yearly?.length || !summary) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      await exportReportPDF({
        title: "Yearly Revenue Report",
        subtitle: "Multi-year revenue, costs, and profit trends",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Revenue", value: `LKR ${fmt(summary.totalSales)}` },
          {
            label: "Total Net Sales",
            value: `LKR ${fmt(summary.totalNetSales)}`,
          },
          {
            label: "Gross Profit",
            value: `LKR ${fmt(summary.overallGrossProfit)}`,
            sub: `${summary.overallGrossMargin?.toFixed(1)}% margin`,
          },
          {
            label: "Net Profit",
            value: `LKR ${fmt(summary.overallNetProfit)}`,
            sub: `${summary.overallNetMargin?.toFixed(1)}% margin`,
          },
        ],
        chartSpecs: [
          {
            title: "Long-term Revenue Trend",
            elementId: "yearly-revenue-chart",
          },
        ],
        tables: [
          {
            title: "Yearly Breakdown",
            columns: [
              "Year",
              "Orders",
              "Net Sales",
              "COGS",
              "Gross Profit",
              "Net Margin",
            ],
            rows: yearly.map((r) => [
              String(r.year),
              String(r.totalOrders),
              `LKR ${fmt(r.totalNetSales)}`,
              `LKR ${fmt(r.totalCOGS)}`,
              `LKR ${fmt(r.grossProfit)}`,
              `${r.netProfitMargin?.toFixed(1)}%`,
            ]),
            boldCols: [0],
            greenCols: [4],
          },
        ],
        filename: `yearly_revenue_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const handleExportExcel = () => {
    if (!yearly?.length) {
      toast.error("No data to export");
      return;
    }
    const data = yearly.map((y: any) => ({
      Year: y.year,
      "Total Orders": y.totalOrders,
      "Total Sales (LKR)": y.totalSales,
      "Net Sales (LKR)": y.totalNetSales,
      "COGS (LKR)": y.totalCOGS,
      "Gross Profit (LKR)": y.grossProfit,
      "Gross Margin (%)": y.grossProfitMargin?.toFixed(1),
      "Net Profit (LKR)": y.netProfit,
      "Net Margin (%)": y.netProfitMargin?.toFixed(1),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Revenue");
    XLSX.writeFile(wb, `yearly_revenue_${from}_${to}.xlsx`);
    toast.success("Excel exported!");
  };

  const gp = summary?.grossProfit ?? 0;
  const np = summary?.netProfit ?? 0;

  const columns: ColumnsType<any> = [
    {
      title: "Year",
      dataIndex: "year",
      key: "year",
      render: (v) => <span className="font-bold text-gray-900">{v}</span>,
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "center",
      render: (v) => <Tag className="m-0 font-bold text-[9px]">{v}</Tag>,
    },
    {
      title: "Total Sales",
      dataIndex: "totalSales",
      key: "totalSales",
      align: "right",
      render: (v) => (
        <span className="text-blue-700 font-mono text-xs">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "totalNetSales",
      key: "totalNetSales",
      align: "right",
      render: (v) => (
        <span className="text-gray-600 font-mono text-xs">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "totalCOGS",
      key: "totalCOGS",
      align: "right",
      render: (v) => (
        <span className="text-red-500 font-mono text-xs">(LKR {fmt(v)})</span>
      ),
    },
    {
      title: "Gross Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (v) => (
        <span
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${v >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
        >
          {v < 0 ? "(" : ""}LKR {fmt(Math.abs(v))}
          {v < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Margin",
      dataIndex: "grossProfitMargin",
      key: "grossProfitMargin",
      align: "center",
      render: (v) => (
        <Tag
          color={v >= 0 ? "success" : "error"}
          className="m-0 font-bold text-[9px]"
        >
          {v.toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: "Net Profit",
      dataIndex: "netProfit",
      key: "netProfit",
      align: "right",
      render: (v) => (
        <span
          className={`font-bold px-2 py-0.5 rounded font-mono text-xs ${v >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"}`}
        >
          {v < 0 ? "(" : ""}LKR {fmt(Math.abs(v))}
          {v < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Net Margin",
      dataIndex: "netProfitMargin",
      key: "netProfitMargin",
      align: "center",
      render: (v) => (
        <Tag
          color={v >= 0 ? "success" : "error"}
          className="m-0 font-bold text-[9px]"
        >
          {v.toFixed(1)}%
        </Tag>
      ),
    },
  ];

  return (
    <PageContainer title="Yearly Revenue Report">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Revenue Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Yearly Revenue
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              Long-term revenue, gross/net profit trends.
              {from && to && summary && (
                <span className="font-mono ml-2">
                  {from} – {to}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <form
                onSubmit={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="YYYY"
                    min="2000"
                    max="2100"
                    className="w-20 px-3 py-1 bg-white border border-gray-200 text-gray-900 text-sm font-mono rounded-md outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-300 font-medium">–</span>
                  <input
                    type="number"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="YYYY"
                    min="2000"
                    max="2100"
                    className="w-20 px-3 py-1 bg-white border border-gray-200 text-gray-900 text-sm font-mono rounded-md outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-md hover:bg-blue-700 transition flex items-center gap-1.5 h-8"
                >
                  <IconFilter size={15} /> Filter
                </button>
              </form>
            </Card>
            <Space>
              <Button
                onClick={handleExportExcel}
                disabled={!yearly?.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                disabled={!yearly?.length}
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
            {/* Revenue KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Total Orders"
                value={(summary.totalOrders ?? 0).toLocaleString()}
                icon={<IconShoppingCart size={20} />}
                color="text-blue-700"
                bg="bg-blue-50"
              />
              <SummaryCard
                label="Total Sales"
                value={`LKR ${fmt(summary.totalSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-blue-700"
                bg="bg-blue-50"
              />
              <SummaryCard
                label="Net Sales"
                value={`LKR ${fmt(summary.totalNetSales)}`}
                icon={<IconTrendingUp size={20} />}
                color="text-indigo-700"
                bg="bg-indigo-50"
              />
              <SummaryCard
                label="Total COGS"
                value={`LKR ${fmt(summary.totalCOGS)}`}
                icon={<IconTrendingDown size={20} />}
                color="text-red-600"
                bg="bg-red-50"
              />
            </div>

            {/* Profit KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Gross Profit"
                value={`LKR ${fmt(Math.abs(gp))}`}
                icon={
                  gp >= 0 ? (
                    <IconTrendingUp size={20} />
                  ) : (
                    <IconTrendingDown size={20} />
                  )
                }
                color={gp >= 0 ? "text-emerald-700" : "text-red-600"}
                bg={gp >= 0 ? "bg-emerald-50" : "bg-red-50"}
                bar={summary.grossProfitMargin ?? 0}
                barLabel="gross margin"
                barColor="#059669"
              />
              <SummaryCard
                label="Net Profit"
                value={`LKR ${fmt(Math.abs(np))}`}
                icon={
                  np >= 0 ? (
                    <IconTrendingUp size={20} />
                  ) : (
                    <IconTrendingDown size={20} />
                  )
                }
                color={np >= 0 ? "text-emerald-700" : "text-red-600"}
                bg={np >= 0 ? "bg-emerald-50" : "bg-red-50"}
                bar={summary.netProfitMargin ?? 0}
                barLabel="net margin"
                barColor="#111827"
              />
              <SummaryCard
                label="Total Expenses"
                value={`LKR ${fmt(summary.totalExpenses)}`}
                icon={<IconTrendingDown size={20} />}
                color="text-amber-700"
                bg="bg-amber-50"
              />
              <SummaryCard
                label="Trans. Fees"
                value={`LKR ${fmt(summary.totalTransactionFee)}`}
                icon={<IconTrendingDown size={20} />}
                color="text-orange-600"
                bg="bg-orange-50"
              />
            </div>

            {/* Charts */}
            {yearly?.length > 0 && (
              <div
                id="yearly-revenue-chart"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Gross vs Net Profit
                  </p>
                  <div className="h-[320px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={75}
                          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          formatter={(v: number) => `LKR ${fmt(v)}`}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalSales"
                          name="Total Sales"
                          stroke="#111827"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="grossProfit"
                          name="Gross Profit"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net Profit"
                          stroke="#16A34A"
                          strokeWidth={3}
                          strokeDasharray="5 5"
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                    Orders Per Year
                  </p>
                  <div className="h-[320px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearly} barCategoryGap="25%">
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 10 }}
                          width={50}
                        />
                        <RechartTooltip
                          {...TOOLTIP_STYLE}
                          cursor={{ fill: "#F9FAFB" }}
                        />
                        <Legend />
                        <Bar
                          dataKey="totalOrders"
                          name="Total Orders"
                          fill="#3B82F6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Table */}
            {yearly?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <Table
                  columns={columns}
                  dataSource={yearly}
                  rowKey="year"
                  pagination={false}
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
              Select a year range and click Filter to load the report.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default YearRevenuePage;
