import React from "react";
import { Spin } from "antd";

const ComponentsLoader = ({
  title = "LOADING",
  position = "absolute",
}: {
  title?: string;
  position?: "fixed" | "absolute" | "relative";
}) => {
  return (
    <div
      className="flex flex-col justify-center items-center bg-white gap-3"
      style={{
        position: position,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
      }}
    >
      <Spin size="large" />
      <span className="text-black font-black text-xs tracking-widest uppercase font-mono">
        {title}
      </span>
    </div>
  );
};

export default ComponentsLoader;
