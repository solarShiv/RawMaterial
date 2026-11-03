import React, { useEffect, useState } from "react";
import Api from "../../auth/Api";

const DebitNot = () => {
  // Existing states
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState("");
  const [loadingPO, setLoadingPO] = useState(false);
  const [poDetails, setPoDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // New states for debit note fields
  const [orgInvoiceNo, setOrgInvoiceNo] = useState("");
  const [orgInvoiceDate, setOrgInvoiceDate] = useState("");
  const [grRrNo, setGrRrNo] = useState("");
  const [transport, setTransport] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [station, setStation] = useState("");
  const [gstType, setGstType] = useState("");
  const [otherCharges, setOtherCharges] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const gstTypes = [
    { value: "IGST_5", label: "IGST 5%", rate: 5 },
    { value: "IGST_12", label: "IGST 12%", rate: 12 },
    { value: "IGST_18", label: "IGST 18%", rate: 18 },
    { value: "IGST_28", label: "IGST 28%", rate: 28 },
    { value: "IGST_EXEMPTED", label: "IGST Exempted", rate: 0 },
    { value: "LGST_5", label: "LGST 5%", rate: 5 },
    { value: "LGST_12", label: "LGST 12%", rate: 12 },
    { value: "LGST_18", label: "LGST 18%", rate: 18 },
    { value: "LGST_28", label: "LGST 28%", rate: 28 },
    { value: "LGST_EXEMPTED", label: "LGST Exempted", rate: 0 },
    { value: "IGST_ITEMWISE", label: "IGST Itemwise", rate: null },
    { value: "LGST_ITEMWISE", label: "LGST Itemwise", rate: null },
  ];

  // Check if GST type is itemwise
  const isItemwiseGST = gstType === "IGST_ITEMWISE" || gstType === "LGST_ITEMWISE";

  // Get default GST rate for non-itemwise GST types
  const getDefaultGSTRate = () => {
    const selectedGstType = gstTypes.find(gst => gst.value === gstType);
    return selectedGstType?.rate || 0;
  };

  // Fetch companies
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await Api.get("/purchase/companies");
        setCompanies(res.data.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch PO list
  useEffect(() => {
    if (!selectedCompany) return;

    const fetchPO = async () => {
      try {
        setLoadingPO(true);
        setPurchaseOrders([]);
        setSelectedPO("");
        setPoDetails(null);
        resetForm();

        const res = await Api.get(
          `/purchase/purchase-orders/company/${selectedCompany}`
        );
        setPurchaseOrders(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingPO(false);
      }
    };

    fetchPO();
  }, [selectedCompany]);

  // Fetch PO damaged stock details
  useEffect(() => {
    if (!selectedPO) return;

    const fetchPODetails = async () => {
      try {
        setLoadingDetails(true);
        resetForm();

        const res = await Api.get(
          `/purchase/purchase-orders/damaged-stock/details/${selectedPO}`
        );

        console.log("PO Details Response:", res.data.data);
        setPoDetails(res.data.data);
        
        // Initialize items with empty fields for the form
        if (res.data.data?.damagedStock) {
          const defaultGSTRate = getDefaultGSTRate();
          const initializedItems = res.data.data.damagedStock.map(item => ({
            id: item.id,
            itemId: item.itemId,
            itemName: item.itemName,
            unit: item.unit || "Pcs",
            quantity: item.quantity || "",
            hsnCode: "",
            modelNumber: "",
            itemDetail: "",
            rate: "",
            gstRate: isItemwiseGST ? "" : defaultGSTRate.toString(),
            itemSource: item.itemSource
          }));
          setItems(initializedItems);
        }
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Failed to load PO details" });
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchPODetails();
  }, [selectedPO]);

  // Update item GST rates when GST type changes
  useEffect(() => {
    if (!isItemwiseGST && items.length > 0) {
      const defaultGSTRate = getDefaultGSTRate();
      const updatedItems = items.map(item => ({
        ...item,
        gstRate: defaultGSTRate.toString()
      }));
      setItems(updatedItems);
    }
  }, [gstType]);

  const resetForm = () => {
    setOrgInvoiceNo("");
    setOrgInvoiceDate("");
    setGrRrNo("");
    setTransport("");
    setVehicleNumber("");
    setStation("");
    setGstType("");
    setOtherCharges([]);
    setItems([]);
    setMessage({ type: "", text: "" });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleOtherChargeChange = (index, field, value) => {
    const updatedCharges = [...otherCharges];
    updatedCharges[index][field] = value;
    setOtherCharges(updatedCharges);
  };

  const addOtherCharge = () => {
    setOtherCharges([
      ...otherCharges,
      { id: Date.now() + Math.random(), name: "", amount: "" }
    ]);
  };

  const removeOtherCharge = (index) => {
    const updatedCharges = otherCharges.filter((_, i) => i !== index);
    setOtherCharges(updatedCharges);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalGST = 0;
    
    const itemTotals = items.map(item => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstRate = parseFloat(item.gstRate) || 0;
      const taxableValue = quantity * rate;
      const gstAmount = (taxableValue * gstRate) / 100;
      const total = taxableValue + gstAmount;
      
      subtotal += taxableValue;
      totalGST += gstAmount;
      
      return {
        ...item,
        taxableValue: taxableValue.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        total: total.toFixed(2)
      };
    });

    const otherChargesTotal = otherCharges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    const grandTotal = subtotal + totalGST + otherChargesTotal;

    return { 
      itemTotals, 
      subtotal, 
      totalGST, 
      otherChargesTotal, 
      grandTotal 
    };
  };

  const validateForm = () => {
    if (!orgInvoiceNo.trim()) {
      setMessage({ type: "error", text: "Original Invoice No. is required" });
      return false;
    }
    if (!orgInvoiceDate) {
      setMessage({ type: "error", text: "Original Invoice Date is required" });
      return false;
    }
    if (!gstType) {
      setMessage({ type: "error", text: "GST Type is required" });
      return false;
    }
    
    // Validate items
    for (const item of items) {
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        setMessage({ type: "error", text: `Invalid quantity for ${item.itemName}` });
        return false;
      }
      if (!item.rate || parseFloat(item.rate) <= 0) {
        setMessage({ type: "error", text: `Invalid rate for ${item.itemName}` });
        return false;
      }
      if (isItemwiseGST) {
        if (item.gstRate === undefined || item.gstRate === null || item.gstRate === "") {
          setMessage({ type: "error", text: `GST Rate is required for ${item.itemName}` });
          return false;
        }
        const gstRate = parseFloat(item.gstRate);
        if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
          setMessage({ type: "error", text: `GST Rate must be between 0-100% for ${item.itemName}` });
          return false;
        }
      }
    }

    // Validate other charges - only validate if they have values
    for (const charge of otherCharges) {
      if (charge.name.trim() === "" && charge.amount !== "") {
        setMessage({ type: "error", text: "Charge name is required if amount is entered" });
        return false;
      }
      if (charge.name.trim() !== "" && charge.amount === "") {
        setMessage({ type: "error", text: `Amount is required for ${charge.name}` });
        return false;
      }
      const amount = parseFloat(charge.amount);
      if (charge.amount !== "" && (isNaN(amount) || amount < 0)) {
        setMessage({ type: "error", text: `Invalid amount for ${charge.name}` });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Format date to ISO string
      const formattedDate = orgInvoiceDate ? new Date(orgInvoiceDate).toISOString() : null;

      // Prepare damagedItems array - conditionally include gstRate
      const damagedItems = items.map(item => {
        // Create base item object
        const itemData = {
          damagedStockId: item.id,
          itemId: item.itemId,
          source: item.itemSource,
          name: item.itemName,
          hsnCode: item.hsnCode || "",
          modelNumber: item.modelNumber || "",
          itemDetail: item.itemDetail || "",
          quantity: item.quantity.toString(),
          unit: item.unit,
          rate: item.rate.toString(),
        };

        // Only add gstRate if GST type is ITEMWISE
        if (isItemwiseGST) {
          itemData.gstRate = item.gstRate ? item.gstRate.toString() : "";
        }

        return itemData;
      });

      // Filter and format otherCharges - only include charges with both name and amount
      const formattedOtherCharges = otherCharges
        .filter(charge => charge.name.trim() !== "" && charge.amount !== "")
        .map(charge => ({
          name: charge.name,
          amount: parseFloat(charge.amount).toString()
        }));

      const debitNoteData = {
        purchaseOrderId: selectedPO,
        companyId: selectedCompany,
        vendorId: poDetails?.vendorId || "",
        gstType: gstType,
        damagedItems: damagedItems,
        remarks: "", // Empty as per requirement
        orgInvoiceNo: orgInvoiceNo,
        orgInvoiceDate: formattedDate,
        gr_rr_no: grRrNo, // Note: underscore in field name
        transport: transport,
        vehicleNumber: vehicleNumber,
        station: station,
        otherCharges: formattedOtherCharges
      };

      console.log("Submitting debit note:", JSON.stringify(debitNoteData, null, 2));

      const response = await Api.post(
        "/purchase/debit-note/create",
        debitNoteData
      );

      if (response.data.success) {
        setMessage({ 
          type: "success", 
          text: "Debit Note created successfully!" 
        });
        resetForm();
        setSelectedPO("");
        setPoDetails(null);
      } else {
        setMessage({ 
          type: "error", 
          text: response.data.message || "Failed to create debit note" 
        });
      }
    } catch (error) {
      console.error("Error creating debit note:", error);
      let errorMessage = "Error creating debit note. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setMessage({ 
        type: "error", 
        text: errorMessage 
      });
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, totalGST, otherChargesTotal, grandTotal } = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">

      {/* Message Display */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-6xl">
        <form onSubmit={handleSubmit}>
          {/* Company */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Company Name *
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full border border-black rounded-lg px-3 py-2"
              required
            >
              <option value="">-- Select Company --</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* PO */}
          {selectedCompany && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">
                Purchase Order *
              </label>

              {loadingPO ? (
                <p className="text-blue-600 text-sm">Loading PO...</p>
              ) : (
                <select
                  value={selectedPO}
                  onChange={(e) => setSelectedPO(e.target.value)}
                  className="w-full border border-black rounded-lg px-3 py-2"
                  required
                >
                  <option value="">-- Select PO Number --</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* PO DETAILS */}
          {loadingDetails && (
            <p className="text-blue-600">Loading PO details...</p>
          )}

          {poDetails && items.length > 0 && (
            <>
              {/* Header Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="text-sm text-gray-600">PO Number</label>
                  <input
                    value={poDetails.poNumber}
                    disabled
                    className="w-full border border-black rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Company</label>
                  <input
                    value={poDetails.companyName}
                    disabled
                    className="w-full border border-black rounded px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Vendor</label>
                  <input
                    value={poDetails.vendorName}
                    disabled
                    className="w-full border border-black rounded px-3 py-2 bg-gray-100"
                  />
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="mb-8 p-4 border border-black rounded-lg bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Original Invoice No. *
                    </label>
                    <input
                      type="text"
                      value={orgInvoiceNo}
                      onChange={(e) => setOrgInvoiceNo(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Original Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={orgInvoiceDate}
                      onChange={(e) => setOrgInvoiceDate(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      GR/RR No.
                    </label>
                    <input
                      type="text"
                      value={grRrNo}
                      onChange={(e) => setGrRrNo(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Transport
                    </label>
                    <input
                      type="text"
                      value={transport}
                      onChange={(e) => setTransport(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Station
                    </label>
                    <input
                      type="text"
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">
                      GST Type *
                    </label>
                    <select
                      value={gstType}
                      onChange={(e) => setGstType(e.target.value)}
                      className="w-full border border-black rounded px-3 py-2"
                      required
                    >
                      <option value="">-- Select GST Type --</option>
                      {gstTypes.map((gst) => (
                        <option key={gst.value} value={gst.value}>
                          {gst.label}
                        </option>
                      ))}
                    </select>
                    {!isItemwiseGST && gstType && (
                      <p className="text-sm text-gray-500 mt-1">
                        Default GST Rate: {getDefaultGSTRate()}%
                      </p>
                    )}
                    {isItemwiseGST && (
                      <p className="text-sm text-blue-600 mt-1">
                        You can set GST rate for each item individually below
                      </p>
                    )}
                  </div>
                </div>

                {/* Other Charges - Dynamic Form */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium">Other Charges</h4>
                    <button
                      type="button"
                      onClick={addOtherCharge}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      + Add Charge
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {otherCharges.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        No charges added yet. Click "Add Charge" to add one.
                      </div>
                    ) : (
                      otherCharges.map((charge, index) => (
                        <div key={charge.id} className="flex items-center gap-3 p-3 border border-black rounded bg-white">
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">
                              Charge Name
                            </label>
                            <input
                              type="text"
                              value={charge.name}
                              onChange={(e) => handleOtherChargeChange(index, 'name', e.target.value)}
                              className="w-full border border-black rounded px-3 py-2"
                              placeholder="e.g., Freight, Loading, Insurance, etc."
                            />
                          </div>
                          
                          <div className="flex-1">
                            <label className="block text-sm font-medium mb-1">
                              Amount (₹)
                            </label>
                            <input
                              type="text"
                              step="0.01"
                              min="0"
                              value={charge.amount}
                              onChange={(e) => handleOtherChargeChange(index, 'amount', e.target.value)}
                              className="w-full border border-black rounded px-3 py-2"
                              placeholder="Enter amount"
                            />
                          </div>
                          
                          <div className="pt-6">
                            <button
                              type="button"
                              onClick={() => removeOtherCharge(index)}
                              className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200 border border-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Summary of Other Charges */}
                  {otherChargesTotal > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Total Other Charges:</span>
                        <span className="font-bold text-lg">₹{otherChargesTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Damaged Stock Items - Card Layout */}
              <h2 className="text-lg font-semibold mb-4">
                Damaged Stock Details
              </h2>

              <div className="space-y-6 mb-6">
                {items.map((item, index) => {
                  const quantity = parseFloat(item.quantity) || 0;
                  const rate = parseFloat(item.rate) || 0;
                  const gstRate = parseFloat(item.gstRate) || 0;
                  const taxableValue = quantity * rate;
                  const gstAmount = (taxableValue * gstRate) / 100;
                  const total = taxableValue + gstAmount;
                  
                  return (
                    <div key={item.id} className="border-2 border-black rounded-lg p-4 bg-white">
                      {/* Item Name Header */}
                      <div className="mb-4 pb-3 border-b-2 border-black">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.itemName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Source: {item.itemSource || "mysql"} | Item ID: {item.itemId?.substring(0, 8)}...
                        </p>
                      </div>

                      {/* First Row: 3 fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            HSN Code
                          </label>
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) => handleItemChange(index, 'hsnCode', e.target.value)}
                            className="w-full border border-black rounded px-3 py-2"
                            placeholder="Enter HSN Code"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Model Number
                          </label>
                          <input
                            type="text"
                            value={item.modelNumber}
                            onChange={(e) => handleItemChange(index, 'modelNumber', e.target.value)}
                            className="w-full border border-black rounded px-3 py-2"
                            placeholder="Enter Model Number"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Quantity *
                          </label>
                          <input
                            type="text"
                            step="0.01"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full border border-black rounded px-3 py-2"
                            required
                          />
                        </div>
                      </div>

                      {/* Second Row: 3 fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Unit
                          </label>
                          <div className="w-full border border-black rounded px-3 py-2 bg-gray-50">
                            {item.unit}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Rate (₹) *
                          </label>
                          <input
                            type="text"
                            step="0.01"
                            min="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="w-full border border-black rounded px-3 py-2"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Taxable Value (₹)
                          </label>
                          <div className="w-full border border-black rounded px-3 py-2 bg-gray-50 text-right font-medium">
                            ₹{taxableValue.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Third Row: GST Rate and Amount - Conditionally show */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            GST Rate (%)
                          </label>
                          {isItemwiseGST ? (
                            <div className="flex items-center">
                              <input
                                type="text"
                                step="0.01"
                                min="0"
                                max="100"
                                value={item.gstRate}
                                onChange={(e) => handleItemChange(index, 'gstRate', e.target.value)}
                                className="w-full border border-black rounded px-3 py-2"
                                required={isItemwiseGST}
                                placeholder="0-100"
                              />
                              <span className="ml-2 text-sm">%</span>
                            </div>
                          ) : (
                            <div className="w-full border border-black rounded px-3 py-2 bg-gray-50">
                              GST Rate is determined by selected GST Type: {getDefaultGSTRate()}%
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            GST Amount (₹)
                          </label>
                          <div className="w-full border border-black rounded px-3 py-2 bg-gray-50 text-right font-medium">
                            ₹{gstAmount.toFixed(2)}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Total (₹)
                          </label>
                          <div className="w-full border-2 border-black rounded px-3 py-2 bg-gray-100 text-right font-bold">
                            ₹{total.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Item Details (Full width) */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">
                          Item Details
                        </label>
                        <textarea
                          value={item.itemDetail}
                          onChange={(e) => handleItemChange(index, 'itemDetail', e.target.value)}
                          className="w-full border-2 border-black rounded px-3 py-2 min-h-[100px]"
                          placeholder="Enter detailed product description, specifications, condition, etc."
                          rows="4"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed border-2 border-blue-800"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Creating...
                    </span>
                  ) : "Create Debit Note"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default DebitNot;
