import React from "react";
import { Card } from "antd";

type Props = {
  className?: string;
  children: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
};

const BlankCard = ({ children, className, title, action }: Props) => {
  return (
    <Card
      className={`shadow-sm ${className || ""}`}
      title={title}
      extra={action}
      bordered
      bodyStyle={{ padding: 0 }}
    >
      {children}
    </Card>
  );
};

export default BlankCard;
