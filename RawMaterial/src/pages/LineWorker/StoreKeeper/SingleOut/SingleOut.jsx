import React, { useEffect, useState, useRef } from "react";
import Api from "../../../../auth/Api";
import { ArchiveBoxIcon, ArrowUturnLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import ContainerMultiSelect from "../../../../components/dropdown/ContainerMultiSelect";

const ISSUE_TYPES = ["PERMANENT", "RETURNABLE"];

const toNum = (value) => parseFloat(value) || 0;

// Containers exactly as the API's containerStock lists them, as [{ name, qty }]
const getItemContainers = (item) =>
  Object.entries(item.containerStock || {}).map(([name, qty]) => ({ name, qty: Number(qty) || 0 }));

const hasContainers = (item) => getItemContainers(item).length > 0;

const mergeContainerStock = (a = {}, b = {}) => {
  const merged = { ...a };
  Object.entries(b).forEach(([name, qty]) => {
    merged[name] = (merged[name] || 0) + (Number(qty) || 0);
  });
  return merged;
};

const SingleOut = () => {
  const [itemList, setItemList] = useState([]);
  const [uniqueItemList, setUniqueItemList] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemQuantities, setItemQuantities] = useState({});
  const [itemIssueTypes, setItemIssueTypes] = useState({});
  // Per item: selected container names, and the quantity taken from each
  const [itemContainers, setItemContainers] = useState({});
  const [containerQtys, setContainerQtys] = useState({});
  const [containers, setContainers] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [lineWorkers, setLineWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherDepartment, setOtherDepartment] = useState("");
  
  // --- FILE UPLOAD STATE ---
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);

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

    const fetchContainers = async () => {
      try {
        const res = await Api.get("/common/container");
        setContainers(res?.data?.data || []);
      } catch (err) {
        alert(err?.response?.data?.message || err.message);
      }
    };

    fetchItemList();
    fetchLineWorkers();
    fetchContainers();
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
        const existing = map.get(item.id);
        existing.totalStock += item.stock;
        existing.containerStock = mergeContainerStock(existing.containerStock, item.containerStock);
      } else {
        map.set(item.id, {
          ...item,
          totalStock: item.stock,
          containerStock: { ...(item.containerStock || {}) },
        });
      }
    });

    const uniqueItems = [...map.values()];
    setUniqueItemList(uniqueItems);
  }, [itemList]);

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
      handleRemoveItem(item.id);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          id: item.id,
          name: item.name,
          unit: item.unit,
          stock: item.totalStock,
          containerStock: item.containerStock,
          code: item.code,
          category: item.category
        }
      ]);
      // Container items get their quantity from the per-container inputs
      setItemQuantities({
        ...itemQuantities,
        [item.id]: hasContainers(item) ? "" : "1"
      });
      setItemIssueTypes({
        ...itemIssueTypes,
        [item.id]: "PERMANENT"
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

  // What can be issued: stock in the selected containers, or total stock for items without containers
  const getAvailableQty = (item) =>
    hasContainers(item)
      ? (itemContainers[item.id] || []).reduce((sum, name) => sum + toNum(item.containerStock?.[name]), 0)
      : item.stock;

  // Store per-container quantities and keep the item total equal to their sum
  const applyContainerQtys = (itemId, names, qtys) => {
    const total = names.reduce((sum, name) => sum + toNum(qtys[name]), 0);
    setItemContainers(prev => ({ ...prev, [itemId]: names }));
    setContainerQtys(prev => ({ ...prev, [itemId]: qtys }));
    setItemQuantities(prev => ({ ...prev, [itemId]: total > 0 ? String(total) : "" }));
    setErrors(prev => ({ ...prev, [`container_${itemId}`]: undefined, [`quantity_${itemId}`]: undefined }));
  };

  const handleSetMaxQuantity = (itemId) => {
    const item = selectedItems.find(item => item.id === itemId);
    if (!item) return;

    if (hasContainers(item)) {
      const names = itemContainers[itemId] || [];
      const qtys = Object.fromEntries(names.map(name => [name, String(toNum(item.containerStock?.[name]))]));
      applyContainerQtys(itemId, names, qtys);
    } else {
      setItemQuantities({
        ...itemQuantities,
        [itemId]: String(item.stock)
      });
    }
  };

  const handleRemoveItem = (itemId) => {
    const omit = (obj) => {
      const next = { ...obj };
      delete next[itemId];
      return next;
    };
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    setItemQuantities(omit);
    setItemIssueTypes(omit);
    setItemContainers(omit);
    setContainerQtys(omit);
  };

  const handleIssueTypeChange = (itemId, issueType) => {
    setItemIssueTypes({ ...itemIssueTypes, [itemId]: issueType });
  };

  // Keep quantities of containers still selected; newly added ones start empty
  const handleContainerChange = (itemId, names) => {
    const prevQtys = containerQtys[itemId] || {};
    const qtys = Object.fromEntries(names.map(name => [name, prevQtys[name] ?? ""]));
    applyContainerQtys(itemId, names, qtys);
  };

  const handleContainerQtyChange = (itemId, name, value) => {
    if (value !== "" && !(parseFloat(value) >= 0)) return;
    applyContainerQtys(itemId, itemContainers[itemId] || [], { ...containerQtys[itemId], [name]: value });
  };

  const handleWorkerChange = (e) => {
    const value = e.target.value;
    setSelectedWorker(value);
    
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

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setErrors(prev => ({ ...prev, file: "Only image files are allowed" }));
      e.target.value = "";
      return;
    }

    setFile(selected);
    setErrors(prev => ({ ...prev, file: undefined }));
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      } else if (parseFloat(quantity) > getAvailableQty(item)) {
        newErrors[`quantity_${item.id}`] = `Maximum allowed: ${getAvailableQty(item)} ${item.unit}`;
      }

      if (!issueType || !ISSUE_TYPES.includes(issueType)) {
        newErrors[`issueType_${item.id}`] = "Issue type is required";
      }

      if (hasContainers(item)) {
        const names = itemContainers[item.id] || [];
        const overdrawn = names.find(name => toNum(containerQtys[item.id]?.[name]) > toNum(item.containerStock?.[name]));
        const missing = names.find(name => toNum(containerQtys[item.id]?.[name]) <= 0);

        if (names.length === 0) {
          newErrors[`container_${item.id}`] = "Select at least one container";
        } else if (missing) {
          newErrors[`container_${item.id}`] = `Enter quantity for ${missing}`;
        } else if (overdrawn) {
          newErrors[`container_${item.id}`] = `${overdrawn} has only ${toNum(item.containerStock?.[overdrawn])} ${item.unit}`;
        }
      }
    });

    if (!selectedWorker) {
      newErrors.selectedWorker = "Please select a line worker";
    }

    if (selectedWorker === OTHERS_ID && othersWorker) {
      if (!otherName.trim()) {
        newErrors.otherName = "Name is required";
      }
      if (!otherDepartment.trim()) {
        newErrors.otherDepartment = "Department is required";
      }
    }

    if (!file) {
      newErrors.file = "Image is required";
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
      let uploadedFileUrl = null;

      // 1. Upload File First (If a file is selected)
      if (file) {
        const formData = new FormData();
        formData.append("file", file); 

        const uploadRes = await Api.post("/common/uploadFile", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedFileUrl = uploadRes?.data?.data?.fileUrl;
      }

      // 2. Build Final Payload
      const payload = {
        issuedTo: selectedWorker,
        rawMaterialIssued: selectedItems.map(item => ({
          rawMaterialId: item.id,
          quantity: String(itemQuantities[item.id]),
          unit: item.unit,
          issueType: itemIssueTypes[item.id] || "PERMANENT",
          containers: (itemContainers[item.id] || []).map(name => ({
            containerId: containers.find(c => c.name === name)?.id ?? null,
            containerName: name,
            quantity: String(containerQtys[item.id]?.[name]),
          })),
        })),
        remarks: remarks || undefined,
      };

      if (selectedWorker === OTHERS_ID && othersWorker) {
        payload.issuedToName = otherName;
        payload.department = otherDepartment;
      }

      // ---> UPDATED KEY HERE <---
      if (uploadedFileUrl) {
        payload.proof_images = uploadedFileUrl; 
      }

      console.log("FINAL PAYLOAD 👉", payload);

      // 3. Submit Final Payload
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
    setItemContainers({});
    setContainerQtys({});
    setSearchTerm("");
    setRemarks("");
    setErrors({});
    setSelectedWorker("");
    setOtherName("");
    setOtherDepartment("");
    
    // Reset File
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

                      {/* QUANTITY INPUT (total of containers when the item has container stock) */}
                      <div className="md:col-span-4">
                        <div className="mb-1 text-xs font-medium text-gray-500">
                          {hasContainers(item) ? "Total quantity" : "Quantity"}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              min="0.01"
                              step="0.01"
                              value={itemQuantities[item.id] || ""}
                              onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                              readOnly={hasContainers(item)}
                              title={hasContainers(item) ? "Sum of the container quantities below" : undefined}
                              className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                hasContainers(item) ? "bg-gray-50 text-gray-700 cursor-default" : ""
                              }`}
                              placeholder={hasContainers(item) ? "From containers" : "Enter quantity"}
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
                        <div className="mb-1 text-xs font-medium text-gray-500">Issue type</div>
                        <div className="flex rounded-lg overflow-hidden border border-gray-300 text-sm">
                          {ISSUE_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleIssueTypeChange(item.id, type)}
                              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 font-medium transition-colors ${
                                itemIssueTypes[item.id] === type
                                  ? type === "RETURNABLE"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-700 text-white"
                                  : "bg-white text-gray-600 hover:bg-gray-100"
                              }`}
                            >
                              {type === "RETURNABLE" ? (
                                <>
                                  <ArrowUturnLeftIcon className="h-4 w-4 shrink-0" /> Return
                                </>
                              ) : (
                                <>
                                  <LockClosedIcon className="h-4 w-4 shrink-0" /> Permanent
                                </>
                              )}
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
                            </span> / {getAvailableQty(item)} {item.unit}
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

                    {/* CONTAINERS: pick one or more, then how much to take from each */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="sm:w-72 shrink-0">
                          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <ArchiveBoxIcon className="h-4 w-4" />
                            Containers
                          </div>
                          {hasContainers(item) ? (
                            <ContainerMultiSelect
                              options={getItemContainers(item).map((c) => ({
                                id: c.name,
                                name: c.name,
                                hint: `${c.qty} ${item.unit}`,
                                disabled: c.qty <= 0,
                              }))}
                              value={itemContainers[item.id] || []}
                              onChange={(names) => handleContainerChange(item.id, names)}
                              invalid={!!errors[`container_${item.id}`]}
                            />
                          ) : (
                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-400">
                              No container stock
                            </div>
                          )}
                        </div>

                        {(itemContainers[item.id] || []).length > 0 && (
                          <div className="flex-1 min-w-0">
                            <div className="mb-1 text-xs font-medium text-gray-500">Quantity by container</div>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {itemContainers[item.id].map((name) => (
                                <div key={name} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5">
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-semibold text-gray-900" title={name}>{name}</div>
                                    <div className="text-xs text-gray-500">
                                      Available: {toNum(item.containerStock?.[name])} {item.unit}
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={containerQtys[item.id]?.[name] ?? ""}
                                    onChange={(e) => handleContainerQtyChange(item.id, name, e.target.value)}
                                    className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-right text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {errors[`container_${item.id}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`container_${item.id}`]}</p>
                      )}
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

          {/* IMAGE UPLOAD + REMARKS (2 per row on md+) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* IMAGE UPLOAD UI */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Attach Image <span className="text-red-500">*</span>
            </label>
            <p className="flex items-start gap-1.5 mb-3 text-xs sm:text-sm font-medium text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 text-red-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Upload images via NoteCam with Lat, Long, Date, and Time visible
            </p>

            <input
              id="proof-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />

            {!file ? (
              <label
                htmlFor="proof-image"
                className={`flex flex-col items-center justify-center w-full px-4 py-6 sm:py-8 border-2 border-dashed rounded-lg cursor-pointer transition text-center ${
                  errors.file
                    ? 'border-red-400 bg-red-50 hover:bg-red-100'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 mb-2 ${errors.file ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm sm:text-base font-medium text-blue-600">
                  Tap to upload image
                </span>
                <span className="mt-1 text-xs text-gray-500">PNG, JPG, JPEG</span>
              </label>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-green-300 bg-green-50 rounded-lg">
                {filePreview && (
                  <img
                    src={filePreview}
                    alt="Selected proof"
                    className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-md border border-gray-200"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Image selected
                  </div>
                  <p className="text-sm text-gray-700 truncate mt-0.5" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <div className="flex gap-2">
                  <label
                    htmlFor="proof-image"
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Change
                  </label>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            )}

            {errors.file && (
              <p className="flex items-center gap-1 text-red-500 text-sm mt-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.file}
              </p>
            )}
          </div>

          {/* REMARKS */}
          <div className="flex flex-col">
            <label className="flex items-center gap-2 mb-1 font-medium text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Remarks
            </label>
            {/* <p className="mb-3 text-xs sm:text-sm text-gray-500">Optional notes about this transaction</p> */}
            <textarea
              rows={5}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full flex-1 min-h-[8rem] border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              placeholder="Add any notes or remarks about this transaction..."
            />
          </div>
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