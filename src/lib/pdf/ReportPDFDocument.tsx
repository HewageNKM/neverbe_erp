import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { pdfStyles as S } from "./pdfStyles";
import { companyConfig } from "./companyConfig";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PDFSummaryItem {
  label: string;
  value: string;
  sub?: string;
}

export interface PDFTable {
  title?: string;
  columns: string[];
  rows: (string | number)[][];
  /** Indices of columns to render in green (positive amounts) */
  greenCols?: number[];
  /** Indices of columns to render in red (negative amounts) */
  redCols?: number[];
  /** Indices of columns to render bold */
  boldCols?: number[];
}

export interface PDFChart {
  title: string;
  imageBase64: string; // base64 PNG from html2canvas
}

export interface ReportPDFDocumentProps {
  title: string;
  subtitle?: string;
  period: string;
  /** Base64 logo image */
  logoBase64: string | null;
  summaryItems?: PDFSummaryItem[];
  charts?: PDFChart[];
  tables?: PDFTable[];
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

const CompanyHeader: React.FC<{
  logoBase64: string | null;
  generatedAt: string;
}> = ({ logoBase64, generatedAt }) => (
  <>
    <View style={S.headerBand}>
      <View style={S.headerLeft}>
        {logoBase64 && <Image src={logoBase64} style={S.logo} />}
        <View>
          <Text style={S.companyNameText}>{companyConfig.name}</Text>
          <Text style={S.companyTagline}>{companyConfig.tagline}</Text>
          <Text style={S.contactLine}>
            {companyConfig.addressLine1}
            {companyConfig.addressLine2
              ? `  ·  ${companyConfig.addressLine2}`
              : ""}
          </Text>
          <Text style={S.contactLine}>
            {companyConfig.phone} · {companyConfig.email} ·{" "}
            {companyConfig.website}
          </Text>
        </View>
      </View>
      <View style={S.headerRight}>
        <Text style={S.generatedLabel}>Generated</Text>
        <Text style={S.generatedDate}>{generatedAt}</Text>
      </View>
    </View>
    <View style={S.accentStripe} />
  </>
);

const ReportTitleBlock: React.FC<{
  title: string;
  subtitle?: string;
  period: string;
}> = ({ title, subtitle, period }) => (
  <View style={S.reportTitleBlock}>
    <View>
      <Text style={S.reportTitle}>{title}</Text>
      {subtitle && <Text style={S.reportSubtitle}>{subtitle}</Text>}
    </View>
    <View style={S.periodBadge}>
      <Text style={S.periodLabel}>Period</Text>
      <Text style={S.periodValue}>{period}</Text>
    </View>
  </View>
);

const KPICards: React.FC<{ items: PDFSummaryItem[] }> = ({ items }) => (
  <>
    <View style={S.sectionHeader}>
      <View style={S.sectionAccentBar} />
      <Text style={S.sectionTitle}>Key Metrics</Text>
    </View>
    <View style={S.kpiGrid}>
      {items.map((item, i) => (
        <View key={i} style={S.kpiCard}>
          <Text style={S.kpiLabel}>{item.label}</Text>
          <Text style={S.kpiValue}>{item.value}</Text>
          {item.sub && <Text style={S.kpiSub}>{item.sub}</Text>}
        </View>
      ))}
    </View>
  </>
);

const ChartSection: React.FC<{ charts: PDFChart[] }> = ({ charts }) => (
  <>
    <View style={S.sectionHeader}>
      <View style={S.sectionAccentBar} />
      <Text style={S.sectionTitle}>Charts & Analytics</Text>
    </View>
    {charts.map((chart, i) => (
      <View key={i} style={S.chartContainer}>
        <Text style={S.chartTitle}>{chart.title}</Text>
        <Image src={chart.imageBase64} style={S.chartImage} />
      </View>
    ))}
  </>
);

const DataTable: React.FC<{ table: PDFTable }> = ({ table }) => (
  <>
    {table.title && (
      <View style={S.sectionHeader}>
        <View style={S.sectionAccentBar} />
        <Text style={S.sectionTitle}>{table.title}</Text>
      </View>
    )}
    <View style={S.table}>
      {/* Header */}
      <View style={S.tableHeaderRow}>
        {table.columns.map((col, ci) => (
          <Text key={ci} style={S.tableHeaderCell}>
            {col}
          </Text>
        ))}
      </View>
      {/* Rows */}
      {table.rows.map((row, ri) => (
        <View
          key={ri}
          style={[S.tableRow, ri % 2 === 0 ? S.tableRowEven : S.tableRowOdd]}
        >
          {row.map((cell, ci) => {
            const extraStyle = table.greenCols?.includes(ci)
              ? S.tableCellGreen
              : table.redCols?.includes(ci)
                ? S.tableCellRed
                : table.boldCols?.includes(ci)
                  ? S.tableCellBold
                  : {};
            return (
              <Text key={ci} style={[S.tableCell, extraStyle]}>
                {String(cell ?? "—")}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  </>
);

const PDFFooter: React.FC = () => (
  <View style={S.footer} fixed>
    <Text style={S.footerLeft}>
      <Text style={S.footerAccent}>{companyConfig.name}</Text>
      {"  ·  "}
      {companyConfig.website}
      {"  ·  Confidential"}
    </Text>
    <Text
      style={S.footerRight}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
    />
  </View>
);

// ─────────────────────────────────────────────────────────────
// Main Document
// ─────────────────────────────────────────────────────────────

export const ReportPDFDocument: React.FC<ReportPDFDocumentProps> = ({
  title,
  subtitle,
  period,
  logoBase64,
  summaryItems = [],
  charts = [],
  tables = [],
}) => {
  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Document
      title={title}
      author={companyConfig.name}
      creator={companyConfig.name}
      subject={`${title} — ${period}`}
    >
      <Page size="A4" style={S.page}>
        {/* ── Header ── */}
        <CompanyHeader logoBase64={logoBase64} generatedAt={generatedAt} />

        {/* ── Body ── */}
        <View style={S.content}>
          <ReportTitleBlock title={title} subtitle={subtitle} period={period} />

          {summaryItems.length > 0 && <KPICards items={summaryItems} />}

          {charts.length > 0 && <ChartSection charts={charts} />}

          {tables.map((table, i) => (
            <DataTable key={i} table={table} />
          ))}
        </View>

        {/* ── Footer ── */}
        <PDFFooter />
      </Page>
    </Document>
  );
};
