import React from "react";
import { Card } from "antd";

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  headtitle?: React.ReactNode;
  headsubtitle?: React.ReactNode;
  children?: React.ReactNode;
  middlecontent?: React.ReactNode;
  className?: string;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  headtitle,
  headsubtitle,
  middlecontent,
  className,
}: Props) => {
  const displayTitle = headtitle || title;
  const displaySubtitle = headsubtitle || subtitle;

  return (
    <Card
      title={
        displayTitle ? (
          <div className="flex flex-col py-1">
            <span className="text-sm font-extrabold uppercase tracking-widest text-gray-800">
              {displayTitle}
            </span>
            {displaySubtitle && (
              <span className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wide">
                {displaySubtitle}
              </span>
            )}
          </div>
        ) : null
      }
      extra={action}
      className={`h-full shadow-xl shadow-green-900/5 sm:rounded-3xl border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:shadow-green-900/10 ${className || ""}`}
      style={{ borderRadius: "1.25rem" }}
      bodyStyle={{ padding: "24px", height: "100%" }}
      bordered={false}
    >
      <div className="flex flex-col h-full">
        {middlecontent && <div className="mb-4">{middlecontent}</div>}
        <div className="flex-1">{children}</div>
        {footer && (
          <div className="mt-6 pt-4 border-t border-gray-100">{footer}</div>
        )}
      </div>
    </Card>
  );
};

export default DashboardCard;
