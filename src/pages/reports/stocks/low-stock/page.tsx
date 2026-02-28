import {
  Card,
  Form,
  Spin,
  Table,
  Select,
  InputNumber,
  Button,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";

import React, { useEffect, useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";
import { useAppSelector } from "@/lib/hooks";

const LowStockPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [stock, setStock] = useState<any[]>([]);
  const [stocksDropdown, setStocksDropdown] = useState<any[]>([]);

  const [summary, setSummary] = useState({
    totalProducts: 0,
    totalQuantity: 0,
    totalValuation: 0,
  });

  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Fetch stock dropdown
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

  // Fetch all low-stock items at once
  const fetchStock = async (values?: any) => {
    setLoading(true);
    const threshold = values?.threshold || 10;
    const stockId = values?.stockId || "all";

    try {
      const res = await api.get("/api/v1/erp/reports/stocks/low-stock", {
        params: { threshold, stockId },
      });

      const data = res.data.stock || [];
      setStock(data);

      setSummary({
        totalProducts: data.length,
        totalQuantity: data.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0,
        ),
        totalValuation: data.reduce(
          (sum: number, s: any) => sum + (s.buyingPrice || 0) * s.quantity,
          0,
        ),
      });
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchStocksDropdown();
      form.setFieldsValue({
        threshold: 10,
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
      Threshold: s.threshold,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Low Stock");
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
        <span className="font-medium text-red-600">{text}</span>
      ),
    },
    {
      title: "Threshold",
      dataIndex: "threshold",
      key: "threshold",
      align: "right",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
  ];

  return (
    <PageContainer title="Low Stock">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Low Stock Report
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Products and variants with stock below threshold.
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
                <Form.Item name="threshold" className="mb-0!">
                  <InputNumber
                    min={0}
                    placeholder="Threshold"
                    className="w-24 border border-gray-300 focus:border-gray-900"
                  />
                </Form.Item>
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

            <button
              onClick={exportExcel}
              disabled={!stock.length}
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

export default LowStockPage;
