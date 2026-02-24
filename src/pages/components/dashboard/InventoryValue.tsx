import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getInventoryValueAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconPackage, } from "@tabler/icons-react";
import { Row, Col, Statistic, Card, Spin, Button, Tag } from "antd";

interface InventoryData {
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  avgItemValue: number;
}

const InventoryValue = () => {
  const [data, setData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getInventoryValueAction();
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
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-6 gap-2">
        <div className="flex items-center gap-2">
          <IconPackage size={18} className="text-indigo-500" />
          <h4 className="text-lg font-bold text-black m-0">Inventory Value</h4>
          
        </div>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <div className="flex flex-col gap-3">
            <Card
              size="small"
              bordered={false}
              className="bg-linear-to-bl from-green-500 to-green-600 rounded-2xl shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5"
              bodyStyle={{ padding: "16px" }}
            >
              <Statistic
                title={
                  <span className="text-[10px] font-bold text-green-100 uppercase tracking-widest">
                    Total Stock Value
                  </span>
                }
                value={data.totalValue}
                precision={2}
                prefix={
                  <span className="text-sm font-bold text-green-200 mr-1 uppercase">
                    LKR
                  </span>
                }
                valueStyle={{
                  color: "#fff",
                  fontWeight: "900",
                  fontSize: "1.5rem",
                }}
              />
            </Card>

            <Row gutter={[8, 8]}>
              <Col span={8}>
                <Card
                  size="small"
                  bordered={false}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center transition-all hover:-translate-y-0.5 h-full"
                  bodyStyle={{ padding: "8px" }}
                >
                  <Statistic
                    title={
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Products
                      </span>
                    }
                    value={data.totalProducts}
                    valueStyle={{
                      fontSize: "1.125rem",
                      fontWeight: "900",
                      color: "#1f2937",
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  bordered={false}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center transition-all hover:-translate-y-0.5 h-full"
                  bodyStyle={{ padding: "8px" }}
                >
                  <Statistic
                    title={
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Qty
                      </span>
                    }
                    value={data.totalQuantity}
                    valueStyle={{
                      fontSize: "1.125rem",
                      fontWeight: "900",
                      color: "#1f2937",
                    }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  size="small"
                  bordered={false}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 text-center transition-all hover:-translate-y-0.5 h-full"
                  bodyStyle={{ padding: "8px" }}
                >
                  <Statistic
                    title={
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Avg/Item
                      </span>
                    }
                    value={data.avgItemValue}
                    precision={1}
                    valueStyle={{
                      fontSize: "1.125rem",
                      fontWeight: "900",
                      color: "#1f2937",
                    }}
                  />
                </Card>
              </Col>
            </Row>
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

export default InventoryValue;
