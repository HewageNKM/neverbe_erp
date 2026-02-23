
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Order } from "@/model/Order";
import PageContainer from "../../components/container/PageContainer";
import DashboardCard from "../../components/shared/DashboardCard";
import { useAppSelector } from "@/lib/hooks";
import { getToken } from "@/firebase/firebaseClient";
import axios from "axios";
import { OrderEditForm } from "./components/OrderEditForm";
import { OrderExchangeHistory } from "./components/OrderExchangeHistory";
import toast from "react-hot-toast";
import { Link } from "react-router-dom"; // Use Next.js Link instead of MUI

const OrderEditPage = () => {
  const param = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAppSelector(
    (state) => state.authSlice
  );

  useEffect(() => {
    if (param.orderId && !authLoading && currentUser) {
      fetchOrder();
    }
  }, [currentUser, param.orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`/api/v1/erp/orders/${param.orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  // Breadcrumb Component
  const BreadcrumbNav = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium  tracking-wide">
      <Link to="/orders" className="hover:text-black transition-colors">
        Orders
      </Link>
      <span>/</span>
      <span className="text-black font-bold">
        Edit Order #{order?.orderId || param.orderId}
      </span>
    </div>
  );

  if (loading) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard title="Loading Order...">
          <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
          </div>
        </DashboardCard>
      </PageContainer>
    );
  }

  if (!order) {
    return (
      <PageContainer title="Edit Order">
        <DashboardCard title="Order Not Found">
          <div className="p-8 text-center text-gray-500">
            <p>Order not found or failed to load.</p>
          </div>
        </DashboardCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`Edit Order #${order.orderId}`}>
      <BreadcrumbNav />
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <OrderEditForm order={order} onRefresh={fetchOrder} />
        <OrderExchangeHistory orderId={order.orderId} />
      </div>
    </PageContainer>
  );
};

export default OrderEditPage;
