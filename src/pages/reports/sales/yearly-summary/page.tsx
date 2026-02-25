import api from "@/lib/api";
import { Card, Form, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const Page = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchReport = async (evt?: any) => {
    evt.preventDefault();
    if (!from || !to) return;
    setLoading(true);
    try {
      // Convert to full date strings for the API
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await api.get("/api/v1/erp/reports/sales/yearly-summary", {
        params: { from: fromDate, to: toDate },
      });
      setSummary(res.data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (!summary?.yearly || summary.yearly.length === 0) return;

    const exportData: any[] = [];
    summary.yearly.forEach((y: any) => {
      exportData.push({
        Year: y.year,
        "Total Orders": y.orders,
        "Total Sales (Rs)": y.sales.toFixed(2),
        "Total Net Sales": y.netSales.toFixed(2),
        "Total COGS (Rs)": (y.cogs || 0).toFixed(2),
        "Total Gross Profit (Rs)": (y.grossProfit || 0).toFixed(2),
        "Gross Profit Margin (%)": (y.grossProfitMargin || 0).toFixed(2),
        "Avg Order Value (Rs)": (y.averageOrderValue || 0).toFixed(2),
        "Shipping (Rs)": y.shipping.toFixed(2),
        "Discount (Rs)": y.discount.toFixed(2),
        "Transaction Fee (Rs)": y.transactionFee.toFixed(2),
        "Items Sold": y.itemsSold,
      });
      y.monthly.forEach((m: any) => {
        exportData.push({
          Year: y.year,
          Month: m.month,
          "Total Orders": m.orders,
          "Total Sales (Rs)": m.sales.toFixed(2),
          "Total Net Sales": m.netSales.toFixed(2),
          "Total COGS (Rs)": (m.cogs || 0).toFixed(2),
          "Total Gross Profit (Rs)": (m.grossProfit || 0).toFixed(2),
          "Gross Profit Margin (%)": (m.grossProfitMargin || 0).toFixed(2),
          "Avg Order Value (Rs)": (m.averageOrderValue || 0).toFixed(2),
          "Shipping (Rs)": m.shipping.toFixed(2),
          "Discount (Rs)": m.discount.toFixed(2),
          "Transaction Fee (Rs)": m.transactionFee.toFixed(2),
          "Items Sold": m.itemsSold,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Yearly Summary");
    XLSX.writeFile(wb, `yearly_summary_${from}_${to}.xlsx`);
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

  const dataSource = (summary?.yearly || []).map((y: any) => ({
    ...y,
    key: `year-${y.year}`,
    isYear: true,
    children: y.monthly
      ? y.monthly.map((m: any) => ({
          ...m,
          key: `month-${y.year}-${m.month}`,
          isYear: false,
        }))
      : undefined,
  }));

  const columns: ColumnsType<any> = [
    {
      title: "Year/Month",
      dataIndex: "period",
      key: "period",
      render: (_, record) => (
        <span
          className={`font-medium ${record.isYear ? "text-gray-900" : "text-gray-600 pl-4"}`}
        >
          {record.isYear ? `${record.year} (Total)` : record.month}
        </span>
      ),
    },
    {
      title: "Orders",
      dataIndex: "orders",
      key: "orders",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Sales",
      dataIndex: "sales",
      key: "sales",
      align: "right",
      render: (val) => (
        <span className="font-medium text-gray-900">
          Rs {(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      dataIndex: "netSales",
      key: "netSales",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {(val || 0).toFixed(2)}</span>
      ),
    },
    {
      title: "COGS",
      dataIndex: "cogs",
      key: "cogs",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {(val || 0).toFixed(2)}</span>
      ),
    },
    {
      title: "Profit",
      dataIndex: "grossProfit",
      key: "grossProfit",
      align: "right",
      render: (val) => (
        <span className="font-medium text-green-600">
          Rs {(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Items",
      dataIndex: "itemsSold",
      key: "itemsSold",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Shipping",
      dataIndex: "shipping",
      key: "shipping",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {(val || 0).toFixed(2)}</span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Yearly Sales Report"
      description="Yearly Sales Summary"
    >
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Yearly Summary
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Filter sales by year range to view yearly and monthly summaries.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
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

            <button
              onClick={handleExportExcel}
              disabled={!summary?.yearly?.length}
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
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard title="Total Orders" value={summary.totalOrders} />
              <SummaryCard
                title="Total Sales"
                value={`Rs ${summary.totalSales.toFixed(2)}`}
              />
              <SummaryCard
                title="Net Sales"
                value={`Rs ${summary.totalNetSales.toFixed(2)}`}
              />
              <SummaryCard title="Items Sold" value={summary.totalItemsSold} />
              <SummaryCard
                title="Gross Profit"
                value={`Rs ${(summary.totalGrossProfit || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Profit Margin"
                value={`${(summary.totalGrossProfitMargin || 0).toFixed(2)}%`}
              />
              <SummaryCard
                title="Avg Order Value"
                value={`Rs ${(summary.averageOrderValue || 0).toFixed(2)}`}
              />
              <SummaryCard
                title="Shipping"
                value={`Rs ${summary.totalShipping.toFixed(2)}`}
              />
            </div>

            {/* Charts Section */}
            {summary.yearly && summary.yearly.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                      Yearly Sales Trend
                    </h3>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E5E7EB"
                          />
                          <XAxis
                            dataKey="year"
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
                          <Line
                            type="monotone"
                            dataKey="sales"
                            name="Sales"
                            stroke="#1976d2"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#1976d2", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#1976d2" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                    <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                      Yearly Net Sales
                    </h3>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E5E7EB"
                          />
                          <XAxis
                            dataKey="year"
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
                          <Line
                            type="monotone"
                            dataKey="netSales"
                            name="Net Sales"
                            stroke="#FF5722"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
                  <h3 className="text-sm font-bold   text-gray-900 mb-6 border-b border-gray-100 pb-2">
                    Items Sold Per Year
                  </h3>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 10 }}
                          allowDecimals={false}
                          width={40}
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
                        <Bar
                          dataKey="itemsSold"
                          name="Items"
                          fill="#1976d2"
                          radius={[2, 2, 0, 0]}
                          barSize={30}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Yearly & Monthly Table */}
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              scroll={{ x: 1000 }}
                        bordered
              expandable={{
                defaultExpandAllRows: true, // You may choose false for better initial UX if there's a lot of data
              }}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Page;
