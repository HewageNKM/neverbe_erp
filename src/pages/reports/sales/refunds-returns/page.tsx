import api from "@/lib/api";

import { Card, Form, Spin, Table, Space, Button, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState } from "react";
import { IconFilter, IconDownload, IconFileTypePdf } from "@tabler/icons-react";
import * as XLSX from "xlsx";
import PageContainer from "@/pages/components/container/PageContainer";

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

const RefundsReturnsReport = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    totalOrders: number;
    totalRefundAmount: number;
    totalRestockedItems: number;
    items: any[];
  } | null>(null);

  const fetchReport = async (evt?: React.FormEvent) => {
    if (evt) evt.preventDefault();
    setLoading(true);
    try {
      const res = await api.get("/api/v1/erp/reports/sales/refunds-returns", {
        params: { from, to },
      });
      setReport(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const exportExcel = () => {
    if (!report?.items?.length) return;

    const formatted = report.items.map((o: any) => ({
      "Order ID": o.orderId,
      Status: o.status,
      "Refund Amount (Rs)": o.refundAmount,
      Restocked: o.restocked ? "Yes" : "No",
      "Restocked At": o.restockedAt || "-",
      "Created At": o.createdAt,
    }));

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refunds & Returns");
    XLSX.writeFile(wb, "refunds_returns.xlsx");
  };

  const columns: ColumnsType<any> = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => (
        <span className="font-medium text-gray-900">{text}</span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 text-xs font-bold  rounded-lg ${
            status === "Refunded"
              ? "bg-red-50 text-red-700"
              : status === "Returned"
                ? "bg-orange-50 text-orange-700"
                : "bg-gray-100 text-gray-700"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Refund Amount",
      dataIndex: "refundAmount",
      key: "refundAmount",
      align: "right",
      render: (val) => (
        <span className="font-medium text-red-600">Rs {val}</span>
      ),
    },
    {
      title: "Restocked",
      dataIndex: "restocked",
      key: "restocked",
      render: (val) => (
        <span className="text-gray-600">{val ? "Yes" : "No"}</span>
      ),
    },
    {
      title: "Restocked At",
      dataIndex: "restockedAt",
      key: "restockedAt",
      render: (val) => <span className="text-gray-600">{val || "-"}</span>,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => <span className="text-gray-600">{text}</span>,
    },
  ];

  return (
    <PageContainer title="Refunds & Returns">
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
              Refunds & Returns
            </h2>
            <p className="text-xs text-gray-400 mt-1.5 font-mono">
              {from || "Start"} &nbsp;–&nbsp; {to || "End"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full xl:w-auto">
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

            <Space>
              <Button
                onClick={exportExcel}
                disabled={!report?.items?.length}
                icon={<IconDownload size={16} />}
              >
                Excel
              </Button>
              <Button
                onClick={() => window.print()}
                disabled={!report?.items?.length}
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
        {!loading && report && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <SummaryCard
                title="Total Returned Orders"
                value={report.totalOrders}
              />
              <SummaryCard
                title="Total Refunded Amount"
                value={`Rs ${report.totalRefundAmount}`}
              />
              <SummaryCard
                title="Total Restocked Items"
                value={report.totalRestockedItems}
              />
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Order Details
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {report.items?.length} entries found
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
                dataSource={report.items || []}
                rowKey={(record, index) => index as number}
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

export default RefundsReturnsReport;
