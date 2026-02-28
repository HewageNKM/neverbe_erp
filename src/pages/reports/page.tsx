import React from "react";
import { Link } from "react-router-dom";
import { Card, Col, Row, Typography } from "antd";
import PageContainer from "../components/container/PageContainer";
import {
  IconChartBar,
  IconArrowRight,
  IconPackage,
  IconCoin,
  IconReceipt,
} from "@tabler/icons-react";

const { Title, Text } = Typography;

const Reports = () => {
  const reportSections = [
    {
      id: "01",
      category: "Financial",
      icon: <IconCoin size={20} stroke={2} />,
      reports: [
        { title: "P&L Statement", link: "/reports/pnl" },
        { title: "Tax Report", link: "/reports/tax" },
        { title: "Cashflow Statement", link: "/reports/cash/cashflow" },
      ],
    },
    {
      id: "02",
      category: "Sales Analysis",
      icon: <IconChartBar size={20} stroke={2} />,
      reports: [
        { title: "Daily Summary", link: "/reports/sales/daily-summary" },
        { title: "Monthly Summary", link: "/reports/sales/monthly-summary" },
        { title: "Yearly Summary", link: "/reports/sales/yearly-summary" },
        { title: "Top Selling Products", link: "/reports/sales/top-products" },
        { title: "Sales by Category", link: "/reports/sales/by-category" },
        { title: "Sales by Brand", link: "/reports/sales/by-brand" },
        {
          title: "Sales vs Discount",
          link: "/reports/sales/sales-vs-discount",
        },
        {
          title: "By Payment Method",
          link: "/reports/sales/by-payment-method",
        },
        { title: "Refunds & Returns", link: "/reports/sales/refunds-returns" },
      ],
    },
    {
      id: "03",
      category: "Revenue",
      icon: <IconCoin size={20} stroke={2} />,
      reports: [
        { title: "Daily Revenue", link: "/reports/revenues/daily-revenue" },
        { title: "Monthly Revenue", link: "/reports/revenues/monthly-revenue" },
        { title: "Yearly Revenue", link: "/reports/revenues/yearly-revenue" },
      ],
    },
    {
      id: "04",
      category: "Expenses",
      icon: <IconReceipt size={20} stroke={2} />,
      reports: [{ title: "Expense Report", link: "/reports/expenses" }],
    },
    {
      id: "05",
      category: "Inventory",
      icon: <IconPackage size={20} stroke={2} />,
      reports: [
        { title: "Live Stock", link: "/reports/stocks/live-stock" },
        { title: "Low Stock Alerts", link: "/reports/stocks/low-stock" },
        { title: "Stock Valuation", link: "/reports/stocks/valuation" },
      ],
    },
    {
      id: "06",
      category: "Customer Insights",
      icon: <IconChartBar size={20} stroke={2} />,
      reports: [{ title: "Customer Analytics", link: "/reports/customers" }],
    },
  ];

  return (
    <PageContainer title="Reports">
      <div className="w-full space-y-10">
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-2">
          <div className="w-1.5 h-10 bg-green-600 rounded-full" />
          <div className="flex flex-col">
            <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
              Data Intelligence
            </Text>
            <Title level={2} className="!m-0 !leading-none tracking-tight">
              Reports Center
            </Title>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-10">
          {reportSections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <div className="flex items-end gap-3 mb-4 pb-3 border-b border-gray-200">
                <span className="text-4xl font-bold text-gray-200 leading-none select-none">
                  {section.id}
                </span>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-green-600">{section.icon}</span>
                  <Title level={5} className="!m-0 tracking-tight">
                    {section.category}
                  </Title>
                </div>
              </div>

              {/* Report Cards Grid */}
              <Row gutter={[16, 16]}>
                {section.reports.map((report, index) => (
                  <Col key={index} xs={24} sm={12} lg={8} xl={6} xxl={5}>
                    <Link to={report.link} className="block">
                      <Card
                        hoverable
                        className="h-[130px] group border-gray-200 transition-all duration-300 hover:border-green-500 hover:shadow-md relative overflow-hidden"
                        styles={{
                          body: {
                            padding: "20px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          },
                        }}
                      >
                        {/* Top accent bar */}
                        <div className="w-8 h-[3px] bg-green-600 rounded-full mb-auto" />

                        {/* Bottom section */}
                        <div className="flex items-end justify-between">
                          <div>
                            <Text
                              strong
                              className="block text-sm leading-tight text-gray-900"
                            >
                              {report.title}
                            </Text>
                            <Text
                              type="secondary"
                              className="text-xs mt-1 block"
                            >
                              View Report
                            </Text>
                          </div>
                          <IconArrowRight
                            size={18}
                            className="text-green-500 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0 ml-2"
                          />
                        </div>
                      </Card>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};

export default Reports;
