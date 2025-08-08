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
import { Box } from "@mui/material";
import { BACKEND_URL } from "../assets/constants";

const ResourceManagement = () => {
  const [form] = Form.useForm();
  const [resources, setResources] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [loadingResourceId, setLoadingResourceId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingResource, setEditingResource] = useState(null);

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("selectedOrgId");

  const fetchResources = async () => {
    setTableLoading(true);
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientadmin/resourceManagement/getResources?orgId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResources(response.data.response || []);
    } catch (err) {
      console.error("Error fetching resources:", err);
      message.error("Failed to fetch resources");
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleAddResource = () => {
    setEditingResource(null);
    form.resetFields();
    setIsModalVisible(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleEditResource = (resource) => {
    setEditingResource(resource);
    form.setFieldsValue({
      name: resource.name,
    });
    setIsModalVisible(true);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingResource(null);
    setErrorMsg("");
    setSuccessMsg("");
  };

  const handleSubmit = async (values) => {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (editingResource) {
        // Update existing resource (assuming API endpoint exists)
        await axios.put(
          `${BACKEND_URL}/clientadmin/resourceManagement/updateResource`,
          {
            id: editingResource.id,
            resourceName: values.name,
            orgId: orgId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        message.success("Resource updated successfully");
        setSuccessMsg("Resource updated successfully");
      } else {
        // Create new resource
        await axios.post(
          `${BACKEND_URL}/clientadmin/resourceManagement/createResource`,
          {
            resourceName: values.name,
            orgId: orgId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        message.success("Resource added successfully");
        setSuccessMsg("Resource added successfully");
      }

      setIsModalVisible(false);
      form.resetFields();
      setEditingResource(null);
      fetchResources();
    } catch (err) {
      const errorMessage = editingResource
        ? "Failed to update resource"
        : "Failed to add resource";
      setErrorMsg(errorMessage);
      message.error(errorMessage);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoadingResourceId(id);
      await axios.patch(
        `${BACKEND_URL}/clientadmin/resourceManagement/updateResources?id=${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Status updated successfully");
      setSuccessMsg("Status updated successfully");
      setErrorMsg("");
      fetchResources();
    } catch (err) {
      setErrorMsg("Failed to update status");
      setSuccessMsg("");
      message.error("Failed to update status");
      console.error("Status update error:", err);
    } finally {
      setLoadingResourceId(null);
    }
  };

  const handleDeleteResource = async (id) => {
    try {
      setLoadingResourceId(id);
      // Update this endpoint when the actual delete API is available
      await axios.delete(
        `${BACKEND_URL}/clientadmin/resourceManagement/deleteResource?id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Resource deleted successfully");
      setSuccessMsg("Resource deleted successfully");
      setErrorMsg("");
      fetchResources();
    } catch (err) {
      setErrorMsg("Failed to delete resource");
      setSuccessMsg("");
      message.error("Failed to delete resource");
      console.error("Delete error:", err);
    } finally {
      setLoadingResourceId(null);
    }
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "portal_id",
      key: "portal_id",
      // sorter: (a, b) => a.portal_id - b.portal_id,
    },
    {
      title: "Resource Name",
      dataIndex: "name",
      key: "name",
      // sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <Popconfirm
          title={`Are you sure you want to ${
            status === "ENABLED" ? "disable" : "enable"
          } this resource?`}
          onConfirm={() =>
            handleStatusChange(
              record.id,
              status === "ENABLED" ? "DISABLED" : "ENABLED"
            )
          }
          okText="Yes"
          cancelText="No"
        >
          <Tag
            color={status === "ENABLED" ? "green" : "red"}
            style={{ cursor: "pointer" }}
            loading={loadingResourceId === record.id}
          >
            {status || "ENABLED"}
          </Tag>
        </Popconfirm>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditResource(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this resource?"
            onConfirm={() => handleDeleteResource(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={loadingResourceId === record.id}
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
            Resource Management
          </h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddResource}
            size="large"
          >
            Add Resource
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
            dataSource={resources}
            loading={tableLoading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showQuickJumper: true,
            }}
            scroll={{ x: 600 }}
          />
        </div>

        <Modal
          title={editingResource ? "Edit Resource" : "Add New Resource"}
          open={isModalVisible}
          onCancel={handleModalCancel}
          footer={null}
          width={500}
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
                label="Resource Name"
                name="name"
                rules={[
                  { required: true, message: "Please enter resource name!" },
                  {
                    min: 2,
                    message: "Resource name must be at least 2 characters!",
                  },
                ]}
              >
                <Input placeholder="Enter resource name" />
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
                    ? editingResource
                      ? "Updating..."
                      : "Creating..."
                    : editingResource
                    ? "Update Resource"
                    : "Create Resource"}
                </Button>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    </Box>
  );
};

export default ResourceManagement;
