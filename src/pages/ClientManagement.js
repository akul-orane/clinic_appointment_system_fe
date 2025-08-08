import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box } from "@mui/material";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Alert,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import Sidebar from "../components/SideBar";
import { BACKEND_URL, isFeatureValid } from "../assets/constants";

const { Option } = Select;
const { Search } = Input;

const ClientManagement = () => {
  const [form] = Form.useForm();
  const [clients, setClients] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [roleId, setRoleId] = useState(null);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [isMobileView, setIsMobileView] = useState(false);

  const orgId = localStorage.getItem("selectedOrgId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRoleId();
    checkMobileView();
    fetchClients();
  }, []);

  useEffect(() => {
    fetchClients();
  }, [search, pagination.current]);

  const fetchRoleId = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getRoles?orgId=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const roles = response.data.response || [];
      const clientRole = roles.find(
        (role) =>
          role.name === "CLIENT" && role.description === "DEFAULT CLIENT"
      );

      if (clientRole) {
        setRoleId(clientRole.id);
      } else {
        console.warn("CLIENT / DEFAULT CLIENT role not found");
        message.warning(
          "Default client role not found. Please contact administrator."
        );
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      message.error("Failed to fetch client roles");
    }
  };

  const checkMobileView = () => {
    try {
      const response = isFeatureValid("CLIENT_LISTING", "VIEW_MOBILE");
      setIsMobileView(response);
    } catch (err) {
      console.error("Error checking mobile view permission:", err);
    }
  };

  const fetchClients = async () => {
    setTableLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/patient/clients/clientListing`,
        {
          params: {
            search,
            page: pagination.current,
            limit: pagination.pageSize,
            orgId,
          },
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setClients(response.data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.totalPages * pagination.pageSize,
      }));
    } catch (err) {
      console.error("Error fetching clients:", err);
      message.error("Failed to fetch clients");
    } finally {
      setTableLoading(false);
    }
  };

  const handleAddClient = () => {
    form.resetFields();
    setIsModalVisible(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (values) => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    if (!roleId) {
      setErrorMsg("Role not loaded yet. Please try again shortly.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/patient/clients/registerClient`,
        {
          Firstname: values.first_name,
          Secondname: values.last_name,
          address: values.address,
          mobile: values.mobile,
          dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
          gender: values.gender,
          occupation: values.occupation,
          email: values.email,
          emergencyContact: values.emergency_contact,
          organization_id: orgId,
          roleId: roleId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if ([200, 201].includes(response.status)) {
        form.resetFields();
        setIsModalVisible(false);
        setSuccessMsg("Client registered successfully.");
        message.success("Client registered successfully.");
        fetchClients();
      } else {
        message.error("Failed to register client.");
      }
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Registration failed. Please try again later.";
      setErrorMsg(errorMessage);
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(paginationInfo);
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "first_name",
      key: "first_name",

      render: (firstName, record) =>
        `${firstName || ""} ${record.last_name || ""}`.trim() || "-",
    },
    ...(isMobileView
      ? [
          {
            title: "Mobile",
            dataIndex: "phone",
            key: "phone",
          },
        ]
      : []),
    {
      title: "Address",
      dataIndex: "address",
      key: "address",

      ellipsis: true,
    },
    {
      title: "Date of Birth",
      dataIndex: "date_of_birth",
      key: "date_of_birth",

      render: (dob) =>
        dob
          ? new Date(dob).toLocaleDateString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
          : "-",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Occupation",
      dataIndex: "occupation",
      key: "occupation",

      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",

      ellipsis: true,
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f4f9ff" }}>
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Client Management
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddClient}
            size="large"
          >
            Register Client
          </Button>
        </div>

        {successMsg && (
          <Alert
            message={successMsg}
            type="success"
            showIcon
            closable
            className="mb-4"
            onClose={() => setSuccessMsg("")}
          />
        )}

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            className="mb-4"
            onClose={() => setErrorMsg("")}
          />
        )}

        <div className="mb-4">
          <Search
            placeholder="Search by name, mobile..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            onChange={(e) => {
              if (!e.target.value) {
                handleSearch("");
              }
            }}
            style={{ maxWidth: 400 }}
          />
        </div>

        <div className="bg-white rounded-lg shadow">
          <Table
            columns={columns}
            dataSource={clients}
            loading={tableLoading}
            rowKey={(record) => record.id || record.portal_id}
            pagination={{
              ...pagination,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            onChange={handleTableChange}
          />
        </div>

        <Modal
          title="Register New Client"
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={800}
          destroyOnClose
        >
          <div className="modal_outDiv">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              autoComplete="off"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="First Name"
                  name="first_name"
                  rules={[
                    { required: true, message: "Please enter first name!" },
                  ]}
                >
                  <Input placeholder="Enter first name" />
                </Form.Item>

                <Form.Item label="Last Name" name="last_name">
                  <Input placeholder="Enter last name" />
                </Form.Item>

                <Form.Item
                  label="Mobile Number"
                  name="mobile"
                  rules={[
                    { required: true, message: "Please enter mobile number!" },
                    { len: 10, message: "Mobile number must be 10 digits!" },
                  ]}
                >
                  <Input placeholder="Enter mobile number" maxLength={10} />
                </Form.Item>

                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[{ required: true, message: "Please select gender!" }]}
                >
                  <Select placeholder="Select gender">
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  label="Date of Birth"
                  name="dob"
                  rules={[
                    { required: true, message: "Please select date of birth!" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item label="Email" name="email">
                  <Input placeholder="Enter email" type="email" />
                </Form.Item>

                <Form.Item label="Occupation" name="occupation">
                  <Input placeholder="Enter occupation" />
                </Form.Item>

                <Form.Item label="Emergency Contact" name="emergency_contact">
                  <Input placeholder="Enter emergency contact" />
                </Form.Item>
              </div>

              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true, message: "Please enter address!" }]}
              >
                <Input.TextArea rows={3} placeholder="Enter complete address" />
              </Form.Item>

              {errorMsg && (
                <Alert
                  message={errorMsg}
                  type="error"
                  showIcon
                  className="mb-4"
                />
              )}

              {successMsg && (
                <Alert
                  message={successMsg}
                  type="success"
                  showIcon
                  className="mb-4"
                />
              )}

              <div className="flex justify-end gap-2 mt-6">
                <Button onClick={handleModalCancel}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isSubmitting}>
                  {isSubmitting ? "Registering..." : "Register Client"}
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </Box>
  );
};

export default ClientManagement;
