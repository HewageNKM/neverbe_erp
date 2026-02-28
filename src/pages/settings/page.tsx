import api from "@/lib/api";

import React, { useEffect, useState } from "react";
import PageContainer from "../components/container/PageContainer";
import {
  IconDeviceFloppy,
  IconServer,
  IconWorld,
  IconDeviceDesktop,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";
import {
  Card,
  Button,
  Select,
  Switch,
  Typography,
  Space,
  Row,
  Col,
  Form,
  Spin,
  Divider,
} from "antd";

const { Option } = Select;
const { Text } = Typography;

interface Stock {
  id: string;
  label: string;
}

interface Settings {
  defaultStockId: string;
  onlineStockId: string;
  ecommerce: {
    enable: boolean;
  };
  pos: {
    enable: boolean;
  };
  [key: string]: any;
}

const SettingPage = () => {
  const [form] = Form.useForm();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const { currentUser } = useAppSelector((state) => state.authSlice);

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, stocksRes] = await Promise.all([
        api.get("/api/v1/erp/settings/erp"),
        api.get("/api/v1/erp/master/stocks/dropdown"),
      ]);
      const settingsData = settingsRes.data;
      const stocksData = stocksRes.data;
      setSettings(settingsData);
      setStocks(stocksData);
      form.setFieldsValue({
        defaultStockId: settingsData.defaultStockId,
        onlineStockId: settingsData.onlineStockId,
        ecommerceEnabled: settingsData.ecommerce?.enable,
        posEnabled: settingsData.pos?.enable,
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) fetchSettings();
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        ...settings,
        defaultStockId: values.defaultStockId,
        onlineStockId: values.onlineStockId,
        ecommerce: { ...settings?.ecommerce, enable: values.ecommerceEnabled },
        pos: { ...settings?.pos, enable: values.posEnabled },
      };
      await api.put("/api/v1/erp/settings/erp", payload);
      setSettings(payload);
      toast.success("CONFIGURATION SAVED");
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message || "FAILED TO SAVE");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Settings" description="Settings Management">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Spin size="large" />
          <Text type="secondary" className="mt-4">
            Loading Configuration...
          </Text>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Settings" description="Settings Management">
      <Space
        direction="vertical"
        size="large"
        className="w-full max-w-5xl mx-auto"
      >
        <div className="flex justify-between items-end mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-green-600 rounded-full" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 leading-none mb-1">
                System Configuration
              </span>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                ERP Settings
              </h2>
            </div>
          </div>
          <Button
            type="primary"
            icon={<IconDeviceFloppy size={18} />}
            loading={saving}
            onClick={handleSave}
            className="bg-black hover:bg-gray-800 border-none h-12 px-6 rounded-lg text-sm font-bold shadow-lg shadow-black/10 flex items-center gap-2"
          >
            Save Changes
          </Button>
        </div>

        <Form form={form} layout="vertical">
          <Row gutter={[24, 24]}>
            {/* Inventory Source Configuration */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <IconServer size={20} /> Inventory Source
                  </Space>
                }
                className="h-full"
              >
                <Form.Item
                  label="Default Warehouse"
                  name="defaultStockId"
                  help="Primary source for general operations."
                >
                  <Select placeholder="Select Location">
                    {stocks.map((stock) => (
                      <Option key={stock.id} value={stock.id}>
                        {stock.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Online Allocation"
                  name="onlineStockId"
                  help="Inventory reserved for digital channels."
                >
                  <Select placeholder="Select Location">
                    {stocks.map((stock) => (
                      <Option key={stock.id} value={stock.id}>
                        {stock.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Card>
            </Col>

            {/* Feature Toggles */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <IconDeviceDesktop size={20} /> Platform Modules
                  </Space>
                }
                className="h-full"
              >
                <div className="flex items-center justify-between py-4">
                  <Space>
                    <IconWorld size={24} className="text-gray-400" />
                    <div>
                      <Text strong className="block">
                        E-Commerce
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Public Storefront Access
                      </Text>
                    </div>
                  </Space>
                  <Form.Item
                    name="ecommerceEnabled"
                    valuePropName="checked"
                    noStyle
                  >
                    <Switch />
                  </Form.Item>
                </div>
                <Divider className="my-2" />
                <div className="flex items-center justify-between py-4">
                  <Space>
                    <IconDeviceDesktop size={24} className="text-gray-400" />
                    <div>
                      <Text strong className="block">
                        Point of Sale
                      </Text>
                      <Text type="secondary" className="text-xs">
                        Internal Sales Interface
                      </Text>
                    </div>
                  </Space>
                  <Form.Item name="posEnabled" valuePropName="checked" noStyle>
                    <Switch />
                  </Form.Item>
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </Space>
    </PageContainer>
  );
};

export default SettingPage;
