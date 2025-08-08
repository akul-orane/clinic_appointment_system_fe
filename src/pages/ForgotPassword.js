import React, { useState } from "react";
import { Form, Input, Button, Alert, Card, Typography } from "antd";
import { UserOutlined, LockOutlined, KeyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BACKEND_URL } from "../../assets/constants";

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [step, setStep] = useState(1); // 1: Login ID, 2: OTP, 3: Reset Password
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // === API CALL PLACEHOLDERS ===
  const sendOtpApi = async (loginId) => {
    // Example API call
    // await axios.post(`${BACKEND_URL}/noAuth/auth/send-otp`, { login_id: loginId });
    console.log("Send OTP API for:", loginId);
  };

  const verifyOtpApi = async (loginId, otp) => {
    // Example API call
    // await axios.post(`${BACKEND_URL}/noAuth/auth/verify-otp`, { login_id: loginId, otp });
    console.log("Verify OTP API for:", loginId, otp);
  };

  const resetPasswordApi = async (loginId, newPass) => {
    // Example API call
    // await axios.post(`${BACKEND_URL}/noAuth/auth/reset-password`, { login_id: loginId, password: newPass });
    console.log("Reset password API for:", loginId, newPass);
  };

  // === HANDLERS ===
  const handleSendOtp = async (values) => {
    setErrorMsg("");
    setLoading(true);
    try {
      await sendOtpApi(values.loginId);
      setStep(2);
    } catch (err) {
      setErrorMsg("Failed to send OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (values) => {
    setErrorMsg("");
    setLoading(true);
    try {
      await verifyOtpApi(values.loginId, values.otp);
      setStep(3);
    } catch (err) {
      setErrorMsg("Invalid OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleResetPassword = async (values) => {
    if (values.newPassword !== values.confirmPassword) {
      return setErrorMsg("Passwords do not match.");
    }
    setErrorMsg("");
    setLoading(true);
    try {
      await resetPasswordApi(values.loginId, values.newPassword);
      navigate("/login");
    } catch (err) {
      setErrorMsg("Failed to reset password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <Card className="login-card">
          <div className="login-content">
            {/* Header */}
            <div className="login-header">
              <Title level={3} className="login-title">
                Forgot Password
              </Title>
              <Text className="login-subtitle">
                {step === 1 && "Enter your Login ID to receive OTP"}
                {step === 2 && "Enter the OTP sent to your email"}
                {step === 3 && "Enter your new password"}
              </Text>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                className="error-alert"
              />
            )}

            {/* Step Forms */}
            {step === 1 && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSendOtp}
                initialValues={{ loginId: "" }}
              >
                <Form.Item
                  name="loginId"
                  label="Login ID"
                  rules={[
                    { required: true, message: "Please enter your Login ID" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="Enter your Login ID"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </Form.Item>
              </Form>
            )}

            {step === 2 && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleVerifyOtp}
                initialValues={{ otp: "" }}
              >
                {/* Hidden field for loginId */}
                <Form.Item name="loginId" hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  name="otp"
                  label="OTP"
                  rules={[{ required: true, message: "Please enter the OTP" }]}
                >
                  <Input
                    prefix={<KeyOutlined />}
                    placeholder="Enter OTP"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </Form.Item>
              </Form>
            )}

            {step === 3 && (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleResetPassword}
                initialValues={{ newPassword: "", confirmPassword: "" }}
              >
                {/* Hidden field for loginId */}
                <Form.Item name="loginId" hidden>
                  <Input />
                </Form.Item>

                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    { required: true, message: "Please enter new password" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Enter new password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label="Confirm Password"
                  rules={[
                    { required: true, message: "Please confirm your password" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Confirm password"
                    size="large"
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    size="large"
                    loading={loading}
                  >
                    {loading ? "Saving..." : "Save New Password"}
                  </Button>
                </Form.Item>
              </Form>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
