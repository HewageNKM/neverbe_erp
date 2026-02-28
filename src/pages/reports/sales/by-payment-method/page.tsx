import api from "@/lib/api";

import { Card, Form, Spin, Table, Button, Space, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const COLORS = ["#111827", "#374151", "#6B7280", "#9CA3AF", "#D1D5DB"];

const SalesByPaymentMethod = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const fetchReport = async (evt?: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-payment-method", {
        params: { from, to },
      });
      setRows(res.data.paymentMethods || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    const formatted = rows.map((r) => ({
      "Payment Method": r.paymentMethod,
      "Total Amount (Rs)": r.totalAmount.toFixed(2),
      "Total Orders": r.totalOrders,
      "Total Transactions": r.transactions,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payment Method");
    XLSX.writeFile(wb, "sales_by_payment_method.xlsx");
  };

  const columns: ColumnsType<any> = [
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      align: "right",
      render: (val) => (
        <span className="font-medium text-gray-900">Rs {val.toFixed(2)}</span>
      ),
    },
    {
      title: "Total Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Transactions",
      dataIndex: "transactions",
      key: "transactions",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
  ];

  return (
    <PageContainer title="Sales by Payment Method">
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
              Sales by Payment Method
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
                disabled={!rows.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={() => window.print()}
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
            <div className="flex justify-center py-12">
              <Spin size="large" />
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && rows.length > 0 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                  Total Sales by Payment Method
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
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                        cursor={{ fill: "#f3f4f6", opacity: 0.5 }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalAmount"
                        fill="#111827"
                        name="Sales (Rs)"
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                  Order Distribution by Payment Method
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
                        outerRadius={100}
                        label
                      >
                        {rows.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111827",
                          border: "none",
                          borderRadius: "8px",
                          color: "#F9FAFB",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                        itemStyle={{ color: "#F9FAFB" }}
                      />
                      <Legend />
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
