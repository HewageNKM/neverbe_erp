import api from "@/lib/api";

import {  Card, Form , Spin } from "antd";
import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const SalesVsDiscountPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");

  const fetchReport = async (evt?: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/sales-vs-discount", {
        params: { from, to, groupBy },
      });
      setReport(res.data.report || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!report.length) return;
    const exportData = report.map((r) => ({
      Period: r.period,
      "Total Sales (Rs)": r.totalSales.toFixed(2),
      "Total Net Sale": r.totalNetSales.toFixed(2),
      "Total Discount (Rs)": r.totalDiscount.toFixed(2),
      "Total Transaction Fee (Rs)": (r.totalTransactionFee || 0).toFixed(2),
      "Total Orders": r.totalOrders,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales vs Discount");
    XLSX.writeFile(
      wb,
      `sales_vs_discount_${from || "all"}_${to || "all"}.xlsx`
    );
  };

  return (
    <PageContainer title="Sales vs Discount">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Sales vs Discount
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Compare total sales and discounts over time.
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
              onClick={exportExcel}
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
            <div className="flex justify-center py-12"><Spin size="large" /></div>
          </div>
        )}

        {/* Content */}
        {!loading && report.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Chart */}
            <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                Sales vs Discount Chart
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
                      dataKey="period"
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
                      stroke="#111827"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalNetSales"
                      name="Net Sale"
                      stroke="#22C55E"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalDiscount"
                      name="Discount"
                      stroke="#EF4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalTransactionFee"
                      name="Transaction Fee"
                      stroke="#F59E0B"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500  bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 font-bold ">
                        Period
                      </th>
                      <th className="px-6 py-3 font-bold  text-right">
                        Sales
                      </th>
                      <th className="px-6 py-3 font-bold  text-right">
                        Net Sale
                      </th>
                      <th className="px-6 py-3 font-bold  text-right">
                        Discount
                      </th>
                      <th className="px-6 py-3 font-bold  text-right">
                        Trans. Fee
                      </th>
                      <th className="px-6 py-3 font-bold  text-right">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.map((r, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {r.period}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          Rs {r.totalSales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-green-600">
                          Rs {r.totalNetSales.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          Rs {r.totalDiscount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-orange-600">
                          Rs {(r.totalTransactionFee || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {r.totalOrders}
                        </td>
                      </tr>
                    ))}
                    {report.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-400 text-sm italic"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SalesVsDiscountPage;
