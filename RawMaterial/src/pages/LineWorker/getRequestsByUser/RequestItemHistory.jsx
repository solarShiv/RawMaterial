import React, { useEffect, useState } from "react";
import Api from '../../../auth/Api';

const RequestItemHistory = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch History
  const fetchHistory = async () => {
    try {
      const res = await Api.get(`/line-worker/getRequestsByUser`);
      console.log("History response", res);

      const list = res?.data?.data || [];
      setData(list);
      setFilteredData(list);
    } catch (err) {
      console.log("Error fetching history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Format Date
  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Status Badge
  const statusBadge = (approved, declined) => {
    if (approved)
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-green-600 text-white">
          Approved
        </span>
      );

    if (declined)
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-red-600 text-white">
          Declined
        </span>
      );

    return (
      <span className="px-3 py-1 text-xs rounded-full bg-yellow-400 text-gray-900">
        Pending
      </span>
    );
  };

  // SEARCH Filter
  useEffect(() => {
    if (!Array.isArray(data)) return;

    const s = search.toLowerCase();

    const result = data.filter((item) => {
      const names =
        item.rawMaterialRequested
          ?.map((m) => m.rawMaterialName.toLowerCase())
          .join(" ") || "";

      const date = formatDate(item.requestedAt).toLowerCase();

      return names.includes(s) || date.includes(s);
    });

    setFilteredData(result);
  }, [search, data]);

  if (loading)
    return (
      <h1 className="text-center mt-10 text-xl font-semibold">Loading...</h1>
    );

  return (
    <div className="w-full min-h-screen p-4 md:p-6">
      {/* Title */}
      <div className="flex flex-col items-center mb-6 md:mb-8">

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by material or date..."
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="w-full space-y-4">
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div
              key={item.id}
              className="border p-5 rounded-xl shadow bg-white hover:shadow-lg transition"
            >
              {/* Materials */}
              <div className="space-y-2 mb-3">
                {item.rawMaterialRequested.map((mat, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm border-b pb-1"
                  >
                    <span className="font-medium">{mat.rawMaterialName}</span>
                    <span>
                      {mat.quantity} {mat.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Date + Material Given */}
              <div className="flex justify-between items-center text-sm mt-4">
                <span className="text-gray-600">
                  Requested At: <b>{formatDate(item.requestedAt)}</b>
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs ${
                    item.materialGiven
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {item.materialGiven ? "Material Given" : "Not Given"}
                </span>
              </div>

              {/* Approval Status */}
              <div className="mt-3">{statusBadge(item.approved, item.declined)}</div>
            </div>
          ))
        ) : (
          <h1 className="text-center text-gray-500 mt-10 text-lg">
            No matching records found
          </h1>
        )}
      </div>
    </div>
  );
};

export default RequestItemHistory;
