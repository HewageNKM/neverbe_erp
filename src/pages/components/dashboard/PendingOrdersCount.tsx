import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getPendingOrdersCountAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import {
  IconClock,
  IconTruck,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Spin, Button } from "antd";

interface PendingData {
  pendingPayment: number;
  pendingShipment: number;
  total: number;
}

const PendingOrdersCount = () => {
  const [data, setData] = useState<PendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchData();
  }, [currentUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await getPendingOrdersCountAction();
      setData(result);
    } catch (error) {
      const err = error as Error;
      console.error(err);
      toast.error(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardCard>
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          <IconAlertCircle size={18} className="text-red-500" />
          <h4 className="text-lg font-bold tracking-tighter text-black m-0">
            Needs Attention
          </h4>
          
        </div>
      </div>

      <Spin spinning={loading}>
        {data ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-4 border border-gray-200 bg-green-600 text-white rounded-2xl shadow-sm">
              <div className="flex items-center gap-3">
                <IconAlertCircle size={24} />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-100 m-0">
                    Total Pending
                  </p>
                  <p className="text-2xl font-bold m-0">{data.total}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 border border-yellow-100 bg-yellow-50 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-2">
                  <IconClock size={16} className="text-yellow-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-700">
                    Awaiting Payment
                  </span>
                </div>
                <p className="text-xl font-bold text-yellow-700 m-0">
                  {data.pendingPayment}
                </p>
              </div>

              <div className="p-4 border border-blue-100 bg-blue-50 rounded-2xl shadow-sm transition-all hover:-translate-y-0.5">
                <div className="flex items-center gap-2 mb-2">
                  <IconTruck size={16} className="text-blue-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                    To Ship
                  </span>
                </div>
                <p className="text-xl font-bold text-blue-700 m-0">
                  {data.pendingShipment}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8 min-h-[100px]">
            No data available
          </div>
        )}
      </Spin>
    </DashboardCard>
  );
};

export default PendingOrdersCount;
