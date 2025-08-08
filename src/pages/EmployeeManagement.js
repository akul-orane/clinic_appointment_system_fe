import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Button as MuiButton } from "@mui/material";
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
import { PlusOutlined } from "@ant-design/icons";
import Sidebar from "../components/SideBar";
import { BACKEND_URL } from "../assets/constants";

const { Option } = Select;

const UserManagement = () => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [rowLoadingStates, setRowLoadingStates] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const orgId = localStorage.getItem("selectedOrgId");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRoles();
    fetchEmployeeDetails();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getRoles`,
        {
          params: { orgId: orgId },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRoles(response.data.response);
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    }
  };

  const fetchEmployeeDetails = async () => {
    setTableLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getEmployees?orgId=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setUsers(response.data.response || []);
      } else {
        message.error("Failed to fetch employees.");
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
      message.error("Something went wrong while fetching employees.");
    } finally {
      setTableLoading(false);
    }
  };

  const handleAddEmployee = () => {
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

    try {
      const response = await axios.post(
        `${BACKEND_URL}/clientAdmin/userMgmt/createEmployee`,
        {
          roleId: values.roleId,
          emailId: values.email,
          firstName: values.first_name,
          lastName: values.last_name,
          DOB: values.dob ? values.dob.toISOString() : null,
          gender: values.gender,
          address: values.address,
          emergencyContact: values.emergency_contact,
          password: values.password,
          phone: values.phone,
          login_id: values.login_id,
          orgId: orgId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201 || response.status === 200) {
        form.resetFields();
        setIsModalVisible(false);
        setSuccessMsg("Employee created successfully.");
        message.success("Employee added successfully.");
        fetchEmployeeDetails(); // Refresh the table
      } else {
        message.error("Failed to add employee.");
      }
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.message);
      }
      console.error("API Error:", error);
      message.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setRowLoadingStates((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.put(
        `${BACKEND_URL}/clientAdmin/userMgmt/updateUserRole`,
        {
          userId,
          newRoleId,
          orgId: orgId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchEmployeeDetails();
      message.success("Role updated successfully.");
    } catch (error) {
      console.error("Role update failed:", error);
      message.error("Failed to update role");
    } finally {
      setRowLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "portalid",
      key: "portalid",
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "first_name",
      key: "first_name",
      width: 150,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      width: 120,
    },
    {
      title: "Login ID",
      key: "login_id",
      width: 150,
      render: (_, record) => record.users?.login_id || "-",
    },
    {
      title: "Change Role",
      key: "role",
      width: 180,
      render: (_, record) => (
        <Select
          size="small"
          value={
            record.users?.user_organizations?.[0]?.user_roles?.[0]?.roles?.id ||
            ""
          }
          onChange={(value) => handleRoleChange(record.userid, value)}
          loading={rowLoadingStates[record.portalid]}
          style={{ minWidth: 120 }}
        >
          {roles.map((role) => (
            <Option key={role.id} value={role.id}>
              {role.name}
            </Option>
          ))}
        </Select>
      ),
    },
  ];

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f4f9ff" }}>
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Employee Management
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddEmployee}
            size="large"
          >
            Add Employee
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

        <div className="bg-white rounded-lg shadow">
          <Table
            columns={columns}
            dataSource={users}
            loading={tableLoading}
            rowKey="portalid"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            scroll={{ x: 800 }}
          />
        </div>

        <Modal
          title="Add New Employee"
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={800}
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
                  label="Role"
                  name="roleId"
                  rules={[{ required: true, message: "Please select a role!" }]}
                >
                  <Select placeholder="Select role">
                    {roles.map((role) => (
                      <Option key={role.id} value={role.id}>
                        {role.name}
                      </Option>
                    ))}
                  </Select>
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
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: "Please enter email!" },
                    { type: "email", message: "Please enter a valid email!" },
                  ]}
                >
                  <Input placeholder="Enter email" />
                </Form.Item>

                <Form.Item
                  label="Phone"
                  name="phone"
                  rules={[
                    { required: true, message: "Please enter phone number!" },
                    { len: 10, message: "Phone number must be 10 digits!" },
                  ]}
                >
                  <Input placeholder="Enter phone number" maxLength={10} />
                </Form.Item>

                <Form.Item label="Date of Birth" name="dob">
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Login ID"
                  name="login_id"
                  rules={[
                    { required: true, message: "Please enter login ID!" },
                  ]}
                >
                  <Input placeholder="Enter login ID" />
                </Form.Item>

                <Form.Item
                  label="Password"
                  name="password"
                  rules={[
                    { required: true, message: "Please enter password!" },
                    {
                      min: 6,
                      message: "Password must be at least 6 characters!",
                    },
                  ]}
                >
                  <Input.Password placeholder="Enter password" />
                </Form.Item>

                <Form.Item label="Address" name="address">
                  <Input placeholder="Enter address" />
                </Form.Item>

                <Form.Item label="Emergency Contact" name="emergency_contact">
                  <Input placeholder="Enter emergency contact" />
                </Form.Item>
              </div>

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
                  {isSubmitting ? "Creating..." : "Create Employee"}
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </Box>
  );
};

export default UserManagement;
