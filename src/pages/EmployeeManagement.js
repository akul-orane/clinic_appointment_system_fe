import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  Alert,
} from "@mui/material";
import Sidebar from "../components/SideBar";
import { Tabs, message } from "antd";
import { BACKEND_URL } from "../assets/constants";

const { TabPane } = Tabs;

const UserManagement = () => {
  const [formData, setFormData] = useState({
    roleId: "",
    email: "",
    first_name: "",
    last_name: "",
    gender: "",
    dob: "",
    address: "",
    emergency_contact: "",
    password: "",
    phone: "",
    login_id: "",
  });

  const [errors, setErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsgNew, setSuccessMsgNew] = useState("");
  const [errorMsgNew, setErrorMsgNew] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rowLoadingStates, setRowLoadingStates] = useState({});

  const [roles, setRoles] = useState([]);
  const orgId = localStorage.getItem("selectedOrgId");
  const token = localStorage.getItem("token");
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_URL}/clientAdmin/userMgmt/getRoles`,
          {
            params: {
              orgId: orgId,
            },

            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("Role Response>>> ,", response.data.response);
        setRoles(response.data.response); // assumes response is an array like [{ id: "admin", name: "Admin" }]
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  const validate = () => {
    const newErrors = {};
    if (!formData.first_name) newErrors.first_name = "First Name is required";
    if (!formData.roleId) newErrors.roleId = "Role is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    if (!formData.phone) newErrors.phone = "Phone is required";
    else if (formData.phone.length !== 10)
      newErrors.phone = "Phone must be 10 digits";

    if (!formData.login_id) newErrors.login_id = "Login ID is required";
    if (!formData.password) newErrors.password = "Password is required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    validate();
    const isValid = validate();
    if (!isValid) {
      setIsSubmitting(false);
      return;
    }

    try {
      const orgId = localStorage.getItem("selectedOrgId");
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BACKEND_URL}/clientAdmin/userMgmt/createEmployee`,
        {
          roleId: formData.roleId,
          emailId: formData.email,
          firstName: formData.first_name,
          lastName: formData.last_name,
          DOB: new Date(formData.dob).toISOString(),
          gender: formData.gender,
          address: formData.address,
          emergencyContact: formData.emergency_contact,
          password: formData.password,
          phone: formData.phone,
          login_id: formData.login_id,
          orgId: orgId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status == 400) {
        console.log("Invalid dataaa");
        console.log(response);
      }

      if (response.status === 201 || response.status === 200) {
        setFormData({
          roleId: "",
          email: "",
          first_name: "",
          last_name: "",
          gender: "",
          dob: "",
          address: "",
          emergency_contact: "",
          password: "",
          phone: "",
          login_id: "",
        });

        setErrors({});
        setErrorMsg("");
        setIsSubmitting(false);
        setSuccessMsg("Employee created successfully.");
        message.success("Employee added successfully.");
      } else {
        message.error("Failed to add role.");
      }
    } catch (error) {
      setSuccessMsg("");
      if (error.response) {
        setIsSubmitting(false);
        setErrorMsg(error.response.data.message);
        //console.log("VALIDATION ERROR:", error.response.data);
      }
      console.error("API Error:", error);

      message.error(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    setErrorMsgNew("");
    setSuccessMsgNew("");
    setRowLoadingStates((prev) => ({ ...prev, [userId]: true }));
    try {
      await axios.put(
        `${BACKEND_URL}/clientAdmin/userMgmt/updateUserRole`,
        {
          userId, // WHO to update
          newRoleId, // WHAT role to assign
          orgId: orgId, // Optional, if your backend requires it
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchEmployeeDetails(); // refresh UI
      setSuccessMsgNew("Role Updated");
    } catch (error) {
      console.error("Role update failed:", error);
      setErrorMsgNew("Failed to update role");
    } finally {
      setRowLoadingStates((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const fetchEmployeeDetails = async () => {
    try {
      const orgId = localStorage.getItem("selectedOrgId");
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/clientAdmin/userMgmt/getEmployees?orgId=${orgId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Employee resposne>>>", response.data.response);
      if (response.status === 200) {
        setUsers(response.data.response || []);
      } else {
        message.error("Failed to fetch roles.");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      message.error("Something went wrong while fetching roles.");
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", background: "#f4f9ff" }}>
      <div className="flex-1 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-6">
          Employee Management
        </h1>

        <Tabs
          defaultActiveKey="1"
          onChange={(activeKey) => {
            if (activeKey === "2") {
              setErrorMsgNew("");
              setSuccessMsgNew("");
              fetchEmployeeDetails();
            }
            if (activeKey == "1") {
              setErrorMsg("");
              setSuccessMsg("");
            }
          }}
        >
          <TabPane tab="Create Employee" key="1">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow max-w-5xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="First Name *"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={!!errors.first_name}
                  helperText={errors.first_name}
                  fullWidth
                />

                <TextField
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  //fullWidth
                />
                <div className="flex flex-row gap-4">
                  <TextField
                    select
                    label="Role *"
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    error={!!errors.roleId}
                    helperText={errors.roleId}
                    //fullWidth
                    sx={{ width: 225 }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    label="Gender *"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    error={!!errors.gender}
                    helperText={errors.gender}
                    //fullWidth
                    sx={{ width: 225 }}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </div>

                <TextField
                  label="Email *"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  fullWidth
                />

                <TextField
                  label="Phone *"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  fullWidth
                />

                <TextField
                  type="date"
                  label="Date of Birth"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />

                <TextField
                  label="Login ID *"
                  name="login_id"
                  value={formData.login_id}
                  onChange={handleChange}
                  error={!!errors.login_id}
                  helperText={errors.login_id}
                  fullWidth
                />

                <TextField
                  label="Password *"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  fullWidth
                />
                <TextField
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  fullWidth
                />
                <TextField
                  label="Emergency Contact"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleChange}
                  fullWidth
                />
              </div>
              {errorMsg && (
                <Alert sx={{ mb: 2, mt: 2 }} severity="error">
                  {errorMsg}
                </Alert>
              )}
              {successMsg && (
                <Alert sx={{ mb: 2, mt: 2 }} severity="success">
                  {successMsg}
                </Alert>
              )}

              <div className="mt-6">
                <Button
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Saving..." : "Save User"}
                </Button>
              </div>
            </div>
          </TabPane>

          <TabPane tab="Employee Listing" key="2">
            {errorMsgNew && (
              <Alert sx={{ mb: 2, mt: 2 }} severity="error">
                {errorMsgNew}
              </Alert>
            )}
            {successMsgNew && (
              <Alert sx={{ mb: 2, mt: 2 }} severity="success">
                {successMsgNew}
              </Alert>
            )}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
              <table className="table-fixed w-full text-sm text-left">
                <thead className="bg-blue-100 text-blue-900 font-semibold">
                  <tr>
                    <th className="w-24 px-4 py-2 border-b">Id</th>
                    <th className="w-40 px-4 py-2 border-b">Name</th>
                    <th className="w-60 px-4 py-2 border-b">Email</th>
                    <th className="w-36 px-4 py-2 border-b">Phone</th>
                    <th className="w-48 px-4 py-2 border-b">Login ID</th>
                    <th className="w-48 px-4 py-2 border-b">Change Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{user.portalid}</td>
                      <td className="px-4 py-2">{user.first_name}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2">{user.phone}</td>
                      <td className="px-4 py-2">
                        {user.users?.login_id || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <TextField
                          select
                          size="small"
                          value={
                            user.users?.user_organizations?.[0]?.user_roles?.[0]
                              ?.roles?.id || ""
                          }
                          onChange={(e) => {
                            handleRoleChange(user.userid, e.target.value);
                            console.log(
                              user.users?.user_organizations?.[0]
                                ?.user_roles?.[0]?.roles?.id || ""
                            );
                          }}
                          disabled={rowLoadingStates[user.portalid]}
                          sx={{ minWidth: 120 }}
                        >
                          {roles.map((role) => (
                            <MenuItem key={role.id} value={role.id}>
                              {role.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </Box>
  );
};

export default UserManagement;
