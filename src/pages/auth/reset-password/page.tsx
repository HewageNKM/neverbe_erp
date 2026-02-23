import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconMail,
  IconArrowLeft,
  IconRobot,
  IconCheck,
} from "@tabler/icons-react";
import toast from "react-hot-toast";
import { sendPasswordResetLinkAction } from "@/actions/authActions";
import { Card, Form, Input, Button, Typography } from "antd";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    if (!isVerified) {
      toast("Please complete human verification.", { icon: '⚠️' });
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetLinkAction(values.email);
      setEmailSent(true);
      toast.success("RESET LINK DISPATCHED");
    } catch (e: any) {
      console.log(e);
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <figure className="mb-4">
            <img src="/logo.png" alt="Logo" className="w-28 h-28" />
          </figure>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Reset Access
          </h2>
          <p className="mt-2 text-center text-sm font-semibold text-gray-500 uppercase tracking-widest">
            Enter email to receive recovery link
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card
          className="bg-white py-16 px-4 shadow-xl shadow-green-900/5 sm:rounded-3xl border border-gray-100"
          style={{ borderRadius: "1rem" }}
        >
          {!emailSent ? (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
              requiredMark={false}
              className="space-y-6"
            >
              <Form.Item
                label={
                  <span className="block text-sm font-bold text-gray-700 uppercase tracking-wide">
                    Registered Email
                  </span>
                }
                name="email"
                rules={[
                  { required: true, message: "Please input your email!" },
                  { type: "email", message: "Please enter a valid email!" },
                ]}
                className="mb-0!"
              >
                <Input
                  prefix={<IconMail size={20} className="text-gray-400 mr-2" />}
                  className="h-14 rounded-xl border-gray-200 bg-gray-50 focus:bg-white text-base font-medium"
                  placeholder="admin@neverbe.com"
                />
              </Form.Item>

              {/* Human Verification */}
              <div
                onClick={() => setIsVerified(!isVerified)}
                className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all mb-0! ${
                  isVerified
                    ? "border-green-600 bg-green-50"
                    : "border-gray-200 bg-gray-50 hover:border-green-600 hover:bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 border rounded-md flex items-center justify-center ${isVerified ? "bg-green-600 border-green-600" : "border-gray-300 bg-white"}`}
                  >
                    {isVerified && (
                      <IconCheck size={16} className="text-white" stroke={3} />
                    )}
                  </div>
                  <span
                    className={`text-sm font-bold uppercase tracking-wide ${isVerified ? "text-green-700" : "text-gray-700"}`}
                  >
                    Human Verification
                  </span>
                </div>
                <IconRobot
                  size={24}
                  className={isVerified ? "text-green-600" : "text-gray-400"}
                />
              </div>

              <Form.Item className="mb-0! mt-8!">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={isLoading}
                  disabled={!isVerified}
                  className="btn-fluid-primary"
                >
                  Send Reset Link
                </Button>
              </Form.Item>

              <div className="text-center mt-4">
                <Link to="/login">
                  <Text
                    type="success"
                    className="flex items-center justify-center gap-2 cursor-pointer hover:underline text-green-600 font-semibold"
                  >
                    <IconArrowLeft size={16} /> Back to Login
                  </Text>
                </Link>
              </div>
            </Form>
          ) : (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <IconMail size={40} />
              </div>
              <div className="space-y-2">
                <Title level={3} className="mb-0!">
                  Check Your Email
                </Title>
                <Text type="secondary" className="block text-sm">
                  We have sent password recovery instructions to your inbox.
                </Text>
              </div>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="btn-fluid-primary w-full" type="primary">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
