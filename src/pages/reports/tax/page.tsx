import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import { Button, Card, DatePicker, Form, Space, Spin, Table } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconReceipt2,
  IconSettings,
  IconAlertCircle,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";

interface TaxReportItem {
  date: string;
  orderId: string;
  orderTotal: number;
  taxableAmount: number;
  taxCollected: number;
}

interface TaxReport {
  period: { from: string; to: string };
  transactions: TaxReportItem[];
  summary: {
    totalOrders: number;
    totalSales: number;
    totalTaxableAmount: number;
    totalTaxCollected: number;
    effectiveTaxRate: number;
  };
  taxSettings?: {
    taxEnabled: boolean;
    taxName: string;
    taxRate: number;
  };
}

const TaxReportPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<TaxReport | null>(null);

  const { currentUser } = useAppSelector((state: RootState) => state.authSlice);

  const fetchReport = async (values?: any) => {
    setLoading(true);
    const fromDate = values?.dateRange?.[0]?.format("YYYY-MM-DD") || from;
    const toDate = values?.dateRange?.[1]?.format("YYYY-MM-DD") || to;
    if (values?.dateRange) {
      setFrom(fromDate);
      setTo(toDate);
    }
    try {
      const res = await api.get<TaxReport>("/api/v1/erp/reports/tax", {
        params: { from: fromDate, to: toDate },
      });
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch tax report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({ dateRange: [dayjs().startOf("month"), dayjs()] });
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleExportExcel = () => {
    if (!report || report.transactions.length === 0) {
      toast("No data to export");
      return;
    }

    const exportData = report.transactions.map((t) => ({
      Date: t.date,
      "Order ID": t.orderId,
      "Order Total": t.orderTotal,
      "Taxable Amount": t.taxableAmount,
      "Tax Collected": t.taxCollected,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    XLSX.writeFile(wb, `tax_report_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.transactions.length) {
      toast("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF…");
    try {
      await exportReportPDF({
        title: "Tax Report",
        subtitle: "Summary of tax collected on all transactions",
        period: `${from} – ${to}`,
        summaryItems: [
          { label: "Total Orders", value: String(report.summary.totalOrders) },
          {
            label: "Total Sales",
            value: `Rs ${report.summary.totalSales.toLocaleString()}`,
          },
          {
            label: "Total Tax Collected",
            value: `Rs ${report.summary.totalTaxCollected.toLocaleString()}`,
          },
          {
            label: "Effective Tax Rate",
            value: `${report.summary.effectiveTaxRate.toFixed(2)}%`,
          },
        ],
        tables: [
          {
            title: "Tax Transactions",
            columns: [
              "Date",
              "Order ID",
              "Order Total",
              "Taxable Amount",
              "Tax Collected",
            ],
            rows: report.transactions.map((t) => [
              t.date,
              t.orderId,
              `Rs ${t.orderTotal.toLocaleString()}`,
              `Rs ${t.taxableAmount.toLocaleString()}`,
              `Rs ${t.taxCollected.toLocaleString()}`,
            ]),
            greenCols: [4],
          },
        ],
        filename: `tax_report_${from}_${to}`,
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
  };

  const columns: ColumnsType<any> = [
    { title: "Date", key: "date", render: (_, t) => <>{t.date}</> },
    { title: "Order ID", key: "orderID", render: (_, t) => <>{t.orderId}</> },
    {
      title: "Order Total",
      key: "orderTotal",
      render: (_, t) => <>Rs {t.orderTotal.toLocaleString()}</>,
    },
    {
      title: "Taxable Amount",
      key: "taxableAmount",
      render: (_, t) => <>Rs {t.taxableAmount.toLocaleString()}</>,
    },
    {
      title: "Tax Collected",
      key: "taxCollected",
      render: (_, t) => <>Rs {t.taxCollected.toLocaleString()}</>,
    },
  ];

  return (
    <PageContainer title="Tax Report">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Tax Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Summary of tax collected on all transactions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchReport}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="dateRange" className="mb-0!">
                  <DatePicker.RangePicker size="middle" />
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

            <Button
              onClick={handleExportExcel}
              disabled={!report?.transactions.length}
              icon={<IconDownload size={16} />}
            >
              Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!report?.transactions.length}
              icon={<IconFileTypePdf size={16} />}
              danger
            >
              PDF
            </Button>
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
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tax Settings Banner */}
            {report.taxSettings && !report.taxSettings.taxEnabled && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconAlertCircle size={20} className="text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">
                      Tax collection is disabled
                    </p>
                    <p className="text-sm text-yellow-600">
                      Configure tax settings to start calculating tax on orders.
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings/tax"
                  className="px-4 py-2 bg-yellow-600 text-white text-xs font-bold   hover:bg-yellow-700 transition-colors flex items-center gap-2"
                >
                  <IconSettings size={14} />
                  Configure
                </Link>
              </div>
            )}

            {report.taxSettings && report.taxSettings.taxEnabled && (
              <div className="bg-green-50 border border-gray-200 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconReceipt2 size={20} className="text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">
                      {report.taxSettings.taxName} @{" "}
                      {report.taxSettings.taxRate}%
                    </p>
                    <p className="text-sm text-green-600">
                      Tax is being calculated on all qualifying orders.
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings/tax"
                  className="px-4 py-2 bg-white border border-gray-200 text-green-700 text-xs font-bold   hover:bg-green-50 transition-colors flex items-center gap-2"
                >
                  <IconSettings size={14} />
                  Settings
                </Link>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.totalOrders}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Total Sales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs {report.summary.totalSales.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Taxable Amount
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs {report.summary.totalTaxableAmount.toLocaleString()}
                </p>
              </div>
              <div className="bg-green-600 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <IconReceipt2 size={16} className="text-gray-400" />
                  <p className="text-xs font-bold   text-gray-400">
                    Tax Collected
                  </p>
                </div>
                <p className="text-2xl font-bold text-white">
                  Rs {report.summary.totalTaxCollected.toLocaleString()}
                </p>
              </div>
              <div className="bg-white border border-gray-200 p-6">
                <p className="text-xs font-bold   text-gray-500 mb-2">
                  Effective Tax Rate
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {report.summary.effectiveTaxRate}%
                </p>
              </div>
            </div>

            {/* Transaction Table */}
            {report.transactions.length > 0 && (
              <div className="bg-white border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-sm font-bold   text-gray-900">
                    Transaction Details
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table
                    bordered
                    columns={columns}
                    dataSource={report.transactions}
                    rowKey={(r: any) =>
                      r.id || r.date || r.month || Math.random().toString()
                    }
                    pagination={{ pageSize: 15, position: ["bottomRight"] }}
                    className="border border-gray-200 rounded-lg overflow-hidden bg-white mt-4"
                    scroll={{ x: "max-content" }}
                  />
                </div>
              </div>
            )}

            {report.transactions.length === 0 && (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <IconReceipt2
                  size={48}
                  className="mx-auto text-gray-300 mb-4"
                />
                <p className="text-gray-500 font-medium">
                  No transactions found for this period
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxReportPage;
