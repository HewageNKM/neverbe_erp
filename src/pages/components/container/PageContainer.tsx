import { ReactNode } from "react";

type Props = {
  description?: string;
  children: ReactNode;
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => {
  // Set document title when component mounts
  if (title) document.title = title;

  return <div>{children}</div>;
};

export default PageContainer;
