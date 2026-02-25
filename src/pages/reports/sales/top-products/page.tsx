import type { ColumnsType } from "antd/es/table";
import api from "@/lib/api";
import { Card, Form, Spin, Table } from "antd";
import React, { useState } from "react";
import { IconFilter, IconDownload } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

const TopSellingProductsPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [threshold] = useState("");

  const fetchReport = async (evt?: any) => {
    evt.preventDefault();
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/top-products", {
        params: { from, to, threshold },
      });

      const fetchedProducts: any[] = res.data.topProducts || [];

      setProducts(fetchedProducts);
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch top products");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    if (!products.length) return;

    const exportData = products.map((p) => ({
      "Product ID": p.productId,
      Name: p.name,
      "Variant Name": p.variantName,
      "Total Quantity Sold": p.totalQuantity,
      "Total Sales (Rs)": p.totalSales.toFixed(2),
      "Total Net Sale": p.totalNetSales.toFixed(2),
      "Total COGS (Rs)": (p.totalCOGS || 0).toFixed(2),
      "Total Profit (Rs)": (p.totalGrossProfit || 0).toFixed(2),
      "Margin (%)": (p.grossProfitMargin || 0).toFixed(2),
      "Total Discount (Rs)": p.totalDiscount.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Top Selling Products");
    XLSX.writeFile(
      wb,
      `top_selling_products_${from || "all"}_${to || "all"}.xlsx`,
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: "Product ID",
      key: "productID",
      render: (_, p) => (
        <span className="text-gray-400 font-medium">
          {p.productId.toUpperCase()}
        </span>
      ),
    },
    {
      title: "Name",
      key: "name",
      render: (_, p) => (
        <span className="text-gray-900 font-medium">{p.name}</span>
      ),
    },
    {
      title: "Variant",
      key: "variant",
      render: (_, p) => <span className="text-gray-600">{p.variantName}</span>,
    },
    {
      title: "Qty Sold",
      key: "qtySold",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-900 font-medium">{p.totalQuantity}</span>
      ),
    },
    {
      title: "Sales",
      key: "sales",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-900 font-medium">
          Rs {(p.totalSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Net Sales",
      key: "netSales",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-600">
          Rs {(p.totalNetSales || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "COGS",
      key: "cOGS",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-600">
          Rs {(p.totalCOGS || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Profit",
      key: "profit",
      align: "right",
      render: (_, p) => (
        <span className="text-green-600 font-medium">
          Rs {(p.totalGrossProfit || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Margin",
      key: "margin",
      align: "right",
      render: (_, p) => (
        <span className="text-gray-600">
          {(p.grossProfitMargin || 0).toFixed(2)}%
        </span>
      ),
    },
    {
      title: "Discount",
      key: "discount",
      align: "right",
      render: (_, p) => (
        <span className="text-red-500">
          Rs {(p.totalDiscount || 0).toFixed(2)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer title="Top Selling Products">
      <div className="w-full space-y-8">
        {/* Header & Controls */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold  tracking-tight text-gray-900">
              Top Selling Products
            </h2>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              View most sold products and export data.
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
              onClick={exportExcel}
              disabled={!products.length}
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
          <Table
            columns={columns}
            dataSource={products}
            rowKey={(r: any) => r.productId + r.variantName}
            pagination={{ pageSize: 15, position: ["bottomRight"] }}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            scroll={{ x: 1000 }}
                    bordered
          />
        )}
      </div>
    </PageContainer>
  );
};

export default TopSellingProductsPage;
