import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../../auth/Api";
import SingleSelect from "../../components/dropdown/SingleSelect";

const ReceivedPurchaseStock = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { selectedOrderDetails } = location?.state || {};

  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(""); // New invoice number field

  const [itemInputs, setItemInputs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billFile, setBillFile] = useState(null); // Single bill file for entire order
  
  // Filtered items - only show items that are not fully received
  const [filteredItems, setFilteredItems] = useState([]);

  useEffect(() => {
    fetchWarehouses();

    if (selectedOrderDetails?.items) {
      // Filter items where ordered quantity is greater than already received quantity
      // Parse strings to numbers for comparison
      const pendingItems = selectedOrderDetails.items.filter(
        item => {
          const orderedQty = parseFloat(item.quantity) || 0;
          const receivedQty = parseFloat(item.receivedQty) || 0;
          return orderedQty > receivedQty;
        }
      );
      
      setFilteredItems(pendingItems);
      
      // Initialize inputs only for pending items
      const initial = pendingItems.map((item) => {
        const orderedQty = parseFloat(item.quantity) || 0;
        const receivedQty = parseFloat(item.receivedQty) || 0;
        const remainingQty = orderedQty - receivedQty;
        
        return {
          receivedQty: remainingQty.toString(), // Pre-fill with remaining quantity
          goodQty: remainingQty.toString(), // Pre-fill with remaining quantity
          damagedQty: "0",
          remarks: "",
        };
      });
      setItemInputs(initial);
    }
  }, [selectedOrderDetails]);

  const fetchWarehouses = async () => {
    try {
      const res = await Api.get(`/purchase/warehouses`);
      const formatted = res?.data?.data?.map((w) => ({
        label: w.warehouseName,
        value: w._id,
      }));
      setWarehouseList(formatted);
    } catch (err) {
      alert("Error loading warehouses");
    }
  };

  const handleInputChange = (index, field, value) => {
    const updated = [...itemInputs];
    updated[index][field] = value;
    
    if (field === "receivedQty") {
      updated[index].goodQty = value;
    }
    
    setItemInputs(updated);
  };

  const handleBillFileUpload = (file) => {
    setBillFile(file);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!selectedWarehouse) {
        alert("Please select a warehouse");
        setIsSubmitting(false);
        return;
      }
      
      if (filteredItems.length === 0) {
        alert("No items to receive");
        setIsSubmitting(false);
        return;
      }

      // Validate inputs
      const validationErrors = [];
      
      filteredItems.forEach((item, i) => {
        const input = itemInputs[i];
        const orderedQty = parseFloat(item.quantity) || 0;
        const alreadyReceived = parseFloat(item.receivedQty) || 0;
        const remainingQty = orderedQty - alreadyReceived;
        
        const receivedQty = parseFloat(input.receivedQty) || 0;
        const goodQty = parseFloat(input.goodQty) || 0;
        const damagedQty = parseFloat(input.damagedQty) || 0;
        
        if (receivedQty <= 0) {
          validationErrors.push(`Please enter received quantity for ${item.itemName}`);
        }
        
        if (receivedQty > remainingQty) {
          validationErrors.push(`Received quantity for ${item.itemName} cannot exceed remaining quantity (${remainingQty})`);
        }
        
        if (goodQty + damagedQty !== receivedQty) {
          validationErrors.push(`For ${item.itemName}, Good Qty + Damaged Qty must equal Received Qty`);
        }
      });
      
      if (validationErrors.length > 0) {
        alert(validationErrors.join("\n"));
        setIsSubmitting(false);
        return;
      }

      // Prepare items array in the exact format required
      const itemsToSend = filteredItems.map((item, idx) => {
        const receivedQty = parseFloat(itemInputs[idx].receivedQty) || 0;
        const goodQty = parseFloat(itemInputs[idx].goodQty) || 0;
        const damagedQty = parseFloat(itemInputs[idx].damagedQty) || 0;
        
        return {
          purchaseOrderItemId: item.id,
          itemId: item.itemId,
          itemSource: item.itemSource,
          itemName: item.itemName,
          receivedQty: receivedQty,
          goodQty: goodQty,
          damagedQty: damagedQty,
          remarks: itemInputs[idx].remarks || "",
        };
      });

      // Create FormData with exact structure from example
      const formData = new FormData();
      
      // Exactly these 5 fields including invoiceNumber
      formData.append("purchaseOrderId", selectedOrderDetails.id); // Text field
      formData.append("items", JSON.stringify(itemsToSend)); // JSON string field
      formData.append("warehouseId", selectedWarehouse); // Text field
      formData.append("invoiceNumber", invoiceNumber); // New invoice number field
      
      // Single bill file for entire order (optional)
      if (billFile) {
        formData.append("billFile", billFile); // File field
      }

      console.log("FormData contents:");
      formData.forEach((value, key) => {
        console.log(key, typeof value === 'string' ? 'Text' : 'File', value);
      });

      const response = await Api.post(
        "/purchase/purchase-orders/receive",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data" 
          } 
        }
      );

      alert("Purchase stock received successfully!");
      navigate(-1);
    } catch (error) {
      console.log("Submission error:", error);
      alert(error?.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Calculate remaining quantity for each item
  const calculateRemainingQty = (item) => {
    const orderedQty = parseFloat(item.quantity) || 0;
    const receivedQty = parseFloat(item.receivedQty) || 0;
    return orderedQty - receivedQty;
  };

  // Calculate total pending items count
  const getPendingItemsCount = () => {
    if (!selectedOrderDetails?.items) return 0;
    return selectedOrderDetails.items.filter(item => {
      const orderedQty = parseFloat(item.quantity) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 0;
      return orderedQty > receivedQty;
    }).length;
  };

  // Calculate fully received items count
  const getFullyReceivedItemsCount = () => {
    if (!selectedOrderDetails?.items) return 0;
    return selectedOrderDetails.items.filter(item => {
      const orderedQty = parseFloat(item.quantity) || 0;
      const receivedQty = parseFloat(item.receivedQty) || 0;
      return orderedQty <= receivedQty;
    }).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-4 px-3 sm:py-8 sm:px-5">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Receive Purchase Stock
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-gray-600 text-sm sm:text-base">
                  Purchase Order: #{selectedOrderDetails?.poNumber || "N/A"}
                </p>
                {getFullyReceivedItemsCount() > 0 && (
                  <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-sm">
                    ✓ {getFullyReceivedItemsCount()} item{getFullyReceivedItemsCount() !== 1 ? 's' : ''} fully received
                  </span>
                )}
                <span className="text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full text-sm">
                  ⏳ {getPendingItemsCount()} item{getPendingItemsCount() !== 1 ? 's' : ''} pending
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

          {/* Order-level information section */}
          <div className="space-y-4 mb-4">
            {/* Warehouse Select */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <SingleSelect
                label="Select Destination Warehouse"
                lists={warehouseList}
                selectedValue={selectedWarehouse}
                setSelectedValue={setSelectedWarehouse}
                required={true}
              />
            </div>

            {/* Invoice Number Input */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
                {/* <span className="text-gray-500 font-normal ml-1">(Optional)</span> */}
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="Enter invoice number from supplier"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                Reference number from the supplier's invoice
              </p>
            </div>

            {/* Single Bill File Upload for entire order */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Bill/Invoice Document
                {/* <span className="text-gray-500 font-normal ml-1">(Optional)</span> */}
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
                      <p className="text-xs mt-1">Max 10MB • Single file for entire order</p>
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
                Upload the purchase bill or invoice document (optional)
              </p>
            </div>
          </div>
        </div>

        {/* Show message if no items to receive */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">All items already received</h3>
            <p className="mt-2 text-gray-600">
              All items in this purchase order have been fully received. No pending items to receive.
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
            {/* Items List */}
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

                    {/* Input Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Received Qty *
                          </label>
                          <input
                            type="text"
                            min="1"
                            max={remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            value={itemInputs[index]?.receivedQty || ""}
                            onChange={(e) =>
                              handleInputChange(index, "receivedQty", e.target.value)
                            }
                            placeholder="Enter quantity"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Max: {remainingQty}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Good Qty
                          </label>
                          <input
                            type="text"
                            min="0"
                            max={itemInputs[index]?.receivedQty || remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            value={itemInputs[index]?.goodQty || ""}
                            onChange={(e) =>
                              handleInputChange(index, "goodQty", e.target.value)
                            }
                            placeholder="Good condition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Damaged Qty
                          </label>
                          <input
                            type="text"
                            min="0"
                            max={itemInputs[index]?.receivedQty || remainingQty}
                            step="1"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                            value={itemInputs[index]?.damagedQty || ""}
                            onChange={(e) =>
                              handleInputChange(index, "damagedQty", e.target.value)
                            }
                            placeholder="Damaged items"
                          />
                        </div>
                      </div>

                      {/* Validation message */}
                      {itemInputs[index]?.receivedQty && 
                       itemInputs[index]?.goodQty && 
                       itemInputs[index]?.damagedQty && (
                        <div className={`p-2 rounded-lg text-sm ${
                          (parseFloat(itemInputs[index].goodQty) || 0) + 
                          (parseFloat(itemInputs[index].damagedQty) || 0) === 
                          (parseFloat(itemInputs[index].receivedQty) || 0)
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}>
                          Good ({itemInputs[index].goodQty}) + Damaged ({itemInputs[index].damagedQty}) = {
                            (parseFloat(itemInputs[index].goodQty) || 0) + 
                            (parseFloat(itemInputs[index].damagedQty) || 0)
                          } | Received: {itemInputs[index].receivedQty}
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

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -mx-3 sm:mx-0 sm:rounded-xl sm:border sm:shadow-lg">
              <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-full sm:w-auto order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !selectedWarehouse}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto order-1 sm:order-2"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Submit Received Stock"
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Please verify all quantities and invoice number before submission
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