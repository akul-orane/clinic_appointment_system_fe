import React, { useEffect, useState } from "react";
import { FaChartBar, FaUser, FaBars, FaChevronLeft } from "react-icons/fa";
import { useAuth } from "../layouts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [tabs, setTabs] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const storedOrgs = JSON.parse(
      localStorage.getItem("organizations") || "[]"
    );
    const storedSelected = localStorage.getItem("selectedOrganizationId");

    setOrganizations(storedOrgs);
    const selected = storedSelected || storedOrgs[0]?.organizationId;
    setSelectedOrgId(selected);

    if (selected) {
      const selectedOrg = storedOrgs.find(
        (org) => org.organizationId === selected
      );
      const roleTabs = selectedOrg?.roles?.[0]?.tabs || [];
      const validTabs = roleTabs.filter((tab) => tab.is_valid);
      setTabs(validTabs);
    }
  }, []);

  const handleOrgChange = (e) => {
    const newOrgId = e.target.value;
    setSelectedOrgId(newOrgId);
    localStorage.setItem("selectedOrganizationId", newOrgId);

    const selectedOrg = organizations.find(
      (org) => org.organizationId === newOrgId
    );
    const roleTabs = selectedOrg?.roles?.[0]?.tabs || [];
    const validTabs = roleTabs.filter((tab) => tab.is_valid);
    setTabs(validTabs);
  };

  return (
    <aside
      className={`h-screen bg-gradient-to-b shadow-xl border-r border-gray-200 text-white transition-all duration-300 flex ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex flex-col flex-1 overflow-hidden rounded-lg bg-blue-900 ${
          collapsed ? "m-1" : "m-4"
        }`}
      >
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-blue-500">
          {!collapsed && (
            <h2 className="text-2xl font-extrabold tracking-widest uppercase">
              Arogi
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-full bg-white text-blue-700 hover:bg-blue-200 transition"
          >
            {collapsed ? <FaBars /> : <FaChevronLeft />}
          </button>
        </div>

        {/* Scrollable Middle Section */}
        <div className="flex-1 overflow-y-auto">
          {!collapsed && (
            <div className="p-4 border-b border-blue-500">
              <label className="text-gray-200 text-sm block mb-1">
                Select Organization
              </label>
              <select
                value={selectedOrgId}
                onChange={handleOrgChange}
                className="w-full p-2 rounded bg-white text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              >
                {organizations.map((org) => (
                  <option key={org.organizationId} value={org.organizationId}>
                    {org.organizationName || org.shortorgname}
                  </option>
                ))}
              </select>
            </div>
          )}

          <ul className="p-4 space-y-3">
            {tabs.map((tab) => (
              <li
                key={tab.tab_id}
                onClick={() => navigate(`${tab.tab_path}`)}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 cursor-pointer ${
                  location.pathname === tab.tab_path
                    ? "bg-white text-blue-800 shadow-inner"
                    : "hover:bg-blue-500 hover:shadow-md"
                }`}
              >
                <span className="p-2 rounded-full bg-white text-blue-700">
                  <FaChartBar />
                </span>
                {!collapsed && (
                  <span className="font-semibold">{tab.tab_name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Logout - Fixed Bottom */}
        <div className="p-4 border-t border-blue-500 bg-gradient-to-b bg-blue-900">
          <div
            onClick={logout}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-500 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <span className="p-2 rounded-full bg-white text-red-600">
              <FaUser />
            </span>
            {!collapsed && <span className="font-semibold">Logout</span>}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
