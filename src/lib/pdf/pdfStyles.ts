import { StyleSheet } from "@react-pdf/renderer";
import { companyConfig } from "./companyConfig";

const { primaryColor, accentColor } = companyConfig;

export const pdfStyles = StyleSheet.create({
  // ── Page ─────────────────────────────────────────────────────
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    paddingTop: 0,
    paddingBottom: 50,
    paddingHorizontal: 0,
    backgroundColor: "#ffffff",
    color: "#1a1a1a",
  },

  // ── Header Band ──────────────────────────────────────────────
  headerBand: {
    backgroundColor: primaryColor,
    paddingHorizontal: 40,
    paddingVertical: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  companyNameText: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  companyTagline: {
    color: "#9ca3af",
    fontSize: 8,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  generatedLabel: {
    color: "#9ca3af",
    fontSize: 7,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  generatedDate: {
    color: "#d1d5db",
    fontSize: 8,
    marginTop: 2,
  },
  contactLine: {
    color: "#6b7280",
    fontSize: 7,
    marginTop: 1,
  },

  // ── Accent Stripe ────────────────────────────────────────────
  accentStripe: {
    backgroundColor: accentColor,
    height: 4,
  },

  // ── Content Wrapper ──────────────────────────────────────────
  content: {
    paddingHorizontal: 40,
    paddingTop: 28,
  },

  // ── Report Title Block ───────────────────────────────────────
  reportTitleBlock: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
    letterSpacing: 0.3,
  },
  reportSubtitle: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 3,
  },
  periodBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  periodLabel: {
    fontSize: 7,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  periodValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
    marginTop: 2,
  },

  // ── Section Header ─────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 18,
  },
  sectionAccentBar: {
    width: 3,
    height: 14,
    backgroundColor: accentColor,
    borderRadius: 2,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
  },

  // ── KPI Cards ─────────────────────────────────────────────
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 6,
  },
  kpiCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: accentColor,
    borderLeftStyle: "solid",
    padding: 12,
    minWidth: 110,
    flex: 1,
  },
  kpiLabel: {
    fontSize: 7,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontFamily: "Helvetica-Bold",
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
    marginTop: 4,
  },
  kpiSub: {
    fontSize: 7,
    color: "#9ca3af",
    marginTop: 2,
  },

  // ── Chart Image ───────────────────────────────────────────
  chartImage: {
    width: "100%",
    borderRadius: 6,
    marginBottom: 10,
    objectFit: "contain",
  },
  chartContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
    marginBottom: 6,
  },

  // ── Data Table ────────────────────────────────────────────
  table: {
    marginTop: 6,
    marginBottom: 14,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: primaryColor,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  tableHeaderCell: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    borderBottomStyle: "solid",
  },
  tableRowEven: {
    backgroundColor: "#f9fafb",
  },
  tableRowOdd: {
    backgroundColor: "#ffffff",
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    flex: 1,
  },
  tableCellBold: {
    fontFamily: "Helvetica-Bold",
    color: primaryColor,
  },
  tableCellGreen: {
    color: "#16a34a",
    fontFamily: "Helvetica-Bold",
  },
  tableCellRed: {
    color: "#dc2626",
    fontFamily: "Helvetica-Bold",
  },

  // ── Footer ────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  footerLeft: {
    fontSize: 7,
    color: "#9ca3af",
  },
  footerRight: {
    fontSize: 7,
    color: "#9ca3af",
  },
  footerAccent: {
    color: accentColor,
    fontFamily: "Helvetica-Bold",
  },

  // ── Misc ─────────────────────────────────────────────────
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    marginVertical: 12,
  },
  badge: {
    backgroundColor: "#dcfce7",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#16a34a",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
  },
});
