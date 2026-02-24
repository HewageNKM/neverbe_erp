import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconDeviceDesktopAnalytics,
  IconLogout,
} from "@tabler/icons-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { clearUser, setUser } from "@/lib/authSlice/authSlice";
import Logo from "@/pages/components/layout/shared/logo/Logo";
import { Card, Typography, Row, Col, Button, Space } from "antd";

const { Title, Text } = Typography;

const PortalSelect = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    const userStr = window.localStorage.getItem("nvrUser");
    if (!userStr) {
      navigate("/");
    } else if (!currentUser) {
      try {
        const user = JSON.parse(userStr);
        dispatch(setUser(user));
      } catch (e) {
        console.error("Failed to parse user from storage", e);
      }
    }
  }, [currentUser, dispatch, navigate]);

  const handleLogout = () => {
    window.localStorage.removeItem("nvrUser");
    dispatch(clearUser());
    navigate("/");
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      {/* Decorative Top Border */}
      <div className="w-full h-1 bg-green-600 fixed top-0 z-50" />

      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="scale-90 origin-left">
          <Logo />
        </div>
        <Button
          type="text"
          danger
          icon={<IconLogout size={16} />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-12">
          <div className="text-center space-y-2">
            <Title level={1} className="!mb-0 uppercase tracking-tight">
              Select Portal
            </Title>
            <Text
              type="secondary"
              className="uppercase tracking-widest text-xs font-bold"
            >
              Welcome back, {currentUser?.username || "Admin"}
            </Text>
          </div>

          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} md={12}>
              <Card
                hoverable
                className="h-[280px] flex flex-col items-center justify-center text-center border-2 border-gray-100 hover:border-gray-200 transition-colors group"
                onClick={() => navigate("/dashboard")}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="p-4 rounded-full bg-gray-50 group-hover:bg-green-50 text-black group-hover:text-green-600 transition-colors">
                    <IconLayoutDashboard size={48} stroke={1.5} />
                  </div>
                  <div>
                    <Title level={3} className="!mb-1">
                      ERP Admin
                    </Title>
                    <Text
                      type="secondary"
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Management & Operations
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                hoverable
                className="h-[280px] flex flex-col items-center justify-center text-center border-2 border-gray-100 hover:border-black transition-colors group"
                onClick={() => navigate("/pos")}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="p-4 rounded-full bg-gray-50 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                    <IconDeviceDesktopAnalytics size={48} stroke={1.5} />
                  </div>
                  <div>
                    <Title level={3} className="!mb-1">
                      POS System
                    </Title>
                    <Text
                      type="secondary"
                      className="text-xs font-bold uppercase tracking-wider"
                    >
                      Sales & Checkout
                    </Text>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center">
        <Text
          type="secondary"
          className="text-[10px] font-bold uppercase tracking-widest"
        >
          NeverBe Internal Systems v2.0
        </Text>
      </div>
    </div>
  );
};

export default PortalSelect;
