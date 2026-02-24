import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import { Card, Form, Spin, Table, Tag } from "antd";
import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

const SalesByBrandPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBrands, setTotalBrands] = useState(0);

  const fetchReport = async (evt?: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from, to },
      });

      setBrands(res.data.brands || []);
      setTotalBrands(res.data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from, to, page: 1, size: totalBrands || 1000 },
      });

      const allBrands = res.data.brands || [];
      if (!allBrands.length) return;

      const exportData = allBrands.map((b: any) => ({
        Brand: b.brand,
        "Total Quantity Sold": b.totalQuantity,
        "Total Sales (Rs)": b.totalSales.toFixed(2),
        "Total Net Sale": b.totalNetSales.toFixed(2),
        "Total COGS (Rs)": (b.totalCOGS || 0).toFixed(2),
        "Total Profit (Rs)": (b.totalGrossProfit || 0).toFixed(2),
        "Margin (%)": (b.grossProfitMargin || 0).toFixed(2),
        "Total Discount (Rs)": b.totalDiscount.toFixed(2),
        "Total Orders": b.totalOrders,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales by Brand");
      XLSX.writeFile(wb, `sales_by_brand_${from || "all"}_${to || "all"}.xlsx`);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Brand",
      key: "brand",
      render: (_, b) => (
        <span className="font-medium text-gray-900">{b.brand}</span>
      ),
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "right",
      render: (_, b) => (
        <span className="font-medium text-gray-900">{b.totalQuantity}</span>
      ),
    },
    {
      title: "Sales",
      key: "sales",
      align: "right",
      render: (_, b) => (
        <span className="font-medium text-gray-900">
          Rs {(b.totalSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Sale",
      key: "netSale",
      align: "right",
      render: (_, b) => (
        <span className="text-gray-600">
          Rs {(b.totalNetSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, b) => (
        <span className="text-gray-600">
          Rs {(b.totalCOGS || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Profit",
      key: "profit",
      align: "right",
      render: (_, b) => (
        <span className="font-medium text-green-600">
          Rs {(b.totalGrossProfit || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, b) => (
        <span className="text-gray-600">
          {(b.grossProfitMargin || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, b) => (
        <span className="text-red-500">
          Rs {(b.totalDiscount || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "right",
      render: (_, b) => <span className="text-gray-600">{b.totalOrders}</span>,
    },
  ];

  return (
    <PageContainer title="Sales by Brand">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Sales by Brand
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View total sales by brand and export data.
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
              disabled={!brands.length}
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
        {!loading && brands.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Sales Comparison
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brands}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#E5E7EB"
                      />
                      <XAxis
                        dataKey="brand"
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
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#111827"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalNetSales"
                        name="Net Sale"
                        fill="#22C55E"
                        radius={[2, 2, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDiscount"
                        name="Discount"
                        fill="#EF4444"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                  Quantity Distribution
                </h3>
                <div className="h-[350px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brands}
                        dataKey="totalQuantity"
                        nameKey="brand"
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        label
                      >
                        {brands.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
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
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={brands}
              rowKey={(r: any) => r.brand}
              pagination={{ pageSize: 15 }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
              scroll={{ x: "max-content" }}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default SalesByBrandPage;
