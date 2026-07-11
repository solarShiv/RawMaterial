import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";
import * as XLSX from "xlsx"; // ← new import

const Installation = () => {
  // Dropdown states
  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [systemList, setSystemList] = useState([]);
  const [selectedSystem, setSelectedSystem] = useState("");
  const [pumpData, setPumpData] = useState([]);
  const [selectedPump, setSelectedPump] = useState("");
  const [loadingPumpData, setLoadingPumpData] = useState(false);
      
  // Shortage states
  const [shortageValue, setShortageValue] = useState(200);
  const [shortageData, setShortageData] = useState(null);
  const [loadingShortage, setLoadingShortage] = useState(false);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await Api.get("/purchase/warehouses");
        const formatted = res?.data?.data?.map((w) => ({
          label: w.warehouseName,
          value: w._id,
        }));
        setWarehouseList(formatted || []);
      } catch (err) {
        console.error("Error loading warehouses:", err);
        alert("Error loading warehouses");
      }
    };
    fetchWarehouses();
  }, []);

  // Fetch systems on mount
  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const res = await Api.get("/purchase/systems");
        const formatted = res?.data?.data?.map((s) => ({
          label: s.name,
          value: s._id || s.id,
        }));
        setSystemList(formatted || []);
      } catch (err) {
        console.error("Error loading systems:", err);
        alert("Error loading systems");
      }
    };
    fetchSystems();
  }, []);

  // Fetch pump data when selectedSystem changes
  useEffect(() => {
    const fetchPumpData = async () => {
      if (!selectedSystem) {
        setPumpData([]);
        setSelectedPump("");
        return;
      }

      setLoadingPumpData(true);
      try {
        const response = await Api.get(
          `/common/pump-data?systemId=${selectedSystem}`,
        );
        const data = response?.data?.data || [];
        setPumpData(data);
        setSelectedPump("");
      } catch (error) {
        console.error("Error fetching pump data:", error);
        alert(
          `Error: ${error?.response?.data?.message || "Failed to load pump data"}`,
        );
        setPumpData([]);
      } finally {
        setLoadingPumpData(false);
      }
    };

    fetchPumpData();
  }, [selectedSystem]);

  // Helper to format pump options
  const getPumpOptions = () => {
    return pumpData.map((pump) => ({
      label: pump.itemName || "Unnamed Pump",
      value: pump._id,
    }));
  };

  // Fetch shortage data when button is clicked
  const handleCheckShortage = async () => {
    if (!selectedWarehouse) {
      alert("Please select a warehouse");
      return;
    }
    if (!selectedSystem) {
      alert("Please select a system");
      return;
    }
    if (!selectedPump) {
      alert("Please select a pump");
      return;
    }
    if (!shortageValue || isNaN(shortageValue)) {
      alert("Please enter a valid numeric value");
      return;
    }

    setLoadingShortage(true);
    try {
      const response = await Api.get("/common/stock/shortage", {
        params: {
          v: shortageValue,
          wid: selectedWarehouse,
          sid: selectedSystem,
          pid: selectedPump,
        },
      });
      setShortageData(response?.data?.data || response?.data);
    } catch (error) {
      console.error("Error fetching shortage data:", error);
      alert(
        `Error: ${error?.response?.data?.message || "Failed to load shortage data"}`,
      );
      setShortageData(null);
    } finally {
      setLoadingShortage(false);
    }
  };

  // NEW: Export to Excel function
  const exportToExcel = () => {
    if (!shortageData) return;

    // Convert single object to array for consistent handling
    const dataToExport = Array.isArray(shortageData) ? shortageData : [shortageData];

    // Optional: remove fields like itemId if needed (uncomment if required)
    // const cleanedData = dataToExport.map(({ itemId, ...rest }) => rest);
    // const worksheet = XLSX.utils.json_to_sheet(cleanedData);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shortage Data");
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
    XLSX.writeFile(workbook, `shortage_${timestamp}.xlsx`);
  };

  return (
    <div className="w-full p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Installation Shortage Calculation
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filter Stock
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {/* Warehouse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Warehouse *
            </label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition duration-150 ease-in-out bg-white
                hover:border-gray-400 cursor-pointer text-sm sm:text-base"
            >
              <option value="">-- Select Warehouse --</option>
              {warehouseList.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          {/* System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select System *
            </label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg 
                focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                transition duration-150 ease-in-out bg-white
                hover:border-gray-400 cursor-pointer text-sm sm:text-base"
            >
              <option value="">-- Select System --</option>
              {systemList.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {selectedSystem && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Pump
              </label>
              {loadingPumpData ? (
                <p className="text-sm text-gray-500">Loading pumps...</p>
              ) : pumpData.length > 0 ? (
                <select
                  value={selectedPump}
                  onChange={(e) => setSelectedPump(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg 
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  transition duration-150 ease-in-out bg-white
                  hover:border-gray-400 cursor-pointer text-sm sm:text-base"
                >
                  <option value="">-- Select Pump --</option>
                  {getPumpOptions().map((pump) => (
                    <option key={pump.value} value={pump.value}>
                      {pump.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-gray-500">
                  No pumps available for this system.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Shortage Check Section */}
        {selectedWarehouse && selectedSystem && selectedPump && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-md font-semibold text-gray-800 mb-4">
              Check Stock Shortage
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value (v) *
                </label>
                <input
                  type="number"
                  value={shortageValue}
                  onChange={(e) => setShortageValue(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg 
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    transition duration-150 ease-in-out bg-white
                    hover:border-gray-400 text-sm sm:text-base"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCheckShortage}
                  disabled={loadingShortage}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
                    text-white font-medium rounded-lg shadow-sm 
                    transition duration-150 ease-in-out
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingShortage ? "Checking..." : "Check Shortage"}
                </button>
              </div>
            </div>

            {/* Shortage Result Display - Mini Cards */}
            {shortageData && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">
                    Shortage Result:
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={exportToExcel}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Export to Excel
                    </button>
                    <button
                      onClick={() => setShortageData(null)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Array.isArray(shortageData) ? (
                    shortageData.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition"
                      >
                        {Object.entries(item)
                          .filter(([key]) => key !== "itemId")
                          .map(([key, value]) => (
                            <div key={key} className="mb-2 last:mb-0">
                              <span className="text-xs font-medium text-gray-500 uppercase block">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-sm text-gray-900 break-words">
                                {value !== null && value !== undefined
                                  ? String(value)
                                  : "-"}
                              </span>
                            </div>
                          ))}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:col-span-2 lg:col-span-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.entries(shortageData)
                          .filter(([key]) => key !== "itemId")
                          .map(([key, value]) => (
                            <div
                              key={key}
                              className="border-b border-gray-100 pb-2 last:border-0"
                            >
                              <span className="text-xs font-medium text-gray-500 uppercase block">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-sm text-gray-900 break-words">
                                {value !== null && value !== undefined
                                  ? String(value)
                                  : "-"}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Installation;