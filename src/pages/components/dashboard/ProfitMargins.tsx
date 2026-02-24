import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getProfitMarginsAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconPercentage, IconCoin } from "@tabler/icons-react";
import { Progress, Statistic, Button, Tag, Spin, Card } from "antd";

interface MarginData {
  grossMargin: number;
  netMargin: number;
  avgOrderValue: number;
}

const ProfitMargins = () => {
  const [data, setData] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getProfitMarginsAction();
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
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconPercentage size={18} className="text-blue-500" />
          <h4 className="text-lg font-bold text-black m-0">Profit Margins</h4>
          
        </div>
        <Tag className="m-0 text-xs font-bold text-gray-500 bg-gray-100 border-none">
          This Month
        </Tag>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500">
                  Gross Margin
                </span>
                <span className="text-sm font-bold text-black">
                  {data.grossMargin}%
                </span>
              </div>
              <Progress
                percent={data.grossMargin}
                showInfo={false}
                strokeColor="#9ca3af"
                trailColor="#f3f4f6"
                size="small"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-500">
                  Net Margin
                </span>
                <span className="text-sm font-bold text-black">
                  {data.netMargin}%
                </span>
              </div>
              <Progress
                percent={data.netMargin}
                showInfo={false}
                strokeColor="#16a34a"
                trailColor="#f3f4f6"
                size="small"
              />
            </div>

            <Card
              size="small"
              bordered={false}
              className="bg-white shadow-sm border border-gray-100 rounded-2xl transition-all hover:-translate-y-0.5 mt-2"
            >
              <Statistic
                title={
                  <div className="flex items-center gap-2">
                    <IconCoin size={14} className="text-gray-400" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Avg. Order Value
                    </span>
                  </div>
                }
                value={data.avgOrderValue}
                precision={2}
                prefix={
                  <span className="text-[10px] font-bold text-gray-400 mr-1 uppercase">
                    LKR
                  </span>
                }
                valueStyle={{
                  fontSize: "1.125rem",
                  fontWeight: "900",
                  color: "#1f2937",
                }}
              />
            </Card>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            No data available
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default ProfitMargins;
