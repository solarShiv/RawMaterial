import React, { useEffect, useState } from "react";
import Api from '../../../auth/Api';
import showData from "../../../utils/axios/getMethod";

const UserStock = () => {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch API Data
  const fetchData = async () => {
    try {
      const res = await showData("/line-worker/showUserItemStock")
      const list = res?.data || [];
      setData(list);
      setFiltered(list);
    } catch (err) {
      console.log("Error fetching stock", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    const result = data.filter((item) =>
      item.rawMaterialName.toLowerCase().includes(s)
    );
    setFiltered(result);
  }, [search, data]);

  if (loading) {
    return <h1 className="text-center mt-10 text-xl font-semibold">Loading...</h1>;
  }

  return (
    <div className="w-full min-h-screen p-4 md:p-8">

      {/* Search Bar */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search stock..."
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Stock List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length > 0 ? (
          filtered.map((item) => (
            <div
              key={item.rawMaterialId}
              className="border rounded-xl p-4 shadow bg-white hover:shadow-lg transition"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {item.rawMaterialName}
              </h2>

              <div className="mt-3 space-y-1 text-sm">
                <p>
                  <span className="font-medium">Quantity:</span> {item.quantity} {item.unit}
                </p>

                <p>
                  <span className="font-medium">Item Stock:</span>{" "}
                  {item.itemStock}
                </p>
              </div>
            </div>
          ))
        ) : (
          <h2 className="text-center text-gray-500 col-span-2 mt-6">
            No matching items found
          </h2>
        )}
      </div>
    </div>
  );
};

export default UserStock;
