import { Card, Form, Spin, Table, Select, Button, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import React, { useEffect, useState } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import { exportReportPDF } from "@/lib/pdf/exportReportPDF";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";
import toast from "react-hot-toast";

const StockValuationPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stockList, setStockList] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });
  const fetchStocksDropdown = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/stocks/dropdown");
      setStocksDropdown(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStockValuation = async (values?: any) => {
    setLoading(true);
    const stockId = values?.stockId || "all";
    try {
      const res = await api.get("/api/v1/erp/reports/stocks/valuation", {
        params: { stockId },
      });

      setStockList(res.data.stock || []);
      setSummary(
        res.data.summary || {
          totalProducts: 0,
          totalQuantity: 0,
          totalValuation: 0,
        },
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchStocksDropdown();
      form.setFieldsValue({
        stockId: "all",
      });
      fetchStockValuation(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const exportExcel = () => {
    if (!stockList.length) return;
    const data = stockList.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock ID": s.stockId,
      "Stock Name": s.stockName,
      Quantity: s.quantity,
      "Buying Price (Rs)": s.buyingPrice.toFixed(2),
      "Valuation (Rs)": s.valuation.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Valuation");
    XLSX.writeFile(wb, `stock_valuation.xlsx`);
    toast.success("Excel exported!");
  };

  const exportPDF = async () => {
    if (!stockList.length) return;
    const toastId = toast.loading("Generating PDF…");
    try {
      await exportReportPDF({
        title: "Stock Valuation Report",
        subtitle: "Total inventory value at buying price",
        period: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        summaryItems: [
          { label: "Total SKUs", value: String(summary.totalProducts) },
          { label: "Total Quantity", value: String(summary.totalQuantity) },
          {
            label: "Total Valuation",
            value: `Rs ${summary.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          },
        ],
        tables: [
          {
            title: "Stock Valuation by Product",
            columns: [
              "Product",
              "Variant",
              "Size",
              "Stock",
              "Qty",
              "Buy Price",
              "Valuation",
            ],
            rows: stockList.map((s) => [
              s.productName,
              s.variantName,
              s.size,
              s.stockName,
              s.quantity,
              `Rs ${s.buyingPrice.toFixed(2)}`,
              `Rs ${s.valuation.toFixed(2)}`,
            ]),
            boldCols: [0],
            greenCols: [6],
          },
        ],
        filename: "stock_valuation_report",
      });
      toast.success("PDF exported!", { id: toastId });
    } catch {
      toast.error("PDF export failed", { id: toastId });
    }
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

  const columns: ColumnsType<any> = [
    {
      title: "Product ID",
      dataIndex: "productId",
      key: "productId",
      render: (text) => (
        <span className="font-medium text-gray-400">{text}</span>
      ),
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Variant ID",
      dataIndex: "variantId",
      key: "variantId",
      render: (text) => <span className="text-gray-400">{text}</span>,
    },
    {
      title: "Variant Name",
      dataIndex: "variantName",
      key: "variantName",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Stock ID",
      dataIndex: "stockId",
      key: "stockId",
      render: (text) => <span className="text-gray-400">{text}</span>,
    },
    {
      title: "Stock Name",
      dataIndex: "stockName",
      key: "stockName",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      align: "right",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Buying Price",
      dataIndex: "buyingPrice",
      key: "buyingPrice",
      align: "right",
      render: (val) => (
        <span className="text-gray-600">Rs {val.toFixed(2)}</span>
      ),
    },
    {
      title: "Valuation",
      dataIndex: "valuation",
      key: "valuation",
      align: "right",
      render: (val) => (
        <span className="font-medium text-green-600">Rs {val.toFixed(2)}</span>
      ),
    },
  ];

  return (
    <PageContainer title="Stock Valuation">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Stock Valuation
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Shows the current stock value per product/variant based on buying
              price.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchStockValuation}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="stockId" className="mb-0! min-w-[200px]">
                  <Select
                    options={[
                      { value: "all", label: "All Stocks" },
                      ...stocksDropdown.map((s) => ({
                        value: s.id,
                        label: s.label,
                      })),
                    ]}
                  />
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
              onClick={exportExcel}
              disabled={!stockList.length}
              icon={<IconDownload size={16} />}
            >
              Excel
            </Button>
            <Button
              onClick={exportPDF}
              disabled={!stockList.length}
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
        {!loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Total Products"
                value={summary.totalProducts}
              />
              <SummaryCard
                title="Total Quantity"
                value={summary.totalQuantity}
              />
              <SummaryCard
                title="Total Valuation"
                value={`Rs ${summary.totalValuation.toFixed(2)}`}
              />
            </div>

            {/* Table */}
            <Table
              columns={columns}
              dataSource={stockList}
              rowKey={(record, index) => index as number}
              pagination={{ pageSize: 15, position: ["bottomRight"] }}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
              scroll={{ x: 1000 }}
              bordered
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default StockValuationPage;
