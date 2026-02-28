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

export interface LiveStockItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  size: string;
  stockId: string;
  stockName: string;
  quantity: number;
}

const LiveStockPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<LiveStockItem[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);
  const { currentUser } = useAppSelector((state) => state.authSlice);
  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
  });

  const fetchStocksDropdown = async () => {
    try {
      const res = await api.get("/api/v1/erp/master/stocks/dropdown");
      setStocksDropdown([
        { id: "all", label: "All Stocks" },
        ...(res.data || []),
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch all stock data at once
  const fetchStock = async (values?: any) => {
    setLoading(true);
    const stockId = values?.stockId || "all";

    try {
      const res = await api.get("/api/v1/erp/reports/stocks/live-stock", {
        params: { stockId },
      });

      const allStock: LiveStockItem[] = res.data.stock || [];
      setStock(allStock);

      setSummary(
        res.data.summary || {
          totalProducts: allStock.length,
          totalQuantity: allStock.reduce((acc, s) => acc + s.quantity, 0),
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
      fetchStock(form.getFieldsValue());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const exportExcel = () => {
    if (!stock.length) return;

    const data = stock.map((s) => ({
      "Product ID": s.productId,
      "Product Name": s.productName,
      "Variant ID": s.variantId,
      "Variant Name": s.variantName,
      Size: s.size,
      "Stock ID": s.stockId,
      "Stock Name": s.stockName,
      Quantity: s.quantity,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Live Stock");
    XLSX.writeFile(wb, `live_stock.xlsx`);
  };

  const exportPDF = async () => {
    if (!stock.length) return;
    const toastId = toast.loading("Generating PDF…");
    try {
      await exportReportPDF({
        title: "Live Stock Report",
        subtitle: "Current inventory levels across all stocks",
        period: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        summaryItems: [
          { label: "Total SKUs", value: String(summary.totalProducts) },
          { label: "Total Quantity", value: String(summary.totalQuantity) },
        ],
        tables: [
          {
            title: "Inventory Stock Levels",
            columns: ["Product", "Variant", "Size", "Stock", "Quantity"],
            rows: stock.map((s) => [
              s.productName,
              s.variantName,
              s.size,
              s.stockName,
              s.quantity,
            ]),
            boldCols: [0],
            greenCols: [],
          },
        ],
        filename: "live_stock",
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

  const columns: ColumnsType<LiveStockItem> = [
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
  ];

  return (
    <PageContainer title="Live Stock">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Live Stock
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Current inventory levels with product and variant details.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full xl:w-auto">
            <Card size="small" className="shadow-sm w-full xl:w-auto">
              <Form
                form={form}
                layout="inline"
                onFinish={fetchStock}
                className="flex flex-wrap items-center gap-2"
              >
                <Form.Item name="stockId" className="mb-0! min-w-[200px]">
                  <Select
                    options={stocksDropdown.map((s) => ({
                      value: s.id,
                      label: s.label,
                    }))}
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
              disabled={!stock.length}
              icon={<IconDownload size={16} />}
            >
              Excel
            </Button>
            <Button
              onClick={exportPDF}
              disabled={!stock.length}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SummaryCard
                title="Total Products"
                value={summary.totalProducts}
              />
              <SummaryCard
                title="Total Quantity"
                value={summary.totalQuantity}
              />
            </div>

            {/* Stock Table */}
            <Table
              columns={columns}
              dataSource={stock}
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

export default LiveStockPage;
