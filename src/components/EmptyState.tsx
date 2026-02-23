import React from "react";
import { Empty } from "antd";

const EmptyState = ({
  title = "No Data Found",
  subtitle = "The requested information is unavailable.",
}: {
  title?: string;
  subtitle?: string;
}) => {
  return (
    <div className="flex items-center justify-center py-12 w-full bg-gray-50/50 rounded-md border border-dashed border-gray-200">
      <Empty
        description={
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-gray-700">{title}</span>
            <span className="text-xs text-gray-400">{subtitle}</span>
          </div>
        }
      />
    </div>
  );
};

export default EmptyState;
