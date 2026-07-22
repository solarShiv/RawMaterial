import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../../../../auth/Api";
import axios from "axios";

const ReceivedPurchaseStock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { poData } = location?.state || {};
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [itemInputs, setItemInputs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [fetchVehicle, setFetchVehicle] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedVehicleNo, setSelectedVehicleNo] = useState("");
  const [userWarehouseId, setUserWarehouseId] = useState(null);

  // Search state
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const vehicleSearchRef = useRef(null);

  // Warehouse to Vehicle Warehouse mapping
  const WAREHOUSE_VEHICLE_MAP = {
    "697b06b52da83d53d0e30731": "p891225a-af11-11ef-a344-1a2cd4d9c0d8",
    "67446a8b27dae6f7f4d985dd": "b691221b-af10-11ef-a344-1a2cd4d9c0d1"
  };

  // Target warehouses that require vehicle selection
  const TARGET_WAREHOUSE_IDS = Object.keys(WAREHOUSE_VEHICLE_MAP);

  // Get the vehicle warehouse ID based on user's warehouse
  const getVehicleWarehouseId = (warehouseId) => {
    return WAREHOUSE_VEHICLE_MAP[warehouseId] || null;
  };

  // Fetch vehicles from a specific warehouse
  async function fetchVehiclesForWarehouse(vehicleWarehouseId) {
    try {
      const response = await fetch(
        `https://logistics.umanerp.com/api/vehicleIN/getVehicleSummary?workLocation=${vehicleWarehouseId}`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  }

  // Fetch vehicles based on user's warehouse
  async function fetchVehicles() {
    try {
      if (!userWarehouseId) {
        console.log("No warehouse ID available");
        return;
      }

      const vehicleWarehouseId = getVehicleWarehouseId(userWarehouseId);
      
      if (!vehicleWarehouseId) {
        console.log("No vehicle warehouse mapping found for:", userWarehouseId);
        setFetchVehicle([]);
        return;
      }

      const vehicles = await fetchVehiclesForWarehouse(vehicleWarehouseId);
      console.log("Fetched vehicles for warehouse:", vehicleWarehouseId, vehicles);
      setFetchVehicle(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setFetchVehicle([]);
    }
  }

  // Get warehouse ID from logged-in user data
  useEffect(() => {
    const getWarehouseId = () => {
      // Option 1: From localStorage
      const storedWarehouse = localStorage.getItem('warehouseId');
      if (storedWarehouse) return storedWarehouse;
      
      // Option 2: From sessionStorage
      const sessionWarehouse = sessionStorage.getItem('warehouseId');
      if (sessionWarehouse) return sessionWarehouse;
      
      // Option 3: From user object in localStorage
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.warehouseId) return user.warehouseId;
          if (user.warehouse?.id) return user.warehouse.id;
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
      
      return null;
    };
    
    const warehouseId = getWarehouseId();
    setUserWarehouseId(warehouseId);
    console.log("User warehouse ID:", warehouseId);
  }, []);

  // Fetch vehicles whenever userWarehouseId changes
  useEffect(() => {
    if (userWarehouseId && TARGET_WAREHOUSE_IDS.includes(userWarehouseId)) {
      fetchVehicles();
    } else {
      setFetchVehicle([]);
    }
  }, [userWarehouseId]);

  // Initialize items when poData changes
  useEffect(() => {
    if (poData?.items) {
      const pendingItems = poData.items.filter((item) => {
        const orderedQty = parseFloat(item.quantity) || 0;
        const receivedQty = parseFloat(item.receivedQty) || 0;
        return orderedQty > receivedQty;
      });

      setFilteredItems(pendingItems);

      const initial = pendingItems.map(() => {
        return {
          receivedQty: "",
          goodQty: "",
          damagedQty: "0",
          remarks: "",
        };
      });
      setItemInputs(initial);
    }
  }, [poData]);

  // Handle click outside vehicle dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (vehicleSearchRef.current && !vehicleSearchRef.current.contains(event.target)) {
        setIsVehicleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter vehicles based on search term
  const filteredVehicles = fetchVehicle.filter((vehicle) => {
    const searchLower = vehicleSearchTerm.toLowerCase();
    return (
      vehicle.vehicleNo?.toLowerCase().includes(searchLower) ||
      vehicle.partyName?.toLowerCase().includes(searchLower) ||
      vehicle.vehicleId?.toString().toLowerCase().includes(searchLower)
    );
  });

  const handleVehicleSelect = (vehicleId, vehicleNo, partyName) => {
    setSelectedVehicle(vehicleId);
    setSelectedVehicleNo(vehicleNo);
    setVehicleSearchTerm(`${vehicleNo} - ${partyName}`);
    setIsVehicleDropdownOpen(false);
  };

  const handleVehicleSearchChange = (e) => {
    setVehicleSearchTerm(e.target.value);
    setIsVehicleDropdownOpen(true);
    if (e.target.value === "") {
      setSelectedVehicle("");
      setSelectedVehicleNo("");
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...itemInputs];
    updated[index][field] = value;

    // Auto-populate goodQty when receivedQty changes
    if (field === "receivedQty") {
      const prevReceived = parseFloat(updated[index].receivedQty || 0);
      const currentGood = parseFloat(updated[index].goodQty || 0);

      if (currentGood === 0 || currentGood === prevReceived) {
        updated[index].goodQty = value;
      }
    }

    setItemInputs(updated);
  };

  const handleBillFileUpload = (file) => {
    setBillFile(file);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (filteredItems.length === 0) {
        alert("No items to receive");
        setIsSubmitting(false);
        return;
      }

      const validationErrors = [];
      const itemsToProcess = [];

      filteredItems.forEach((item, i) => {
        const input = itemInputs[i];
        const orderedQty = parseFloat(item.quantity) || 0;
        const alreadyReceived = parseFloat(item.receivedQty) || 0;
        const remainingQty = orderedQty - alreadyReceived;

        const receivedQty = parseFloat(input.receivedQty) || 0;
        const goodQty = parseFloat(input.goodQty) || 0;
        const damagedQty = parseFloat(input.damagedQty) || 0;

        if (receivedQty <= 0) {
          console.log(`Skipping ${item.itemName} - no quantity received in this batch`);
          return;
        }

        if (receivedQty > remainingQty) {
          validationErrors.push(
            `Received quantity for ${item.itemName} cannot exceed remaining quantity (${remainingQty})`
          );
        }

        if (goodQty + damagedQty !== receivedQty) {
          validationErrors.push(
            `For ${item.itemName}, Good Qty + Damaged Qty must equal Received Qty`
          );
        }

        itemsToProcess.push({
          index: i,
          item: item,
          input: input
        });
      });

      if (validationErrors.length > 0) {
        alert(validationErrors.join("\n"));
        setIsSubmitting(false);
        return;
      }

      if (itemsToProcess.length === 0) {
        alert("Please enter received quantity for at least one item");
        setIsSubmitting(false);
        return;
      }

      // Validate vehicle selection for target warehouses
      if (TARGET_WAREHOUSE_IDS.includes(userWarehouseId) && !selectedVehicle) {
        alert("Please select a vehicle number");
        setIsSubmitting(false);
        return;
      }

      if (!invoiceNumber.trim()) {
        alert("Please enter invoice number");
        setIsSubmitting(false);
        return;
      }

      const itemsToSend = itemsToProcess.map(({ item, input }) => {
        const goodQty = parseFloat(input.goodQty) || 0;
        const damagedQty = parseFloat(input.damagedQty) || 0;

        return {
          purchaseOrderItemId: item.id,
          itemId: item.itemId,
          itemSource: item.itemSource,
          itemName: item.itemName,
          goodQty: goodQty,
          damagedQty: damagedQty,
          remarks: input.remarks || "",
        };
      });

      const formData = new FormData();

      formData.append("purchaseOrderId", poData.id);
      formData.append("items", JSON.stringify(itemsToSend));
      formData.append("invoiceNumber", invoiceNumber);
      
      // Only append vehicle data if warehouse matches
      if (TARGET_WAREHOUSE_IDS.includes(userWarehouseId)) {
        formData.append("vehicleId", selectedVehicle);
        formData.append("vehicleNumber", selectedVehicleNo);
        // Optionally add the vehicle warehouse ID if needed by the backend
        const vehicleWarehouseId = getVehicleWarehouseId(userWarehouseId);
        if (vehicleWarehouseId) {
          formData.append("vehicleWarehouseId", vehicleWarehouseId);
        }
      }

      if (billFile) {
        formData.append("billFile", billFile);
      }

      const response = await Api.post(
        "/store-keeper/purchaseOrder/receive", 
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(`Purchase stock received successfully!`);
      navigate(-1);
    } catch (error) {
      console.error("Submission error:", error);
      alert(error?.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const calculateRemainingQty = (item) => {
    const orderedQty = parseFloat(item.quantity) || 0;
    const receivedQty = parseFloat(item.receivedQty) || 0;
    return orderedQty - receivedQty;
  };

  const getPendingItemsCount = () => {
    if (!poData?.items) return 0;
    return poData.items.filter((item) => {
      const orderedQty = parseFloat(item.quantity) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 0;
      return orderedQty > receivedQty;
    }).length;
  };

  const getFullyReceivedItemsCount = () => {
    if (!poData?.items) return 0;
    return poData.items.filter((item) => {
      const orderedQty = parseFloat(item.quantity) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 0;
      return orderedQty <= receivedQty;
    }).length;
  };

  // Check if vehicle selection should be shown
  const shouldShowVehicleSelection = userWarehouseId && TARGET_WAREHOUSE_IDS.includes(userWarehouseId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4 px-3 sm:py-8 sm:px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Receiving Purchase Stock
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm sm:text-base">
                  Purchase Order: #{poData?.poNumber || "N/A"}
                </p>
                {getFullyReceivedItemsCount() > 0 && (
                  <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm">
                    ✓ {getFullyReceivedItemsCount()} item
                    {getFullyReceivedItemsCount() !== 1 ? "s" : ""} fully
                    received
                  </span>
                )}
                <span className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full text-sm">
                  ⏳ {getPendingItemsCount()} item
                  {getPendingItemsCount() !== 1 ? "s" : ""} pending
                </span>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number from supplier"
                maxLength={50}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Reference number from the supplier's invoice
              </p>
            </div>

            {/* Conditional Vehicle Selection - Only show for specific warehouses */}
            {shouldShowVehicleSelection && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-20 overflow-visible relative" ref={vehicleSearchRef}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vehicle Number *
                </label>

                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 pr-10"
                    placeholder="Search by vehicle number or party name..."
                    value={vehicleSearchTerm}
                    onChange={handleVehicleSearchChange}
                    onFocus={() => setIsVehicleDropdownOpen(true)}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => {
                      setIsVehicleDropdownOpen(!isVehicleDropdownOpen);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isVehicleDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredVehicles.length > 0 ? (
                      filteredVehicles.map((vehicle) => (
                        <div
                          key={vehicle.vehicleId}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => handleVehicleSelect(
                            vehicle.vehicleId,
                            vehicle.vehicleNo,
                            vehicle.partyName
                          )}
                        >
                          <div className="font-medium text-gray-800">
                            {vehicle.vehicleNo}
                          </div>
                          <div className="text-sm text-gray-500">
                            {vehicle.partyName}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-sm">
                        {fetchVehicle.length === 0 ? "No vehicles available for this warehouse" : "No matching vehicles found"}
                      </div>
                    )}
                  </div>
                )}

                {selectedVehicle && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ Vehicle selected: {vehicleSearchTerm}
                  </p>
                )}

                {fetchVehicle?.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total {fetchVehicle.length} vehicle(s) available
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Bill/Invoice Document
              </label>
              <div className="flex items-center gap-3">
                <label className="flex-1">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => handleBillFileUpload(e.target.files[0])}
                    />
                    <div className="text-gray-500">
                      <svg
                        className="mx-auto h-8 w-8 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm">
                        {billFile
                          ? billFile.name
                          : "Click to upload PDF or image"}
                      </p>
                      <p className="text-xs mt-1">
                        Max 10MB • Single file for entire order
                      </p>
                    </div>
                  </div>
                </label>
                {billFile && (
                  <button
                    type="button"
                    onClick={() => handleBillFileUpload(null)}
                    className="text-red-600 hover:text-red-800 p-2"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload the purchase bill or invoice document
              </p>
            </div>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg
              className="mx-auto h-12 w-12 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              All items already received
            </h3>
            <p className="mt-2 text-gray-600">
              All items in this purchase order have been fully received. No
              pending items to receive.
            </p>
            <button
              onClick={handleCancel}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              {filteredItems.map((item, index) => {
                const remainingQty = calculateRemainingQty(item);
                const orderedQty = parseFloat(item.quantity) || 0;
                const alreadyReceived = parseFloat(item.receivedQty) || 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
                  >
                    {/* Item Header */}
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-semibold text-gray-800 truncate">
                          {item.itemName}
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {item.modelNumber || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Ordered</p>
                          <p className="text-lg font-semibold text-blue-700">
                            {orderedQty}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Received</p>
                          <p className="text-lg font-semibold text-green-700">
                            {alreadyReceived}
                          </p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-500">Remaining</p>
                          <p className="text-lg font-semibold text-yellow-700">
                            {remainingQty}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received Qty *
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={itemInputs[index]?.receivedQty || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "receivedQty",
                                e.target.value
                              )
                            }
                            placeholder="Enter quantity"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Max: {remainingQty} (Leave 0 to skip this item)
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Good Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            value={itemInputs[index]?.goodQty || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "goodQty",
                                e.target.value
                              )
                            }
                            placeholder="Good condition"
                            disabled={!itemInputs[index]?.receivedQty}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Damaged Qty
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            value={itemInputs[index]?.damagedQty || ""}
                            onChange={(e) =>
                              handleInputChange(
                                index,
                                "damagedQty",
                                e.target.value
                              )
                            }
                            placeholder="Damaged items"
                            disabled={!itemInputs[index]?.receivedQty}
                          />
                        </div>
                      </div>

                      {parseFloat(itemInputs[index]?.receivedQty || 0) > 0 && (
                        <div
                          className={`p-2 rounded-lg text-sm ${(parseFloat(itemInputs[index].goodQty) || 0) +
                            (parseFloat(itemInputs[index].damagedQty) || 0) ===
                            (parseFloat(itemInputs[index].receivedQty) || 0)
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                            }`}
                        >
                          Good ({itemInputs[index].goodQty || 0}) + Damaged (
                          {itemInputs[index].damagedQty || 0}) ={" "}
                          {(parseFloat(itemInputs[index].goodQty) || 0) +
                            (parseFloat(itemInputs[index].damagedQty) || 0)}{" "}
                          | Received: {itemInputs[index].receivedQty}
                        </div>
                      )}

                      {!itemInputs[index]?.receivedQty && (
                        <div className="p-2 rounded-lg text-sm bg-gray-50 text-gray-600">
                          Enter a quantity above to receive this item, or leave empty to skip
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                          rows="2"
                          value={itemInputs[index]?.remarks || ""}
                          onChange={(e) =>
                            handleInputChange(index, "remarks", e.target.value)
                          }
                          placeholder="Any notes or comments..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-3 sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-yellow-400 text-dark rounded-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-500"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Submit Delivery"
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Only items with quantity entered will be received. You can make multiple deliveries.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceivedPurchaseStock;