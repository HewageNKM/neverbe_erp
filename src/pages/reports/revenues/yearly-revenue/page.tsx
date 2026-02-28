import api from "@/lib/api";
import { Card, Form, Spin, Tag, Progress, Button, Space } from "antd";
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

  const handleExportExcel = () => {
    if (!yearly?.length) return;
    const exportData: any[] = yearly.map((y: any) => ({
      Year: y.year,
      Orders: y.totalOrders,
      "Total Sales (LKR)": y.totalSales.toFixed(2),
      "Net Sales (LKR)": y.totalNetSales.toFixed(2),
      "COGS (LKR)": y.totalCOGS.toFixed(2),
      "Discount (LKR)": y.totalDiscount.toFixed(2),
      "Trans. Fee (LKR)": y.totalTransactionFee.toFixed(2),
      "Expenses (LKR)": y.totalExpenses.toFixed(2),
      "Other Income (LKR)": y.totalOtherIncome.toFixed(2),
      "Gross Profit (LKR)": y.grossProfit.toFixed(2),
      "Gross Margin (%)": y.grossProfitMargin.toFixed(2),
      "Net Profit (LKR)": y.netProfit.toFixed(2),
      "Net Margin (%)": y.netProfitMargin.toFixed(2),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Revenue");
    XLSX.writeFile(wb, `yearly_revenue_${from}_${to}.xlsx`);
  };

  const gp = summary?.grossProfit ?? 0;
  const np = summary?.netProfit ?? 0;

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
                onClick={() => window.print()}
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
              {[
                {
                  label: "Total Orders",
                  value: (summary.totalOrders ?? 0).toLocaleString(),
                  icon: <IconShoppingCart size={20} />,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  bar: null,
                },
                {
                  label: "Total Sales",
                  value: `LKR ${fmt(summary.totalSales)}`,
                  icon: <IconTrendingUp size={20} />,
                  color: "text-blue-700",
                  bg: "bg-blue-50",
                  bar: null,
                },
                {
                  label: "Net Sales",
                  value: `LKR ${fmt(summary.totalNetSales)}`,
                  icon: <IconTrendingUp size={20} />,
                  color: "text-indigo-700",
                  bg: "bg-indigo-50",
                  bar: null,
                },
                {
                  label: "Total COGS",
                  value: `LKR ${fmt(summary.totalCOGS)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-red-600",
                  bg: "bg-red-50",
                  bar: null,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
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

            {/* Profit KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Gross Profit",
                  value: `LKR ${fmt(Math.abs(gp))}`,
                  icon:
                    gp >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color: gp >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: gp >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.grossProfitMargin ?? 0,
                  barLabel: "gross margin",
                  barColor: "#059669",
                },
                {
                  label: "Net Profit",
                  value: `LKR ${fmt(Math.abs(np))}`,
                  icon:
                    np >= 0 ? (
                      <IconTrendingUp size={20} />
                    ) : (
                      <IconTrendingDown size={20} />
                    ),
                  color: np >= 0 ? "text-emerald-700" : "text-red-600",
                  bg: np >= 0 ? "bg-emerald-50" : "bg-red-50",
                  bar: summary.netProfitMargin ?? 0,
                  barLabel: "net margin",
                  barColor: "#111827",
                },
                {
                  label: "Total Expenses",
                  value: `LKR ${fmt(summary.totalExpenses)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-amber-700",
                  bg: "bg-amber-50",
                  bar: null,
                  barLabel: "",
                  barColor: "",
                },
                {
                  label: "Trans. Fees",
                  value: `LKR ${fmt(summary.totalTransactionFee)}`,
                  icon: <IconTrendingDown size={20} />,
                  color: "text-orange-600",
                  bg: "bg-orange-50",
                  bar: null,
                  barLabel: "",
                  barColor: "",
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
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
                  {c.bar !== null && c.bar !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-bold">
                          {c.barLabel}
                        </span>
                        <span className={`text-[10px] font-black ${c.color}`}>
                          {c.bar.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(Math.abs(c.bar), 100)}
                        showInfo={false}
                        strokeColor={c.barColor}
                        trailColor="#f3f4f6"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Charts */}
            {yearly?.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-5 py-3">Year</th>
                        <th className="px-5 py-3 text-right">Orders</th>
                        <th className="px-5 py-3 text-right">Total Sales</th>
                        <th className="px-5 py-3 text-right">Net Sales</th>
                        <th className="px-5 py-3 text-right">COGS</th>
                        <th className="px-5 py-3 text-right">Gross Profit</th>
                        <th className="px-5 py-3 text-center">Margin</th>
                        <th className="px-5 py-3 text-right">Net Profit</th>
                        <th className="px-5 py-3 text-center">Net Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {yearly.map((y: any) => (
                        <tr
                          key={y.year}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-5 py-4 font-bold text-gray-900 font-sans">
                            {y.year}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Tag className="m-0 font-bold text-[9px]">
                              {y.totalOrders}
                            </Tag>
                          </td>
                          <td className="px-5 py-4 text-right text-blue-700">
                            LKR {fmt(y.totalSales)}
                          </td>
                          <td className="px-5 py-4 text-right text-gray-700">
                            LKR {fmt(y.totalNetSales)}
                          </td>
                          <td className="px-5 py-4 text-right text-red-500">
                            (LKR {fmt(y.totalCOGS)})
                          </td>
                          <td
                            className={`px-5 py-4 text-right font-medium ${y.grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {y.grossProfit < 0 ? "(" : ""}LKR{" "}
                            {fmt(Math.abs(y.grossProfit))}
                            {y.grossProfit < 0 ? ")" : ""}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Tag
                              color={
                                y.grossProfitMargin >= 0 ? "success" : "error"
                              }
                              className="m-0 font-bold text-[9px]"
                            >
                              {y.grossProfitMargin.toFixed(1)}%
                            </Tag>
                          </td>
                          <td
                            className={`px-5 py-4 text-right font-bold ${y.netProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
                          >
                            {y.netProfit < 0 ? "(" : ""}LKR{" "}
                            {fmt(Math.abs(y.netProfit))}
                            {y.netProfit < 0 ? ")" : ""}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Tag
                              color={
                                y.netProfitMargin >= 0 ? "success" : "error"
                              }
                              className="m-0 font-bold text-[9px]"
                            >
                              {y.netProfitMargin.toFixed(1)}%
                            </Tag>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
