import api from "@/lib/api";
import {
  Card,
  Form,
  Spin,
  Table,
  DatePicker,
  Select,
  Button,
  Space,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState, useEffect } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import dayjs from "dayjs";
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
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  // Initialize with last 5 years
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(4, "year").format("YYYY"),
    dayjs().format("YYYY"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY") || dateRange[1];
    const status = values?.status || "Paid";

    if (!from || !to) return;
    setDateRange([from, to]);
    setLoading(true);
    try {
      // Convert to full date strings for the API
      const fromDate = `${from}-01-01`;
      const toDate = `${to}-12-31`;
      const res = await api.get("/api/v1/erp/reports/sales/yearly-summary", {
        params: { from: fromDate, to: toDate, status },
      });
      setSummary(res.data.summary || null);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.error || e.message || "Failed to fetch report",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      dateRange: [dayjs(dateRange[0], "YYYY"), dayjs(dateRange[1], "YYYY")],
      status: "Paid",
    });
    fetchReport(form.getFieldsValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    XLSX.writeFile(wb, `yearly_summary_${dateRange[0]}_${dateRange[1]}.xlsx`);
  };

  const SummaryCard = ({
    title,
    value,
  }: {
    title: string;
    value: string | number;
  }) => (
    <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-center">
      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">
        {title}
      </p>
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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Sales Analysis
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Yearly Summary
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {dateRange[0]} &nbsp;–&nbsp; {dateRange[1]}
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
                  <DatePicker.RangePicker allowClear={false} picker="year" />
                </Form.Item>
                <Form.Item name="status" className="mb-0! w-32">
                  <Select>
                    <Select.Option value="Paid">Paid</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Refunded">Refunded</Select.Option>
                    <Select.Option value="all">All</Select.Option>
                  </Select>
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

            <Space>
              <Button
                onClick={handleExportExcel}
                disabled={!summary?.yearly?.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={() => window.print()}
                disabled={!summary?.yearly?.length}
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
                  <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                      Yearly Sales Trend
                    </p>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="year"
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

                  <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                    <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                      Yearly Net Sales
                    </p>
                    <div className="h-[300px] w-full text-xs font-semibold">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={summary.yearly}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#f3f4f6"
                          />
                          <XAxis
                            dataKey="year"
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
                          <Line
                            type="monotone"
                            dataKey="netSales"
                            name="Net Sales"
                            stroke="#FF5722"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#FF5722", strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: "#FF5722" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-4">
                    Items Sold Per Year
                  </p>
                  <div className="h-[300px] w-full text-xs font-semibold">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.yearly}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#f3f4f6"
                        />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          tickMargin={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9ca3af", fontSize: 10 }}
                          allowDecimals={false}
                          width={40}
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
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Yearly Subtotals
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {summary.yearly?.length} entries
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
                dataSource={dataSource}
                pagination={false}
                scroll={{ x: "max-content" }}
                expandable={{
                  defaultExpandAllRows: true, // You may choose false for better initial UX if there's a lot of data
                }}
                size="small"
              />
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default Page;
