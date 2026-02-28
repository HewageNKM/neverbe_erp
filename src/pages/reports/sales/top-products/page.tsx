import type { ColumnsType } from "antd/es/table";
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
import React, { useState, useEffect } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import PageContainer from "@/pages/components/container/PageContainer";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const TopSellingProductsPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [threshold] = useState("");

  // Initialize with last 30 days
  const [dateRange, setDateRange] = useState<[string, string]>([
    dayjs().subtract(30, "day").format("YYYY-MM-DD"),
    dayjs().format("YYYY-MM-DD"),
  ]);

  const fetchReport = async (values?: any) => {
    const from = values?.dateRange?.[0]?.format("YYYY-MM-DD") || dateRange[0];
    const to = values?.dateRange?.[1]?.format("YYYY-MM-DD") || dateRange[1];
    const status = values?.status || "Paid";

    setDateRange([from, to]);
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/top-products", {
        params: { from, to, threshold, status },
      });

      const fetchedProducts: any[] = res.data.topProducts || [];

      setProducts(fetchedProducts);
    } catch (e: any) {
      console.error(e);
      toast.error(
        e.response?.data?.error || e.message || "Failed to fetch top products",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      dateRange: [dayjs(dateRange[0]), dayjs(dateRange[1])],
      status: "Paid",
    });
    fetchReport(form.getFieldsValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      `top_selling_products_${dateRange[0]}_${dateRange[1]}.xlsx`,
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
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-6 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                Sales Analysis
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-gray-900 leading-none">
              Top Selling Products
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
                  <DatePicker.RangePicker allowClear={false} />
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
                onClick={exportExcel}
                disabled={!products.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={() => window.print()}
                disabled={!products.length}
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
        {!loading && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Top Products
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {products.length} products found
                </p>
              </div>
              <Tag color="default" className="text-[10px] font-bold uppercase">
                LKR
              </Tag>
            </div>
            <Table
              columns={columns}
              dataSource={products}
              rowKey={(r: any) => r.productId + r.variantName}
              pagination={{
                pageSize: 15,
                position: ["bottomRight"],
                showSizeChanger: true,
              }}
              size="small"
              scroll={{ x: "max-content" }}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default TopSellingProductsPage;
