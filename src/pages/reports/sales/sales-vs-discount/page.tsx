import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Card, Form, Spin, Table, Tag, Space, Button } from "antd";
import React, { useState } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
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
  const [groupBy] = useState<"day" | "month">("day");

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
      `sales_vs_discount_${from || "all"}_${to || "all"}.xlsx`,
    );
  };
  const columns: ColumnsType<any> = [
    {
      title: "Period",
      key: "period",
      render: (_, r) => (
        <span className="font-medium text-gray-900">{r.period}</span>
      ),
    },
    {
      title: "Sales",
      key: "sales",
      align: "right",
      render: (_, r) => (
        <span className="font-medium text-gray-900">
          Rs {r.totalSales.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Sale",
      key: "netSale",
      align: "right",
      render: (_, r) => (
        <span className="text-gray-600">Rs {r.totalNetSales.toFixed(2)}</span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, r) => (
        <span className="text-red-500">Rs {r.totalDiscount.toFixed(2)}</span>
      ),
    },
    {
      title: "Trans. Fee",
      key: "transFee",
      align: "right",
      render: (_, r) => (
        <span className="text-orange-500">
          Rs {(r.totalTransactionFee || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, r) => <span className="text-gray-600">{r.totalOrders}</span>,
    },
  ];

  return (
    <PageContainer title="Sales vs Discount">
      <div className="w-full space-y-8">
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
              Sales vs Discount
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {from || "Start"} &nbsp;–&nbsp; {to || "End"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                layout="inline"
                onFinish={() => fetchReport()}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item className="mb-0!">
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
                <Form.Item className="mb-0!">
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

            <Space>
              <Button
                onClick={exportExcel}
                disabled={!report.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={() => window.print()}
                disabled={!report.length}
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
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && report.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Chart */}
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                Sales vs Discount Trend
              </p>
              <div className="h-[350px] w-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f3f4f6"
                    />
                    <XAxis
                      dataKey="period"
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
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#111827",
                        border: "none",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                        fontSize: "12px",
                        fontWeight: "bold",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                      itemStyle={{ color: "#F9FAFB" }}
                      cursor={{ stroke: "#f3f4f6", strokeWidth: 1 }}
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
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Performance Data
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {report.length} entries recorded
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
                rowKey={(r: any) => r.period}
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

export default SalesVsDiscountPage;
