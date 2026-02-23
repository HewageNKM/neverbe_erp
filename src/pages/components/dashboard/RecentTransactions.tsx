import React, { useEffect, useState } from "react";
import DashboardCard from "../shared/DashboardCard";
import toast from "react-hot-toast";
import { IconReceipt, IconRefresh } from "@tabler/icons-react";
import { getRecentOrdersAction } from "@/actions/reportsActions";
import { useAppSelector } from "@/lib/hooks";
import { Timeline, Tag, Spin, Button, Typography, Card } from "antd";

interface RecentOrder {
  orderId: string;
  paymentStatus: string;
  customerName: string;
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  createdAt: string;
}

const RecentTransactions = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchRecentOrders();
    }
  }, [currentUser]);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const data = await getRecentOrdersAction(6);
      setOrders(data);
    } catch (e: any) {
      console.error(e);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Status mapping to AntD Tag colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "success";
      case "Pending":
        return "default";
      case "Failed":
        return "error";
      case "Refunded":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <DashboardCard title="Recent Orders">
      <div className="flex justify-end -mt-8 mb-4 relative z-10">
        <Button
          type="text"
          shape="circle"
          icon={<IconRefresh size={16} />}
          onClick={fetchRecentOrders}
          loading={loading}
        />
      </div>

      <Spin spinning={loading}>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 opacity-50">
            <IconReceipt size={32} className="mb-2" />
            <Typography.Text strong>No Recent Orders</Typography.Text>
          </div>
        ) : (
          <div className="mt-2 px-2">
            <Timeline
              items={orders.map((order) => ({
                color:
                  getStatusColor(order.paymentStatus) === "success"
                    ? "green"
                    : getStatusColor(order.paymentStatus) === "error"
                      ? "red"
                      : "gray",
                children: (
                  <div className="pb-4">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs text-gray-400 font-medium">
                        {order.createdAt}
                      </span>
                      <Tag
                        color={getStatusColor(order.paymentStatus)}
                        className="mr-0"
                      >
                        {order.paymentStatus}
                      </Tag>
                    </div>

                    <h4 className="text-sm font-bold text-black m-0">
                      Order #{order.orderId}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2 truncate">
                      {order.customerName}
                    </p>

                    <Card
                      size="small"
                      bordered={false}
                      className="bg-white shadow-sm border border-gray-100 rounded-2xl transition-all hover:shadow-md mt-2"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                          <span>Gross Sale</span>
                          <span className="font-semibold text-gray-700">
                            LKR {order.grossAmount.toFixed(2)}
                          </span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="flex justify-between text-xs text-red-500 font-medium">
                            <span>Discount</span>
                            <span className="font-semibold">
                              - LKR {order.discountAmount.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center border-t border-gray-200 pt-1 mt-1">
                          <span className="text-xs font-bold text-gray-700">
                            Net Total
                          </span>
                          <span className="text-sm font-bold text-black">
                            LKR {order.netAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default RecentTransactions;
