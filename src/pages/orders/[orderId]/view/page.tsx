import React, { useState } from "react";
import PageContainer from "../../../components/container/PageContainer";
import { useParams } from "react-router-dom";
import OrderView from "./components/OrderView";

const OrderPage = () => {
  const params = useParams();
  const orderId = params?.orderId as string;
  const [isLoading, setIsLoading] = useState(true);

  return (
    <PageContainer
      title={`Order View - ${orderId}`}
      description="Order View"
      loading={isLoading}
    >
      <OrderView orderId={orderId} onLoadingChange={setIsLoading} />
    </PageContainer>
  );
};

export default OrderPage;
