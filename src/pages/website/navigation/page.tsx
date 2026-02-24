import {
  Spin,
  Card,
  Input,
  Button,
  Row,
  Col,
  Space,
  Typography,
  Tag,
  Alert,
  Affix,
} from "antd";
import React, { useEffect, useState } from "react";
import {
  IconSitemap,
  IconLink,
  IconDeviceFloppy,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconWand,
  IconBrandFacebook,
} from "@tabler/icons-react";
import {
  getNavigationAction,
  saveNavigationAction,
} from "@/actions/settingActions";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/hooks";

const { Title, Text } = Typography;

const NavigationPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // State for JSON strings
  const [mainNavJson, setMainNavJson] = useState("[]");
  const [footerNavJson, setFooterNavJson] = useState("[]");
  const [socialLinksJson, setSocialLinksJson] = useState("[]");

  // State for Validation
  const [mainNavValid, setMainNavValid] = useState(true);
  const [footerNavValid, setFooterNavValid] = useState(true);
  const [socialLinksValid, setSocialLinksValid] = useState(true);

  const { currentUser } = useAppSelector((state) => state.authSlice);

  useEffect(() => {
    if (currentUser) {
      fetchConfig();
    }
  }, [currentUser]);

  // Real-time validation
  useEffect(() => {
    try {
      JSON.parse(mainNavJson);
      setMainNavValid(true);
    } catch {
      setMainNavValid(false);
    }
  }, [mainNavJson]);

  useEffect(() => {
    try {
      JSON.parse(footerNavJson);
      setFooterNavValid(true);
    } catch {
      setFooterNavValid(false);
    }
  }, [footerNavJson]);

  useEffect(() => {
    try {
      JSON.parse(socialLinksJson);
      setSocialLinksValid(true);
    } catch {
      setSocialLinksValid(false);
    }
  }, [socialLinksJson]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getNavigationAction();
      setMainNavJson(JSON.stringify(data.mainNav || [], null, 2));
      setFooterNavJson(JSON.stringify(data.footerNav || [], null, 2));
      setSocialLinksJson(JSON.stringify(data.socialLinks || [], null, 2));
    } catch (e: any) {
      toast.error("Failed to load config");
    } finally {
      setLoading(false);
    }
  };

  const prettify = (type: "main" | "footer" | "social") => {
    try {
      if (type === "main") {
        const obj = JSON.parse(mainNavJson);
        setMainNavJson(JSON.stringify(obj, null, 2));
      } else if (type === "footer") {
        const obj = JSON.parse(footerNavJson);
        setFooterNavJson(JSON.stringify(obj, null, 2));
      } else {
        const obj = JSON.parse(socialLinksJson);
        setSocialLinksJson(JSON.stringify(obj, null, 2));
      }
    } catch (e) {
      toast.error("Cannot format invalid JSON");
    }
  };

  const allValid = mainNavValid && footerNavValid && socialLinksValid;

  const handleSave = async () => {
    if (!allValid) {
      toast.error("Fix invalid JSON before saving");
      return;
    }

    try {
      setSaving(true);
      const mainNav = JSON.parse(mainNavJson);
      const footerNav = JSON.parse(footerNavJson);
      const socialLinks = JSON.parse(socialLinksJson);

      await saveNavigationAction({ mainNav, footerNav, socialLinks });
      toast.success("NAVIGATION CONFIG SAVED");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spin size="large" />
      </div>
    );
  }

  const renderStatusBox = (isValid: boolean) =>
    isValid ? (
      <Tag
        color="success"
        icon={<IconCheck size={14} className="mr-1 inline" />}
      >
        Valid JSON
      </Tag>
    ) : (
      <Tag color="error" icon={<IconX size={14} className="mr-1 inline" />}>
        Syntax Error
      </Tag>
    );

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      {/* Introduction Alert */}
      <Alert
        message="Developer Mode: JSON Configuration"
        description="You are editing the raw data structure for the navigation menu. Changes here directly affect the live site layout. The editor below provides syntax validation to prevent crashes."
        type="info"
        showIcon
        icon={<IconAlertTriangle size={24} />}
        className="mb-4"
      />

      <Row gutter={[24, 24]}>
        {/* Main Nav Editor */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <IconSitemap size={18} /> Main Navigation
              </Space>
            }
            extra={renderStatusBox(mainNavValid)}
            className="shadow-sm h-full"
            bodyStyle={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 58px)",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <Text type="secondary" className="text-xs font-mono">
                config.main_nav.json
              </Text>
              <Button
                type="link"
                size="small"
                icon={<IconWand size={14} />}
                onClick={() => prettify("main")}
              >
                Format Code
              </Button>
            </div>
            <Input.TextArea
              value={mainNavJson}
              onChange={(e) => setMainNavJson(e.target.value)}
              status={!mainNavValid ? "error" : ""}
              spellCheck="false"
              placeholder='[ { "title": "Home", "link": "/" } ]'
              className="font-mono text-xs flex-1 min-h-[400px]"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: "8px",
                resize: "none",
              }}
            />
          </Card>
        </Col>

        {/* Footer Nav Editor */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <IconLink size={18} /> Footer Links
              </Space>
            }
            extra={renderStatusBox(footerNavValid)}
            className="shadow-sm h-full"
            bodyStyle={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 58px)",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <Text type="secondary" className="text-xs font-mono">
                config.footer.json
              </Text>
              <Button
                type="link"
                size="small"
                icon={<IconWand size={14} />}
                onClick={() => prettify("footer")}
              >
                Format Code
              </Button>
            </div>
            <Input.TextArea
              value={footerNavJson}
              onChange={(e) => setFooterNavJson(e.target.value)}
              status={!footerNavValid ? "error" : ""}
              spellCheck="false"
              placeholder='[ { "title": "About", "link": "/about" } ]'
              className="font-mono text-xs flex-1 min-h-[400px]"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: "8px",
                resize: "none",
              }}
            />
          </Card>
        </Col>

        {/* Social Links Editor */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <IconBrandFacebook size={18} /> Social Links
              </Space>
            }
            extra={renderStatusBox(socialLinksValid)}
            className="shadow-sm h-full"
            bodyStyle={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              height: "calc(100% - 58px)",
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <Text type="secondary" className="text-xs font-mono">
                config.social.json
              </Text>
              <Button
                type="link"
                size="small"
                icon={<IconWand size={14} />}
                onClick={() => prettify("social")}
              >
                Format Code
              </Button>
            </div>
            <Input.TextArea
              value={socialLinksJson}
              onChange={(e) => setSocialLinksJson(e.target.value)}
              status={!socialLinksValid ? "error" : ""}
              spellCheck="false"
              placeholder='[ { "name": "facebook", "url": "https://facebook.com/yourpage" } ]'
              className="font-mono text-xs flex-1 min-h-[400px]"
              style={{
                backgroundColor: "#1e1e1e",
                color: "#d4d4d4",
                borderRadius: "8px",
                resize: "none",
              }}
            />
            <Text type="secondary" className="text-xs mt-3 block">
              Supported names: facebook, instagram, tiktok, youtube, twitter
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Floating Save Action (using Affix might be better, but fixed for now to maintain layout) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          type="primary"
          size="large"
          danger={!allValid}
          loading={saving}
          disabled={!allValid}
          onClick={handleSave}
          icon={
            allValid ? (
              <IconDeviceFloppy size={20} />
            ) : (
              <IconAlertTriangle size={20} />
            )
          }
          style={{
            height: "60px",
            padding: "0 32px",
            fontSize: "16px",
            borderRadius: "30px",
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          }}
        >
          {!allValid ? "Fix Errors To Save" : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
};

export default NavigationPage;
