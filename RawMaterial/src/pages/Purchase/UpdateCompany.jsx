import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";

const UpdateCompany = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await Api.get("/purchase/companies");
        setCompanies(res.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleCompanyChange = async (e) => {
    const id = e.target.value;
    setSelectedCompany(id);
    setIsEditable(false);
    if (!id) return;

    setDetailsLoading(true);
    try {
      const res = await Api.get(`/purchase/companies/${id}`);
      setCompanyDetails(res.data.data);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCompanyDetails({ ...companyDetails, [e.target.name]: e.target.value });
  };

  const handleUpdateSubmit = async () => {
    try {
      await Api.put(`/purchase/companies/${selectedCompany}`, companyDetails);
      alert("Company Updated Successfully");
      setIsEditable(false);
    } catch {
      alert("Error updating company");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">

        {/* COMPANY SELECT */}
        <div className="mb-6 max-w-md">
          <label className="block text-sm font-medium mb-2">Select Company</label>
          <select
            value={selectedCompany}
            onChange={handleCompanyChange}
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">-- Select Company --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
        </div>

        {detailsLoading && (
          <div className="py-6 text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto" />
          </div>
        )}

        {/* FORM */}
        {companyDetails && (
          <div className="bg-gray-50 p-6 rounded-lg border">

            {/* GRID → 3 PER ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {[
                ["name", "Company Name"],
                ["companyCode", "Company Code"],
                ["gstNumber", "GST Number"],
                ["contactNumber", "Contact Number"],
                ["alternateNumber", "Alternate Number"],
                ["email", "Email"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "Pincode"],
                ["country", "Country"],
                ["currency", "Currency"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1">
                    {label}
                  </label>
                  <input
                    name={key}
                    value={companyDetails[key] || ""}
                    onChange={handleInputChange}
                    disabled={!isEditable}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      isEditable
                        ? "bg-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* ADDRESS FULL WIDTH */}
            <div className="mt-6">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea
                name="address"
                value={companyDetails.address || ""}
                onChange={handleInputChange}
                disabled={!isEditable}
                rows="3"
                className={`w-full px-3 py-2 border rounded-lg ${
                  isEditable ? "bg-white" : "bg-gray-100 text-gray-600"
                }`}
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-6 flex gap-4">
              {!isEditable ? (
                <button
                  onClick={() => setIsEditable(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Edit
                </button>
              ) : (
                <>
                  <button
                    onClick={handleUpdateSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditable(false)}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCompany;
