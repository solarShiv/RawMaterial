// import React, { useState, useEffect } from "react";
// import Api from "../../auth/Api";
// import { useNavigate } from "react-router-dom";
// import NormalInput from "../../components/InputField/NormalInput";
// import TableHeading from "../../components/table/TableHeading";
// import ButtonWithIcon from "../../components/Button/ButtonWithIcon";
// import { HiPencilAlt, HiSearch } from "react-icons/hi";
// import { MdCancelPresentation, MdEmail, MdDriveFolderUpload } from "react-icons/md";
// import { AiOutlineSync } from "react-icons/ai";
// import { FaCloudDownloadAlt } from "react-icons/fa";
// import { FiSend } from "react-icons/fi";

// const ShowPurchaseOrder = () => {
//   // State variables
//   const [companies, setCompanies] = useState([]);
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [ordersLoading, setOrdersLoading] = useState(false);
//   const [detailsLoading, setDetailsLoading] = useState(false);
//   const [downloadLoading, setDownloadLoading] = useState(false);
//   const [cancelLoading, setCancelLoading] = useState(false);
//   const [emailLoading, setEmailLoading] = useState(false);
//   const [approvalLoading, setApprovalLoading] = useState(false);
//   const [uploadLoading, setUploadLoading] = useState(false);
//   const [selectedCompany, setSelectedCompany] = useState("");
//   const [selectedOrder, setSelectedOrder] = useState("");
//   const [showUpdateForm, setShowUpdateForm] = useState(false);
//   const [showUploadForm, setShowUploadForm] = useState(false);
//   const [updateLoading, setUpdateLoading] = useState(false);
//   const [items, setItems] = useState([]);
//   const [itemsLoading, setItemsLoading] = useState(false);
//   const [showItemsDropdown, setShowItemsDropdown] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [warehouseList, setWarehouseList] = useState([]);
//   const [warehouseLoading, setWarehouseLoading] = useState(false);
//   const [vendorsList, setVendorsList] = useState([]);
//   const [vendorsLoading, setVendorsLoading] = useState(false);
//   const [loadingItems, setLoadingItems] = useState({});
//   const [invoiceData, setInvoiceData] = useState({
//     invoiceNumber: "",
//     invoiceFile: null,
//     vendorId: "",
//     poId: ""
//   });

//   const navigate = useNavigate();

//   // Pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalItems, setTotalItems] = useState(0);
//   const [totalPages, setTotalPages] = useState(1);

//   // Form data state – items have 'id' (master ID) and 'source'
//   const [formData, setFormData] = useState({
//     companyId: "",
//     vendorId: "",
//     vendorName: "",
//     gstType: "",
//     items: [], // each item: { id, name, hsnCode, modelNumber, unit, quantity, rate, gstRate, total, itemDetail, source }
//     otherCharges: [],
//     poNumber: "",
//     poDate: "",
//     paymentTerms: "",
//     deliveryTerms: "",
//     contactPerson: "",
//     cellNo: "",
//     gstRate: "",
//     currency: "INR",
//     exchangeRate: "1",
//     warranty: "",
//     status: "",
//     warehouseName: "",
//     warehouseId: "",
//     expectedDeliveryDate: "",
//     unit: "",
//   });

//   const [unitTypes, setUnitTypes] = useState([]);
//   const [unitsLoading, setUnitsLoading] = useState(false);

//   // Search states
//   const [vendor, setVendor] = useState("");
//   const [item, setItem] = useState("");
//   const [poNumber, setPoNumber] = useState("");
//   const [srcBtnDisabled, setSrcBtnDisabled] = useState(false);
//   const [poListing, setPoListing] = useState([]);

//   // Check if GST type is itemwise
//   const isItemWiseGST =
//     formData.gstType === "IGST_ITEMWISE" ||
//     formData.gstType === "LGST_ITEMWISE";

//   // Status options with colors
//   const statusOptions = [
//     { value: "Draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
//     { value: "Sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
//     { value: "Approved", label: "Approved", color: "bg-green-100 text-green-800" },
//     { value: "Completed", label: "Completed", color: "bg-purple-100 text-purple-800" },
//     { value: "Cancelled", label: "Cancelled", color: "bg-red-100 text-red-800" },
//     { value: "Received", label: "Received", color: "bg-emerald-100 text-emerald-800" },
//     { value: "Update Order", label: "Update Order", color: "bg-amber-100 text-amber-800" },
//     { value: "PartiallyReceived", label: "Partially Received", color: "bg-orange-100 text-orange-800" },
//     { value: "UploadDoc", label: "Upload Doc", color: "bg-yellow-100 text-yellow-800" },
//     { value: "Admin_Approved", label: "Admin Approved", color: "bg-indigo-100 text-indigo-800" },
//     { value: "Admin_Rejected", label: "Admin Rejected", color: "bg-red-100 text-red-800" },
//   ];

//   // GST Types
//   const gstTypes = [
//     { value: "IGST_5", label: "IGST 5%" },
//     { value: "IGST_12", label: "IGST 12%" },
//     { value: "IGST_18", label: "IGST 18%" },
//     { value: "IGST_28", label: "IGST 28%" },
//     { value: "IGST_EXEMPTED", label: "IGST Exempted" },
//     { value: "LGST_5", label: "LGST 5%" },
//     { value: "LGST_12", label: "LGST 12%" },
//     { value: "LGST_18", label: "LGST 18%" },
//     { value: "LGST_28", label: "LGST 28%" },
//     { value: "LGST_EXEMPTED", label: "LGST Exempted" },
//     { value: "IGST_ITEMWISE", label: "IGST Itemwise" },
//     { value: "LGST_ITEMWISE", label: "LGST Itemwise" },
//   ];

//   const currencyOptions = [
//     { value: "INR", label: "INR" },
//     { value: "USD", label: "USD" },
//     { value: "CNY", label: "CNY" },
//     { value: "EUR", label: "EUR" },
//     { value: "GBP", label: "GBP" },
//     { value: "AED", label: "AED" },
//   ];

//   // Filtered items based on search
//   const filteredItems = items.filter(
//     (item) =>
//       item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       item.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase()),
//   );

//   // ==================== API Functions ====================

//   const fetchCompanies = async () => {
//     setLoading(true);
//     try {
//       const response = await Api.get("/purchase/companies");
//       setCompanies(response.data.data || []);
//     } catch (error) {
//       console.log("Error fetching companies:", error?.response?.data?.message || error?.message);
//       alert("Error loading companies");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchPurchaseOrders = async (companyId) => {
//     if (!companyId) {
//       setPurchaseOrders([]);
//       setSelectedOrder("");
//       setSelectedOrderDetails(null);
//       return;
//     }

//     setOrdersLoading(true);
//     try {
//       const response = await Api.get(
//         `/purchase/purchase-orders/company/${companyId}`,
//       );
//       setPurchaseOrders(response.data.data || []);
//       setSelectedOrder("");
//       setSelectedOrderDetails(null);
//     } catch (error) {
//       console.error("Error fetching purchase orders:", error);
//       alert("Error loading purchase orders");
//       setPurchaseOrders([]);
//       setSelectedOrder("");
//       setSelectedOrderDetails(null);
//     } finally {
//       setOrdersLoading(false);
//     }
//   };

//   const fetchOrderDetails = async (orderId) => {
//     if (!orderId) {
//       setSelectedOrderDetails(null);
//       return;
//     }

//     setDetailsLoading(true);
//     try {
//       const response = await Api.get(
//         `/purchase/purchase-orders/details/${orderId}`,
//       );
//       setSelectedOrderDetails(response.data.data);
//     } catch (error) {
//       console.error("Error fetching order details:", error);
//       alert("Error loading order details");
//       setSelectedOrderDetails(null);
//     } finally {
//       setDetailsLoading(false);
//     }
//   };

//   const fetchItems = async () => {
//     setItemsLoading(true);
//     try {
//       const response = await Api.get("/purchase/items");
//       setItems(response.data.items || []);
//     } catch (error) {
//       console.error("Error fetching items:", error);
//       alert("Error loading items");
//       setItems([]);
//     } finally {
//       setItemsLoading(false);
//     }
//   };

//   const fetchItemDetails = async (itemId) => {
//     try {
//       const response = await Api.get(`/purchase/items/details/${itemId}`);
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching item details for ID ${itemId}:`, error);
//       return null;
//     }
//   };

//   const fetchVendors = async () => {
//     setVendorsLoading(true);
//     try {
//       const response = await Api.get("/purchase/vendors");
//       setVendorsList(response?.data?.data || []);
//     } catch (error) {
//       console.error("Error fetching vendors:", error);
//       alert(
//         "Error loading vendors: " +
//           (error?.response?.data?.message || error?.message),
//       );
//     } finally {
//       setVendorsLoading(false);
//     }
//   };

//   const fetchWarehouses = async () => {
//     setWarehouseLoading(true);
//     try {
//       const res = await Api.get(`/purchase/warehouses`);
//       const formatted = res?.data?.data?.map((w) => ({
//         label: w.warehouseName,
//         value: w._id,
//         id: w._id,
//         name: w.warehouseName,
//       }));
//       setWarehouseList(formatted);
//     } catch (err) {
//       console.error("Error loading warehouses:", err);
//       alert("Error loading warehouses");
//     } finally {
//       setWarehouseLoading(false);
//     }
//   };

//   const fetchUnits = async () => {
//     setUnitsLoading(true);
//     try {
//       const response = await Api.get("/common/unit/view");
//       if (response.data.success) {
//         const formattedUnits = response?.data?.data?.map((unit) => ({
//           value: unit.id,
//           label: unit.name,
//           id: unit.id,
//           name: unit.name,
//         }));
//         setUnitTypes(formattedUnits);
//         return formattedUnits;
//       }
//     } catch (error) {
//       console.error("Error fetching units:", error);
//     } finally {
//       setUnitsLoading(false);
//     }
//   };

//   // ==================== Business Logic Functions ====================

//   const handleSendEmail = async (poId, poNumber) => {
//     if (!poId) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     const isConfirmed = window.confirm(
//       `Are you sure you want to send Purchase Order ${poNumber} via email?\n` +
//         `This will send the PO to the vendor's email address.`,
//     );

//     if (!isConfirmed) return;

//     setEmailLoading(true);
//     try {
//       const response = await Api.post(`/purchase/purchase-orders/send/${poId}`);

//       if (response.data.success) {
//         alert("Purchase order sent via email successfully!");

//         if (selectedOrderDetails && selectedOrderDetails.id === poId) {
//           setSelectedOrderDetails({
//             ...selectedOrderDetails,
//             status: "Sent",
//           });
//         }

//         poSearch(currentPage);
//       } else {
//         alert(
//           "Failed to send purchase order via email: " +
//             (response.data.message || "Unknown error"),
//         );
//       }
//     } catch (error) {
//       console.error("Error sending purchase order via email:", error);

//       if (error.response) {
//         if (error.response.status === 400) {
//           alert(
//             `Cannot send purchase order: ${
//               error.response.data.message ||
//               "Order may be in a state that cannot be sent."
//             }`,
//           );
//         } else if (error.response.status === 404) {
//           alert("Purchase order not found");
//         } else {
//           alert(
//             `Error sending purchase order: ${error.response.status} ${
//               error.response.data.message || "Unknown error"
//             }`,
//           );
//         }
//       } else if (error.request) {
//         alert("Network error. Please check your connection and try again.");
//       } else {
//         alert("Error sending purchase order. Please try again.");
//       }
//     } finally {
//       setEmailLoading(false);
//     }
//   };

//   const handleSendApproval = async (poId, poNumber) => {
//     if (!poId) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     const isConfirmed = window.confirm(
//       `Are you sure you want to send Purchase Order ${poNumber} via Approval?\n` +
//         `This will send the PO to the vendor's Approval PO.`,
//     );

//     if (!isConfirmed) return;

//     setApprovalLoading(true);
//     try {
//       const response = await Api.put(`/purchase/purchase-orders/${poId}/send-for-approval`);

//       if (response.data.success) {
//         alert("Purchase order sent via approval successfully!");
//         if (selectedOrderDetails && selectedOrderDetails.id === poId) {
//           setSelectedOrderDetails({
//             ...selectedOrderDetails,
//             status: "FOR SENDING PO FOR APPROVAL",
//           });
//         }
//         poSearch(currentPage);
//       } else {
//         alert(
//           "Failed to send purchase order via approval: " +
//             (response.data.message || "Unknown error"),
//         );
//       }
//     } catch (error) {
//       console.log("Error sending purchase order via approval:", error?.response?.data?.message || error?.message);

//       if (error.response) {
//         if (error.response.status === 400) {
//           alert(
//             `Cannot send purchase order: ${
//               error.response.data.message ||
//               "Order may be in a state that cannot be sent."
//             }`,
//           );
//         } else if (error.response.status === 404) {
//           alert("Purchase order not found");
//         } else {
//           alert(
//             `Error sending purchase order: ${error.response.status} ${
//               error.response.data.message || "Unknown error"
//             }`,
//           );
//         }
//       } else if (error.request) {
//         alert("Network error. Please check your connection and try again.");
//       } else {
//         alert("Error sending purchase order. Please try again.");
//       }
//     } finally {
//       setApprovalLoading(false);
//     }
//   };

//   const canCancelOrder = (orderDetails) => {
//     if (!orderDetails) return false;
//     const nonCancelableStatuses = [
//       "Cancelled",
//       "Completed",
//       "PartiallyReceived",
//       "Received",
//       "Update Order",
//       "Admin_Approved",
//       "Admin_Rejected",
//     ];
//     return !nonCancelableStatuses.includes(orderDetails.status);
//   };

//   const canSendEmail = (orderDetails) => {
//     if (!orderDetails) return false;
//     const sendableStatuses = ["Draft", "Approved", "Update Order"];
//     return sendableStatuses.includes(orderDetails.status);
//   };

//   const canSendApproval = (orderDetails) => {
//     if (!orderDetails) return false;
//     const sendableStatuses = ["Draft", "Approved", "Update Order"];
//     return sendableStatuses.includes(orderDetails.status);
//   };

//   const handleCancelOrder = async (poId) => {
//     if (!poId) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     const isConfirmed = window.confirm(
//       `Are you sure you want to cancel Purchase Order?\n` +
//         `This action cannot be undone.`,
//     );

//     if (!isConfirmed) return;

//     setCancelLoading(true);
//     try {
//       const response = await Api.put(
//         `/purchase/purchase-orders/cancel/${poId}`,
//       );

//       if (response.data.success) {
//         alert("Purchase order cancelled successfully!");

//         if (selectedOrderDetails && selectedOrderDetails.id === poId) {
//           setSelectedOrderDetails({
//             ...selectedOrderDetails,
//             status: "Cancelled",
//           });
//         }

//         if (selectedCompany) {
//           fetchPurchaseOrders(selectedCompany);
//         }
//         poSearch(currentPage);
//       } else {
//         alert(
//           "Failed to cancel purchase order: " +
//             (response.data.message || "Unknown error"),
//         );
//       }
//     } catch (error) {
//       console.error("Error cancelling purchase order:", error);

//       if (error.response) {
//         if (error.response.status === 400) {
//           alert(
//             `Cannot cancel purchase order: ${
//               error.response.data.message ||
//               "Order may be in a state that cannot be cancelled."
//             }`,
//           );
//         } else if (error.response.status === 404) {
//           alert("Purchase order not found");
//         } else {
//           alert(
//             `Error cancelling purchase order: ${error.response.status} ${
//               error.response.data.message || "Unknown error"
//             }`,
//           );
//         }
//       } else if (error.request) {
//         alert("Network error. Please check your connection and try again.");
//       } else {
//         alert("Error cancelling purchase order. Please try again.");
//       }
//     } finally {
//       setCancelLoading(false);
//     }
//   };

//   const handleReOrder = async (poId) => {
//     if (!poId) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     try {
//       const response = await Api.get(
//         `/purchase/purchase-orders/details/${poId}`,
//       );
//       const orderDetails = response.data.data;

//       if (!orderDetails) {
//         alert("Failed to fetch order details");
//         return;
//       }

//       const isForeignCurrency =
//         orderDetails.currency === "USD" ||
//         orderDetails.currency === "EUR" ||
//         orderDetails.currency === "GBP";

//       const reorderItems =
//         orderDetails.items?.map((item) => {
//           let rate, itemTotal, itemAmount;

//           if (isForeignCurrency && item.rateInForeign) {
//             rate = parseFloat(item.rateInForeign) || 0;
//             itemAmount = parseFloat(item.amountInForeign) || 0;
//             itemTotal = parseFloat(item.total) || 0;
//           } else {
//             rate = parseFloat(item.rate) || 0;
//             const quantity = parseFloat(item.quantity) || 1;
//             itemAmount = rate * quantity;
//             itemTotal = itemAmount;
//           }

//           const quantity = parseFloat(item.quantity) || 1;
//           const itemGstRate =
//             parseFloat(item.gstRate) || parseFloat(orderDetails.gstRate) || 0;

//           const taxableAmount = itemAmount;
//           const gstAmount = (taxableAmount * itemGstRate) / 100;
//           const totalAmount = taxableAmount + gstAmount;

//           return {
//             id: item.itemId || item.id,
//             source: item.itemSource || "mysql",
//             itemName: item.itemName || item.name || "",
//             hsnCode: item.hsnCode || "",
//             modelNumber: item.modelNumber || "",
//             unit: item.unit || "",
//             rate: rate.toString(),
//             rateInForeign: item.rateInForeign
//               ? item.rateInForeign.toString()
//               : "",
//             amountInForeign: item.amountInForeign
//               ? item.amountInForeign.toString()
//               : "",
//             quantity: item.quantity || "1",
//             gstRate: itemGstRate,
//             itemDetail: item.itemDetail || "",
//             total: itemTotal.toString(),
//             amount: taxableAmount.toString(),
//             taxableAmount: taxableAmount.toString(),
//             gstAmount: gstAmount.toString(),
//             totalAmount: totalAmount.toString(),
//           };
//         }) || [];

//       const reorderData = {
//         companyId: orderDetails.companyId,
//         vendorId: orderDetails.vendorId,
//         companyName: orderDetails.companyName,
//         vendorName: orderDetails.vendorName,
//         gstType: orderDetails.gstType,
//         gstRate: orderDetails.gstRate || "",
//         currency: orderDetails.currency || "INR",
//         exchangeRate: orderDetails.exchangeRate || "1",
//         paymentTerms: orderDetails.paymentTerms || "",
//         warehouseName: orderDetails.warehouseName || "",
//         deliveryTerms: orderDetails.deliveryTerms || "",
//         warranty: orderDetails.warranty || "",
//         contactPerson: orderDetails.contactPerson || "",
//         cellNo: orderDetails.cellNo || "",
//         poNumber: orderDetails.poNumber,
//         poDate: orderDetails.poDate,
//         items: reorderItems,
//         otherCharges: orderDetails.otherCharges || [],
//       };

//       navigate("/create-purchase-order", {
//         state: {
//           reorderData,
//           source: "reorder",
//         },
//       });
//     } catch (error) {
//       console.error("Error fetching order details for reorder:", error);
//       alert("Failed to fetch order details for reorder. Please try again.");
//     }
//   };

//   // handleUpdatePo – map API's itemId to our 'id' and set 'source' from itemSource
//   const handleUpdatePo = async (poData) => {
//     if (!poData || !poData.id) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     try {
//       const response = await Api.get(
//         `/purchase/purchase-orders/details/${poData.id}`,
//       );
//       const orderDetails = response?.data?.data;

//       if (!orderDetails) {
//         alert("Failed to fetch order details");
//         return;
//       }

//       if (unitTypes.length === 0) {
//         await fetchUnits();
//       }

//       if (warehouseList.length === 0) {
//         await fetchWarehouses();
//       }

//       if (vendorsList.length === 0) {
//         await fetchVendors();
//       }

//       setFormData({
//         companyId: orderDetails?.companyId || "",
//         vendorId: orderDetails.vendorId || "",
//         vendorName: orderDetails.vendorName || "",
//         gstType: orderDetails?.gstType || "",
//         items: orderDetails?.items
//           ? orderDetails?.items?.map((item) => ({
//               id: item?.itemId || "",
//               source: item?.itemSource || "mysql", // preserve source from API
//               name: item?.itemName || "",
//               hsnCode: item?.hsnCode || "",
//               modelNumber: item?.modelNumber || "",
//               itemDetail: item?.itemDetail || "",
//               unit: item?.unit || "",
//               quantity: item?.quantity || "1",
//               rate: item?.rate || "",
//               gstRate: item?.gstRate || "",
//               total: item?.total || "",
//             }))
//           : [],
//         otherCharges: orderDetails?.otherCharges
//           ? orderDetails?.otherCharges?.map((charge) => ({
//               name: charge?.name || "",
//               amount: charge?.amount || "",
//             }))
//           : [],
//         poNumber: orderDetails?.poNumber || "",
//         poDate: orderDetails?.poDate ? orderDetails?.poDate?.split("T")[0] : "",
//         paymentTerms: orderDetails?.paymentTerms || "",
//         deliveryTerms: orderDetails?.deliveryTerms || "",
//         contactPerson: orderDetails?.contactPerson || "",
//         cellNo: orderDetails?.cellNo || "",
//         gstRate: orderDetails?.gstRate || "",
//         currency: orderDetails?.currency || "INR",
//         exchangeRate: orderDetails?.exchangeRate || "1",
//         warranty: orderDetails?.warranty || "",
//         status: orderDetails?.status || "",
//         warehouseName: orderDetails.warehouseName || "",
//         warehouseId: orderDetails.warehouseId || "",
//         expectedDeliveryDate: orderDetails?.expectedDeliveryDate
//           ? orderDetails.expectedDeliveryDate.split("T")[0]
//           : "",
//       });

//       setSelectedOrder(poData.id);
//       setShowUpdateForm(true);
//       fetchItems();
//     } catch (error) {
//       console.log(
//         "Error fetching order details for update:",
//         error?.response?.data?.message,
//       );
//       alert("Failed to fetch order details for update. Please try again.");
//     }
//   };

//   // prepareUpdateForm – same mapping
//   const prepareUpdateForm = (orderDetails) => {
//     if (!orderDetails) return;

//     fetchUnits();

//     setFormData({
//       companyId: orderDetails.companyId || "",
//       vendorId: orderDetails.vendorId || "",
//       vendorName: orderDetails.vendorName || "",
//       gstType: orderDetails.gstType || "",
//       items: orderDetails.items
//         ? orderDetails.items.map((item) => ({
//             id: item.itemId || "",
//             source: item.itemSource || "mysql",
//             name: item.itemName || "",
//             hsnCode: item.hsnCode || "",
//             modelNumber: item.modelNumber || "",
//             itemDetail: item.itemDetail || "",
//             unit: item.unit || "",
//             quantity: item.quantity || "1",
//             rate: item.rate || "",
//             gstRate: item.gstRate || "",
//             total: item.total || "",
//           }))
//         : [],
//       otherCharges: orderDetails.otherCharges
//         ? orderDetails.otherCharges.map((charge) => ({
//             name: charge.name || "",
//             amount: charge.amount || "",
//           }))
//         : [],
//       poNumber: orderDetails.poNumber || "",
//       poDate: orderDetails.poDate ? orderDetails.poDate.split("T")[0] : "",
//       paymentTerms: orderDetails.paymentTerms || "",
//       deliveryTerms: orderDetails.deliveryTerms || "",
//       contactPerson: orderDetails.contactPerson || "",
//       cellNo: orderDetails.cellNo || "",
//       gstRate: orderDetails.gstRate || "",
//       currency: orderDetails.currency || "INR",
//       exchangeRate: orderDetails.exchangeRate || "1",
//       warranty: orderDetails.warranty || "",
//       status: orderDetails.status || "",
//       warehouseName: orderDetails.warehouseName || "",
//       warehouseId: orderDetails.warehouseId || "",
//       expectedDeliveryDate: orderDetails.expectedDeliveryDate
//         ? orderDetails.expectedDeliveryDate.split("T")[0]
//         : "",
//     });

//     setShowUpdateForm(true);
//     fetchItems();
//   };

//   const handleItemChange = (index, field, value) => {
//     const updatedItems = [...formData.items];
//     const currentItem = { ...updatedItems[index] };

//     currentItem[field] = value;

//     const quantity = parseFloat(currentItem.quantity) || 0;
//     const rate = parseFloat(currentItem.rate) || 0;
//     const total = parseFloat(currentItem.total) || 0;

//     if (field === "quantity") {
//       if (rate > 0 && quantity > 0) {
//         currentItem.total = (rate * quantity).toFixed(3);
//       } else if (total > 0 && quantity > 0) {
//         currentItem.rate = (total / quantity).toFixed(3);
//       }
//     } else if (field === "rate") {
//       if (quantity > 0 && rate > 0) {
//         currentItem.total = (rate * quantity).toFixed(3);
//       } else if (total > 0 && rate > 0) {
//         currentItem.quantity = Math.round(total / rate).toString();
//       }
//     } else if (field === "total") {
//       if (quantity > 0 && total > 0) {
//         currentItem.rate = (total / quantity).toFixed(3);
//       } else if (rate > 0 && total > 0) {
//         currentItem.quantity = Math.round(total / rate).toString();
//       }
//     }

//     updatedItems[index] = currentItem;

//     setFormData((prev) => ({
//       ...prev,
//       items: updatedItems,
//     }));
//   };

//   const handleUploadDoc = async (poData) => {
//     if (!poData || !poData.id) {
//       alert("Please select a purchase order first");
//       return;
//     }

//     try {
//       const response = await Api.get(
//         `/purchase/purchase-orders/details/${poData.id}`,
//       );
//       const orderDetails = response?.data?.data;

//       if (!orderDetails) {
//         alert("Failed to fetch order details");
//         return;
//       }

//       setInvoiceData({
//         vendorId: orderDetails.vendorId || "",
//         poId: orderDetails.id || "",
//         invoiceNumber: "",
//         invoiceFile: null
//       });

//       setShowUploadForm(true);

//     } catch (error) {
//       console.log(
//         "Error fetching order details for update:",
//         error?.response?.data?.message,
//       );
//       alert("Failed to fetch order details for update. Please try again.");
//     }
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
//       if (!allowedTypes.includes(file.type)) {
//         alert('Please upload a valid file (PDF, JPEG, PNG)');
//         return;
//       }

//       if (file.size > 10 * 1024 * 1024) {
//         alert('File size should be less than 10MB');
//         return;
//       }

//       setInvoiceData(prev => ({
//         ...prev,
//         invoiceFile: file
//       }));
//     }
//   };

//   const handleUploadSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!invoiceData.vendorId || !invoiceData.poId) {
//       alert("Missing vendor or purchase order information");
//       return;
//     }
    
//     if (!invoiceData.invoiceNumber) {
//       alert("Please enter invoice number");
//       return;
//     }
    
//     if (!invoiceData.invoiceFile) {
//       alert("Please select a file to upload");
//       return;
//     }

//     setUploadLoading(true);
    
//     try {
//       const formData = new FormData();
//       formData.append('vendorId', invoiceData.vendorId);
//       formData.append('poId', invoiceData.poId);
//       formData.append('invoiceNumber', invoiceData.invoiceNumber);
//       formData.append('invoiceFile', invoiceData.invoiceFile);

//       const response = await Api.post(
//         '/purchase/vendor/invoices/upload',
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data'
//           }
//         }
//       );

//       if (response.data.success) {
//         alert('Invoice uploaded successfully!');
//         setShowUploadForm(false);
//         setInvoiceData({
//           invoiceNumber: "",
//           invoiceFile: null,
//           vendorId: "",
//           poId: ""
//         });
        
//         if (selectedCompany) {
//           fetchPurchaseOrders(selectedCompany);
//         }
//         poSearch(currentPage);
//       } else {
//         alert('Failed to upload invoice: ' + (response.data.message || 'Unknown error'));
//       }
//     } catch (error) {
//       console.error('Error uploading invoice:', error);
//       if (error.response) {
//         alert(`Error uploading invoice: ${error.response.status} ${error.response.data.message || 'Unknown error'}`);
//       } else if (error.request) {
//         alert('Network error. Please check your connection and try again.');
//       } else {
//         alert('Error uploading invoice. Please try again.');
//       }
//     } finally {
//       setUploadLoading(false);
//     }
//   };

//   // handleUpdateSubmit – now we always send id (master item ID) and source
//   const handleUpdateSubmit = async (e) => {
//     e.preventDefault();

//     if (!selectedOrder) {
//       alert("No purchase order selected");
//       return;
//     }

//     if (!formData.vendorId) {
//       alert("Please select a vendor");
//       return;
//     }

//     if (isItemWiseGST) {
//       const itemsWithoutGstRate = formData.items.filter(
//         (item) =>
//           !item.gstRate ||
//           item.gstRate.trim() === "" ||
//           isNaN(parseFloat(item.gstRate)),
//       );

//       if (itemsWithoutGstRate.length > 0) {
//         alert("Please enter GST rate for all items when using Itemwise GST");
//         return;
//       }
//     }

//     const submitData = {
//       ...formData,
//       vendorId: formData.vendorId,
//       vendorName: formData.vendorName || "",
//       warehouseId: formData.warehouseId,
//       warehouseName: formData.warehouseName,
//       // items already have id (master ID) and source
//     };

//     setUpdateLoading(true);
//     try {
//       const response = await Api.put(
//         `/purchase/purchase-orders/update/${selectedOrder}`,
//         submitData,
//       );

//       if (response.data.success) {
//         alert("Purchase order updated successfully!");
//         setShowUpdateForm(false);
//         if (selectedCompany) {
//           fetchPurchaseOrders(selectedCompany);
//         }
//         poSearch(currentPage);
//         if (selectedOrderDetails && selectedOrderDetails.id === selectedOrder) {
//           fetchOrderDetails(selectedOrder);
//         }
//       } else {
//         alert(
//           "Failed to update purchase order: " +
//             (response.data.message || "Unknown error"),
//         );
//       }
//     } catch (error) {
//       console.error("Error updating purchase order:", error);

//       if (error.response) {
//         alert(
//           `Error updating purchase order: ${error.response.status} ${
//             error.response.data.message || "Unknown error"
//           }`,
//         );
//       } else if (error.request) {
//         alert("Network error. Please check your connection and try again.");
//       } else {
//         alert("Error updating purchase order. Please try again.");
//       }
//     } finally {
//       setUpdateLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;

//     if (name === "currency" && value === "INR") {
//       setFormData((prev) => ({
//         ...prev,
//         currency: value,
//         exchangeRate: "1",
//       }));
//     } else if (name === "gstType") {
//       const newIsItemWiseGST =
//         value === "IGST_ITEMWISE" || value === "LGST_ITEMWISE";

//       setFormData((prev) => {
//         const updatedItems = prev.items.map((item) => {
//           if (!newIsItemWiseGST) {
//             const { gstRate, ...rest } = item;
//             return rest;
//           }
//           return item;
//         });

//         return {
//           ...prev,
//           [name]: value,
//           items: updatedItems,
//         };
//       });
//     } else {
//       setFormData((prev) => ({
//         ...prev,
//         [name]: value,
//       }));
//     }
//   };

//   // handleItemSelect – set id to master item ID and source from selected item
//   const handleItemSelect = async (index, selectedItem) => {
//     setLoadingItems((prev) => ({ ...prev, [index]: true }));

//     setFormData((prev) => {
//       const newItems = [...prev.items];
//       newItems[index] = {
//         ...newItems[index],
//         id: selectedItem.id,
//         source: selectedItem.source || "mysql", // set source from master item
//         name: selectedItem.name || "",
//         hsnCode: selectedItem.hsnCode || "",
//         modelNumber: selectedItem.modelNumber || "",
//         unit: selectedItem.unit || "",
//         rate: selectedItem.rate || "",
//         itemDetail: selectedItem.itemDetail || selectedItem.description || "",
//       };

//       const rate = parseFloat(newItems[index].rate) || 0;
//       const quantity = parseFloat(newItems[index].quantity) || 1;
//       newItems[index].total = (rate * quantity).toFixed(3);

//       return {
//         ...prev,
//         items: newItems,
//       };
//     });

//     // Fetch additional details from API (optional)
//     try {
//       const itemDetailsResponse = await fetchItemDetails(selectedItem.id);
//       if (itemDetailsResponse && itemDetailsResponse.success) {
//         const detailedItem = itemDetailsResponse.item;
//         setFormData((prev) => {
//           const newItems = [...prev.items];
//           if (newItems[index] && newItems[index].id === selectedItem.id) {
//             newItems[index] = {
//               ...newItems[index],
//               hsnCode: newItems[index].hsnCode || detailedItem.hsnCode || "",
//               unit: detailedItem.unit || newItems[index].unit || "",
//               itemDetail: detailedItem.description || newItems[index].itemDetail || "",
//             };
//           }
//           return {
//             ...prev,
//             items: newItems,
//           };
//         });
//       }
//     } catch (error) {
//       console.error("Error fetching item details from API:", error);
//     } finally {
//       setLoadingItems((prev) => ({ ...prev, [index]: false }));
//     }

//     setShowItemsDropdown(null);
//     setSearchQuery("");
//   };

//   const handleChargeChange = (index, field, value) => {
//     const updatedCharges = [...formData.otherCharges];
//     updatedCharges[index] = {
//       ...updatedCharges[index],
//       [field]: value,
//     };

//     setFormData((prev) => ({
//       ...prev,
//       otherCharges: updatedCharges,
//     }));
//   };

//   // addNewItem – id empty, source empty (will be set on selection)
//   const addNewItem = () => {
//     setFormData((prev) => ({
//       ...prev,
//       items: [
//         ...prev.items,
//         {
//           id: "",
//           source: "",
//           name: "",
//           hsnCode: "",
//           modelNumber: "",
//           itemDetail: "",
//           unit: "",
//           quantity: "1",
//           rate: "",
//           gstRate: isItemWiseGST ? "" : undefined,
//           total: "",
//         },
//       ],
//     }));
//   };

//   const removeItem = (index) => {
//     const updatedItems = formData.items.filter((_, i) => i !== index);
//     setFormData((prev) => ({
//       ...prev,
//       items: updatedItems,
//     }));
//   };

//   const addNewCharge = () => {
//     setFormData((prev) => ({
//       ...prev,
//       otherCharges: [
//         ...prev.otherCharges,
//         {
//           name: "",
//           amount: "",
//         },
//       ],
//     }));
//   };

//   const removeCharge = (index) => {
//     const updatedCharges = formData.otherCharges.filter((_, i) => i !== index);
//     setFormData((prev) => ({
//       ...prev,
//       otherCharges: updatedCharges,
//     }));
//   };

//   const handleDownload = async (poId, poName) => {
//     if (!poId) return;

//     setDownloadLoading(true);
//     try {
//       const response = await Api.post(
//         `/purchase/purchase-orders/download/${poId}`,
//         {},
//         {
//           responseType: "blob",
//         },
//       );

//       const blob = new Blob([response.data], {
//         type: response.headers["content-type"] || "application/pdf",
//       });

//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;

//       const fileName = `${poName}.pdf`;
//       link.setAttribute("download", fileName);

//       document.body.appendChild(link);
//       link.click();

//       link.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error downloading PDF:", error);

//       if (error.response) {
//         if (error.response.status === 404) {
//           alert("PDF file not found for this purchase order");
//         } else if (error.response.status === 500) {
//           alert("Server error while generating PDF. Please try again.");
//         } else {
//           alert(
//             `Error downloading PDF: ${error.response.status} ${error.response.statusText}`,
//           );
//         }
//       } else if (error.request) {
//         alert("Network error. Please check your connection and try again.");
//       } else {
//         alert("Error downloading PDF. Please try again.");
//       }
//     } finally {
//       setDownloadLoading(false);
//     }
//   };

//   const calculateTotals = (orderDetails) => {
//     if (!orderDetails) {
//       return {
//         itemsTotal: 0,
//         otherChargesTotal: 0,
//         subtotal: 0,
//         gstAmount: 0,
//         grandTotal: 0,
//       };
//     }

//     if (orderDetails.subTotal && orderDetails.grandTotal) {
//       const itemsTotal = (orderDetails.items || []).reduce(
//         (sum, item) => sum + Number(item.total || 0),
//         0,
//       );

//       const otherChargesTotal = (orderDetails.otherCharges || []).reduce(
//         (sum, charge) => sum + Number(charge.amount || 0),
//         0,
//       );

//       const subtotal = Number(orderDetails.subTotal);
//       const grandTotal = Number(orderDetails.grandTotal);
//       const gstAmount = grandTotal - subtotal;

//       return {
//         itemsTotal: Number(itemsTotal.toFixed(3)),
//         otherChargesTotal: Number(otherChargesTotal.toFixed(3)),
//         subtotal: Number(subtotal.toFixed(3)),
//         gstAmount: Number(gstAmount.toFixed(3)),
//         grandTotal: Number(grandTotal.toFixed(3)),
//       };
//     }

//     const itemsTotal = (orderDetails.items || []).reduce(
//       (sum, item) => sum + Number(item.total || 0),
//       0,
//     );

//     const otherChargesTotal = (orderDetails.otherCharges || []).reduce(
//       (sum, charge) => sum + Number(charge.amount || 0),
//       0,
//     );

//     const subtotal = itemsTotal + otherChargesTotal;

//     const gstRate = Number(orderDetails.gstRate || 0);
//     const gstAmount = (subtotal * gstRate) / 100;

//     const grandTotal = subtotal + gstAmount;

//     return {
//       itemsTotal: Number(itemsTotal.toFixed(3)),
//       otherChargesTotal: Number(otherChargesTotal.toFixed(3)),
//       subtotal: Number(subtotal.toFixed(3)),
//       gstAmount: Number(gstAmount.toFixed(3)),
//       grandTotal: Number(grandTotal.toFixed(3)),
//     };
//   };

//   const handleCompanyChange = (companyId) => {
//     setSelectedCompany(companyId);
//     fetchPurchaseOrders(companyId);
//     setCurrentPage(1);
//   };

//   const handleOrderChange = (orderId) => {
//     setSelectedOrder(orderId);
//     if (orderId) {
//       fetchOrderDetails(orderId);
//     } else {
//       setSelectedOrderDetails(null);
//     }
//   };

//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   };

//   const formatCurrency = (amount) => {
//     if (!amount) return "0.00";
//     return parseFloat(amount).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });
//   };

//   const formatForeignCurrency = (amount, currency) => {
//     if (!amount) return "0.00";
//     const formattedAmount = parseFloat(amount).toLocaleString("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     });

//     if (currency === "USD") {
//       return `$${formattedAmount}`;
//     } else if (currency === "EUR") {
//       return `€${formattedAmount}`;
//     } else if (currency === "GBP") {
//       return `£${formattedAmount}`;
//     } else if (currency === "CNY") {
//       return `¥${formattedAmount}`;
//     } else if (currency === "AED") {
//       return `د.إ${formattedAmount}`;
//     } else {
//       return `${currency} ${formattedAmount}`;
//     }
//   };

//   const getStatusColor = (status) => {
//     const statusOption = statusOptions.find((s) => s.value === status);
//     return statusOption ? statusOption.color : "bg-gray-100 text-gray-800";
//   };

//   const getStatusLabel = (status) => {
//     const statusOption = statusOptions.find((s) => s.value === status);
//     return statusOption ? statusOption.label : status;
//   };

//   const poSearch = async (page = 1) => {
//     setSrcBtnDisabled(true);
//     const API_URL = "/purchase/purchase-orders/show?";
//     let queryParams = [];

//     if (poNumber) queryParams.push(`poNumber=${encodeURIComponent(poNumber)}`);
//     if (selectedCompany)
//       queryParams.push(`company=${encodeURIComponent(selectedCompany)}`);
//     if (vendor) queryParams.push(`vendor=${encodeURIComponent(vendor)}`);
//     if (item) queryParams.push(`itemName=${encodeURIComponent(item)}`);

//     queryParams.push(`page=${page}`);
//     queryParams.push(`limit=${itemsPerPage}`);

//     const finalURL = API_URL + queryParams.join("&");

//     try {
//       const response = await Api.get(finalURL);

//       if (response && response.data && response.data.success) {
//         const mappedData = response.data.data.map((po) => ({
//           id: po.id,
//           poNumber: po.poNumber,
//           poDate: po.poDate,
//           companyName: po.companyName,
//           vendorName: po.vendorName,
//           items: po.items || [],
//           status: po.status,
//           expectedDeliveryDate: po.expectedDeliveryDate,
//           currency: po.currency,
//           foreignGrandTotal: po.foreignGrandTotal,
//           grandTotal: po.grandTotal,
//           displayGrandTotal: po.displayGrandTotal,
//         }));

//         setPoListing(mappedData);
//         setTotalItems(response.data.pagination?.total || 0);
//         setTotalPages(response.data.pagination?.totalPages || 1);
//         setCurrentPage(page);
//       }
//     } catch (error) {
//       console.error("Error fetching purchase orders:", error);
//       alert("Error loading purchase orders");
//       setPoListing([]);
//     } finally {
//       setSrcBtnDisabled(false);
//     }
//   };

//   const handlePageChange = (page) => {
//     poSearch(page);
//   };

//   const handleItemsPerPageChange = (e) => {
//     const newItemsPerPage = parseInt(e.target.value);
//     setItemsPerPage(newItemsPerPage);
//     setCurrentPage(1);
//     poSearch(1);
//   };

//   const getPaginationRange = () => {
//     const totalPageNumbers = 5;
//     const startPage = Math.max(
//       1,
//       currentPage - Math.floor(totalPageNumbers / 2),
//     );
//     const endPage = Math.min(totalPages, startPage + totalPageNumbers - 1);

//     const pages = [];
//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(i);
//     }
//     return pages;
//   };

//   const PO_Table_Heading = [
//     "SR.No.",
//     "PO Number",
//     "Company",
//     "Vendor",
//     "Status",
//     "Actions",
//   ];

//   useEffect(() => {
//     fetchCompanies();
//     fetchWarehouses();
//     fetchUnits();
//     fetchVendors();
//     poSearch(1);
//   }, []);

//   useEffect(() => {
//     if (formData.currency === "INR") {
//       setFormData((prev) => ({
//         ...prev,
//         exchangeRate: "1",
//       }));
//     }
//   }, [formData.currency]);

//   const totals = selectedOrderDetails
//     ? calculateTotals(selectedOrderDetails)
//     : {};

//   const isForeignCurrency =
//     selectedOrderDetails &&
//     (selectedOrderDetails.currency === "USD" ||
//       selectedOrderDetails.currency === "EUR" ||
//       selectedOrderDetails.currency === "GBP" ||
//       selectedOrderDetails.currency === "CNY" ||
//       selectedOrderDetails.currency === "AED");

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
//       <div className="max-w-7xl mx-auto py-4">
//         {/* Hero Section */}
//         <div className="text-center mb-2">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">
//             View Purchase Order
//           </h1>
//         </div>

//         {/* Search Section */}
//         <div className="flex gap-3 mb-3">
//           <NormalInput
//             label="PO Number"
//             value={poNumber}
//             setterFun={setPoNumber}
//             placeholder="Enter PO Number"
//             name="poNumber"
//             className="p-2"
//           />
//           <div>
//             <label className="text-sm font-semibold text-gray-800 mb-1">
//               Select Company
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedCompany}
//                 onChange={(e) => handleCompanyChange(e.target.value)}
//                 className="p-2 border rounded-md border-gray-300 bg-white"
//                 disabled={loading}
//               >
//                 <option value=""> Select Company </option>
//                 {companies.map((company) => (
//                   <option key={company.id} value={company.id}>
//                     {company.companyName}
//                   </option>
//                 ))}
//               </select>
//               {loading && (
//                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
//                   <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
//                 </div>
//               )}
//             </div>
//           </div>
//           <NormalInput
//             label="Vendor"
//             value={vendor}
//             setterFun={setVendor}
//             placeholder="Enter Vendor Name"
//             name="vendor"
//             className="p-2"
//           />
//           <NormalInput
//             label="Item"
//             value={item}
//             setterFun={setItem}
//             placeholder="Enter Item Name"
//             name="item"
//             className="p-2"
//           />
//           <ButtonWithIcon
//             icon={<HiSearch />}
//             onClick={() => poSearch(1)}
//             className="rounded-md h-10 mt-6 w-12 bg-yellow-400 hover:bg-yellow-500 text-dark text-xl px-3"
//             disabled={srcBtnDisabled}
//           />
//         </div>

//         {/* Pagination Controls */}
//         <div className="flex flex-col md:flex-row justify-between items-center mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
//           <div className="flex items-center space-x-4 mb-3 md:mb-0">
//             <div className="text-sm text-gray-700">
//               Showing{" "}
//               <span className="font-semibold">
//                 {(currentPage - 1) * itemsPerPage + 1}
//               </span>{" "}
//               to{" "}
//               <span className="font-semibold">
//                 {Math.min(currentPage * itemsPerPage, totalItems)}
//               </span>{" "}
//               of <span className="font-semibold">{totalItems}</span> Purchase
//               Orders
//             </div>

//             <div className="flex items-center space-x-2">
//               <label className="text-sm text-gray-600">Items per page:</label>
//               <select
//                 value={itemsPerPage}
//                 onChange={handleItemsPerPageChange}
//                 className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//               >
//                 <option value="5">5</option>
//                 <option value="10">10</option>
//                 <option value="20">20</option>
//                 <option value="50">50</option>
//                 <option value="100">100</option>
//               </select>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M15 19l-7-7 7-7"
//                 />
//               </svg>
//             </button>

//             {getPaginationRange().map((page) => (
//               <button
//                 key={page}
//                 onClick={() => handlePageChange(page)}
//                 className={`px-3 py-1.5 min-w-[40px] border rounded-md transition-colors ${
//                   currentPage === page
//                     ? "bg-blue-600 text-white border-blue-600"
//                     : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                 }`}
//               >
//                 {page}
//               </button>
//             ))}

//             <button
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//             >
//               <svg
//                 className="w-5 h-5"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 5l7 7-7 7"
//                 />
//               </svg>
//             </button>

//             <div className="text-sm text-gray-600 ml-4">
//               Page <span className="font-semibold">{currentPage}</span> of{" "}
//               <span className="font-semibold">{totalPages}</span>
//             </div>
//           </div>
//         </div>

//         {/* PO list */}
//         <div>
//           <table className="min-w-full bg-white shadow-md rounded-lg overflow-scroll text-center">
//             <TableHeading list={PO_Table_Heading} />
//             <tbody>
//               {poListing.length === 0 ? (
//                 <tr>
//                   <td colSpan={6} className="text-center py-4 text-gray-500">
//                     No Purchase Orders found.
//                   </td>
//                 </tr>
//               ) : (
//                 poListing.map((po, index) => (
//                   <tr key={po.id} className="border-b hover:bg-gray-100">
//                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
//                       {(currentPage - 1) * itemsPerPage + index + 1}
//                     </td>
//                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
//                       {po?.poNumber || "N/A"}
//                     </td>
//                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
//                       {po?.companyName || "N/A"}
//                     </td>
//                     <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
//                       {po?.vendorName || "N/A"}
//                     </td>
//                     <td className="px-2 py-2 whitespace-nowrap">
//                       <span
//                         className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
//                           po?.status,
//                         )}`}
//                       >
//                         {getStatusLabel(po?.status)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap cursor-pointer flex gap-2">
//                       {po?.status === "Draft" ? (
//                         <ButtonWithIcon
//                           onClick={() => handleUpdatePo(po)}
//                           icon={<HiPencilAlt />}
//                           className="p-2 text-white rounded-md bg-green-600 hover:bg-green-800"
//                         />
//                       ) : (
//                         <div className="w-8"></div>
//                       )}
//                       {canCancelOrder(po) && (
//                         <ButtonWithIcon
//                           onClick={() => handleCancelOrder(po?.id)}
//                           icon={<MdCancelPresentation />}
//                           className="p-2 text-white rounded-md bg-red-600 hover:bg-red-800"
//                         />
//                       )}
//                       <ButtonWithIcon
//                         onClick={() => handleReOrder(po?.id)}
//                         icon={<AiOutlineSync />}
//                         className="p-2 text-white rounded-md bg-violet-500 hover:bg-violet-800"
//                       />
//                       {canSendEmail(po) && (
//                         <ButtonWithIcon
//                           onClick={() => handleSendEmail(po.id, po?.poNumber)}
//                           disabled={emailLoading}
//                           icon={<MdEmail />}
//                           className="p-2 text-white rounded-md bg-teal-500 hover:bg-teal-700"
//                         />
//                       )}

//                       {canSendApproval(po) && (
//                         <ButtonWithIcon
//                           onClick={() => handleSendApproval(po.id, po?.poNumber)}
//                           disabled={approvalLoading}
//                           icon={<FiSend  />}
//                           className="p-2 text-white rounded-md bg-teal-500 hover:bg-teal-700"
//                         />
//                       )}
//                       <ButtonWithIcon
//                         onClick={() => handleDownload(po.id, po?.poNumber)}
//                         disabled={downloadLoading}
//                         icon={<FaCloudDownloadAlt />}
//                         className="p-2 text-white rounded-md bg-blue-500 hover:bg-blue-800"
//                       />
//                       {po?.status !== "UploadDoc" && po?.status !== "Received" && po?.status !== "Cancelled" && (
//                         <ButtonWithIcon
//                           onClick={() => handleUploadDoc(po)}
//                           icon={<MdDriveFolderUpload />}
//                           className="p-2 text-white rounded-md bg-orange-600 hover:bg-orange-700"
//                         />
//                       )}
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Bottom Pagination Controls */}
//         <div className="flex justify-center mt-6">
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
//             >
//               <svg
//                 className="w-5 h-5 mr-1"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M15 19l-7-7 7-7"
//                 />
//               </svg>
//               Previous
//             </button>

//             <div className="flex space-x-1">
//               {getPaginationRange().map((page) => (
//                 <button
//                   key={page}
//                   onClick={() => handlePageChange(page)}
//                   className={`px-3 py-1.5 min-w-[40px] border rounded-md transition-colors ${
//                     currentPage === page
//                       ? "bg-blue-600 text-white border-blue-600"
//                       : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                   }`}
//                 >
//                   {page}
//                 </button>
//               ))}
//             </div>

//             <button
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
//             >
//               Next
//               <svg
//                 className="w-5 h-5 ml-1"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 5l7 7-7 7"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>

//         {/* Order Details Section */}
//         {selectedOrder && selectedOrderDetails && (
//           <div className="space-y-6">
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//               <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
//                     <svg
//                       className="w-6 h-6 text-blue-600"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                       />
//                     </svg>
//                   </div>
//                   <div>
//                     <h2 className="text-xl font-bold text-gray-900">
//                       Purchase Order: {selectedOrderDetails.poNumber}
//                     </h2>
//                     <div className="flex flex-wrap items-center gap-2 mt-1">
//                       <span className="text-sm text-gray-600">
//                         Date: {formatDate(selectedOrderDetails.poDate)}
//                       </span>
//                       <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
//                         {selectedOrderDetails.companyName}
//                       </span>
//                       <span
//                         className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(
//                           selectedOrderDetails.status,
//                         )}`}
//                       >
//                         {getStatusLabel(selectedOrderDetails.status)}
//                       </span>
//                       <span className="text-sm text-gray-600">
//                         Vendor: {selectedOrderDetails.vendorName}
//                       </span>
//                       {isForeignCurrency && (
//                         <span className="text-sm px-3 py-1 rounded-full font-medium bg-indigo-100 text-indigo-800">
//                           Currency: {selectedOrderDetails.currency}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-3">
//                   {selectedOrderDetails.status === "Cancelled" ? (
//                     <button
//                       className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                       onClick={() => handleDownload(selectedOrderDetails.id)}
//                       disabled={downloadLoading}
//                     >
//                       {downloadLoading ? (
//                         <>
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                           Downloading...
//                         </>
//                       ) : (
//                         <>
//                           <svg
//                             className="w-4 h-4 mr-2"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                             />
//                           </svg>
//                           Download
//                         </>
//                       )}
//                     </button>
//                   ) : (
//                     <>
//                       {selectedOrderDetails.status !== "Update Order" &&
//                         selectedOrderDetails.status !== "Received" && (
//                           <button
//                             className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center"
//                             onClick={() =>
//                               prepareUpdateForm(selectedOrderDetails)
//                             }
//                           >
//                             <svg
//                               className="w-4 h-4 mr-2"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
//                               />
//                             </svg>
//                             Update Order
//                           </button>
//                         )}

//                       {selectedOrderDetails.status !== "UploadDoc" && selectedOrderDetails.status !== "Received" && selectedOrderDetails.status !== "Cancelled" && (
//                         <button
//                           className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center"
//                           onClick={() =>
//                             handleUploadDoc(selectedOrderDetails)
//                           }
//                         >
//                           <MdDriveFolderUpload className="w-4 h-4 mr-2" />
//                           Upload Document
//                         </button>
//                       )}

//                       {canSendEmail(selectedOrderDetails) && (
//                         <button
//                           className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                           onClick={() =>
//                             handleSendEmail(
//                               selectedOrderDetails.id,
//                               selectedOrderDetails.poNumber,
//                             )
//                           }
//                           disabled={emailLoading}
//                         >
//                           {emailLoading ? (
//                             <>
//                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                               Sending...
//                             </>
//                           ) : (
//                             <>
//                               <svg
//                                 className="w-4 h-4 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                                 />
//                               </svg>
//                               Send Email
//                             </>
//                           )}
//                         </button>
//                       )}

//                       {canSendApproval(selectedOrderDetails) && (
//                         <button
//                           className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                           onClick={() =>
//                             handleSendApproval(
//                               selectedOrderDetails.id,
//                               selectedOrderDetails.poNumber,
//                             )
//                           }
//                           disabled={approvalLoading}
//                         >
//                           {approvalLoading ? (
//                             <>
//                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                               Sending...
//                             </>
//                           ) : (
//                             <>
//                               <svg
//                                 className="w-4 h-4 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
//                                 />
//                               </svg>
//                               Send Approval
//                             </>
//                           )}
//                         </button>
//                       )}

//                       {selectedOrderDetails.status !== "Update Order" && (
//                         <button
//                           className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-medium flex items-center justify-center"
//                           onClick={() => handleReOrder(selectedOrderDetails.id)}
//                         >
//                           <svg
//                             className="w-4 h-4 mr-2"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//                             />
//                           </svg>
//                           ReOrder
//                         </button>
//                       )}

//                       {canCancelOrder(selectedOrderDetails) && (
//                         <button
//                           className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                           onClick={() =>
//                             handleCancelOrder(selectedOrderDetails.id)
//                           }
//                           disabled={cancelLoading}
//                         >
//                           {cancelLoading ? (
//                             <>
//                               <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                               Cancelling...
//                             </>
//                           ) : (
//                             <>
//                               <svg
//                                 className="w-4 h-4 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M6 18L18 6M6 6l12 12"
//                                 />
//                               </svg>
//                               Cancel
//                             </>
//                           )}
//                         </button>
//                       )}

//                       <button
//                         className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
//                         onClick={() => handleDownload(selectedOrderDetails.id)}
//                         disabled={downloadLoading}
//                       >
//                         {downloadLoading ? (
//                           <>
//                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                             Downloading...
//                           </>
//                         ) : (
//                           <>
//                             <svg
//                               className="w-4 h-4 mr-2"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                               />
//                             </svg>
//                             Download
//                           </>
//                         )}
//                       </button>
//                     </>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {detailsLoading ? (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
//                 <p className="text-gray-600">Loading order details...</p>
//               </div>
//             ) : (
//               <>
//                 {/* Basic Information */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                   <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200 flex items-center">
//                     <svg
//                       className="w-5 h-5 mr-2 text-gray-500"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                       />
//                     </svg>
//                     Basic Information
//                   </h3>
//                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Vendor Name
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.vendorName || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Contact Person
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.contactPerson || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Contact Number
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.cellNo || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         GST Type
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.gstType || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Currency
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.currency || "INR"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Warehouse Name
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.warehouseName || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Exchange Rate
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.exchangeRate || "1"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Payment Terms
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.paymentTerms || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Delivery Terms
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.deliveryTerms || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Warranty
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.warranty || "N/A"}
//                       </div>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-600 mb-2">
//                         Expected Delivery Date
//                       </label>
//                       <div className="text-base font-semibold text-gray-900">
//                         {selectedOrderDetails.expectedDeliveryDate
//                           ? formatDate(selectedOrderDetails.expectedDeliveryDate)
//                           : "N/A"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Items Section */}
//                 <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                   <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
//                     <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                       <svg
//                         className="w-5 h-5 mr-2 text-gray-500"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
//                         />
//                       </svg>
//                       Item Details
//                     </h3>
//                     <div className="flex items-center gap-4">
//                       {isForeignCurrency && (
//                         <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
//                           {selectedOrderDetails.currency} Currency
//                         </span>
//                       )}
//                       <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
//                         {selectedOrderDetails.items?.length || 0} Items
//                       </span>
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     {selectedOrderDetails.items &&
//                     selectedOrderDetails.items.length > 0 ? (
//                       selectedOrderDetails.items.map((item, index) => (
//                         <div
//                           key={item.id || index}
//                           className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all duration-200"
//                         >
//                           <div className="flex items-center justify-between mb-4">
//                             <div className="flex items-center">
//                               <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
//                                 {index + 1}
//                               </div>
//                               <div>
//                                 <h4 className="font-semibold text-gray-900">
//                                   {item.itemName || "Unnamed Item"}
//                                 </h4>
//                                 {item.hsnCode && (
//                                   <p className="text-sm text-gray-600">
//                                     HSN: {item.hsnCode}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                           </div>

//                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
//                             <div>
//                               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Unit
//                               </label>
//                               <div className="font-medium text-gray-900">
//                                 {item.unit || "N/A"}
//                               </div>
//                             </div>
//                             <div>
//                               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Quantity
//                               </label>
//                               <div className="font-medium text-gray-900">
//                                 {item.quantity || "0"}
//                               </div>
//                             </div>
//                             <div>
//                               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Rate{" "}
//                                 {isForeignCurrency
//                                   ? `(${selectedOrderDetails.currency})`
//                                   : "(₹)"}
//                               </label>
//                               <div className="font-medium text-gray-900">
//                                 {isForeignCurrency
//                                   ? formatForeignCurrency(
//                                       item.rateInForeign || item.rate,
//                                       selectedOrderDetails.currency,
//                                     )
//                                   : `₹${formatCurrency(item.rate)}`}
//                               </div>
//                             </div>
//                             <div>
//                               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                 Model
//                               </label>
//                               <div className="font-medium text-gray-900">
//                                 {item.modelNumber || "N/A"}
//                               </div>
//                             </div>
//                           </div>

//                           {isForeignCurrency && item.amountInForeign && (
//                             <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
//                               <div className="grid grid-cols-2 gap-4">
//                                 <div>
//                                   <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                     Amount in {selectedOrderDetails.currency}
//                                   </label>
//                                   <div className="font-semibold text-indigo-700">
//                                     {formatForeignCurrency(
//                                       item.amountInForeign,
//                                       selectedOrderDetails.currency,
//                                     )}
//                                   </div>
//                                 </div>
//                                 <div>
//                                   <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
//                                     Amount in INR
//                                   </label>
//                                   <div className="font-semibold text-gray-900">
//                                     ₹
//                                     {formatCurrency(
//                                       (parseFloat(item.amountInForeign) || 0) *
//                                         (parseFloat(
//                                           selectedOrderDetails.exchangeRate,
//                                         ) || 1),
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {item.itemDetail && (
//                             <div className="mt-3 pt-3 border-t border-gray-100">
//                               <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
//                                 Description
//                               </label>
//                               <div className="text-sm text-gray-700">
//                                 {item.itemDetail}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       ))
//                     ) : (
//                       <div className="text-center py-8">
//                         <svg
//                           className="w-12 h-12 text-gray-300 mx-auto mb-3"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
//                           />
//                         </svg>
//                         <p className="text-gray-500">
//                           No items found in this purchase order
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 {/* Other Charges Section */}
//                 {selectedOrderDetails.otherCharges &&
//                   selectedOrderDetails.otherCharges.length > 0 && (
//                     <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
//                       <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
//                         <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                           <svg
//                             className="w-5 h-5 mr-2 text-gray-500"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                             />
//                           </svg>
//                           Other Charges
//                         </h3>
//                         <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
//                           {selectedOrderDetails.otherCharges.length} Charges
//                         </span>
//                       </div>

//                       <div className="space-y-3">
//                         {selectedOrderDetails.otherCharges.map(
//                           (charge, index) => (
//                             <div
//                               key={index}
//                               className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
//                             >
//                               <div className="flex items-center">
//                                 <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-md flex items-center justify-center text-xs font-semibold mr-3">
//                                   {index + 1}
//                                 </div>
//                                 <div className="font-medium text-gray-900">
//                                   {charge.name || "Unnamed Charge"}
//                                 </div>
//                               </div>
//                               <div className="font-semibold text-blue-600">
//                                 ₹{formatCurrency(charge.amount)}
//                               </div>
//                             </div>
//                           ),
//                         )}
//                       </div>
//                     </div>
//                   )}
//               </>
//             )}
//           </div>
//         )}

//         {selectedCompany &&
//           !selectedOrder &&
//           purchaseOrders.length === 0 &&
//           !ordersLoading && (
//             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
//               <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
//                 <svg
//                   className="w-10 h-10 text-blue-600"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                   />
//                 </svg>
//               </div>
//               <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                 No Purchase Orders
//               </h3>
//             </div>
//           )}

//         {/* Update Form Modal */}
//         {showUpdateForm && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
//             <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
//               {/* Modal Header */}
//               <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
//                       <svg
//                         className="w-5 h-5 text-blue-600"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
//                         />
//                       </svg>
//                     </div>
//                     <div>
//                       <h2 className="text-xl font-bold text-gray-900">
//                         Update Purchase Order
//                       </h2>
//                       <p className="text-sm text-gray-600">
//                         <b>PO Number</b> : {formData.poNumber} <b>PO Date</b>:{" "}
//                         {formData.poDate}
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
//                     onClick={() => setShowUpdateForm(false)}
//                   >
//                     <svg
//                       className="w-5 h-5 text-gray-500"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M6 18L18 6M6 6l12 12"
//                       />
//                     </svg>
//                   </button>
//                 </div>
//               </div>

//               {/* Modal Content */}
//               <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
//                 <form onSubmit={handleUpdateSubmit} className="space-y-6">
//                   {/* Basic Information */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
//                       <svg
//                         className="w-5 h-5 mr-2 text-gray-500"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                         />
//                       </svg>
//                       Basic Information
//                     </h3>
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Vendor <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                           name="vendorId"
//                           value={formData.vendorId}
//                           onChange={(e) => {
//                             const selectedVendor = vendorsList.find(
//                               (v) => v.id === e.target.value,
//                             );
//                             setFormData((prev) => ({
//                               ...prev,
//                               vendorId: e.target.value,
//                               vendorName: selectedVendor
//                                 ? selectedVendor.displayName
//                                 : "",
//                             }));
//                           }}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                           required
//                         >
//                           <option value="">Select Vendor</option>
//                           {vendorsLoading ? (
//                             <option value="" disabled>
//                               Loading vendors...
//                             </option>
//                           ) : (
//                             vendorsList.map((vendor) => (
//                               <option key={vendor.id} value={vendor.id}>
//                                 {vendor.displayName}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                         {vendorsLoading && (
//                           <p className="mt-1 text-xs text-blue-600">
//                             Loading vendors from database...
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           GST Type <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                           name="gstType"
//                           value={formData.gstType}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                           required
//                         >
//                           <option value="">Select GST Type</option>
//                           {gstTypes.map((gst) => (
//                             <option key={gst.value} value={gst.value}>
//                               {gst.label}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Currency <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                           name="currency"
//                           value={formData.currency}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                           required
//                         >
//                           <option value="">Select Currency</option>
//                           {currencyOptions.map((option) => (
//                             <option key={option.value} value={option.value}>
//                               {option.label}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Exchange Rate <span className="text-red-500">*</span>
//                         </label>
//                         <input
//                           type="text"
//                           name="exchangeRate"
//                           value={formData.exchangeRate}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                           step="0.0001"
//                           min="0.0001"
//                           required
//                           disabled={formData.currency === "INR"}
//                         />
//                         {formData.currency === "INR" && (
//                           <p className="text-xs text-gray-500 mt-1">
//                             Exchange rate is automatically set to 1 for INR
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Warehouse Name <span className="text-red-500">*</span>
//                         </label>
//                         <select
//                           name="warehouseName"
//                           value={formData.warehouseName}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                           required
//                         >
//                           <option value="">Select Warehouse</option>
//                           {warehouseLoading ? (
//                             <option value="" disabled>
//                               Loading warehouses...
//                             </option>
//                           ) : (
//                             warehouseList.map((warehouse) => (
//                               <option
//                                 key={warehouse.value}
//                                 value={warehouse.label}
//                               >
//                                 {warehouse.label}
//                               </option>
//                             ))
//                           )}
//                         </select>
//                         {warehouseLoading && (
//                           <p className="mt-1 text-xs text-blue-600">
//                             Loading warehouses from database...
//                           </p>
//                         )}
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Payment Terms
//                         </label>
//                         <input
//                           type="text"
//                           name="paymentTerms"
//                           value={formData.paymentTerms}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Delivery Terms
//                         </label>
//                         <input
//                           type="text"
//                           name="deliveryTerms"
//                           value={formData.deliveryTerms}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Contact Person
//                         </label>
//                         <input
//                           type="text"
//                           name="contactPerson"
//                           value={formData.contactPerson}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Contact Number
//                         </label>
//                         <input
//                           type="text"
//                           name="cellNo"
//                           value={formData.cellNo}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Warranty
//                         </label>
//                         <input
//                           type="text"
//                           name="warranty"
//                           value={formData.warranty}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Expected Delivery
//                         </label>
//                         <input
//                           type="date"
//                           name="expectedDeliveryDate"
//                           value={formData.expectedDeliveryDate}
//                           onChange={handleInputChange}
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                         />
//                       </div>
//                     </div>

//                     {isItemWiseGST && (
//                       <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//                         <div className="flex items-center">
//                           <svg
//                             className="w-5 h-5 text-blue-600 mr-2"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                             />
//                           </svg>
//                           <span className="font-medium text-blue-800">
//                             Itemwise GST Selected
//                           </span>
//                         </div>
//                         <p className="text-sm text-blue-600 mt-1">
//                           GST rate must be entered for each item individually in
//                           the items section below.
//                         </p>
//                       </div>
//                     )}
//                   </div>

//                   {/* Items Section */}
//                   <div className="bg-gray-50 rounded-xl p-6">
//                     <div className="flex items-center justify-between mb-6">
//                       <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                         <svg
//                           className="w-5 h-5 mr-2 text-gray-500"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
//                           />
//                         </svg>
//                         Items
//                         {isItemWiseGST && (
//                           <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
//                             Itemwise GST
//                           </span>
//                         )}
//                       </h3>
//                     </div>

//                     <div className="space-y-6">
//                       {formData.items.map((item, index) => (
//                         <div
//                           key={index}
//                           className="bg-white rounded-xl border border-gray-200 p-5"
//                         >
//                           <div className="flex items-center justify-between mb-4">
//                             <div className="flex items-center">
//                               <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
//                                 {index + 1}
//                               </div>
//                               <h4 className="font-semibold text-gray-900">
//                                 Item {index + 1}
//                               </h4>
//                               {loadingItems[index] && (
//                                 <div className="ml-2">
//                                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
//                                 </div>
//                               )}
//                             </div>
//                             <button
//                               type="button"
//                               className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium flex items-center"
//                               onClick={() => removeItem(index)}
//                             >
//                               <svg
//                                 className="w-4 h-4 mr-1"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                                 />
//                               </svg>
//                               Remove
//                             </button>
//                           </div>

//                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Item Name{" "}
//                                 <span className="text-red-500">*</span>
//                               </label>
//                               <div className="relative">
//                                 <input
//                                   type="text"
//                                   value={item.name}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       index,
//                                       "name",
//                                       e.target.value,
//                                     )
//                                   }
//                                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                   required
//                                   onFocus={() => setShowItemsDropdown(index)}
//                                   placeholder="Click to select item"
//                                 />
//                                 {showItemsDropdown === index && (
//                                   <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
//                                     <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2">
//                                       <div className="flex items-center justify-between">
//                                         <span className="text-sm font-medium text-gray-700">
//                                           Select Item
//                                         </span>
//                                         <button
//                                           type="button"
//                                           className="text-gray-400 hover:text-gray-600"
//                                           onClick={() =>
//                                             setShowItemsDropdown(null)
//                                           }
//                                         >
//                                           <svg
//                                             className="w-4 h-4"
//                                             fill="none"
//                                             stroke="currentColor"
//                                             viewBox="0 0 24 24"
//                                           >
//                                             <path
//                                               strokeLinecap="round"
//                                               strokeLinejoin="round"
//                                               strokeWidth={2}
//                                               d="M6 18L18 6M6 6l12 12"
//                                             />
//                                           </svg>
//                                         </button>
//                                       </div>
//                                       <div className="px-4 py-2 border-b border-gray-200">
//                                         <input
//                                           type="text"
//                                           placeholder="Search items..."
//                                           className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                           value={searchQuery}
//                                           onChange={(e) =>
//                                             setSearchQuery(e.target.value)
//                                           }
//                                           onClick={(e) => e.stopPropagation()}
//                                         />
//                                       </div>
//                                     </div>
//                                     <div className="py-1">
//                                       {itemsLoading ? (
//                                         <div className="px-4 py-8 text-center text-gray-500">
//                                           <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
//                                           Loading items...
//                                         </div>
//                                       ) : filteredItems.length > 0 ? (
//                                         filteredItems.map((apiItem) => (
//                                           <div
//                                             key={apiItem.id}
//                                             className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
//                                             onClick={() =>
//                                               handleItemSelect(index, apiItem)
//                                             }
//                                           >
//                                             <div className="font-medium text-gray-900">
//                                               {apiItem.name || "Unnamed Item"}
//                                             </div>
//                                             {apiItem.hsnCode && (
//                                               <div className="text-sm text-gray-500 mt-1">
//                                                 HSN: {apiItem.hsnCode}
//                                               </div>
//                                             )}
//                                           </div>
//                                         ))
//                                       ) : (
//                                         <div className="px-4 py-8 text-center text-gray-500">
//                                           No items found
//                                         </div>
//                                       )}
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 HSN Code <span className="text-red-500">*</span>
//                               </label>
//                               <input
//                                 type="text"
//                                 value={item.hsnCode}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "hsnCode",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 required
//                               />
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Model Number
//                               </label>
//                               <input
//                                 type="text"
//                                 value={item.modelNumber}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "modelNumber",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                               />
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Unit <span className="text-red-500">*</span>
//                               </label>
//                               <select
//                                 value={item.unit}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "unit",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 required
//                               >
//                                 <option value="">Select Unit</option>
//                                 {unitsLoading ? (
//                                   <option value="" disabled>
//                                     Loading units...
//                                   </option>
//                                 ) : (
//                                   unitTypes?.map((unit) => (
//                                     <option key={unit?.id} value={unit?.name}>
//                                       {unit.label}
//                                     </option>
//                                   ))
//                                 )}
//                               </select>
//                               {unitsLoading && (
//                                 <p className="mt-1 text-xs text-blue-600">
//                                   Loading units from database...
//                                 </p>
//                               )}
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Quantity <span className="text-red-500">*</span>
//                               </label>
//                               <input
//                                 type="text"
//                                 value={item.quantity}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "quantity",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 required
//                               />
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Rate <span className="text-red-500">*</span>
//                               </label>
//                               <input
//                                 type="text"
//                                 value={item.rate}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "rate",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 required
//                               />
//                             </div>

//                             {isItemWiseGST && (
//                               <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                                   GST Rate (%){" "}
//                                   <span className="text-red-500">*</span>
//                                 </label>
//                                 <input
//                                   type="text"
//                                   value={item.gstRate || ""}
//                                   onChange={(e) =>
//                                     handleItemChange(
//                                       index,
//                                       "gstRate",
//                                       e.target.value,
//                                     )
//                                   }
//                                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                   step="0.01"
//                                   min="0"
//                                   max="100"
//                                   required
//                                 />
//                               </div>
//                             )}

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Total <span className="text-red-500">*</span>
//                               </label>
//                               <input
//                                 type="text"
//                                 value={item.total}
//                                 onChange={(e) =>
//                                   handleItemChange(
//                                     index,
//                                     "total",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 required
//                               />
//                             </div>
//                           </div>

//                           <div>
//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                               Item Description
//                             </label>
//                             <textarea
//                               value={item.itemDetail}
//                               onChange={(e) =>
//                                 handleItemChange(
//                                   index,
//                                   "itemDetail",
//                                   e.target.value,
//                                 )
//                               }
//                               className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                               rows="3"
//                             />
//                           </div>
//                         </div>
//                       ))}
//                       <button
//                         type="button"
//                         className="px-4 py-2 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center"
//                         onClick={addNewItem}
//                       >
//                         <svg
//                           className="w-4 h-4 mr-2"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 4v16m8-8H4"
//                           />
//                         </svg>
//                         Add Item
//                       </button>
//                     </div>
//                   </div>

//                   {/* Other Charges Section */}
//                   <div className="bg-gray-50 rounded-xl p-6 ">
//                     <div className="flex flex-reverse items-center justify-between mb-6">
//                       <h3 className="text-lg font-semibold text-gray-800 flex items-center">
//                         <svg
//                           className="w-5 h-5 mr-2 text-gray-500"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                           />
//                         </svg>
//                         Other Charges
//                       </h3>
//                     </div>

//                     <div className="space-y-4">
//                       {formData.otherCharges.map((charge, index) => (
//                         <div
//                           key={index}
//                           className="bg-white rounded-xl border border-gray-200 p-5"
//                         >
//                           <div className="flex items-center justify-between mb-4">
//                             <div className="flex items-center">
//                               <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
//                                 {index + 1}
//                               </div>
//                               <h4 className="font-semibold text-gray-900">
//                                 Charge {index + 1}
//                               </h4>
//                             </div>
//                             <button
//                               type="button"
//                               className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium flex items-center"
//                               onClick={() => removeCharge(index)}
//                             >
//                               <svg
//                                 className="w-4 h-4 mr-1"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
//                                 />
//                               </svg>
//                               Remove
//                             </button>
//                           </div>

//                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Charge Name
//                               </label>
//                               <input
//                                 type="text"
//                                 value={charge.name}
//                                 onChange={(e) =>
//                                   handleChargeChange(
//                                     index,
//                                     "name",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                               />
//                             </div>

//                             <div>
//                               <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Amount
//                               </label>
//                               <input
//                                 type="text"
//                                 value={charge.amount}
//                                 onChange={(e) =>
//                                   handleChargeChange(
//                                     index,
//                                     "amount",
//                                     e.target.value,
//                                   )
//                                 }
//                                 className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
//                                 step="0.01"
//                                 min="0"
//                               />
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                     <div>
//                       <button
//                         type="button"
//                         className="px-4 py-2 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center"
//                         onClick={addNewCharge}
//                       >
//                         <svg
//                           className="w-4 h-4 mr-2"
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M12 4v16m8-8H4"
//                           />
//                         </svg>
//                         Add Charge
//                       </button>
//                     </div>
//                   </div>

//                   {/* Form Actions */}
//                   <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
//                     <button
//                       type="button"
//                       className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
//                       onClick={() => setShowUpdateForm(false)}
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       type="submit"
//                       className="px-6 py-3 bg-yellow-400 text-dark rounded-xl hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
//                       disabled={updateLoading}
//                     >
//                       {updateLoading ? (
//                         <>
//                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                           Updating...
//                         </>
//                       ) : (
//                         <>
//                           <svg
//                             className="w-4 h-4 mr-2"
//                             fill="none"
//                             stroke="currentColor"
//                             viewBox="0 0 24 24"
//                           >
//                             <path
//                               strokeLinecap="round"
//                               strokeLinejoin="round"
//                               strokeWidth={2}
//                               d="M5 13l4 4L19 7"
//                             />
//                           </svg>
//                           Update Order
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </form>
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Upload Document Modal */}
//         {showUploadForm && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
//               {/* Modal Header */}
//               <div className="px-6 py-4 border-b border-gray-200">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center">
//                     <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
//                       <MdDriveFolderUpload className="w-5 h-5 text-orange-600" />
//                     </div>
//                     <div>
//                       <h2 className="text-xl font-bold text-gray-900">
//                         Upload Invoice Document
//                       </h2>
//                       <p className="text-sm text-gray-600">
//                         Upload invoice file for this purchase order
//                       </p>
//                     </div>
//                   </div>
//                   <button
//                     className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
//                     onClick={() => setShowUploadForm(false)}
//                   >
//                     <svg
//                       className="w-5 h-5 text-gray-500"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M6 18L18 6M6 6l12 12"
//                       />
//                     </svg>
//                   </button>
//                 </div>
//               </div>

//               {/* Modal Content */}
//               <form onSubmit={handleUploadSubmit} className="p-6">
//                 <div className="space-y-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Invoice Number <span className="text-red-500">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       value={invoiceData.invoiceNumber}
//                       onChange={(e) => setInvoiceData(prev => ({
//                         ...prev,
//                         invoiceNumber: e.target.value
//                       }))}
//                       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
//                       placeholder="Enter invoice number"
//                       required
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Invoice File <span className="text-red-500">*</span>
//                     </label>
//                     <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
//                       <div className="space-y-1 text-center">
//                         <svg
//                           className="mx-auto h-12 w-12 text-gray-400"
//                           stroke="currentColor"
//                           fill="none"
//                           viewBox="0 0 48 48"
//                           aria-hidden="true"
//                         >
//                           <path
//                             d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
//                             strokeWidth={2}
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                           />
//                         </svg>
//                         <div className="flex text-sm text-gray-600">
//                           <label
//                             htmlFor="file-upload"
//                             className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
//                           >
//                             <span>Upload a file</span>
//                             <input
//                               id="file-upload"
//                               name="file-upload"
//                               type="file"
//                               className="sr-only"
//                               onChange={handleFileChange}
//                               accept=".pdf,.jpg,.jpeg,.png"
//                               required
//                             />
//                           </label>
//                           <p className="pl-1">or drag and drop</p>
//                         </div>
//                         <p className="text-xs text-gray-500">
//                           PDF, JPG, PNG up to 10MB
//                         </p>
//                         {invoiceData.invoiceFile && (
//                           <div className="mt-2">
//                             <p className="text-sm text-green-600">
//                               Selected: {invoiceData.invoiceFile.name}
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Form Actions */}
//                 <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
//                   <button
//                     type="button"
//                     className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
//                     onClick={() => setShowUploadForm(false)}
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
//                     disabled={uploadLoading}
//                   >
//                     {uploadLoading ? (
//                       <>
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                         Uploading...
//                       </>
//                     ) : (
//                       <>
//                         <MdDriveFolderUpload className="w-4 h-4 mr-2" />
//                         Upload Invoice
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default ShowPurchaseOrder;


import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";
import { useNavigate } from "react-router-dom";
import NormalInput from "../../components/InputField/NormalInput";
import TableHeading from "../../components/table/TableHeading";
import ButtonWithIcon from "../../components/Button/ButtonWithIcon";
import { HiPencilAlt, HiSearch } from "react-icons/hi";
import {
  MdCancelPresentation,
  MdEmail,
  MdDriveFolderUpload,
} from "react-icons/md";
import { AiOutlineSync } from "react-icons/ai";
import { FaCloudDownloadAlt } from "react-icons/fa";
import { FiSend } from "react-icons/fi";

const ShowPurchaseOrder = () => {
  // State variables
  const [companies, setCompanies] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedOrder, setSelectedOrder] = useState("");
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [showItemsDropdown, setShowItemsDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [warehouseList, setWarehouseList] = useState([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [vendorsList, setVendorsList] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState({});
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: "",
    invoiceFile: null,
    vendorId: "",
    poId: "",
  });

  const navigate = useNavigate();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Form data state – items have 'id' (master ID) and 'source'
  const [formData, setFormData] = useState({
    companyId: "",
    vendorId: "",
    vendorName: "",
    gstType: "",
    items: [], // each item: { id, name, hsnCode, modelNumber, unit, quantity, rate, gstRate, total, itemDetail, source }
    otherCharges: [],
    poNumber: "",
    poDate: "",
    paymentTerms: "",
    deliveryTerms: "",
    contactPerson: "",
    cellNo: "",
    gstRate: "",
    currency: "INR",
    exchangeRate: "1",
    warranty: "",
    status: "",
    warehouseName: "",
    warehouseId: "",
    expectedDeliveryDate: "",
    unit: "",
  });

  const [unitTypes, setUnitTypes] = useState([]);
  const [unitsLoading, setUnitsLoading] = useState(false);

  // Search states
  const [vendor, setVendor] = useState("");
  const [item, setItem] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [srcBtnDisabled, setSrcBtnDisabled] = useState(false);
  const [poListing, setPoListing] = useState([]);

  // Check if GST type is itemwise
  const isItemWiseGST =
    formData.gstType === "IGST_ITEMWISE" ||
    formData.gstType === "LGST_ITEMWISE";

  // Status options with colors
  const statusOptions = [
    { value: "Draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
    { value: "Sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
    {
      value: "Approved",
      label: "Approved",
      color: "bg-green-100 text-green-800",
    },
    {
      value: "Completed",
      label: "Completed",
      color: "bg-purple-100 text-purple-800",
    },
    {
      value: "Cancelled",
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
    },
    {
      value: "Received",
      label: "Received",
      color: "bg-emerald-100 text-emerald-800",
    },
    {
      value: "Update Order",
      label: "Update Order",
      color: "bg-amber-100 text-amber-800",
    },
    {
      value: "PartiallyReceived",
      label: "Partially Received",
      color: "bg-orange-100 text-orange-800",
    },
    {
      value: "UploadDoc",
      label: "Upload Doc",
      color: "bg-yellow-100 text-yellow-800",
    },
    {
      value: "Admin_Approved",
      label: "Admin Approved",
      color: "bg-indigo-100 text-indigo-800",
    },
    {
      value: "Admin_Rejected",
      label: "Admin Rejected",
      color: "bg-red-100 text-red-800",
    },
  ];

  // GST Types
  const gstTypes = [
    { value: "IGST_5", label: "IGST 5%" },
    { value: "IGST_12", label: "IGST 12%" },
    { value: "IGST_18", label: "IGST 18%" },
    { value: "IGST_28", label: "IGST 28%" },
    { value: "IGST_EXEMPTED", label: "IGST Exempted" },
    { value: "LGST_5", label: "LGST 5%" },
    { value: "LGST_12", label: "LGST 12%" },
    { value: "LGST_18", label: "LGST 18%" },
    { value: "LGST_28", label: "LGST 28%" },
    { value: "LGST_EXEMPTED", label: "LGST Exempted" },
    { value: "IGST_ITEMWISE", label: "IGST Itemwise" },
    { value: "LGST_ITEMWISE", label: "LGST Itemwise" },
  ];

  const currencyOptions = [
    { value: "INR", label: "INR" },
    { value: "USD", label: "USD" },
    { value: "CNY", label: "CNY" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "AED", label: "AED" },
  ];

  // Filtered items based on search
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.hsnCode?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ==================== API Functions ====================

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/companies");
      setCompanies(response.data.data || []);
    } catch (error) {
      console.log(
        "Error fetching companies:",
        error?.response?.data?.message || error?.message,
      );
      alert("Error loading companies");
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseOrders = async (companyId) => {
    if (!companyId) {
      setPurchaseOrders([]);
      setSelectedOrder("");
      setSelectedOrderDetails(null);
      return;
    }

    setOrdersLoading(true);
    try {
      const response = await Api.get(
        `/purchase/purchase-orders/company/${companyId}`,
      );
      setPurchaseOrders(response.data.data || []);
      setSelectedOrder("");
      setSelectedOrderDetails(null);
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      alert("Error loading purchase orders");
      setPurchaseOrders([]);
      setSelectedOrder("");
      setSelectedOrderDetails(null);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (!orderId) {
      setSelectedOrderDetails(null);
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await Api.get(
        `/purchase/purchase-orders/details/${orderId}`,
      );
      setSelectedOrderDetails(response.data.data);
    } catch (error) {
      console.error("Error fetching order details:", error);
      alert("Error loading order details");
      setSelectedOrderDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const response = await Api.get("/purchase/items");
      setItems(response.data.items || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      alert("Error loading items");
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchItemDetails = async (itemId) => {
    try {
      const response = await Api.get(`/purchase/items/details/${itemId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching item details for ID ${itemId}:`, error);
      return null;
    }
  };

  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const response = await Api.get("/purchase/vendors");
      setVendorsList(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      alert(
        "Error loading vendors: " +
          (error?.response?.data?.message || error?.message),
      );
    } finally {
      setVendorsLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    setWarehouseLoading(true);
    try {
      const res = await Api.get(`/purchase/warehouses`);
      const formatted = res?.data?.data?.map((w) => ({
        label: w.warehouseName,
        value: w._id,
        id: w._id,
        name: w.warehouseName,
      }));
      setWarehouseList(formatted);
    } catch (err) {
      console.error("Error loading warehouses:", err);
      alert("Error loading warehouses");
    } finally {
      setWarehouseLoading(false);
    }
  };

  const fetchUnits = async () => {
    setUnitsLoading(true);
    try {
      const response = await Api.get("/common/unit/view");
      if (response.data.success) {
        const formattedUnits = response?.data?.data?.map((unit) => ({
          value: unit.id,
          label: unit.name,
          id: unit.id,
          name: unit.name,
        }));
        setUnitTypes(formattedUnits);
        return formattedUnits;
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setUnitsLoading(false);
    }
  };

  // ==================== Business Logic Functions ====================

  const handleSendEmail = async (poId, poNumber) => {
    if (!poId) {
      alert("Please select a purchase order first");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to send Purchase Order ${poNumber} via email?\n` +
        `This will send the PO to the vendor's email address.`,
    );

    if (!isConfirmed) return;

    setEmailLoading(true);
    try {
      const response = await Api.post(`/purchase/purchase-orders/send/${poId}`);

      if (response.data.success) {
        alert("Purchase order sent via email successfully!");

        if (selectedOrderDetails && selectedOrderDetails.id === poId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            status: "Sent",
          });
        }

        poSearch(currentPage);
      } else {
        alert(
          "Failed to send purchase order via email: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error sending purchase order via email:", error);

      if (error.response) {
        if (error.response.status === 400) {
          alert(
            `Cannot send purchase order: ${
              error.response.data.message ||
              "Order may be in a state that cannot be sent."
            }`,
          );
        } else if (error.response.status === 404) {
          alert("Purchase order not found");
        } else {
          alert(
            `Error sending purchase order: ${error.response.status} ${
              error.response.data.message || "Unknown error"
            }`,
          );
        }
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error sending purchase order. Please try again.");
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSendApproval = async (poId, poNumber) => {
    if (!poId) {
      alert("Please select a purchase order first");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to send Purchase Order ${poNumber} via Approval?\n` +
        `This will send the PO to the vendor's Approval PO.`,
    );

    if (!isConfirmed) return;

    setApprovalLoading(true);
    try {
      const response = await Api.put(
        `/purchase/purchase-orders/${poId}/send-for-approval`,
      );

      if (response.data.success) {
        alert("Purchase order sent via approval successfully!");
        if (selectedOrderDetails && selectedOrderDetails.id === poId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            status: "FOR SENDING PO FOR APPROVAL",
          });
        }
        poSearch(currentPage);
      } else {
        alert(
          "Failed to send purchase order via approval: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.log(
        "Error sending purchase order via approval:",
        error?.response?.data?.message || error?.message,
      );

      if (error.response) {
        if (error.response.status === 400) {
          alert(
            `Cannot send purchase order: ${
              error.response.data.message ||
              "Order may be in a state that cannot be sent."
            }`,
          );
        } else if (error.response.status === 404) {
          alert("Purchase order not found");
        } else {
          alert(
            `Error sending purchase order: ${error.response.status} ${
              error.response.data.message || "Unknown error"
            }`,
          );
        }
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error sending purchase order. Please try again.");
      }
    } finally {
      setApprovalLoading(false);
    }
  };

  const canCancelOrder = (orderDetails) => {
    if (!orderDetails) return false;
    const nonCancelableStatuses = [
      "Cancelled",
      "Completed",
      "PartiallyReceived",
      "Received",
      "Update Order",
      "Admin_Approved",
      "Admin_Rejected",
    ];
    return !nonCancelableStatuses.includes(orderDetails.status);
  };

  const canSendEmail = (orderDetails) => {
    if (!orderDetails) return false;
    const sendableStatuses = ["Draft", "Approved", "Update Order"];
    return sendableStatuses.includes(orderDetails.status);
  };

  const canSendApproval = (orderDetails) => {
    if (!orderDetails) return false;
    const sendableStatuses = ["Draft", "Approved", "Update Order"];
    return sendableStatuses.includes(orderDetails.status);
  };

  const handleCancelOrder = async (poId) => {
    if (!poId) {
      alert("Please select a purchase order first");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to cancel Purchase Order?\n` +
        `This action cannot be undone.`,
    );

    if (!isConfirmed) return;

    setCancelLoading(true);
    try {
      const response = await Api.put(
        `/purchase/purchase-orders/cancel/${poId}`,
      );

      if (response.data.success) {
        alert("Purchase order cancelled successfully!");

        if (selectedOrderDetails && selectedOrderDetails.id === poId) {
          setSelectedOrderDetails({
            ...selectedOrderDetails,
            status: "Cancelled",
          });
        }

        if (selectedCompany) {
          fetchPurchaseOrders(selectedCompany);
        }
        poSearch(currentPage);
      } else {
        alert(
          "Failed to cancel purchase order: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error cancelling purchase order:", error);

      if (error.response) {
        if (error.response.status === 400) {
          alert(
            `Cannot cancel purchase order: ${
              error.response.data.message ||
              "Order may be in a state that cannot be cancelled."
            }`,
          );
        } else if (error.response.status === 404) {
          alert("Purchase order not found");
        } else {
          alert(
            `Error cancelling purchase order: ${error.response.status} ${
              error.response.data.message || "Unknown error"
            }`,
          );
        }
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error cancelling purchase order. Please try again.");
      }
    } finally {
      setCancelLoading(false);
    }
  };

  const handleReOrder = async (poId) => {
    if (!poId) {
      alert("Please select a purchase order first");
      return;
    }

    try {
      const response = await Api.get(
        `/purchase/purchase-orders/details/${poId}`,
      );
      const orderDetails = response.data.data;

      if (!orderDetails) {
        alert("Failed to fetch order details");
        return;
      }

      const isForeignCurrency =
        orderDetails.currency === "USD" ||
        orderDetails.currency === "EUR" ||
        orderDetails.currency === "GBP";

      const reorderItems =
        orderDetails.items?.map((item) => {
          let rate, itemTotal, itemAmount;

          if (isForeignCurrency && item.rateInForeign) {
            rate = parseFloat(item.rateInForeign) || 0;
            itemAmount = parseFloat(item.amountInForeign) || 0;
            itemTotal = parseFloat(item.total) || 0;
          } else {
            rate = parseFloat(item.rate) || 0;
            const quantity = parseFloat(item.quantity) || 1;
            itemAmount = rate * quantity;
            itemTotal = itemAmount;
          }

          const quantity = parseFloat(item.quantity) || 1;
          const itemGstRate =
            parseFloat(item.gstRate) || parseFloat(orderDetails.gstRate) || 0;

          const taxableAmount = itemAmount;
          const gstAmount = (taxableAmount * itemGstRate) / 100;
          const totalAmount = taxableAmount + gstAmount;

          return {
            id: item.itemId || item.id,
            source: item.itemSource || "mysql",
            itemName: item.itemName || item.name || "",
            hsnCode: item.hsnCode || "",
            modelNumber: item.modelNumber || "",
            unit: item.unit || "",
            rate: rate.toString(),
            rateInForeign: item.rateInForeign
              ? item.rateInForeign.toString()
              : "",
            amountInForeign: item.amountInForeign
              ? item.amountInForeign.toString()
              : "",
            quantity: item.quantity || "1",
            gstRate: itemGstRate,
            itemDetail: item.itemDetail || "",
            total: itemTotal.toString(),
            amount: taxableAmount.toString(),
            taxableAmount: taxableAmount.toString(),
            gstAmount: gstAmount.toString(),
            totalAmount: totalAmount.toString(),
          };
        }) || [];

      const reorderData = {
        companyId: orderDetails.companyId,
        vendorId: orderDetails.vendorId,
        companyName: orderDetails.companyName,
        vendorName: orderDetails.vendorName,
        gstType: orderDetails.gstType,
        gstRate: orderDetails.gstRate || "",
        currency: orderDetails.currency || "INR",
        exchangeRate: orderDetails.exchangeRate || "1",
        paymentTerms: orderDetails.paymentTerms || "",
        warehouseName: orderDetails.warehouseName || "",
        deliveryTerms: orderDetails.deliveryTerms || "",
        warranty: orderDetails.warranty || "",
        contactPerson: orderDetails.contactPerson || "",
        cellNo: orderDetails.cellNo || "",
        poNumber: orderDetails.poNumber,
        poDate: orderDetails.poDate,
        items: reorderItems,
        otherCharges: orderDetails.otherCharges || [],
      };

      navigate("/create-purchase-order", {
        state: {
          reorderData,
          source: "reorder",
        },
      });
    } catch (error) {
      console.error("Error fetching order details for reorder:", error);
      alert("Failed to fetch order details for reorder. Please try again.");
    }
  };

  // handleUpdatePo – map API's itemId to our 'id' and set 'source' from itemSource
  const handleUpdatePo = async (poData) => {
    if (!poData || !poData.id) {
      alert("Please select a purchase order first");
      return;
    }

    try {
      const response = await Api.get(
        `/purchase/purchase-orders/details/${poData.id}`,
      );
      const orderDetails = response?.data?.data;

      if (!orderDetails) {
        alert("Failed to fetch order details");
        return;
      }

      if (unitTypes.length === 0) {
        await fetchUnits();
      }

      if (warehouseList.length === 0) {
        await fetchWarehouses();
      }

      if (vendorsList.length === 0) {
        await fetchVendors();
      }

      setFormData({
        companyId: orderDetails?.companyId || "",
        vendorId: orderDetails.vendorId || "",
        vendorName: orderDetails.vendorName || "",
        gstType: orderDetails?.gstType || "",
        items: orderDetails?.items
          ? orderDetails?.items?.map((item) => ({
              id: item?.itemId || "",
              source: item?.itemSource || "mysql", // preserve source from API
              name: item?.itemName || "",
              hsnCode: item?.hsnCode || "",
              modelNumber: item?.modelNumber || "",
              itemDetail: item?.itemDetail || "",
              unit: item?.unit || "",
              quantity: item?.quantity || "1",
              rate: item?.rate || "",
              gstRate: item?.gstRate || "",
              total: item?.total || "",
            }))
          : [],
        otherCharges: orderDetails?.otherCharges
          ? orderDetails?.otherCharges?.map((charge) => ({
              name: charge?.name || "",
              amount: charge?.amount || "",
            }))
          : [],
        poNumber: orderDetails?.poNumber || "",
        poDate: orderDetails?.poDate ? orderDetails?.poDate?.split("T")[0] : "",
        paymentTerms: orderDetails?.paymentTerms || "",
        deliveryTerms: orderDetails?.deliveryTerms || "",
        contactPerson: orderDetails?.contactPerson || "",
        cellNo: orderDetails?.cellNo || "",
        gstRate: orderDetails?.gstRate || "",
        currency: orderDetails?.currency || "INR",
        exchangeRate: orderDetails?.exchangeRate || "1",
        warranty: orderDetails?.warranty || "",
        status: orderDetails?.status || "",
        warehouseName: orderDetails.warehouseName || "",
        warehouseId: orderDetails.warehouseId || "",
        expectedDeliveryDate: orderDetails?.expectedDeliveryDate
          ? orderDetails.expectedDeliveryDate.split("T")[0]
          : "",
      });

      setSelectedOrder(poData.id);
      setShowUpdateForm(true);
      fetchItems();
    } catch (error) {
      console.log(
        "Error fetching order details for update:",
        error?.response?.data?.message,
      );
      alert("Failed to fetch order details for update. Please try again.");
    }
  };

  // prepareUpdateForm – same mapping
  const prepareUpdateForm = (orderDetails) => {
    if (!orderDetails) return;

    fetchUnits();

    setFormData({
      companyId: orderDetails.companyId || "",
      vendorId: orderDetails.vendorId || "",
      vendorName: orderDetails.vendorName || "",
      gstType: orderDetails.gstType || "",
      items: orderDetails.items
        ? orderDetails.items.map((item) => ({
            id: item.itemId || "",
            source: item.itemSource || "mysql",
            name: item.itemName || "",
            hsnCode: item.hsnCode || "",
            modelNumber: item.modelNumber || "",
            itemDetail: item.itemDetail || "",
            unit: item.unit || "",
            quantity: item.quantity || "1",
            rate: item.rate || "",
            gstRate: item.gstRate || "",
            total: item.total || "",
          }))
        : [],
      otherCharges: orderDetails.otherCharges
        ? orderDetails.otherCharges.map((charge) => ({
            name: charge.name || "",
            amount: charge.amount || "",
          }))
        : [],
      poNumber: orderDetails.poNumber || "",
      poDate: orderDetails.poDate ? orderDetails.poDate.split("T")[0] : "",
      paymentTerms: orderDetails.paymentTerms || "",
      deliveryTerms: orderDetails.deliveryTerms || "",
      contactPerson: orderDetails.contactPerson || "",
      cellNo: orderDetails.cellNo || "",
      gstRate: orderDetails.gstRate || "",
      currency: orderDetails.currency || "INR",
      exchangeRate: orderDetails.exchangeRate || "1",
      warranty: orderDetails.warranty || "",
      status: orderDetails.status || "",
      warehouseName: orderDetails.warehouseName || "",
      warehouseId: orderDetails.warehouseId || "",
      expectedDeliveryDate: orderDetails.expectedDeliveryDate
        ? orderDetails.expectedDeliveryDate.split("T")[0]
        : "",
    });

    setShowUpdateForm(true);
    fetchItems();
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    const currentItem = { ...updatedItems[index] };

    currentItem[field] = value;

    const quantity = parseFloat(currentItem.quantity) || 0;
    const rate = parseFloat(currentItem.rate) || 0;
    const total = parseFloat(currentItem.total) || 0;

    if (field === "quantity") {
      if (rate > 0 && quantity > 0) {
        currentItem.total = (rate * quantity).toFixed(3);
      } else if (total > 0 && quantity > 0) {
        currentItem.rate = (total / quantity).toFixed(3);
      }
    } else if (field === "rate") {
      if (quantity > 0 && rate > 0) {
        currentItem.total = (rate * quantity).toFixed(3);
      } else if (total > 0 && rate > 0) {
        currentItem.quantity = Math.round(total / rate).toString();
      }
    } else if (field === "total") {
      if (quantity > 0 && total > 0) {
        currentItem.rate = (total / quantity).toFixed(3);
      } else if (rate > 0 && total > 0) {
        currentItem.quantity = Math.round(total / rate).toString();
      }
    }

    updatedItems[index] = currentItem;

    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const handleUploadDoc = async (poData) => {
    if (!poData || !poData.id) {
      alert("Please select a purchase order first");
      return;
    }

    try {
      const response = await Api.get(
        `/purchase/purchase-orders/details/${poData.id}`,
      );
      const orderDetails = response?.data?.data;

      if (!orderDetails) {
        alert("Failed to fetch order details");
        return;
      }

      setInvoiceData({
        vendorId: orderDetails.vendorId || "",
        poId: orderDetails.id || "",
        invoiceNumber: "",
        invoiceFile: null,
      });

      setShowUploadForm(true);
    } catch (error) {
      console.log(
        "Error fetching order details for update:",
        error?.response?.data?.message,
      );
      alert("Failed to fetch order details for update. Please try again.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload a valid file (PDF, JPEG, PNG)");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }

      setInvoiceData((prev) => ({
        ...prev,
        invoiceFile: file,
      }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();

    if (!invoiceData.vendorId || !invoiceData.poId) {
      alert("Missing vendor or purchase order information");
      return;
    }

    if (!invoiceData.invoiceNumber) {
      alert("Please enter invoice number");
      return;
    }

    if (!invoiceData.invoiceFile) {
      alert("Please select a file to upload");
      return;
    }

    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append("vendorId", invoiceData.vendorId);
      formData.append("poId", invoiceData.poId);
      formData.append("invoiceNumber", invoiceData.invoiceNumber);
      formData.append("invoiceFile", invoiceData.invoiceFile);

      const response = await Api.post(
        "/purchase/vendor/invoices/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (response.data.success) {
        alert("Invoice uploaded successfully!");
        setShowUploadForm(false);
        setInvoiceData({
          invoiceNumber: "",
          invoiceFile: null,
          vendorId: "",
          poId: "",
        });

        if (selectedCompany) {
          fetchPurchaseOrders(selectedCompany);
        }
        poSearch(currentPage);
      } else {
        alert(
          "Failed to upload invoice: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error uploading invoice:", error);
      if (error.response) {
        alert(
          `Error uploading invoice: ${error.response.status} ${error.response.data.message || "Unknown error"}`,
        );
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error uploading invoice. Please try again.");
      }
    } finally {
      setUploadLoading(false);
    }
  };

  // handleUpdateSubmit – now we always send id (master item ID) and source
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();

    if (!selectedOrder) {
      alert("No purchase order selected");
      return;
    }

    if (!formData.vendorId) {
      alert("Please select a vendor");
      return;
    }

    if (isItemWiseGST) {
      const itemsWithoutGstRate = formData.items.filter(
        (item) =>
          !item.gstRate ||
          item.gstRate.trim() === "" ||
          isNaN(parseFloat(item.gstRate)),
      );

      if (itemsWithoutGstRate.length > 0) {
        alert("Please enter GST rate for all items when using Itemwise GST");
        return;
      }
    }

    const submitData = {
      ...formData,
      vendorId: formData.vendorId,
      vendorName: formData.vendorName || "",
      warehouseId: formData.warehouseId,
      warehouseName: formData.warehouseName,
      // items already have id (master ID) and source
    };

    setUpdateLoading(true);
    try {
      const response = await Api.put(
        `/purchase/purchase-orders/update/${selectedOrder}`,
        submitData,
      );

      if (response.data.success) {
        alert("Purchase order updated successfully!");
        setShowUpdateForm(false);
        if (selectedCompany) {
          fetchPurchaseOrders(selectedCompany);
        }
        poSearch(currentPage);
        if (selectedOrderDetails && selectedOrderDetails.id === selectedOrder) {
          fetchOrderDetails(selectedOrder);
        }
      } else {
        alert(
          "Failed to update purchase order: " +
            (response.data.message || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error updating purchase order:", error);

      if (error.response) {
        alert(
          `Error updating purchase order: ${error.response.status} ${
            error.response.data.message || "Unknown error"
          }`,
        );
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error updating purchase order. Please try again.");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "currency" && value === "INR") {
      setFormData((prev) => ({
        ...prev,
        currency: value,
        exchangeRate: "1",
      }));
    } else if (name === "gstType") {
      const newIsItemWiseGST =
        value === "IGST_ITEMWISE" || value === "LGST_ITEMWISE";

      setFormData((prev) => {
        const updatedItems = prev.items.map((item) => {
          if (!newIsItemWiseGST) {
            const { gstRate, ...rest } = item;
            return rest;
          }
          return item;
        });

        return {
          ...prev,
          [name]: value,
          items: updatedItems,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // handleItemSelect – set id to master item ID and source from selected item
  const handleItemSelect = async (index, selectedItem) => {
    setLoadingItems((prev) => ({ ...prev, [index]: true }));

    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        id: selectedItem.id,
        source: selectedItem.source || "mysql", // set source from master item
        name: selectedItem.name || "",
        hsnCode: selectedItem.hsnCode || "",
        modelNumber: selectedItem.modelNumber || "",
        unit: selectedItem.unit || "",
        rate: selectedItem.rate || "",
        itemDetail: selectedItem.itemDetail || selectedItem.description || "",
      };

      const rate = parseFloat(newItems[index].rate) || 0;
      const quantity = parseFloat(newItems[index].quantity) || 1;
      newItems[index].total = (rate * quantity).toFixed(3);

      return {
        ...prev,
        items: newItems,
      };
    });

    // Fetch additional details from API (optional)
    try {
      const itemDetailsResponse = await fetchItemDetails(selectedItem.id);
      if (itemDetailsResponse && itemDetailsResponse.success) {
        const detailedItem = itemDetailsResponse.item;
        setFormData((prev) => {
          const newItems = [...prev.items];
          if (newItems[index] && newItems[index].id === selectedItem.id) {
            newItems[index] = {
              ...newItems[index],
              hsnCode: newItems[index].hsnCode || detailedItem.hsnCode || "",
              unit: detailedItem.unit || newItems[index].unit || "",
              itemDetail:
                detailedItem.description || newItems[index].itemDetail || "",
            };
          }
          return {
            ...prev,
            items: newItems,
          };
        });
      }
    } catch (error) {
      console.error("Error fetching item details from API:", error);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [index]: false }));
    }

    setShowItemsDropdown(null);
    setSearchQuery("");
  };

  const handleChargeChange = (index, field, value) => {
    const updatedCharges = [...formData.otherCharges];
    updatedCharges[index] = {
      ...updatedCharges[index],
      [field]: value,
    };

    setFormData((prev) => ({
      ...prev,
      otherCharges: updatedCharges,
    }));
  };

  // addNewItem – id empty, source empty (will be set on selection)
  const addNewItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: "",
          source: "",
          name: "",
          hsnCode: "",
          modelNumber: "",
          itemDetail: "",
          unit: "",
          quantity: "1",
          rate: "",
          gstRate: isItemWiseGST ? "" : undefined,
          total: "",
        },
      ],
    }));
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  const addNewCharge = () => {
    setFormData((prev) => ({
      ...prev,
      otherCharges: [
        ...prev.otherCharges,
        {
          name: "",
          amount: "",
        },
      ],
    }));
  };

  const removeCharge = (index) => {
    const updatedCharges = formData.otherCharges.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      otherCharges: updatedCharges,
    }));
  };

  const handleDownload = async (poId, poName) => {
    if (!poId) return;

    setDownloadLoading(true);
    try {
      const response = await Api.post(
        `/purchase/purchase-orders/download/${poId}`,
        {},
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const fileName = `${poName}.pdf`;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);

      if (error.response) {
        if (error.response.status === 404) {
          alert("PDF file not found for this purchase order");
        } else if (error.response.status === 500) {
          alert("Server error while generating PDF. Please try again.");
        } else {
          alert(
            `Error downloading PDF: ${error.response.status} ${error.response.statusText}`,
          );
        }
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error downloading PDF. Please try again.");
      }
    } finally {
      setDownloadLoading(false);
    }
  };

  const calculateTotals = (orderDetails) => {
    if (!orderDetails) {
      return {
        itemsTotal: 0,
        otherChargesTotal: 0,
        subtotal: 0,
        gstAmount: 0,
        grandTotal: 0,
      };
    }

    if (orderDetails.subTotal && orderDetails.grandTotal) {
      const itemsTotal = (orderDetails.items || []).reduce(
        (sum, item) => sum + Number(item.total || 0),
        0,
      );

      const otherChargesTotal = (orderDetails.otherCharges || []).reduce(
        (sum, charge) => sum + Number(charge.amount || 0),
        0,
      );

      const subtotal = Number(orderDetails.subTotal);
      const grandTotal = Number(orderDetails.grandTotal);
      const gstAmount = grandTotal - subtotal;

      return {
        itemsTotal: Number(itemsTotal.toFixed(3)),
        otherChargesTotal: Number(otherChargesTotal.toFixed(3)),
        subtotal: Number(subtotal.toFixed(3)),
        gstAmount: Number(gstAmount.toFixed(3)),
        grandTotal: Number(grandTotal.toFixed(3)),
      };
    }

    const itemsTotal = (orderDetails.items || []).reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const otherChargesTotal = (orderDetails.otherCharges || []).reduce(
      (sum, charge) => sum + Number(charge.amount || 0),
      0,
    );

    const subtotal = itemsTotal + otherChargesTotal;

    const gstRate = Number(orderDetails.gstRate || 0);
    const gstAmount = (subtotal * gstRate) / 100;

    const grandTotal = subtotal + gstAmount;

    return {
      itemsTotal: Number(itemsTotal.toFixed(3)),
      otherChargesTotal: Number(otherChargesTotal.toFixed(3)),
      subtotal: Number(subtotal.toFixed(3)),
      gstAmount: Number(gstAmount.toFixed(3)),
      grandTotal: Number(grandTotal.toFixed(3)),
    };
  };

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    fetchPurchaseOrders(companyId);
    setCurrentPage(1);
  };

  const handleOrderChange = (orderId) => {
    setSelectedOrder(orderId);
    if (orderId) {
      fetchOrderDetails(orderId);
    } else {
      setSelectedOrderDetails(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0.00";
    return parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatForeignCurrency = (amount, currency) => {
    if (!amount) return "0.00";
    const formattedAmount = parseFloat(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    if (currency === "USD") {
      return `$${formattedAmount}`;
    } else if (currency === "EUR") {
      return `€${formattedAmount}`;
    } else if (currency === "GBP") {
      return `£${formattedAmount}`;
    } else if (currency === "CNY") {
      return `¥${formattedAmount}`;
    } else if (currency === "AED") {
      return `د.إ${formattedAmount}`;
    } else {
      return `${currency} ${formattedAmount}`;
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return statusOption ? statusOption.color : "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find((s) => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const poSearch = async (page = 1) => {
    setSrcBtnDisabled(true);
    const API_URL = "/purchase/purchase-orders/show?";
    let queryParams = [];

    if (poNumber) queryParams.push(`poNumber=${encodeURIComponent(poNumber)}`);
    if (selectedCompany)
      queryParams.push(`company=${encodeURIComponent(selectedCompany)}`);
    if (vendor) queryParams.push(`vendor=${encodeURIComponent(vendor)}`);
    if (item) queryParams.push(`itemName=${encodeURIComponent(item)}`);

    queryParams.push(`page=${page}`);
    queryParams.push(`limit=${itemsPerPage}`);

    const finalURL = API_URL + queryParams.join("&");

    try {
      const response = await Api.get(finalURL);

      if (response && response.data && response.data.success) {
        const mappedData = response.data.data.map((po) => ({
          id: po.id,
          poNumber: po.poNumber,
          poDate: po.poDate,
          companyName: po.companyName,
          vendorName: po.vendorName,
          items: po.items || [],
          status: po.status,
          expectedDeliveryDate: po.expectedDeliveryDate,
          currency: po.currency,
          foreignGrandTotal: po.foreignGrandTotal,
          grandTotal: po.grandTotal,
          displayGrandTotal: po.displayGrandTotal,
        }));

        setPoListing(mappedData);
        setTotalItems(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
      alert("Error loading purchase orders");
      setPoListing([]);
    } finally {
      setSrcBtnDisabled(false);
    }
  };

  const handlePageChange = (page) => {
    poSearch(page);
  };

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    poSearch(1);
  };

  const getPaginationRange = () => {
    const totalPageNumbers = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(totalPageNumbers / 2),
    );
    const endPage = Math.min(totalPages, startPage + totalPageNumbers - 1);

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const PO_Table_Heading = [
    "SR.No.",
    "PO Number",
    "Company",
    "Vendor",
    "Status",
    "Actions",
  ];

  useEffect(() => {
    fetchCompanies();
    fetchWarehouses();
    fetchUnits();
    fetchVendors();
    poSearch(1);
  }, []);

  useEffect(() => {
    if (formData.currency === "INR") {
      setFormData((prev) => ({
        ...prev,
        exchangeRate: "1",
      }));
    }
  }, [formData.currency]);

  const totals = selectedOrderDetails
    ? calculateTotals(selectedOrderDetails)
    : {};

  const isForeignCurrency =
    selectedOrderDetails &&
    (selectedOrderDetails.currency === "USD" ||
      selectedOrderDetails.currency === "EUR" ||
      selectedOrderDetails.currency === "GBP" ||
      selectedOrderDetails.currency === "CNY" ||
      selectedOrderDetails.currency === "AED");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto py-4">
        {/* Hero Section */}
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            View Purchase Order
          </h1>
        </div>

        {/* Search Section */}
        <div className="flex gap-3 mb-3">
          <NormalInput
            label="PO Number"
            value={poNumber}
            setterFun={setPoNumber}
            placeholder="Enter PO Number"
            name="poNumber"
            className="p-2"
          />
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-1">
              Select Company
            </label>
            <div className="relative">
              <select
                value={selectedCompany}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="p-2 border rounded-md border-gray-300 bg-white"
                disabled={loading}
              >
                <option value=""> Select Company </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
              {loading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>
          <NormalInput
            label="Vendor"
            value={vendor}
            setterFun={setVendor}
            placeholder="Enter Vendor Name"
            name="vendor"
            className="p-2"
          />
          <NormalInput
            label="Item"
            value={item}
            setterFun={setItem}
            placeholder="Enter Item Name"
            name="item"
            className="p-2"
          />
          <ButtonWithIcon
            icon={<HiSearch />}
            onClick={() => poSearch(1)}
            className="rounded-md h-10 mt-6 w-12 bg-yellow-400 hover:bg-yellow-500 text-dark text-xl px-3"
            disabled={srcBtnDisabled}
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4 mb-3 md:mb-0">
            <div className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-semibold">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {Math.min(currentPage * itemsPerPage, totalItems)}
              </span>{" "}
              of <span className="font-semibold">{totalItems}</span> Purchase
              Orders
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            {getPaginationRange().map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1.5 min-w-[40px] border rounded-md transition-colors ${
                  currentPage === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <div className="text-sm text-gray-600 ml-4">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </div>
          </div>
        </div>

        {/* PO list */}
        <div>
          <table className="min-w-full bg-white shadow-md rounded-lg overflow-scroll text-center">
            <TableHeading list={PO_Table_Heading} />
            <tbody>
              {poListing.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No Purchase Orders found.
                  </td>
                </tr>
              ) : (
                poListing.map((po, index) => (
                  <tr key={po.id} className="border-b hover:bg-gray-100">
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {po?.poNumber || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {po?.companyName || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-900">
                      {po?.vendorName || "N/A"}
                    </td>
                    <td className="px-2 py-2 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          po?.status,
                        )}`}
                      >
                        {getStatusLabel(po?.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer flex gap-2">
                      {po?.status === "Draft" ? (
                        <ButtonWithIcon
                          onClick={() => handleUpdatePo(po)}
                          icon={<HiPencilAlt />}
                          className="p-2 text-white rounded-md bg-green-600 hover:bg-green-800"
                        />
                      ) : (
                        <div className="w-8"></div>
                      )}
                      {canCancelOrder(po) && (
                        <ButtonWithIcon
                          onClick={() => handleCancelOrder(po?.id)}
                          icon={<MdCancelPresentation />}
                          className="p-2 text-white rounded-md bg-red-600 hover:bg-red-800"
                        />
                      )}
                      <ButtonWithIcon
                        onClick={() => handleReOrder(po?.id)}
                        icon={<AiOutlineSync />}
                        className="p-2 text-white rounded-md bg-violet-500 hover:bg-violet-800"
                      />
                      {canSendEmail(po) && (
                        <ButtonWithIcon
                          onClick={() => handleSendEmail(po.id, po?.poNumber)}
                          disabled={emailLoading}
                          icon={<MdEmail />}
                          className="p-2 text-white rounded-md bg-teal-500 hover:bg-teal-700"
                        />
                      )}

                      {canSendApproval(po) && (
                        <ButtonWithIcon
                          onClick={() =>
                            handleSendApproval(po.id, po?.poNumber)
                          }
                          disabled={approvalLoading}
                          icon={<FiSend />}
                          className="p-2 text-white rounded-md bg-teal-500 hover:bg-teal-700"
                        />
                      )}
                      <ButtonWithIcon
                        onClick={() => handleDownload(po.id, po?.poNumber)}
                        disabled={downloadLoading}
                        icon={<FaCloudDownloadAlt />}
                        className="p-2 text-white rounded-md bg-blue-500 hover:bg-blue-800"
                      />
                      {po?.status !== "UploadDoc" &&
                        po?.status !== "Received" &&
                        po?.status !== "Cancelled" && (
                          <ButtonWithIcon
                            onClick={() => handleUploadDoc(po)}
                            icon={<MdDriveFolderUpload />}
                            className="p-2 text-white rounded-md bg-orange-600 hover:bg-orange-700"
                          />
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Controls */}
        <div className="flex justify-center mt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous
            </button>

            <div className="flex space-x-1">
              {getPaginationRange().map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 min-w-[40px] border rounded-md transition-colors ${
                    currentPage === page
                      ? "bg-blue-600 text-white border-blue-600"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              Next
              <svg
                className="w-5 h-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Order Details Section */}
        {selectedOrder && selectedOrderDetails && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Purchase Order: {selectedOrderDetails.poNumber}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-sm text-gray-600">
                        Date: {formatDate(selectedOrderDetails.poDate)}
                      </span>
                      <span className="text-sm px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-800">
                        {selectedOrderDetails.companyName}
                      </span>
                      <span
                        className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(
                          selectedOrderDetails.status,
                        )}`}
                      >
                        {getStatusLabel(selectedOrderDetails.status)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Vendor: {selectedOrderDetails.vendorName}
                      </span>
                      {isForeignCurrency && (
                        <span className="text-sm px-3 py-1 rounded-full font-medium bg-indigo-100 text-indigo-800">
                          Currency: {selectedOrderDetails.currency}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedOrderDetails.status === "Cancelled" ? (
                    <button
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleDownload(selectedOrderDetails.id)}
                      disabled={downloadLoading}
                    >
                      {downloadLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Download
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {selectedOrderDetails.status !== "Update Order" &&
                        selectedOrderDetails.status !== "Received" && (
                          <button
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center"
                            onClick={() =>
                              prepareUpdateForm(selectedOrderDetails)
                            }
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Update Order
                          </button>
                        )}

                      {selectedOrderDetails.status !== "UploadDoc" &&
                        selectedOrderDetails.status !== "Received" &&
                        selectedOrderDetails.status !== "Cancelled" && (
                          <button
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center justify-center"
                            onClick={() =>
                              handleUploadDoc(selectedOrderDetails)
                            }
                          >
                            <MdDriveFolderUpload className="w-4 h-4 mr-2" />
                            Upload Document
                          </button>
                        )}

                      {canSendEmail(selectedOrderDetails) && (
                        <button
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() =>
                            handleSendEmail(
                              selectedOrderDetails.id,
                              selectedOrderDetails.poNumber,
                            )
                          }
                          disabled={emailLoading}
                        >
                          {emailLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              Send Email
                            </>
                          )}
                        </button>
                      )}

                      {canSendApproval(selectedOrderDetails) && (
                        <button
                          className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() =>
                            handleSendApproval(
                              selectedOrderDetails.id,
                              selectedOrderDetails.poNumber,
                            )
                          }
                          disabled={approvalLoading}
                        >
                          {approvalLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sending...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                              Send Approval
                            </>
                          )}
                        </button>
                      )}

                      {selectedOrderDetails.status !== "Update Order" && (
                        <button
                          className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-medium flex items-center justify-center"
                          onClick={() => handleReOrder(selectedOrderDetails.id)}
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                          ReOrder
                        </button>
                      )}

                      {canCancelOrder(selectedOrderDetails) && (
                        <button
                          className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() =>
                            handleCancelOrder(selectedOrderDetails.id)
                          }
                          disabled={cancelLoading}
                        >
                          {cancelLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-4 h-4 mr-2"
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
                              Cancel
                            </>
                          )}
                        </button>
                      )}

                      <button
                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleDownload(selectedOrderDetails.id)}
                        disabled={downloadLoading}
                      >
                        {downloadLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Download
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {detailsLoading ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Loading order details...</p>
              </div>
            ) : (
              <>
                {/* Basic Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-6 pb-4 border-b border-gray-200 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Vendor Name
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.vendorName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Contact Person
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.contactPerson || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Contact Number
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.cellNo || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        GST Type
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.gstType || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Currency
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.currency || "INR"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Warehouse Name
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.warehouseName || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Exchange Rate
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.exchangeRate || "1"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Payment Terms
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.paymentTerms || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Delivery Terms
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.deliveryTerms || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Warranty
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.warranty || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Expected Delivery Date
                      </label>
                      <div className="text-base font-semibold text-gray-900">
                        {selectedOrderDetails.expectedDeliveryDate
                          ? formatDate(
                              selectedOrderDetails.expectedDeliveryDate,
                            )
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      Item Details
                    </h3>
                    <div className="flex items-center gap-4">
                      {isForeignCurrency && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                          {selectedOrderDetails.currency} Currency
                        </span>
                      )}
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {selectedOrderDetails.items?.length || 0} Items
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedOrderDetails.items &&
                    selectedOrderDetails.items.length > 0 ? (
                      selectedOrderDetails.items.map((item, index) => (
                        <div
                          key={item.id || index}
                          className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {item.itemName || "Unnamed Item"}
                                </h4>
                                {item.hsnCode && (
                                  <p className="text-sm text-gray-600">
                                    HSN: {item.hsnCode}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Unit
                              </label>
                              <div className="font-medium text-gray-900">
                                {item.unit || "N/A"}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantity
                              </label>
                              <div className="font-medium text-gray-900">
                                {item.quantity || "0"}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rate{" "}
                                {isForeignCurrency
                                  ? `(${selectedOrderDetails.currency})`
                                  : "(₹)"}
                              </label>
                              <div className="font-medium text-gray-900">
                                {isForeignCurrency
                                  ? formatForeignCurrency(
                                      item.rateInForeign || item.rate,
                                      selectedOrderDetails.currency,
                                    )
                                  : `₹${formatCurrency(item.rate)}`}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Model
                              </label>
                              <div className="font-medium text-gray-900">
                                {item.modelNumber || "N/A"}
                              </div>
                            </div>
                          </div>

                          {isForeignCurrency && item.amountInForeign && (
                            <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount in {selectedOrderDetails.currency}
                                  </label>
                                  <div className="font-semibold text-indigo-700">
                                    {formatForeignCurrency(
                                      item.amountInForeign,
                                      selectedOrderDetails.currency,
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount in INR
                                  </label>
                                  <div className="font-semibold text-gray-900">
                                    ₹
                                    {formatCurrency(
                                      (parseFloat(item.amountInForeign) || 0) *
                                        (parseFloat(
                                          selectedOrderDetails.exchangeRate,
                                        ) || 1),
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {item.itemDetail && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1 block">
                                Description
                              </label>
                              <div className="text-sm text-gray-700">
                                {item.itemDetail}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        <p className="text-gray-500">
                          No items found in this purchase order
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Charges Section */}
                {selectedOrderDetails.otherCharges &&
                  selectedOrderDetails.otherCharges.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Other Charges
                        </h3>
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                          {selectedOrderDetails.otherCharges.length} Charges
                        </span>
                      </div>

                      <div className="space-y-3">
                        {selectedOrderDetails.otherCharges.map(
                          (charge, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center">
                                <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-md flex items-center justify-center text-xs font-semibold mr-3">
                                  {index + 1}
                                </div>
                                <div className="font-medium text-gray-900">
                                  {charge.name || "Unnamed Charge"}
                                </div>
                              </div>
                              <div className="font-semibold text-blue-600">
                                ₹{formatCurrency(charge.amount)}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        {selectedCompany &&
          !selectedOrder &&
          purchaseOrders.length === 0 &&
          !ordersLoading && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Purchase Orders
              </h3>
            </div>
          )}

        {/* Update Form Modal */}
        {showUpdateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mr-3">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Update Purchase Order
                      </h2>
                      <p className="text-sm text-gray-600">
                        <b>PO Number</b> : {formData.poNumber} <b>PO Date</b>:{" "}
                        {formData.poDate}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors duration-200"
                    onClick={() => setShowUpdateForm(false)}
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-60px)]">
                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Vendor <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="vendorId"
                          value={formData.vendorId}
                          onChange={(e) => {
                            const selectedVendor = vendorsList.find(
                              (v) => v.id === e.target.value,
                            );
                            setFormData((prev) => ({
                              ...prev,
                              vendorId: e.target.value,
                              vendorName: selectedVendor
                                ? selectedVendor.displayName
                                : "",
                            }));
                          }}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                        >
                          <option value="">Select Vendor</option>
                          {vendorsLoading ? (
                            <option value="" disabled>
                              Loading vendors...
                            </option>
                          ) : (
                            vendorsList.map((vendor) => (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.displayName}
                              </option>
                            ))
                          )}
                        </select>
                        {vendorsLoading && (
                          <p className="mt-1 text-xs text-blue-600">
                            Loading vendors from database...
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GST Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="gstType"
                          value={formData.gstType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                        >
                          <option value="">Select GST Type</option>
                          {gstTypes.map((gst) => (
                            <option key={gst.value} value={gst.value}>
                              {gst.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Currency <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                        >
                          <option value="">Select Currency</option>
                          {currencyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Exchange Rate <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="exchangeRate"
                          value={formData.exchangeRate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          step="0.0001"
                          min="0.0001"
                          required
                          disabled={formData.currency === "INR"}
                        />
                        {formData.currency === "INR" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Exchange rate is automatically set to 1 for INR
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Warehouse Name <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="warehouseName"
                          value={formData.warehouseName}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          required
                        >
                          <option value="">Select Warehouse</option>
                          {warehouseLoading ? (
                            <option value="" disabled>
                              Loading warehouses...
                            </option>
                          ) : (
                            warehouseList.map((warehouse) => (
                              <option
                                key={warehouse.value}
                                value={warehouse.label}
                              >
                                {warehouse.label}
                              </option>
                            ))
                          )}
                        </select>
                        {warehouseLoading && (
                          <p className="mt-1 text-xs text-blue-600">
                            Loading warehouses from database...
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Terms
                        </label>
                        <input
                          type="text"
                          name="paymentTerms"
                          value={formData.paymentTerms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Terms
                        </label>
                        <input
                          type="text"
                          name="deliveryTerms"
                          value={formData.deliveryTerms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person
                        </label>
                        <input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Number
                        </label>
                        <input
                          type="text"
                          name="cellNo"
                          value={formData.cellNo}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Warranty
                        </label>
                        <input
                          type="text"
                          name="warranty"
                          value={formData.warranty}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expected Delivery
                        </label>
                        <input
                          type="date"
                          name="expectedDeliveryDate"
                          value={formData.expectedDeliveryDate}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>

                    {isItemWiseGST && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-blue-600 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium text-blue-800">
                            Itemwise GST Selected
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">
                          GST rate must be entered for each item individually in
                          the items section below.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Items Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                          />
                        </svg>
                        Items
                        {isItemWiseGST && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Itemwise GST
                          </span>
                        )}
                      </h3>
                    </div>

                    <div className="space-y-6">
                      {formData.items.map((item, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl border border-gray-200 p-5"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-gray-900">
                                Item {index + 1}
                              </h4>
                              {loadingItems[index] && (
                                <div className="ml-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium flex items-center"
                              onClick={() => removeItem(index)}
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Name{" "}
                                <span className="text-red-500">*</span>
                              </label>
                              {/* <div className="relative">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "name",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  required
                                  onFocus={() => setShowItemsDropdown(index)}
                                  placeholder="Click to select item"
                                />
                                {showItemsDropdown === index && (
                                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                          Select Item
                                        </span>
                                        <button
                                          type="button"
                                          className="text-gray-400 hover:text-gray-600"
                                          onClick={() =>
                                            setShowItemsDropdown(null)
                                          }
                                        >
                                          <svg
                                            className="w-4 h-4"
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
                                      </div>
                                      <div className="px-4 py-2 border-b border-gray-200">
                                        <input
                                          type="text"
                                          placeholder="Search items..."
                                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          value={searchQuery}
                                          onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                          }
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    </div>
                                    <div className="py-1">
                                      {itemsLoading ? (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                          Loading items...
                                        </div>
                                      ) : filteredItems.length > 0 ? (
                                        filteredItems.map((apiItem) => (
                                          <div
                                            key={apiItem.id}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            onClick={() =>
                                              handleItemSelect(index, apiItem)
                                            }
                                          >
                                            <div className="font-medium text-gray-900">
                                              {apiItem.name || "Unnamed Item"}
                                            </div>
                                            {apiItem.hsnCode && (
                                              <div className="text-sm text-gray-500 mt-1">
                                                HSN: {apiItem.hsnCode}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                          No items found
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div> */}

                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    handleItemChange(
                                      index,
                                      "name",
                                      e.target.value,
                                    );
                                    setSearchQuery(e.target.value);
                                    setShowItemsDropdown(index);
                                  }}
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  required
                                  onFocus={() => {
                                    setShowItemsDropdown(index);
                                    setSearchQuery(item.name || "");
                                  }}
                                  placeholder="Type to search item"
                                  autoComplete="off"
                                />
                                {showItemsDropdown === index && (
                                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                          Select Item
                                        </span>
                                        <button
                                          type="button"
                                          className="text-gray-400 hover:text-gray-600"
                                          onClick={() => {
                                            setShowItemsDropdown(null);
                                            setSearchQuery("");
                                          }}
                                        >
                                          <svg
                                            className="w-4 h-4"
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
                                      </div>
                                    </div>
                                    <div className="py-1">
                                      {itemsLoading ? (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                          Loading items...
                                        </div>
                                      ) : filteredItems.length > 0 ? (
                                        filteredItems.map((apiItem) => (
                                          <div
                                            key={apiItem.id}
                                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                            onClick={() =>
                                              handleItemSelect(index, apiItem)
                                            }
                                          >
                                            <div className="font-medium text-gray-900">
                                              {apiItem.name || "Unnamed Item"}
                                            </div>
                                            {apiItem.hsnCode && (
                                              <div className="text-sm text-gray-500 mt-1">
                                                HSN: {apiItem.hsnCode}
                                              </div>
                                            )}
                                          </div>
                                        ))
                                      ) : (
                                        <div className="px-4 py-8 text-center text-gray-500">
                                          No items found
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                HSN Code <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.hsnCode}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "hsnCode",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Model Number
                              </label>
                              <input
                                type="text"
                                value={item.modelNumber}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "modelNumber",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit <span className="text-red-500">*</span>
                              </label>
                              <select
                                value={item.unit}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "unit",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                              >
                                <option value="">Select Unit</option>
                                {unitsLoading ? (
                                  <option value="" disabled>
                                    Loading units...
                                  </option>
                                ) : (
                                  unitTypes?.map((unit) => (
                                    <option key={unit?.id} value={unit?.name}>
                                      {unit.label}
                                    </option>
                                  ))
                                )}
                              </select>
                              {unitsLoading && (
                                <p className="mt-1 text-xs text-blue-600">
                                  Loading units from database...
                                </p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rate <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "rate",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                              />
                            </div>

                            {isItemWiseGST && (
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  GST Rate (%){" "}
                                  <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={item.gstRate || ""}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "gstRate",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                  step="0.01"
                                  min="0"
                                  max="100"
                                  required
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={item.total}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "total",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Item Description
                            </label>
                            <textarea
                              value={item.itemDetail}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "itemDetail",
                                  e.target.value,
                                )
                              }
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              rows="3"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="px-4 py-2 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center"
                        onClick={addNewItem}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                  </div>

                  {/* Other Charges Section */}
                  <div className="bg-gray-50 rounded-xl p-6 ">
                    <div className="flex flex-reverse items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        Other Charges
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {formData.otherCharges.map((charge, index) => (
                        <div
                          key={index}
                          className="bg-white rounded-xl border border-gray-200 p-5"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-lg flex items-center justify-center font-semibold text-sm mr-3">
                                {index + 1}
                              </div>
                              <h4 className="font-semibold text-gray-900">
                                Charge {index + 1}
                              </h4>
                            </div>
                            <button
                              type="button"
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all duration-200 font-medium flex items-center"
                              onClick={() => removeCharge(index)}
                            >
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Charge Name
                              </label>
                              <input
                                type="text"
                                value={charge.name}
                                onChange={(e) =>
                                  handleChargeChange(
                                    index,
                                    "name",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount
                              </label>
                              <input
                                type="text"
                                value={charge.amount}
                                onChange={(e) =>
                                  handleChargeChange(
                                    index,
                                    "amount",
                                    e.target.value,
                                  )
                                }
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                step="0.01"
                                min="0"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center"
                        onClick={addNewCharge}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
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
                        Add Charge
                      </button>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                      onClick={() => setShowUpdateForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-yellow-400 text-dark rounded-xl hover:bg-yellow-400 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={updateLoading}
                    >
                      {updateLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Update Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Upload Document Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mr-3">
                      <MdDriveFolderUpload className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Upload Invoice Document
                      </h2>
                      <p className="text-sm text-gray-600">
                        Upload invoice file for this purchase order
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                    onClick={() => setShowUploadForm(false)}
                  >
                    <svg
                      className="w-5 h-5 text-gray-500"
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
                </div>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleUploadSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={invoiceData.invoiceNumber}
                      onChange={(e) =>
                        setInvoiceData((prev) => ({
                          ...prev,
                          invoiceNumber: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter invoice number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Invoice File <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none"
                          >
                            <span>Upload a file</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                              accept=".pdf,.jpg,.jpeg,.png"
                              required
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, JPG, PNG up to 10MB
                        </p>
                        {invoiceData.invoiceFile && (
                          <div className="mt-2">
                            <p className="text-sm text-green-600">
                              Selected: {invoiceData.invoiceFile.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    onClick={() => setShowUploadForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all duration-200 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploadLoading}
                  >
                    {uploadLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <MdDriveFolderUpload className="w-4 h-4 mr-2" />
                        Upload Invoice
                        
                      </>
                    )}  
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowPurchaseOrder;
