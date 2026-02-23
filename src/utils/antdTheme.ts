import type { ThemeConfig } from "antd";

/**
 * Ant Design Theme Configuration for NEVER Panel
 * Professional ERP Design (Green Theme)
 */
export const antdTheme: ThemeConfig = {
  token: {
    // Primary green palette
    colorPrimary: "#16a34a", // Green-600
    colorSuccess: "#22c55e", // Green-500
    colorWarning: "#f59e0b", // Amber-500
    colorError: "#ef4444", // Red-500
    colorInfo: "#16a34a", // Green-600

    // Background colors
    colorBgLayout: "#f9fafb", // Gray-50

    // Typography
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,

    // Softer spacing & borders for modern professional look
    borderRadius: 6,
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 40,
      fontWeight: 500, // Reduced from 700
      primaryShadow: "0 2px 0 rgba(0, 0, 0, 0.045)",
    },
    Input: {
      controlHeight: 40,
      activeBorderColor: "#16a34a",
      hoverBorderColor: "#22c55e",
    },
    Select: {
      controlHeight: 40,
    },
    DatePicker: {
      controlHeight: 40,
    },
    Table: {
      headerBg: "#f9fafb", // Gray-50 instead of green tint for simpler look? Or keep tint? Let's keep tint but lighter.
      headerColor: "#374151", // Gray-700
      rowHoverBg: "#f0fdf4", // Green-50
    },
    Menu: {
      itemSelectedBg: "#f0fdf4", // Green-50
      itemSelectedColor: "#16a34a", // Green-600
      activeBarBorderWidth: 2,
    },
    Tabs: {
      inkBarColor: "#16a34a",
      itemSelectedColor: "#16a34a",
      itemHoverColor: "#22c55e",
    },
  },
};

export default antdTheme;
