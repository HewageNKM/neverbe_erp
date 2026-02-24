import DashboardCard from "../shared/DashboardCard";
import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks";
import { getLowStockAlertsAction } from "@/actions/reportsActions";
import toast from "react-hot-toast";
import { IconAlertTriangle, } from "@tabler/icons-react";
import { List, Avatar, Tag, Button, Spin, Typography } from "antd";

interface LowStockItem {
  productId: string;
  productName: string;
  variantName: string;
  size: string;
  currentStock: number;
  thumbnail?: string;
}

const LowStockAlerts = () => {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) fetchLowStock();
  }, [currentUser]);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const data = await getLowStockAlertsAction(5, 8);
      setItems(data);
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
          <IconAlertTriangle size={18} className="text-orange-500" />
          <h4 className="text-lg font-bold text-black m-0">Low Stock Alerts</h4>
          
        </div>
        <Tag color="orange" className="font-bold">
          {items.length} Items
        </Tag>
      </div>

      <Spin spinning={loading}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[160px] text-gray-400">
            <IconAlertTriangle size={32} className="mb-2 opacity-50" />
            <Typography.Text type="secondary" strong className="text-xs">
              No low stock items
            </Typography.Text>
          </div>
        ) : (
          <List
            dataSource={items}
            size="small"
            className="max-h-[200px] overflow-y-auto"
            renderItem={(item) => (
              <List.Item className="hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 !px-2 !py-2">
                <List.Item.Meta
                  avatar={
                    item.thumbnail ? (
                      <Avatar
                        shape="square"
                        src={item.thumbnail}
                        size="small"
                      />
                    ) : (
                      <Avatar
                        shape="square"
                        size="small"
                        icon={<IconAlertTriangle size={12} />}
                        className="bg-gray-100 text-gray-400"
                      />
                    )
                  }
                  title={
                    <Typography.Text
                      ellipsis
                      className="text-xs font-bold block max-w-[150px]"
                    >
                      {item.productName}
                    </Typography.Text>
                  }
                  description={
                    <Typography.Text
                      type="secondary"
                      ellipsis
                      className="text-[10px] block"
                    >
                      {item.variantName} • Size {item.size}
                    </Typography.Text>
                  }
                />
                <div className="text-right shrink-0 ml-2">
                  <Typography.Text
                    strong
                    className={`text-sm block ${item.currentStock <= 2 ? "text-red-600" : "text-orange-600"}`}
                  >
                    {item.currentStock}
                  </Typography.Text>
                  <span className="text-[10px] text-gray-400">left</span>
                </div>
              </List.Item>
            )}
          />
        )}
      </Spin>
    </DashboardCard>
  );
};

export default LowStockAlerts;
