import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getExpenseSummaryAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconReceipt, IconCategory } from "@tabler/icons-react";
import { Row, Col, Statistic, Card, Spin, Button, Typography, Tag } from "antd";

interface ExpenseData {
  todayExpenses: number;
  monthExpenses: number;
  topCategory: string;
  topCategoryAmount: number;
}

const ExpenseSummary = () => {
  const [data, setData] = useState<ExpenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getExpenseSummaryAction();
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
          <IconReceipt size={18} className="text-red-500" />
          <h4 className="text-lg font-bold text-black m-0">Expenses</h4>
          
        </div>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <div className="flex flex-col gap-4">
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card
                  size="small"
                  bordered={false}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5 h-full"
                >
                  <Statistic
                    title={
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Today
                      </span>
                    }
                    value={data.todayExpenses}
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
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  bordered={false}
                  className="bg-green-50/50 rounded-2xl shadow-sm border border-gray-200 transition-all hover:-translate-y-0.5 h-full"
                >
                  <Statistic
                    title={
                      <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest">
                        This Month
                      </span>
                    }
                    value={data.monthExpenses}
                    precision={2}
                    prefix={
                      <span className="text-[10px] font-bold text-green-700 mr-1 uppercase">
                        LKR
                      </span>
                    }
                    valueStyle={{
                      fontSize: "1.125rem",
                      fontWeight: "900",
                      color: "#166534",
                    }}
                  />
                </Card>
              </Col>
            </Row>

            <Card
              size="small"
              bordered={false}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 transition-all hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <IconCategory size={16} className="text-gray-400" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Top Category
                  </span>
                </div>
                <Tag className="m-0 font-bold border-none rounded-lg">
                  {data.topCategory}
                </Tag>
              </div>
              <div className="text-right mt-2">
                <Typography.Text strong className="text-sm">
                  LKR {data.topCategoryAmount.toLocaleString()}
                </Typography.Text>
              </div>
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

export default ExpenseSummary;
