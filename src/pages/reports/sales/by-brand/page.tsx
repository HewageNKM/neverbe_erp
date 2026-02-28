import {
  Card,
  Form,
  Spin,
  Table,
  Tag,
  DatePicker,
  Button,
  Space,
  Progress,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import React, { useState } from "react";
import dayjs from "dayjs";
import {
  IconFilter,
  IconDownload,
  IconTrendingUp,
  IconShoppingCart,
  IconReceipt2,
  IconBusinessplan,
} from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

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
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

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

const SalesByBrandPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const fetchReport = async (values?: any) => {
    let fromDate = from;
    let toDate = to;
    if (values?.dateRange) {
      fromDate = values.dateRange[0]?.format("YYYY-MM-DD") || from;
      toDate = values.dateRange[1]?.format("YYYY-MM-DD") || to;
      setFrom(fromDate);
      setTo(toDate);
    }
    if (!fromDate || !toDate) {
      toast("Please select a date range");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from: fromDate, to: toDate },
      });
      const data = res.data.brands || [];
      setBrands(data);

      if (data.length > 0) {
        setSummary({
          totalSales: data.reduce(
            (sum: number, b: any) => sum + (b.totalSales || 0),
            0,
          ),
          totalNetSales: data.reduce(
            (sum: number, b: any) => sum + (b.totalNetSales || 0),
            0,
          ),
          totalProfit: data.reduce(
            (sum: number, b: any) => sum + (b.totalGrossProfit || 0),
            0,
          ),
          totalQuantity: data.reduce(
            (sum: number, b: any) => sum + (b.totalQuantity || 0),
            0,
          ),
          totalOrders: data.reduce(
            (sum: number, b: any) => sum + (b.totalOrders || 0),
            0,
          ),
        });
      } else {
        setSummary(null);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const res = await api.get("/api/v1/erp/reports/sales/by-brand", {
        params: { from, to, page: 1, size: 1000 },
      });
      const allBrands = res.data.brands || [];
      if (!allBrands.length) {
        toast("No data to export");
        return;
      }

      const exportData = allBrands.map((b: any) => ({
        Brand: b.brand,
        "Quantity Sold": b.totalQuantity,
        "Total Sales (LKR)": b.totalSales.toFixed(2),
        "Net Sales (LKR)": b.totalNetSales.toFixed(2),
        "COGS (LKR)": (b.totalCOGS || 0).toFixed(2),
        "Gross Profit (LKR)": (b.totalGrossProfit || 0).toFixed(2),
        "Margin (%)": (b.grossProfitMargin || 0).toFixed(2),
        "Discount (LKR)": b.totalDiscount.toFixed(2),
        Orders: b.totalOrders,
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sales by Brand");
      XLSX.writeFile(wb, `sales_by_brand_${from}_${to}.xlsx`);
      toast.success("Excel exported!");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export failed");
    }
  };

  const columns: ColumnsType<any> = [
    {
      title: "Brand",
      key: "brand",
      render: (_, b) => (
        <span className="font-bold text-gray-900">{b.brand || "Unknown"}</span>
      ),
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "center",
      render: (_, b) => (
        <Tag className="font-mono text-[10px] font-bold m-0">
          {b.totalQuantity}
        </Tag>
      ),
    },
    {
      title: "Total Sales",
      key: "sales",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-blue-700">
          LKR {fmt(b.totalSales || 0)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      key: "netSale",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-gray-700">
          LKR {fmt(b.totalNetSales || 0)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-red-500">
          (LKR {fmt(b.totalCOGS || 0)})
        </span>
      ),
    },
    {
      title: "Gross Profit",
      key: "profit",
      align: "right",
      render: (_, b) => (
        <span
          className={`font-mono font-semibold ${b.totalGrossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}
        >
          {b.totalGrossProfit < 0 ? "(" : ""}LKR{" "}
          {fmt(Math.abs(b.totalGrossProfit || 0))}
          {b.totalGrossProfit < 0 ? ")" : ""}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, b) => (
        <Tag
          color={b.grossProfitMargin >= 0 ? "success" : "error"}
          className="font-mono text-[10px] m-0 font-bold"
        >
          {(b.grossProfitMargin || 0).toFixed(1)}%
        </Tag>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, b) => (
        <span className="font-mono text-red-500 text-xs">
          LKR {fmt(b.totalDiscount || 0)}
        </span>
      ),
    },
    {
      title: "Orders",
      key: "orders",
      align: "center",
      render: (_, b) => (
        <span className="font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded text-[10px]">
          {b.totalOrders}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Sales by Brand">
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-indigo-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Sales Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Sales by Brand
            </h2>
            <p className="text-xs text-gray-400 mt-1.5">
              View comprehensive sales and profit metrics segmented by brand.
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
                  <DatePicker.RangePicker />
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
            <Button
              onClick={exportExcel}
              disabled={!brands.length}
              icon={<IconDownload size={16} />}
              className="w-full sm:w-auto"
            >
              Excel
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        )}

        {!loading && summary && brands.length > 0 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-blue-50">
                  <span className="text-blue-700">
                    <IconTrendingUp size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Brand Sales
                </p>
                <p className="text-2xl font-black tracking-tight text-blue-700 leading-none">
                  LKR {fmt(summary.totalSales)}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-emerald-50">
                  <span className="text-emerald-700">
                    <IconBusinessplan size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Brand Profit
                </p>
                <p className="text-2xl font-black tracking-tight text-emerald-700 leading-none">
                  LKR {fmt(summary.totalProfit)}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-gray-400 font-bold">
                      Avg Margin
                    </span>
                    <span className="text-[10px] font-black text-emerald-700">
                      {(
                        (summary.totalProfit / summary.totalSales) * 100 || 0
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    percent={Math.min(
                      (summary.totalProfit / summary.totalSales) * 100 || 0,
                      100,
                    )}
                    showInfo={false}
                    strokeColor="#059669"
                    trailColor="#f3f4f6"
                    size="small"
                  />
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-indigo-50">
                  <span className="text-indigo-700">
                    <IconShoppingCart size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Qty Sold
                </p>
                <p className="text-2xl font-black tracking-tight text-indigo-700 leading-none">
                  {summary.totalQuantity.toLocaleString()}
                </p>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-gray-50">
                  <span className="text-gray-700">
                    <IconReceipt2 size={20} />
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Total Orders
                </p>
                <p className="text-2xl font-black tracking-tight text-gray-900 leading-none">
                  {summary.totalOrders.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Sales & Profit by Brand
                </p>
                <div className="h-[320px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={brands.slice(0, 10)}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#F3F4F6"
                      />
                      <XAxis
                        dataKey="brand"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        tickMargin={10}
                      />
                      <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        width={60}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        width={40}
                      />
                      <RechartTooltip
                        {...TOOLTIP_STYLE}
                        formatter={(v: number, name: string) => [
                          name.includes("Margin")
                            ? `${v.toFixed(1)}%`
                            : `LKR ${fmt(v)}`,
                          name,
                        ]}
                        cursor={{ fill: "#F9FAFB" }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalSales"
                        name="Total Sales"
                        fill="#3B82F6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalGrossProfit"
                        name="Gross Profit"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
                  Quantity Distribution (Top 10)
                </p>
                <div className="h-[320px] w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={brands.slice(0, 10)}
                        dataKey="totalQuantity"
                        nameKey="brand"
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {brands.slice(0, 10).map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartTooltip {...TOOLTIP_STYLE} />
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
                    Brand Performance
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {brands.length} Brands found
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
                dataSource={brands}
                rowKey={(r: any) => r.brand || Math.random()}
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

export default SalesByBrandPage;
