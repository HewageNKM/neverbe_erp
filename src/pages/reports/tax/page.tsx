import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Space,
  Spin,
  Table,
  Tag,
  Progress,
} from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import { Link } from "react-router-dom";
import {
  IconFilter,
  IconDownload,
  IconFileTypePdf,
  IconReceipt2,
  IconSettings,
  IconAlertCircle,
  IconMinus,
  IconPercentage,
  IconShoppingCart,
  IconCurrencyDollar,
} from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

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

const fmt = (v: number) =>
  new Intl.NumberFormat("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);

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

  const fetchReport = async (values?: { dateRange?: dayjs.Dayjs[] }) => {
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
      "Order Total (LKR)": t.orderTotal,
      "Taxable Amount (LKR)": t.taxableAmount,
      "Tax Collected (LKR)": t.taxCollected,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tax Report");
    XLSX.writeFile(wb, `tax_report_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const handleExportPDF = async () => {
    if (!report || !report.transactions.length) {
      toast.error("No data to export");
      return;
    }
    const toastId = toast.loading("Generating PDF...");
    try {
      await exportReportPDF({
        title: "Tax Report",
        subtitle: "Taxable sales and collected tax breakdown",
        period: `${report.period.from} – ${report.period.to}`,
        summaryItems: [
          {
            label: "Total Sales",
            value: `LKR ${fmt(report.summary.totalSales)}`,
          },
          {
            label: "Taxable Amount",
            value: `LKR ${fmt(report.summary.totalTaxableAmount)}`,
          },
          {
            label: "Tax Collected",
            value: `LKR ${fmt(report.summary.totalTaxCollected)}`,
            sub: `${report.summary.effectiveTaxRate.toFixed(2)}% effective rate`,
          },
        ],
        tables: [
          {
            title: "Tax Transactions",
            columns: [
              "Date",
              "Order ID",
              "Order Total",
              "Taxable Amt",
              "Tax Collected",
            ],
            rows: report.transactions.map((t) => [
              t.date,
              t.orderId,
              fmt(t.orderTotal),
              fmt(t.taxableAmount),
              fmt(t.taxCollected),
            ]),
            boldCols: [1],
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

  const columns: ColumnsType<TaxReportItem> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (v) => (
        <span className="font-mono text-xs text-gray-500">{v}</span>
      ),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (v) => <Tag className="font-mono text-[10px]">{v}</Tag>,
    },
    {
      title: "Order Total",
      dataIndex: "orderTotal",
      key: "orderTotal",
      align: "right",
      render: (v) => (
        <span className="font-mono font-semibold text-gray-900">
          LKR {fmt(v)}
        </span>
      ),
    },
    {
      title: "Taxable Amount",
      dataIndex: "taxableAmount",
      key: "taxableAmount",
      align: "right",
      render: (v) => (
        <span className="font-mono text-gray-600">LKR {fmt(v)}</span>
      ),
    },
    {
      title: "Tax Collected",
      dataIndex: "taxCollected",
      key: "taxCollected",
      align: "right",
      render: (v) => (
        <span className="font-mono font-bold text-emerald-700">
          LKR {fmt(v)}
        </span>
      ),
    },
  ];

  const kpiCards = report
    ? [
        {
          label: "Total Orders",
          value: report.summary.totalOrders.toLocaleString(),
          icon: <IconShoppingCart size={20} />,
          color: "text-blue-600",
          bg: "bg-blue-50",
          bar: null,
        },
        {
          label: "Total Sales",
          value: `LKR ${fmt(report.summary.totalSales)}`,
          icon: <IconCurrencyDollar size={20} />,
          color: "text-gray-900",
          bg: "bg-gray-100",
          bar: null,
        },
        {
          label: "Taxable Amount",
          value: `LKR ${fmt(report.summary.totalTaxableAmount)}`,
          icon: <IconReceipt2 size={20} />,
          color: "text-amber-700",
          bg: "bg-amber-50",
          bar:
            report.summary.totalSales > 0
              ? (report.summary.totalTaxableAmount /
                  report.summary.totalSales) *
                100
              : 0,
          barLabel: "% of sales",
          barColor: "#b45309",
        },
        {
          label: "Tax Collected",
          value: `LKR ${fmt(report.summary.totalTaxCollected)}`,
          icon: <IconReceipt2 size={20} />,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
          bar: null,
        },
        {
          label: "Effective Tax Rate",
          value: `${report.summary.effectiveTaxRate.toFixed(2)}%`,
          icon: <IconPercentage size={20} />,
          color: "text-purple-700",
          bg: "bg-purple-50",
          bar: Math.min(report.summary.effectiveTaxRate, 100),
          barLabel: "rate",
          barColor: "#7c3aed",
        },
      ]
    : [];

  return (
    <PageContainer title="Tax Report">
      <div className="w-full space-y-6">
        {/* ── Header & Controls ─────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Financial Reports
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Tax Report
            </h2>
            {report && (
              <p className="text-xs text-gray-400 mt-1.5 font-mono">
                {report.period.from} &nbsp;–&nbsp; {report.period.to}
              </p>
            )}
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
            <Space>
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
            </Space>
          </div>
        </div>

        {/* ── Loading ───────────────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-24">
            <Spin size="large" />
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────── */}
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tax Status Banner */}
            {report.taxSettings && !report.taxSettings.taxEnabled && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconAlertCircle
                    size={20}
                    className="text-amber-600 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">
                      Tax collection is disabled
                    </p>
                    <p className="text-xs text-amber-600 mt-0.5">
                      Configure tax settings to start calculating tax on orders.
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings/tax"
                  className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <IconSettings size={13} /> Configure
                </Link>
              </div>
            )}

            {report.taxSettings && report.taxSettings.taxEnabled && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <IconReceipt2
                    size={20}
                    className="text-emerald-600 flex-shrink-0"
                  />
                  <div>
                    <p className="font-semibold text-emerald-800 text-sm">
                      {report.taxSettings.taxName} @{" "}
                      {report.taxSettings.taxRate}%
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Tax is being calculated on all qualifying orders.
                    </p>
                  </div>
                </div>
                <Link
                  to="/settings/tax"
                  className="px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1.5 flex-shrink-0"
                >
                  <IconSettings size={13} /> Settings
                </Link>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {kpiCards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.bg}`}
                  >
                    <span className={card.color}>{card.icon}</span>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {card.label}
                  </p>
                  <p
                    className={`text-lg font-black tracking-tight ${card.color} leading-none`}
                  >
                    {card.value}
                  </p>
                  {card.bar !== null && card.bar !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-gray-400 font-bold">
                          {card.barLabel}
                        </span>
                        <span
                          className={`text-[10px] font-black ${card.color}`}
                        >
                          {card.bar.toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        percent={Math.min(card.bar, 100)}
                        showInfo={false}
                        strokeColor={card.barColor}
                        trailColor="#f3f4f6"
                        size="small"
                        strokeLinecap="square"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Transaction Table */}
            {report.transactions.length > 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                      Transaction Details
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5">
                      {report.transactions.length} taxable transaction
                      {report.transactions.length !== 1 ? "s" : ""}
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
                  dataSource={report.transactions}
                  rowKey={(r) =>
                    r.orderId || r.date || Math.random().toString()
                  }
                  pagination={{
                    pageSize: 15,
                    position: ["bottomRight"],
                    showSizeChanger: true,
                  }}
                  size="small"
                  scroll={{ x: "max-content" }}
                  className="pnl-table"
                />
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
                <IconReceipt2
                  size={48}
                  className="mx-auto text-gray-200 mb-4"
                />
                <p className="text-gray-400 font-semibold text-sm">
                  No transactions found for this period
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !report && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <IconMinus size={40} stroke={1} />
            <p className="mt-4 text-sm font-medium">
              Select a date range and click Filter to load the report.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TaxReportPage;
