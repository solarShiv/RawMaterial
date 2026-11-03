import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const ActiveDeactivateVendor = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [updatingVendor, setUpdatingVendor] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [actionType, setActionType] = useState("");
  const [error, setError] = useState(null);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vendors, searchTerm, statusFilter, sortConfig]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await Api.get("/purchase/vendors/data");
      setVendors(res.data?.data || []);
    } catch (err) {
      setError("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER + SORT ================= */
  const applyFilters = () => {
    let data = [...vendors];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      data = data.filter(
        (v) =>
          v.name?.toLowerCase().includes(term) ||
          v.gstNumber?.toLowerCase().includes(term) ||
          v.state?.toLowerCase().includes(term) ||
          v.country?.toLowerCase().includes(term) ||
          v.address?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter((v) =>
        statusFilter === "active" ? v.isActive : !v.isActive
      );
    }

    data.sort((a, b) => {
      const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
      const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
      return sortConfig.direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

    setFilteredVendors(data);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  /* ================= STATUS UPDATE ================= */
  const handleStatusChange = (vendor, action) => {
    setSelectedVendor(vendor);
    setActionType(action);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = async () => {
    try {
      setUpdatingVendor(selectedVendor.id);
      const newStatus = actionType === "activate";
      await Api.put(`/common/update/${selectedVendor.id}/${newStatus}`);

      setVendors((prev) =>
        prev.map((v) =>
          v.id === selectedVendor.id ? { ...v, isActive: newStatus } : v
        )
      );
    } catch {
      alert("Failed to update status");
    } finally {
      setUpdatingVendor(null);
      setShowConfirmModal(false);
    }
  };

  const statusBadge = (active) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
        active
          ? "bg-green-100 text-green-700 border-green-200"
          : "bg-red-100 text-red-700 border-red-200"
      }`}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <ArrowPathIcon className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* ================= MODAL ================= */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-3">
              Confirm {actionType === "activate" ? "Activation" : "Deactivation"}
            </h2>
            <p className="mb-4 text-gray-600">{selectedVendor?.name}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className={`px-4 py-2 text-white rounded ${
                  actionType === "activate"
                    ? "bg-green-600"
                    : "bg-red-600"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN CARD ================= */}
      <div className="bg-white rounded-xl shadow-lg w-full">
        {/* HEADER */}
        <div className="p-6 border-b">

          {/* FILTERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor..."
                className="pl-10 w-full border rounded-md py-2"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-md py-2 px-3"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead className="bg-gray-50">
              <tr>
                {["name", "gstNumber", "state", "country"].map((key) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="px-6 py-3 text-left text-xs font-bold uppercase cursor-pointer"
                  >
                    <div className="flex items-center gap-1">
                      {key.replace(/([A-Z])/g, " $1")}
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{vendor.name}</p>
                    <p className="text-sm text-gray-500 break-words">
                      {vendor.address}
                    </p>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {vendor.gstNumber}
                  </td>
                  <td className="px-6 py-4">{vendor.state}</td>
                  <td className="px-6 py-4">{vendor.country}</td>
                  <td className="px-6 py-4">
                    {statusBadge(vendor.isActive)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        handleStatusChange(
                          vendor,
                          vendor.isActive ? "deactivate" : "activate"
                        )
                      }
                      disabled={updatingVendor === vendor.id}
                      className={`px-3 py-1 rounded text-white text-sm ${
                        vendor.isActive
                          ? "bg-red-600"
                          : "bg-green-600"
                      }`}
                    >
                      {vendor.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-gray-50 text-sm text-gray-600 flex justify-between">
          <span>
            Showing {filteredVendors.length} of {vendors.length}
          </span>
          <span>
            Active: {vendors.filter((v) => v.isActive).length} • Inactive:{" "}
            {vendors.filter((v) => !v.isActive).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActiveDeactivateVendor;
