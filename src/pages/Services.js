import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, message, Popconfirm } from "antd";
import axios from "axios";
import { Box, Alert, Typography } from "@mui/material";
import { BACKEND_URL } from "../assets/constants";

const Services = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingServiceId, setLoadingServiceId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    status: "ENABLED",
  });

  const token = localStorage.getItem("token");
  const orgId = localStorage.getItem("selectedOrgId");

  const fetchServices = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/clientadmin/serviceManagement/getServices?orgId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(res);
      setServices(res.data.data);
    } catch (err) {
      message.error("Failed to fetch services");
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAdd = async () => {
    const { name, description, price, status } = formData;
    if (!name.trim() || !price.trim()) {
      message.warning("Name and Price are required");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${BACKEND_URL}/clientadmin/serviceManagement/createService`,
        {
          serviceName: name,
          desc: description,
          price: price,
          orgId: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Service added successfully");
      setIsModalVisible(false);
      setFormData({ name: "", description: "", price: "", status: "ENABLED" });
      setErrorMsg("");
      setSuccessMsg("Service added successfully");
      fetchServices();
    } catch (err) {
      setErrorMsg("Failed to add service");
      setSuccessMsg("");
      message.error("Failed to add service");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setLoadingServiceId(id);
      await axios.patch(
        `${BACKEND_URL}/clientadmin/serviceManagement/updateServiceStatus?id=${id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Status updated");
      setErrorMsg("");
      setSuccessMsg("Status updated successfully");
      fetchServices();
    } catch (err) {
      setErrorMsg("Failed to update status");
      setSuccessMsg("");
      message.error("Failed to update status");
    } finally {
      setLoadingServiceId(null);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(to right, #e6f0ff, #f8fbff)",
      }}
    >
      <div style={{ padding: 24 }}>
        <Typography
          variant="h4"
          sx={{ color: "#0047ab", fontWeight: "bold", mb: 4 }}
        >
          Service Management
        </Typography>
        <Button
          type="primary"
          onClick={() => setIsModalVisible(true)}
          style={{ marginBottom: 16 }}
        >
          Add Service
        </Button>

        {errorMsg && (
          <Alert sx={{ mb: 2 }} severity="error">
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert sx={{ mb: 2 }} severity="success">
            {successMsg}
          </Alert>
        )}

        <table className="table-fixed w-full text-sm text-left">
          <thead className="bg-blue-100 text-blue-900 font-semibold">
            <tr>
              <th className="w-24 px-4 py-2 border-b">ID</th>
              <th className="w-40 px-4 py-2 border-b">Name</th>
              <th className="w-24 px-4 py-2 border-b">Price</th>
              <th className="w-64 px-4 py-2 border-b">Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(services) &&
              services.map((service) => (
                <tr key={service.id} className="border-t">
                  <td className="px-4 py-2">{service.portal_id}</td>
                  <td className="px-4 py-2">{service.name}</td>
                  <td className="px-4 py-2">₹{service.price}</td>
                  <td className="px-4 py-2">{service.description}</td>
                </tr>
              ))}
          </tbody>
        </table>

        <Modal
          title="Add New Service"
          open={isModalVisible}
          onCancel={() => setIsModalVisible(false)}
          onOk={handleAdd}
          confirmLoading={loading}
          width={600} // 👈 increase modal width here
        >
          <Input
            placeholder="Service Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            style={{ marginBottom: 10 }}
          />
          <Input
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            style={{ marginBottom: 10 }}
          />
          <Input
            placeholder="Price"
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, price: e.target.value }))
            }
            style={{ marginBottom: 10 }}
          />
        </Modal>
      </div>
    </Box>
  );
};

export default Services;
