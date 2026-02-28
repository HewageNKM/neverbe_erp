import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Typography } from "antd";
import MenuItems from "./header/MenuItems";

const { Text } = Typography;

export default function AppBreadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  // Don't show breadcrumbs on the dashboard or root
  if (pathnames.length === 0 || pathnames[0] === "dashboard") {
    return null;
  }

  // Find the label for a given path segment from MenuItems
  const getLabelForPathSegment = (segment: string) => {
    // Basic mapping for common cases
    const segmentMap: Record<string, string> = {
      master: "Master Data",
      inventory: "Inventory",
      finance: "Finance",
      campaign: "Campaign",
      settings: "Settings",
      reports: "Reports",
      orders: "Orders",
      users: "Users",
      roles: "Roles",
      website: "Website",
    };

    if (segmentMap[segment]) return segmentMap[segment];

    // Search through MenuItems for a matching href
    for (const item of MenuItems) {
      if (item.children) {
        for (const child of item.children) {
          if (child.href && child.href.endsWith(segment)) {
            return child.title;
          }
        }
      } else if (item.href && item.href.endsWith(segment)) {
        return item.title;
      }
    }

    // Fallback: capitalize the segment and replace dashes with spaces
    return segment
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm mb-6 px-4 sm:px-8 lg:px-12 pt-4">
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join("/")}`;

        // Skip IDs in breadcrumbs (UUIDs, generated IDs like p-, grn-, etc.)
        // This is a simple heuristic: if it looks like an ID, we might just display "Details"
        // or skip it in some designs. Here, we'll try to format it cleanly.
        let label = getLabelForPathSegment(value);
        if (value.length > 15 || value.match(/^[a-z]+-[a-zA-Z0-9_-]{8}$/)) {
          label = "View Details"; // Override ugly IDs with generic text
        }

        if (last) {
          return (
            <Text key={to} strong className="text-gray-700">
              {label}
            </Text>
          );
        }

        return (
          <React.Fragment key={to}>
            <Link
              to={to}
              className="!text-green-600 hover:!text-green-700 font-medium transition-colors"
            >
              {label}
            </Link>
            <span className="text-gray-300">/</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
