import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";
import { removeStartingZero } from "../../utils/number/removeStartingZero";

const PrePo = () => {
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [itemList, setItemList] = useState([]);
  const [itemDetails, setItemDetails] = useState([
    {
      id: 1,
      selectedItem: "",
      modelNumber: "",
      selectedUnit: "",
      rate: "",
      quantity: "",
      amount: "",
      itemDetail: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [skipCalculation, setSkipCalculation] = useState({});
  const [loadingItems, setLoadingItems] = useState({});
  const [unitTypes, setUnitTypes] = useState([]);
  const [openItemDropdown, setOpenItemDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState({});
  const dropdownRefs = useRef({});

  // Fetch units from API
  const fetchUnits = async () => {
    try {
      const response = await Api.get("/common/unit/view");
      if (response.data.success) {
        const formattedUnits = response.data.data.map((unit) => ({
          value: unit.name,
          label: unit.name,
          id: unit.id,
        }));
        setUnitTypes(formattedUnits);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  // Add custom units from item details
  useEffect(() => {
    const customUnits = itemDetails
      .map((item) => item.selectedUnit)
      .filter(
        (unit) =>
          unit && unit.trim() && !unitTypes.some((u) => u.value === unit),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    if (customUnits.length > 0) {
      const newUnitTypes = [...unitTypes];
      let addedUnits = false;
      customUnits.forEach((unit) => {
        if (!newUnitTypes.some((u) => u.value === unit)) {
          newUnitTypes.push({ value: unit, label: unit });
          addedUnits = true;
        }
      });
      if (addedUnits) {
        setUnitTypes(newUnitTypes);
      }
    }
  }, [itemDetails, unitTypes]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/vendors");
      setVendorsList(response?.data?.data || []);
    } catch (error) {
      alert("Error: " + (error?.response?.data?.message || error?.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchItemList = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/items");
      setItemList(response?.data?.items || []);
    } catch (error) {
      alert("Error: " + (error?.response?.data?.message || error?.message));
    } finally {
      setLoading(false);
    }
  };

  const addItemDetail = () => {
    const newId = itemDetails.length + 1;
    setItemDetails([
      ...itemDetails,
      {
        id: newId,
        selectedItem: "",
        modelNumber: "",
        selectedUnit: "",
        rate: "",
        quantity: "",
        amount: "",
        itemDetail: "",
      },
    ]);
  };

  const removeItemDetail = (id) => {
    if (itemDetails.length > 1) {
      setItemDetails(itemDetails.filter((item) => item.id !== id));
      setLoadingItems((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  // Calculate missing value among rate, quantity, and amount
  const calculateMissingValue = (rate, quantity, amount) => {
    const r = rate === "" ? 0 : parseFloat(rate) || 0;
    const q = quantity === "" ? 0 : parseFloat(quantity) || 0;
    const a = amount === "" ? 0 : parseFloat(amount) || 0;

    const rateValid = rate !== "" && !isNaN(r) && r > 0;
    const quantityValid = quantity !== "" && !isNaN(q) && q > 0;
    const amountValid = amount !== "" && !isNaN(a) && a > 0;

    const validCount = [rateValid, quantityValid, amountValid].filter(
      Boolean,
    ).length;

    if (validCount === 2) {
      if (rateValid && quantityValid && !amountValid) {
        return { amount: r * q, rate: r, quantity: q };
      } else if (rateValid && amountValid && !quantityValid) {
        return { amount: a, rate: r, quantity: a / r };
      } else if (quantityValid && amountValid && !rateValid) {
        return { amount: a, rate: a / q, quantity: q };
      }
    }

    if (validCount === 3) {
      return { amount: r * q, rate: r, quantity: q };
    }

    return { amount: a, rate: r, quantity: q };
  };

  const handleItemSelect = async (id, itemId) => {
    console.log(`Item changed: ${itemId} for item ${id}`);

    if (!itemId) {
      setItemDetails(
        itemDetails.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              selectedItem: "",
              modelNumber: "",
              selectedUnit: "",
              rate: "",
              itemDetail: "",
            };
          }
          return item;
        }),
      );
      setLoadingItems((prev) => ({ ...prev, [id]: false }));
      return;
    }

    const selectedItemData = itemList.find((item) => item.id === itemId);
    if (selectedItemData) {
      setLoadingItems((prev) => ({ ...prev, [id]: true }));

      try {
        let initialRate = selectedItemData.rate || "";

        let updatedItemDetails = itemDetails.map((item) => {
          if (item.id === id) {
            const updatedItem = {
              ...item,
              selectedItem: itemId,
              modelNumber: selectedItemData.modelNumber || "",
              selectedUnit: "",
              rate: initialRate,
              itemDetail: selectedItemData.itemDetail || "",
            };

            const calculated = calculateMissingValue(
              updatedItem.rate,
              updatedItem.quantity,
              updatedItem.amount,
            );
            return {
              ...updatedItem,
              rate: calculated.rate.toString(),
              quantity: calculated.quantity.toString(),
              amount: calculated.amount.toString(),
            };
          }
          return item;
        });

        setItemDetails(updatedItemDetails);

        // Fetch detailed item information from the API (for unit and description)
        try {
          const response = await Api.get(`/purchase/items/details/${itemId}`);

          if (response.data.success) {
            const detailedItem = response.data.item;

            setItemDetails((prevItemDetails) =>
              prevItemDetails.map((item) => {
                if (item.id === id) {
                  const apiUnit = detailedItem.unit;
                  let newUnit = "";

                  if (
                    apiUnit !== undefined &&
                    apiUnit !== null &&
                    apiUnit.toString().trim() !== ""
                  ) {
                    newUnit = apiUnit.toString().trim();
                  }

                  const apiDescription = detailedItem.description;
                  let newDescription = "";

                  if (
                    apiDescription !== undefined &&
                    apiDescription !== null &&
                    apiDescription.toString().trim() !== ""
                  ) {
                    newDescription = apiDescription.toString().trim();
                  }

                  const updatedItem = {
                    ...item,
                    selectedUnit: newUnit,
                    itemDetail: newDescription,
                  };

                  const calculated = calculateMissingValue(
                    updatedItem.rate,
                    updatedItem.quantity,
                    updatedItem.amount,
                  );

                  return {
                    ...updatedItem,
                    rate: calculated.rate.toString(),
                    quantity: calculated.quantity.toString(),
                    amount: calculated.amount.toString(),
                  };
                }
                return item;
              }),
            );
          }
        } catch (apiError) {
          console.error("Error fetching item details:", apiError);
        }
      } catch (error) {
        console.error("Error in handleItemSelect:", error);
      } finally {
        setLoadingItems((prev) => ({ ...prev, [id]: false }));
      }
    } else {
      setItemDetails(
        itemDetails.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              selectedItem: itemId,
              selectedUnit: "",
            };
          }
          return item;
        }),
      );
      setLoadingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  const updateItemDetail = (id, field, value) => {
    if (
      value === "" &&
      (field === "rate" || field === "quantity" || field === "amount")
    ) {
      setSkipCalculation((prev) => ({ ...prev, [id]: true }));

      setTimeout(() => {
        setSkipCalculation((prev) => ({ ...prev, [id]: false }));
      }, 100);
    }

    setItemDetails(
      itemDetails.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          if (
            skipCalculation[id] &&
            (field === "rate" || field === "quantity" || field === "amount")
          ) {
            return updatedItem;
          }

          if (field === "rate") {
            const newAmount = Number(value) * Number(updatedItem.quantity || 0);
            return {
              ...updatedItem,
              rate: value,
              amount: Number(newAmount.toFixed(3)),
            };
          }
          if (field === "amount") {
            const newRate = Number(value) / Number(updatedItem.quantity);
            return {
              ...updatedItem,
              rate: Number(newRate.toFixed(3)),
              amount: value,
            };
          }
          if (field === "quantity") {
            const newAmount = Number(value) * Number(updatedItem.rate);
            const newValue = Number(removeStartingZero(value));
            return {
              ...updatedItem,
              quantity: value,
              amount: Number(newAmount.toFixed(3)),
            };
          }

          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Initialize search query for each item
  useEffect(() => {
    const initialSearchQueries = {};
    itemDetails.forEach((item) => {
      initialSearchQueries[item.id] = "";
    });
    setSearchQuery(initialSearchQueries);
  }, [itemDetails]);

  const getFilteredItems = (itemId) => {
    const query = searchQuery[itemId] || "";
    if (!query.trim()) return itemList;

    return itemList.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.hsnCode &&
          item.hsnCode.toLowerCase().includes(query.toLowerCase())) ||
        (item.modelNumber &&
          item.modelNumber.toLowerCase().includes(query.toLowerCase())),
    );
  };

  const handleSearchChange = (itemId, value) => {
    setSearchQuery((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const toggleItemDropdown = (itemId) => {
    if (openItemDropdown === itemId) {
      setOpenItemDropdown(null);
      setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
    } else {
      setOpenItemDropdown(itemId);
      if (!searchQuery[itemId]) {
        setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
      }
    }
  };

  const handleItemSelectFromDropdown = async (itemId, selectedItemId) => {
    await handleItemSelect(itemId, selectedItemId);
    setOpenItemDropdown(null);
    setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isOutside = true;
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          isOutside = false;
        }
      });

      if (isOutside) {
        setOpenItemDropdown(null);
        const clearedQueries = {};
        itemDetails.forEach((item) => {
          clearedQueries[item.id] = "";
        });
        setSearchQuery(clearedQueries);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [itemDetails]);

  const handleSubmit = async () => {
    if (!selectedVendor) {
      alert("Please select a vendor");
      return;
    }

    // Check for missing unit
    const itemsWithoutUnit = itemDetails.filter(
      (item) => !item.selectedUnit || item.selectedUnit.trim() === ""
    );
    if (itemsWithoutUnit.length > 0) {
      alert("Please select a unit for all items");
      return;
    }

    // Validate required fields (hsnCode removed)
    const invalidItems = itemDetails.filter(
      (item) =>
        !item.selectedItem || !item.rate || !item.quantity || !item.selectedUnit
    );
    if (invalidItems.length > 0) {
      alert("Please fill all required fields for all items (item, rate, quantity, unit)");
      return;
    }

    try {
      const purchaseOrderData = {
        vendorId: selectedVendor,
        items: itemDetails.map((item) => {
          const selectedItemData = itemList.find(
            (i) => i.id === item.selectedItem
          );
          return {
            itemId: item.selectedItem,
            quantity: parseFloat(item.quantity) || 0,
            rate: parseFloat(item.rate) || 0,
            itemSource: selectedItemData?.source || "",
            itemName: selectedItemData?.name || "",
            unit: item.selectedUnit,
          };
        }),
      };

      console.log("Before submit data: ",purchaseOrderData )

      const response = await Api.post(
        "/pre-po/pre-po-request",
        purchaseOrderData
      );

      if (response.data.success) {
        alert("Purchase Order created successfully!");
        handleReset();
      } else {
        alert("Error creating purchase order: " + response.data.message);
      }
    } catch (error) {
      console.log("Error creating purchase order:", error);
      alert(
        "Error creating purchase order: " +
          (error?.response?.data?.message || error?.message)
      );
    }
  };

  const handleReset = () => {
    setSelectedVendor("");
    setItemDetails([
      {
        id: 1,
        selectedItem: "",
        modelNumber: "",
        selectedUnit: "",
        rate: "",
        quantity: "",
        amount: "",
        itemDetail: "",
      },
    ]);
    setSkipCalculation({});
    setLoadingItems({});
    setOpenItemDropdown(null);
    setSearchQuery({});
  };

  useEffect(() => {
    fetchVendors();
    fetchItemList();
    fetchUnits();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
            Basic Information
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vendor *
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Item Details</h2>
            <button
              type="button"
              className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg transition-colors duration-200 font-medium flex items-center"
              onClick={addItemDetail}
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Item
            </button>
          </div>

          <div className="space-y-6">
            {itemDetails.map((item, index) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Item {index + 1}
                  </h3>
                  {itemDetails.length > 1 && (
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                      onClick={() => removeItemDetail(item.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Item dropdown */}
                    <div
                      className="relative"
                      ref={(el) => (dropdownRefs.current[item.id] = el)}
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Item *
                        {loadingItems[item.id] && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg
                              className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
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
                              ></path>
                            </svg>
                            Loading...
                          </span>
                        )}
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleItemDropdown(item.id)}
                        disabled={loadingItems[item.id]}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex justify-between items-center ${
                          loadingItems[item.id] ? "opacity-50" : ""
                        }`}
                      >
                        <span className="truncate">
                          {item.selectedItem
                            ? (() => {
                                const selected = itemList.find(
                                  (i) => i.id === item.selectedItem,
                                );
                                return selected
                                  ? selected.name
                                  : "-- Choose Item --";
                              })()
                            : "-- Choose Item --"}
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transform transition-transform ${
                            openItemDropdown === item.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {openItemDropdown === item.id && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                            <div className="relative">
                              <svg
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                              </svg>
                              <input
                                type="text"
                                value={searchQuery[item.id] || ""}
                                onChange={(e) =>
                                  handleSearchChange(item.id, e.target.value)
                                }
                                placeholder="Search items by name, HSN, or model..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                              {searchQuery[item.id] && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSearchChange(item.id, "")
                                  }
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              )}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              Type to search items. Showing{" "}
                              {getFilteredItems(item.id).length} of{" "}
                              {itemList.length} items.
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-64">
                            {getFilteredItems(item.id).length > 0 ? (
                              getFilteredItems(item.id).map((itemOption) => (
                                <button
                                  key={itemOption.id}
                                  type="button"
                                  onClick={() =>
                                    handleItemSelectFromDropdown(
                                      item.id,
                                      itemOption.id,
                                    )
                                  }
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                                    item.selectedItem === itemOption.id
                                      ? "bg-blue-50"
                                      : ""
                                  }`}
                                >
                                  <div className="font-medium text-gray-900">
                                    {itemOption.name}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {itemOption.hsnCode && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        HSN: {itemOption.hsnCode}
                                      </span>
                                    )}
                                    {itemOption.modelNumber && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        Model: {itemOption.modelNumber}
                                      </span>
                                    )}
                                    {itemOption.rate && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        ₹{parseFloat(itemOption.rate).toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                  {itemOption.itemDetail && (
                                    <div className="mt-1 text-xs text-gray-500 truncate">
                                      {itemOption.itemDetail}
                                    </div>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-8 text-center">
                                <svg
                                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <p className="text-gray-500">
                                  No items found for "{searchQuery[item.id]}"
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                  Try different search terms
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Unit *
                        {loadingItems[item.id] && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg
                              className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
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
                              ></path>
                            </svg>
                            Loading...
                          </span>
                        )}
                      </label>
                      <select
                        value={item.selectedUnit}
                        onChange={(e) =>
                          updateItemDetail(
                            item.id,
                            "selectedUnit",
                            e.target.value,
                          )
                        }
                        disabled={loadingItems[item.id]}
                        className={`w-full px-4 py-2.5 border ${
                          item.selectedItem && !item.selectedUnit
                            ? "border-orange-300"
                            : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                          loadingItems[item.id] ? "opacity-50" : ""
                        }`}
                      >
                        <option value="">-- Choose Unit --</option>
                        {unitTypes.length === 0 ? (
                          <option value="" disabled>
                            Loading units...
                          </option>
                        ) : (
                          unitTypes.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))
                        )}
                      </select>
                      {item.selectedUnit ? (
                        <p className="mt-1 text-xs text-green-600">
                          Current unit: {item.selectedUnit}
                        </p>
                      ) : item.selectedItem && !loadingItems[item.id] ? (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <p className="text-xs text-orange-600 flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                              />
                            </svg>
                            No unit available for this item. Please select a
                            unit manually.
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            updateItemDetail(item.id, "quantity", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter quantity in {item.selectedUnit || "unit"}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate
                      </label>
                      <input
                        type="text"
                        value={item.rate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            updateItemDetail(item.id, "rate", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={!item.quantity.toString().length >= 1}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter rate per unit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!selectedVendor}
            >
              Pre Po Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrePo;