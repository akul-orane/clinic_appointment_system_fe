import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Alert,
  Tag,
  Space,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";
import { Box, Typography } from "@mui/material";
import { BACKEND_URL } from "../assets/constants";

const { TextArea } = Input;

const Services = () => {
  const [form] = Form.useForm();
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [loadingServiceId, setLoadingServiceId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingService, setEditingService] = useState(null);

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("selectedOrgId");

  const fetchServices = async () => {
    setTableLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientadmin/serviceManagement/getServices?orgId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setServices(response.data.data || []);
    } catch (err) {
      console.error("Error fetching services:", err);
      message.error("Failed to fetch services");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = () => {
    setEditingService(null);
    form.resetFields();
    setIsModalVisible(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleEditService = (service) => {
    setEditingService(service);
    form.setFieldsValue({
      name: service.name,
      description: service.description,
      price: service.price,
    });
    setIsModalVisible(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingService(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (values) => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (editingService) {
        // Update existing service
        await axios.put(
          `${BACKEND_URL}/clientadmin/serviceManagement/updateService`,
          {
            id: editingService.id,
            serviceName: values.name,
            desc: values.description,
            price: values.price,
            orgId: orgId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        message.success("Service updated successfully");
        setSuccessMsg("Service updated successfully");
      } else {
        // Create new service
        await axios.post(
          `${BACKEND_URL}/clientadmin/serviceManagement/createService`,
          {
            serviceName: values.name,
            desc: values.description,
            price: values.price,
            orgId: orgId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        message.success("Service added successfully");
        setSuccessMsg("Service added successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingService(null);
      fetchServices();
    } catch (err) {
      const errorMessage = editingService
        ? "Failed to update service"
        : "Failed to add service";
      setErrorMsg(errorMessage);
      message.error(errorMessage);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoadingServiceId(id);
      await axios.patch(
        `${BACKEND_URL}/clientadmin/serviceManagement/updateServiceStatus?id=${id}`,
        { is_valid: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Status updated successfully");
      setSuccessMsg("Status updated successfully");
      setErrorMsg("");
      fetchServices();
    } catch (err) {
      setErrorMsg("Failed to update status");
      setSuccessMsg("");
      message.error("Failed to update status");
      console.error("Status update error:", err);
    } finally {
      setLoadingServiceId(null);
    }
  };

  const handleDeleteService = async (id) => {
    try {
      setLoadingServiceId(id);
      await axios.delete(
        `${BACKEND_URL}/clientadmin/serviceManagement/deleteService?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Service deleted successfully");
      setSuccessMsg("Service deleted successfully");
      setErrorMsg("");
      fetchServices();
    } catch (err) {
      setErrorMsg("Failed to delete service");
      setSuccessMsg("");
      message.error("Failed to delete service");
      console.error("Delete error:", err);
    } finally {
      setLoadingServiceId(null);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "portal_id",
      key: "portal_id",
    },
    {
      title: "Service Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      // render: (price) => `₹${price}`,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      // width: 300,
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "is_valid",
      key: "is_valid",
      // width: 120,
      render: (is_valid, record) => (
        <Popconfirm
          title={`Are you sure you want to ${
            is_valid ? "disable" : "enable"
          } this service?`}
          onConfirm={() => handleStatusChange(record.id, !is_valid)}
          okText="Yes"
          cancelText="No"
        >
          <Tag color={is_valid ? "green" : "red"} style={{ cursor: "pointer" }}>
            {is_valid ? "ENABLED" : "DISABLED"}
          </Tag>
        </Popconfirm>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      // width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditService(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDeleteService(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={loadingServiceId === record.id}
              size="small"
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "#f4f9ff",
      }}
    >
      <div className="flex-1 p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900">
            Service Management
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddService}
            size="large"
          >
            Add Service
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
            dataSource={services}
            loading={tableLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            scroll={{ x: 800 }}
          />
        </div>

        <Modal
          title={editingService ? "Edit Service" : "Add New Service"}
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
              <Form.Item
                label="Service Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter service name!" },
                  {
                    min: 2,
                    message: "Service name must be at least 2 characters!",
                  },
                ]}
              >
                <Input placeholder="Enter service name" />
              </Form.Item>

              <Form.Item label="Description" name="description">
                <TextArea rows={3} placeholder="Enter service description" />
              </Form.Item>

              <Form.Item
                label="Price"
                name="price"
                rules={[
                  { required: true, message: "Please enter price!" },
                  {
                    pattern: /^\d+(\.\d{1,2})?$/,
                    message:
                      "Please enter a valid price (e.g., 100 or 100.50)!",
                  },
                ]}
              >
                <Input
                  placeholder="Enter price"
                  type="number"
                  min="0"
                  step="0.01"
                  addonBefore="₹"
                />
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
                <Button type="primary" htmlType="submit" loading={loading}>
                  {loading
                    ? editingService
                      ? "Updating..."
                      : "Creating..."
                    : editingService
                    ? "Update Service"
                    : "Create Service"}
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </Box>
  );
};

export default Services;
