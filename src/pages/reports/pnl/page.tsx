import api from "@/lib/api";

import { Button, Card, DatePicker, Form, Space, Spin } from "antd";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import { RootState } from "@/lib/store";

interface ProfitLossStatement {
  period: { from: string; to: string };
  revenue: {
    grossSales: number;
    discounts: number;
    netSales: number;
    shippingIncome: number;
    otherIncome: number;
    totalRevenue: number;
  };
  costOfGoodsSold: {
    productCost: number;
    shippingCost: number;
    totalCOGS: number;
  };
  grossProfit: number;
  grossProfitMargin: number;
  operatingExpenses: {
    byCategory: { category: string; amount: number }[];
    totalExpenses: number;
  };
  operatingIncome: number;
  otherExpenses: {
    transactionFees: number;
    otherFees: number;
    totalOther: number;
  };
  netProfit: number;
  netProfitMargin: number;
}

const ProfitLossPage = () => {
  const [form] = Form.useForm();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ProfitLossStatement | null>(null);

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
      const res = await api.get<ProfitLossStatement>(
        "/api/v1/erp/reports/pnl",
        {
          params: { from: fromDate, to: toDate },
        },
      );
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch P&L statement");
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
    if (!report) {
      toast("No data to export");
      return;
    }

    const exportData = [
      { Item: "REVENUE", Amount: "" },
      { Item: "Gross Sales", Amount: report.revenue.grossSales },
      { Item: "Less: Discounts", Amount: -report.revenue.discounts },
      { Item: "Net Sales", Amount: report.revenue.netSales },
      { Item: "Shipping Income", Amount: report.revenue.shippingIncome },
      { Item: "Total Revenue", Amount: report.revenue.totalRevenue },
      { Item: "", Amount: "" },
      { Item: "COST OF GOODS SOLD", Amount: "" },
      { Item: "Product Cost", Amount: report.costOfGoodsSold.productCost },
      { Item: "Total COGS", Amount: report.costOfGoodsSold.totalCOGS },
      { Item: "", Amount: "" },
      { Item: "GROSS PROFIT", Amount: report.grossProfit },
      { Item: `Gross Margin (${report.grossProfitMargin}%)`, Amount: "" },
      { Item: "", Amount: "" },
      { Item: "OPERATING EXPENSES", Amount: "" },
      ...report.operatingExpenses.byCategory.map((e) => ({
        Item: e.category,
        Amount: e.amount,
      })),
      {
        Item: "Total Operating Expenses",
        Amount: report.operatingExpenses.totalExpenses,
      },
      { Item: "", Amount: "" },
      { Item: "OPERATING INCOME", Amount: report.operatingIncome },
      { Item: "", Amount: "" },
      { Item: "OTHER EXPENSES", Amount: "" },
      {
        Item: "Transaction Fees",
        Amount: report.otherExpenses.transactionFees,
      },
      { Item: "Total Other Expenses", Amount: report.otherExpenses.totalOther },
      { Item: "", Amount: "" },
      { Item: "NET PROFIT", Amount: report.netProfit },
      { Item: `Net Margin (${report.netProfitMargin}%)`, Amount: "" },
    ];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "P&L Statement");
    XLSX.writeFile(wb, `pnl_statement_${from}_${to}.xlsx`);
    toast.success("Excel exported successfully");
  };

  const LineItem = ({
    label,
    value,
    formula,
    bold = false,
    indent = false,
    negative = false,
    highlight = false,
    positive = false,
  }: {
    label: string;
    value?: number;
    formula?: string;
    bold?: boolean;
    indent?: boolean;
    negative?: boolean;
    positive?: boolean;
    highlight?: boolean;
  }) => (
    <div
      className={`flex justify-between py-2 px-4 ${
        highlight ? "bg-gray-100 border-t border-b border-gray-200" : ""
      } ${indent ? "pl-8" : ""}`}
    >
      <div className="flex flex-col">
        <span className={`${bold ? "font-bold" : ""} text-gray-900`}>
          {label}
        </span>
        {formula && (
          <span className="text-xs text-gray-400 font-mono">{formula}</span>
        )}
      </div>
      {value !== undefined && (
        <span
          className={`${bold ? "font-bold" : ""} ${
            value < 0 || negative
              ? "text-red-600"
              : positive
                ? "text-green-600"
                : "text-gray-900"
          }`}
        >
          {negative ? "-" : positive ? "+" : ""}Rs{" "}
          {Math.abs(value).toLocaleString()}
        </span>
      )}
    </div>
  );

  return (
    <PageContainer title="Profit & Loss Statement">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Profit & Loss Statement
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Financial performance summary for the selected period.
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

            <button
              onClick={handleExportExcel}
              disabled={!report}
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
        {!loading && report && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* P&L Statement */}
            <div className="bg-white border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-bold   text-gray-900">
                  Statement Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Period: {report.period.from} to {report.period.to}
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {/* Net Sale Section */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold   text-gray-500">
                    Net Sale
                  </span>
                </div>
                <LineItem
                  label="Gross Sales"
                  value={report.revenue.grossSales}
                  indent
                />
                <LineItem
                  label="Discounts"
                  value={report.revenue.discounts}
                  indent
                  negative
                />
                <LineItem
                  label="Net Sales"
                  value={report.revenue.netSales}
                  indent
                  bold
                />
                <LineItem
                  label="Total Revenue"
                  value={report.revenue.totalRevenue}
                  bold
                  highlight
                />

                {/* COGS Section */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold   text-gray-500">
                    Cost of Goods Sold
                  </span>
                </div>
                <LineItem
                  label="Product Cost"
                  value={report.costOfGoodsSold.productCost}
                  indent
                />
                <LineItem
                  label="Total COGS"
                  value={report.costOfGoodsSold.totalCOGS}
                  bold
                  highlight
                  negative
                />

                {/* Gross Profit */}
                <LineItem
                  label={`Gross Profit (${report.grossProfitMargin}% margin)`}
                  value={report.grossProfit}
                  bold
                  highlight
                />

                {/* Operating Expenses */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold   text-gray-500">
                    Operating Expenses
                  </span>
                </div>
                {report.operatingExpenses.byCategory.map((exp) => (
                  <LineItem
                    key={exp.category}
                    label={exp.category}
                    value={exp.amount}
                    indent
                  />
                ))}
                <LineItem
                  label="Total Operating Expenses"
                  value={report.operatingExpenses.totalExpenses}
                  bold
                  highlight
                  negative
                />

                {/* Operating Income */}
                <LineItem
                  label="Operating Income"
                  value={report.operatingIncome}
                  bold
                  highlight
                />

                {/* Other Expenses */}
                <div className="bg-gray-50 px-4 py-2">
                  <span className="text-xs font-bold   text-gray-500">
                    Other Expenses
                  </span>
                </div>
                <LineItem
                  label="Transaction Fees"
                  value={report.otherExpenses.transactionFees}
                  indent
                />
                <LineItem
                  label="Total Other Expenses"
                  value={report.otherExpenses.totalOther}
                  bold
                  negative
                />

                {/* Order Fees added to profit */}
                <LineItem
                  label="Order Fees"
                  value={report.revenue.otherIncome}
                  bold
                  positive
                />

                {/* Net Profit */}
                <div className="bg-green-600 text-white px-4 py-4 flex justify-between items-center">
                  <span className="font-bold text-lg">
                    Net Profit ({report.netProfitMargin}% margin)
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      report.netProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    Rs {report.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default ProfitLossPage;
