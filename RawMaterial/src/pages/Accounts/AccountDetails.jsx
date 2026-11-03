import React, { useEffect, useState } from "react";
import Api from "../../auth/Api";

const AccountDetails = () => {
  const [accountDetails, setAccountDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        const response = await Api.get("/accounts-dept/vendors");
        setAccountDetails(response?.data?.data || []);
      } catch (err) {
        setError("Failed to fetch vendors");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, []);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 mt-8">

      {/* Loading */}
      {loading && (
        <div className="text-center text-blue-600 text-sm">
          Loading vendor data...
        </div>
      )}

      {/* Error */}
      {error && <div className="text-center text-red-500 text-sm">{error}</div>}

      {/* ================= MOBILE VIEW ================= */}
      <div className="grid gap-4 sm:hidden">
        {accountDetails.map((vendor, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-4 border">
            <div className="mb-2">
              <p className="text-sm text-gray-500">Vendor Name</p>
              <p className="font-medium">{vendor.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">GST Number</p>
                <p>{vendor.gstNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Contact</p>
                <p>{vendor.contactNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Person</p>
                <p>{vendor.accountHolder || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Bank Name</p>
                <p>{vendor.bankName || "-"}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden sm:block overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              {[
                "Vendor",
                "GST Number",
                "Contact No",
                "Account Holder Name",
                "Bank Name",
                "Account No",
                "IFSC",
              ].map((head) => (
                <th
                  key={head}
                  className="px-4 py-3 text-left text-sm font-semibold text-gray-600"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {accountDetails.map((vendor, index) => (
              <tr key={index} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-medium">{vendor.name}</td>
                <td className="px-4 py-3 text-sm">{vendor.gstNumber || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  {vendor.contactNumber || "-"}
                </td>
                <td className="px-4 py-3 text-sm">
                  {vendor.accountHolder || "-"}
                </td>
                <td className="px-4 py-3 text-sm">{vendor.bankName || "-"}</td>
                <td className="px-4 py-3 text-sm">
                  {vendor.accountNumber || "-"}
                </td>
                <td className="px-4 py-3 text-sm">{vendor.ifscCode || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountDetails;
