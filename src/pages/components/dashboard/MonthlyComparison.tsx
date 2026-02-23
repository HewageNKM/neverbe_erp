import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getMonthlyComparisonAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import {
  IconTrendingUp,
  IconTrendingDown,
  IconRefresh,
  IconArrowRight,
} from "@tabler/icons-react";
import { List, Tag, Button, Spin, Typography, Space } from "antd";

interface MonthlyData {
  currentMonth: { orders: number; revenue: number; profit: number };
  lastMonth: { orders: number; revenue: number; profit: number };
  percentageChange: { orders: number; revenue: number; profit: number };
}

const MonthlyComparison = () => {
  const [data, setData] = useState<MonthlyData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getMonthlyComparisonAction();
      setData(result);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-lg font-bold text-black m-0">Monthly</h4>
          <Button
            type="text"
            shape="circle"
            icon={<IconRefresh size={14} />}
            onClick={fetchData}
            loading={loading}
          />
        </div>
        <Space size={4} className="text-xs font-bold text-gray-500">
          <span>vs Last</span>
          <IconArrowRight size={10} />
        </Space>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <List
            dataSource={[
              {
                label: "Orders",
                current: data.currentMonth.orders,
                change: data.percentageChange.orders,
              },
              {
                label: "Net Sale",
                current: data.currentMonth.revenue,
                change: data.percentageChange.revenue,
                isCurrency: true,
              },
              {
                label: "Profit",
                current: data.currentMonth.profit,
                change: data.percentageChange.profit,
                isCurrency: true,
              },
            ]}
            renderItem={(item) => {
              const isPositive = item.change >= 0;
              return (
                <List.Item className="bg-white mb-3 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all p-4!">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <Typography.Text
                        type="secondary"
                        strong
                        className="text-[10px] uppercase tracking-widest block mb-1"
                      >
                        {item.label}
                      </Typography.Text>
                      <div className="flex items-baseline">
                        {item.isCurrency && (
                          <span className="text-xs font-bold text-gray-400 mr-1">
                            LKR
                          </span>
                        )}
                        <span className="text-lg font-bold text-black">
                          {item.current.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Tag
                      color={isPositive ? "success" : "error"}
                      className="m-0 flex items-center gap-1 font-bold px-2 py-1 rounded-lg border-none"
                      icon={
                        isPositive ? (
                          <IconTrendingUp size={14} />
                        ) : (
                          <IconTrendingDown size={14} />
                        )
                      }
                    >
                      {Math.abs(item.change)}%
                    </Tag>
                  </div>
                </List.Item>
              );
            }}
          />
        ) : (
          <div className="text-center text-gray-400 py-8">
            No data available
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default MonthlyComparison;
