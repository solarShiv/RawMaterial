import React, { useEffect, useState, useRef } from "react";
import Api from "../../../../auth/Api";

const ISSUE_TYPES = ["PERMANENT", "RETURNABLE"];

const SingleOut = () => {
  const [itemList, setItemList] = useState([]);
  const [uniqueItemList, setUniqueItemList] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemIssueTypes, setItemIssueTypes] = useState({});
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [lineWorkers, setLineWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherDepartment, setOtherDepartment] = useState("");
  const dropdownRef = useRef(null);

  // Find the "Others" worker from the list
  const othersWorker = lineWorkers.find(worker => 
    worker.name.toLowerCase().includes("others") || 
    (worker.role?.name || "").toLowerCase().includes("other department")
  );
  
  // Get the ID of the "Others" worker
  const OTHERS_ID = othersWorker?.id || "";

  useEffect(() => {
    const fetchItemList = async () => {
      setLoading(true);
      try {
        const res = await Api.get(
          "/store-keeper/getWarehouseRawMaterialList"
        );
        setItemList(res?.data?.data || []);
      } catch (err) {
        alert(err?.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchLineWorkers = async () => {
      try {
        const res = await Api.get("/store-keeper/getLineWorkerList");
        setLineWorkers(res?.data?.data || []);
      } catch (err) {
        alert(err?.response?.data?.message || err.message);
      }
    };

    fetchItemList();
    fetchLineWorkers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!itemList.length) return;

    const map = new Map();

    itemList.forEach((item) => {
      if (map.has(item.id)) {
        map.get(item.id).totalStock += item.stock;
      } else {
        map.set(item.id, {
          ...item,
          totalStock: item.stock,
        });
      }
    });

    const uniqueItems = [...map.values()];
    setUniqueItemList(uniqueItems);
  }, [itemList]);

  const filteredItems = uniqueItemList.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.code?.toLowerCase().includes(term) ||
      item.category?.toLowerCase().includes(term)
    );
  });

  const handleItemSelection = (item) => {
    const isSelected = selectedItems.some(selected => selected.id === item.id);
    
    if (isSelected) {
      // Remove item
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
      const newQuantities = { ...itemQuantities };
      delete newQuantities[item.id];
      setItemQuantities(newQuantities);
      const newIssueTypes = { ...itemIssueTypes };
      delete newIssueTypes[item.id];
      setItemIssueTypes(newIssueTypes);
    } else {
      // Add item
      setSelectedItems([
        ...selectedItems,
        {
          id: item.id,
          name: item.name,
          unit: item.unit,
          stock: item.totalStock,
          code: item.code,
          category: item.category
        }
      ]);
      setItemQuantities({
        ...itemQuantities,
        [item.id]: "1" // Default quantity
      });
      setItemIssueTypes({
        ...itemIssueTypes,
        [item.id]: "PERMANENT" // Default issue type
      });
    }
  };

  const handleQuantityChange = (itemId, quantity) => {
    if (quantity === "" || parseFloat(quantity) >= 0) {
      setItemQuantities({
        ...itemQuantities,
        [itemId]: quantity
      });
    }
  };

  const handleSetMaxQuantity = (itemId) => {
    const item = selectedItems.find(item => item.id === itemId);
    if (item) {
      setItemQuantities({
        ...itemQuantities,
        [itemId]: String(item.stock)
      });
    }
  };

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
    const newQuantities = { ...itemQuantities };
    delete newQuantities[itemId];
    setItemQuantities(newQuantities);
    const newIssueTypes = { ...itemIssueTypes };
    delete newIssueTypes[itemId];
    setItemIssueTypes(newIssueTypes);
  };

  const handleIssueTypeChange = (itemId, issueType) => {
    setItemIssueTypes({ ...itemIssueTypes, [itemId]: issueType });
  };

  const handleWorkerChange = (e) => {
    const value = e.target.value;
    setSelectedWorker(value);
    
    // Reset "other" fields when selecting a regular worker
    if (value !== OTHERS_ID) {
      setOtherName("");
      setOtherDepartment("");
      setErrors(prev => ({
        ...prev,
        otherName: undefined,
        otherDepartment: undefined
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (selectedItems.length === 0) {
      newErrors.selectedItems = "Please select at least one item";
    }

    selectedItems.forEach((item) => {
      const quantity = itemQuantities[item.id];
      const issueType = itemIssueTypes[item.id];
      
      if (!quantity || quantity.trim() === "") {
        newErrors[`quantity_${item.id}`] = "Quantity is required";
      } else if (parseFloat(quantity) <= 0) {
        newErrors[`quantity_${item.id}`] = "Quantity must be greater than 0";
      } else if (parseFloat(quantity) > item.stock) {
        newErrors[`quantity_${item.id}`] = `Maximum allowed: ${item.stock} ${item.unit}`;
      }

      if (!issueType || !ISSUE_TYPES.includes(issueType)) {
        newErrors[`issueType_${item.id}`] = "Issue type is required";
      }
    });

    if (!selectedWorker) {
      newErrors.selectedWorker = "Please select a line worker";
    }

    // Validate "other" fields when "Others" is selected
    if (selectedWorker === OTHERS_ID && othersWorker) {
      if (!otherName.trim()) {
        newErrors.otherName = "Name is required";
      }
      if (!otherDepartment.trim()) {
        newErrors.otherDepartment = "Department is required";
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        issuedTo: selectedWorker, // This will be the actual ID (e.g., "others-worker-id-123")
        rawMaterialIssued: selectedItems.map(item => ({
          rawMaterialId: item.id,
          quantity: String(itemQuantities[item.id]),
          unit: item.unit,
          issueType: itemIssueTypes[item.id] || "PERMANENT",
        })),
        remarks: remarks || undefined,
      };

      // Only add these fields when the "Others" worker is selected
      if (selectedWorker === OTHERS_ID && othersWorker) {
        payload.issuedToName = otherName;
        payload.department = otherDepartment;
      }

      console.log("FINAL PAYLOAD 👉", payload);

      await Api.post("/store-keeper/directItemIssue", payload);

      alert("Items Issued Successfully ✅");
      handleReset();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedItems([]);
    setItemQuantities({});
    setItemIssueTypes({});
    setSearchTerm("");
    setRemarks("");
    setErrors({});
    setSelectedWorker("");
    setOtherName("");
    setOtherDepartment("");
  };

  const renderSelectedBadges = () => {
    if (selectedItems.length === 0) {
      return (
        <div className="text-gray-500 italic text-sm">
          No items selected
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm"
          >
            <span className="mr-2">{item.name}</span>
            <span className="bg-blue-200 px-2 py-0.5 rounded text-xs">
              {itemQuantities[item.id] || 0} {item.unit}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveItem(item.id)}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Raw Material Out</h2>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading items...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* MULTI-SELECT DROPDOWN SECTION */}
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Select Items <span className="text-red-500">*</span>
            </label>
            
            <div className="relative" ref={dropdownRef}>
              {/* DROPDOWN TRIGGER */}
              <div
                className="border border-gray-300 rounded-lg px-3 py-2.5 cursor-pointer bg-white flex justify-between items-center hover:border-blue-500 transition"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="flex-1">
                  {selectedItems.length > 0 ? (
                    <span className="text-gray-700">
                      {selectedItems.length} item(s) selected
                    </span>
                  ) : (
                    <span className="text-gray-500">Click to select items...</span>
                  )}
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-gray-400 transform transition ${dropdownOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* DROPDOWN MENU */}
              {dropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                  {/* SEARCH INPUT */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search items..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-gray-400 absolute left-3 top-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* ITEMS LIST */}
                  <div className="overflow-y-auto max-h-64">
                    {filteredItems.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No items found
                      </div>
                    ) : (
                      filteredItems.map((item) => {
                        const isSelected = selectedItems.some(selected => selected.id === item.id);
                        const isOutOfStock = item.totalStock <= 0;

                        return (
                          <div
                            key={item.id}
                            className={`px-4 py-3 flex items-center hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                              isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onClick={() => !isOutOfStock && handleItemSelection(item)}
                          >
                            <div className="flex items-center h-5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={isOutOfStock}
                                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  {item.code && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      Code: {item.code}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className={`text-sm font-semibold ${
                                    item.totalStock > 10 ? 'text-green-600' : 
                                    item.totalStock > 0 ? 'text-yellow-600' : 
                                    'text-red-600'
                                  }`}>
                                    {item.totalStock.toLocaleString()} {item.unit}
                                  </div>
                                  {isOutOfStock && (
                                    <div className="text-xs text-red-500 mt-1">
                                      Out of stock
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* SELECTED COUNT */}
                  <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {selectedItems.length} item(s) selected
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchTerm("");
                          setDropdownOpen(false);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SELECTED ITEMS DISPLAY */}
            <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              {renderSelectedBadges()}
            </div>

            {errors.selectedItems && (
              <p className="text-red-500 text-sm mt-2">{errors.selectedItems}</p>
            )}
          </div>

          {/* SELECTED ITEMS QUANTITY MANAGEMENT */}
          {selectedItems.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  Set Quantities ({selectedItems.length} items)
                </h3>
              </div>

              {/* QUANTITY INPUTS */}
              <div className="space-y-3">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                      {/* ITEM INFO */}
                      <div className="md:col-span-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="flex items-center mt-1">
                          <div className="text-xs text-gray-500 mr-3">
                            Stock: <span className="font-semibold">{item.stock} {item.unit}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Unit: <span className="font-semibold">{item.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* QUANTITY INPUT */}
                      <div className="md:col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              min="0.01"
                              step="0.01"
                              value={itemQuantities[item.id] || ""}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                              placeholder="Enter quantity"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                              {item.unit}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSetMaxQuantity(item.id)}
                            className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded hover:bg-green-200 transition"
                          >
                            Max
                          </button>
                        </div>
                        {errors[`quantity_${item.id}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`quantity_${item.id}`]}</p>
                        )}
                      </div>

                      {/* ISSUE TYPE */}
                      <div className="md:col-span-3">
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-sm">
                          {ISSUE_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleIssueTypeChange(item.id, type)}
                              className={`flex-1 px-2 py-2 font-medium transition-colors ${
                                itemIssueTypes[item.id] === type
                                  ? type === "RETURNABLE"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-white"
                                  : "bg-white text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {type === "RETURNABLE" ? "↩ Return" : "⬛ Perm"}
                            </button>
                          ))}
                        </div>
                        {errors[`issueType_${item.id}`] && (
                          <p className="text-red-500 text-xs mt-1">{errors[`issueType_${item.id}`]}</p>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="md:col-span-2 flex justify-end">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold text-green-600">
                              {parseFloat(itemQuantities[item.id]) || 0}
                            </span> / {item.stock} {item.unit}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1.5 rounded"
                            title="Remove item"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LINE WORKER SELECTION */}
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Issued To <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedWorker}
              onChange={handleWorkerChange}
              className={`w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.selectedWorker ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select Issued To</option>
              {lineWorkers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} ({worker?.role?.name || 'No Role'})
                </option>
              ))}
            </select>
            {errors.selectedWorker && (
              <p className="text-red-500 text-sm mt-1">{errors.selectedWorker}</p>
            )}

            {/* OTHER NAME AND DEPARTMENT FIELDS */}
            {selectedWorker === OTHERS_ID && othersWorker && (
              <div className="mt-4 p-4 border border-gray-300 rounded-lg bg-blue-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* OTHER NAME */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      placeholder="Enter person's name"
                      className={`w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.otherName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.otherName && (
                      <p className="text-red-500 text-sm mt-1">{errors.otherName}</p>
                    )}
                  </div>

                  {/* OTHER DEPARTMENT */}
                  <div>
                    <label className="block mb-2 font-medium text-gray-700">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={otherDepartment}
                      onChange={(e) => setOtherDepartment(e.target.value)}
                      placeholder="Enter department name"
                      className={`w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.otherDepartment ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.otherDepartment && (
                      <p className="text-red-500 text-sm mt-1">{errors.otherDepartment}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* REMARKS */}
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              placeholder="Add any notes or remarks about this transaction..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={submitting || selectedItems.length === 0}
              className="flex-1 bg-yellow-600 to-emerald-600 
              text-black rounded-lg px-4 py-3 font-medium hover:from-yellow-700 
              hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 
              disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `Submit ${selectedItems.length} Item${selectedItems.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      )}

      {/* EMPTY STATE */}
      {!loading && uniqueItemList.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No items available</h3>
          <p className="text-gray-500">
            There are no items in the warehouse to issue.
          </p>
        </div>
      )}
    </div>
  );
};

export default SingleOut;