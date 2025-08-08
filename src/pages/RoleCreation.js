// RoleManagement.js
import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Switch,
} from "antd";
import axios from "axios";
import { BACKEND_URL } from "../assets/constants";

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRoleData, setSelectedRoleData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [editingRole, setEditingRole] = useState(null);

  const orgId = localStorage.getItem("selectedOrgId");
  const token = localStorage.getItem("token");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRoles = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getRoles?orgId=${orgId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setRoles(response.data.response || []);
      } else {
        message.error("Failed to fetch roles.");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      message.error("Something went wrong while fetching roles.");
    }
  };

  const fetchAllTabsAndFeatureOfRole = async (roleId) => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getTabsAndFeaturesByRole?roleId=${roleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.status === 200) {
        setSelectedRoleData(response.data.data || []);
      } else {
        message.error("Failed to fetch role features.");
      }
    } catch (err) {
      console.error("Error fetching role features:", err);
      message.error("Something went wrong while fetching features.");
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleToggle = (tabId, featureId, newValue) => {
    const updated = selectedRoleData.map((tab) => {
      if (tab.tabId === tabId) {
        return {
          ...tab,
          features: tab.features.map((feature) =>
            feature.featureId === featureId
              ? { ...feature, isValid: newValue }
              : feature
          ),
        };
      }
      return tab;
    });
    setSelectedRoleData(updated);
  };

  const handleCreateRole = async (values) => {
    try {
      const orgId = localStorage.getItem("selectedOrgId");
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${BACKEND_URL}/clientAdmin/userMgmt/createRole`,
        {
          roleName: values.roleName,
          roleDesc: values.roleDescription,
          orgId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201 || response.status === 200) {
        message.success("Role added successfully.");
        form.resetFields();
        setModalVisible(false);
        setErrorMsg("");
        setSuccessMsg("Role created successfully.");
        fetchRoles(); // Refresh table
        setIsSubmitting(false);
        message.success("Role added successfully.");
      } else {
        setIsSubmitting(false);
        message.error("Failed to add role.");
      }
    } catch (error) {
      console.error("API Error:", error);
      setSuccessMsg("");
      setIsSubmitting(false);
      setErrorMsg("Please try again later or with other Role Name");
      message.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleSubmitRoleFeatureUpdates = async () => {
    try {
      const payload = {
        roleId: editingRole.id,
        tabFeatureMapping: selectedRoleData.map((tab) => ({
          tabId: tab.tabId,
          features: tab.features.map((feature) => ({
            featureId: feature.featureId,
            isValid: feature.isValid,
          })),
        })),
      };

      await axios.post(
        `${BACKEND_URL}/clientAdmin/userMgmt/updateTabAndFeatureAccess`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success("Permissions updated successfully");
      setEditModalVisible(false);
      setSelectedRoleData([]);
      setEditingRole(null);
      fetchRoles(); // Refresh roles after update
    } catch (error) {
      console.error("Error submitting features:", error);
      message.error("Failed to update role features");
    }
  };

  const tableData = selectedRoleData.flatMap((tab) =>
    tab.features.map((feature) => ({
      key: `${tab.tabId}-${feature.featureId}`,
      tabName: tab.tabName,
      featureName: feature.featureName,
      isValid: feature.isValid,
      tabId: tab.tabId,
      featureId: feature.featureId,
    }))
  );

  const roleColumns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Role Description",
      dataIndex: "description",
      key: "description",
      render: (text) => text || "—",
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <Button
          type="link"
          onClick={async () => {
            setEditingRole(record);
            await fetchAllTabsAndFeatureOfRole(record.id);
            setEditModalVisible(true);
          }}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Role Management</h1>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Create Role
        </Button>
      </div>

      {/* <Table
        columns={roleColumns}
        dataSource={roles}
        rowKey="id"
        bordered
        pagination={false}
      /> */}

      <div className="bg-white rounded-lg shadow">
        <Table
          columns={roleColumns}
          dataSource={roles}
          // loading={tableLoading}
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
        title="Create New Role"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setErrorMsg("");
          setSuccessMsg("");
        }}
        footer={null}
      >
        <div className="modal_outDiv">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateRole}
            autoComplete="off"
          >
            <Form.Item
              label="Role Name"
              name="roleName"
              rules={[{ required: true, message: "Role name is required" }]}
            >
              <Input placeholder="Enter role name" />
            </Form.Item>

            <Form.Item
              label="Role Description"
              name="roleDescription"
              rules={[
                { required: true, message: "Role description is required" },
              ]}
            >
              <Input placeholder="Enter role description" />
            </Form.Item>

            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {successMsg && (
              <Alert
                message={successMsg}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Save Role
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Modal
        title={`Edit Role: ${editingRole?.name}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        width={800}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleSubmitRoleFeatureUpdates}
          >
            Submit Changes
          </Button>,
        ]}
      >
        <Table
          columns={[
            {
              title: "Tab Name",
              dataIndex: "tabName",
              key: "tabName",
            },
            {
              title: "Feature Name",
              dataIndex: "featureName",
              key: "featureName",
            },
            {
              title: "Access",
              dataIndex: "isValid",
              key: "isValid",
              render: (_, record) => (
                <Switch
                  checked={record.isValid}
                  onChange={(checked) =>
                    handleToggle(record.tabId, record.featureId, checked)
                  }
                />
              ),
            },
          ]}
          dataSource={tableData}
          pagination={false}
          bordered
        />
      </Modal>
    </div>
  );
};

export default RoleManagement;
