// import React, { useState, useEffect } from "react";
// import { 
//   fetchPaymentRequestsApi, 
//   updatePaymentRequestStatusApi 
// } from "../../config/apiPaths";

// const PaymentRequestDetails = () => {
//   const [paymentRequests, setPaymentRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [filterType, setFilterType] = useState("all");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [sortConfig, setSortConfig] = useState({
//     key: "createdAt",
//     direction: "desc",
//   });
//   const [processingRequest, setProcessingRequest] = useState(null);
//   const [role, setRole] = useState("");

//   useEffect(() => {
//     const userRole = localStorage.getItem("roleName");
//     setRole(userRole || "");
//   }, []);

//   const fetchPaymentRequests = async () => {
//     console.log("fetch payment function call");
//     try {
//       setLoading(true);
//       setError(null);

//       const userRole = localStorage.getItem("roleName");
//       const response = await fetchPaymentRequestsApi(userRole);
//       console.log("Response ->: ", response);

//       setPaymentRequests(response?.data?.data || []);
//     } catch (error) {
//       console.log("error for fetch payment ->", error);
//       setError(
//         error?.response?.data?.message || "Failed to fetch payment requests",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPaymentRequests();
//   }, []);

//   // Sort function
//   const sortedRequests = React.useMemo(() => {
//     let sortableItems = [...paymentRequests];
//     if (sortConfig !== null) {
//       sortableItems.sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === "asc" ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === "asc" ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortableItems;
//   }, [paymentRequests, sortConfig]);

//   // Filter and search logic
//   const filteredRequests = sortedRequests.filter((request) => {
//     const matchesSearch =
//       (request.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//       (request.vendorName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//       (request.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
//       (request.paymentRequestedBy?.toLowerCase() || "").includes(searchTerm.toLowerCase());

//     const matchesFilter =
//       filterType === "all" || request.billpaymentType === filterType;

//     return matchesSearch && matchesFilter;
//   });

//   // Handle sort
//   const requestSort = (key) => {
//     let direction = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") {
//       direction = "desc";
//     }
//     setSortConfig({ key, direction });
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       });
//     } catch (error) {
//       return "Invalid Date";
//     }
//   };

//   const formatCurrency = (amount, currency) => {
//     if (!amount) return "$0.00";
//     return new Intl.NumberFormat("en-US", {
//       style: "currency",
//       currency: currency || "USD",
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(amount);
//   };

//   const getSortIndicator = (key) => {
//     if (sortConfig.key === key) {
//       return sortConfig.direction === "asc" ? "↑" : "↓";
//     }
//     return "↕";
//   };

//   const stats = {
//     total: paymentRequests.length,
//     totalAmount: paymentRequests.reduce(
//       (sum, req) => sum + (req.requestedAmount || 0),
//       0,
//     ),
//     advanceCount: paymentRequests.filter(
//       (req) => req.billpaymentType === "Advance_Payment",
//     ).length,
//     partialCount: paymentRequests.filter(
//       (req) => req.billpaymentType === "Partial_Payment",
//     ).length,
//     uniqueVendors: [...new Set(paymentRequests.map((req) => req.vendorName).filter(Boolean))]
//       .length,
//     uniquePOs: [...new Set(paymentRequests.map((req) => req.poNumber).filter(Boolean))].length,
//   };

//   // Handle approve payment request
//   const handleApprove = async (requestId, poNumber,status) => {
//     const remarks = window.prompt(
//       `Enter remarks for approving ${poNumber}:`,
//       "Docs are verified"
//     );
//     if (remarks === null) return;

//     if (
//       window.confirm(
//         `Are you sure you want to approve payment request for ${poNumber}?`
//       )
//     ) {
//       try {
//         setProcessingRequest(requestId);
//         const userRole = localStorage.getItem("roleName");
//         let updateStatus ;
//         if(status === "Reject"){
//           updateStatus = "REJECTED";
//         }else{
//           updateStatus = userRole === "Accounts" ? "PAID" : "Approved";
//         }
//         await updatePaymentRequestStatusApi({
//           role: userRole,
//           paymentRequestId: requestId,
//           status:updateStatus,
//           remarks: remarks || "",
//         });

//         alert(`Payment request for ${poNumber} approved successfully!`);
//         fetchPaymentRequests();
//       } catch (error) {
//         alert(
//           error?.response?.data?.message ||
//             "Failed to approve payment request"
//         );
//         console.error(error);
//       } finally {
//         setProcessingRequest(null);
//       }
//     }
//   };

//   const handleReject = async (requestId, poNumber) => {
//     const remarks = window.prompt(
//       `Enter reason for rejecting ${poNumber}:`
//     );

//     if (!remarks) {
//       alert("Rejection reason is required");
//       return;
//     }

//     if (
//       window.confirm(
//         `Are you sure you want to reject payment request for ${poNumber}?`
//       )
//     ) {
//       try {
//         setProcessingRequest(requestId);
        
//         const userRole = localStorage.getItem("roleName");
//         await updatePaymentRequestStatusApi({
//           role: userRole,
//           paymentRequestId: requestId,
//           status: "REJECTED",
//           remarks,
//         });

//         alert(`Payment request for ${poNumber} rejected successfully!`);
//         fetchPaymentRequests();
//       } catch (error) {
//         alert(
//           error?.response?.data?.message ||
//             "Failed to reject payment request"
//         );
//         console.error(error);
//       } finally {
//         setProcessingRequest(null);
//       }
//     }
//   };

//   // Handle view details
//   const handleViewDetails = (requestId, poNumber) => {
//     console.log("View details for:", requestId, poNumber);
//     // You can implement navigation or modal here
//     // Example: navigate(`/payment-requests/${requestId}`);
//   };

//   // Loading state
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
//         <div className="max-w-7xl mx-auto">
//           <div className="animate-pulse">
//             <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
//               {[...Array(4)].map((_, i) => (
//                 <div key={i} className="bg-white rounded-xl shadow p-6">
//                   <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
//                   <div className="h-8 bg-gray-300 rounded w-1/2"></div>
//                 </div>
//               ))}
//             </div>
//             <div className="bg-white rounded-xl shadow p-6">
//               <div className="h-96 bg-gray-300 rounded"></div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
//       <div className="max-w-7xl mx-auto">
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex flex-col md:flex-row md:items-center justify-between">
//             <div>
//               <h1 className="text-3xl font-bold text-gray-900">
//                 Payment Request Details
//               </h1>
              
//             </div>
//             <div className="mt-4 md:mt-0 flex space-x-3">
//               <button
//                 onClick={fetchPaymentRequests}
//                 className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
//                 disabled={processingRequest}
//               >
//                 <svg
//                   className={`h-4 w-4 mr-2 ${processingRequest ? "animate-spin" : ""}`}
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//                   />
//                 </svg>
//                 Refresh
//               </button>
//             </div>
//           </div>
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
//             <div className="flex items-center">
//               <svg
//                 className="h-5 w-5 text-red-400 mr-3"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//               <div>
//                 <h3 className="text-sm font-medium text-red-800">
//                   Error loading payment requests
//                 </h3>
//                 <p className="text-sm text-red-700 mt-1">{error}</p>
//               </div>
//               <button
//                 onClick={() => setError(null)}
//                 className="ml-auto text-red-400 hover:text-red-600"
//               >
//                 <svg
//                   className="h-5 w-5"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M6 18L18 6M6 6l12 12"
//                   />
//                 </svg>
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Filters and Search */}
//         <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
//           <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
//             <div className="flex-1">
//               <div className="relative">
//                 <svg
//                   className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                   />
//                 </svg>
//                 <input
//                   type="text"
//                   placeholder="Search by PO Number, Vendor, Company, or Requester..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
//                 />
//               </div>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4">
//               <div className="flex items-center space-x-2">
//                 <span className="text-sm font-medium text-gray-700">
//                   Filter by:
//                 </span>
//                 <select
//                   value={filterType}
//                   onChange={(e) => setFilterType(e.target.value)}
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[140px]"
//                 >
//                   <option value="all">All Types</option>
//                   <option value="Advance_Payment">Advance Payment</option>
//                   <option value="Partial_Payment">Partial Payment</option>
//                 </select>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <span className="text-sm font-medium text-gray-700">
//                   Sort by:
//                 </span>
//                 <select
//                   value={sortConfig.key}
//                   onChange={(e) => requestSort(e.target.value)}
//                   className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-w-[140px]"
//                 >
//                   <option value="createdAt">Date</option>
//                   <option value="poNumber">PO Number</option>
//                   <option value="requestedAmount">Amount</option>
//                   <option value="vendorName">Vendor</option>
//                   <option value="companyName">Company</option>
//                 </select>
//                 <button
//                   onClick={() => requestSort(sortConfig.key)}
//                   className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
//                 >
//                   {sortConfig.direction === "asc" ? "↑" : "↓"}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Payment Requests Table */}
//         {filteredRequests.length === 0 ? (
//           <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
//             <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
//               <svg
//                 className="h-12 w-12 text-gray-400"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                 />
//               </svg>
//             </div>
//             <h3 className="text-xl font-semibold text-gray-700 mb-2">
//               {searchTerm || filterType !== "all"
//                 ? "No matching results"
//                 : "No payment requests found"}
//             </h3>
//             <p className="text-gray-500 mb-6">
//               {searchTerm || filterType !== "all"
//                 ? "Try adjusting your search or filter criteria"
//                 : "All payment requests have been processed or there are no pending requests"}
//             </p>
//             {(searchTerm || filterType !== "all") && (
//               <button
//                 onClick={() => {
//                   setSearchTerm("");
//                   setFilterType("all");
//                 }}
//                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 Clear filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
//             {/* Table Container */}
//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th
//                       className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
//                       onClick={() => requestSort("poNumber")}
//                     >
//                       <div className="flex items-center">
//                         PO Details
//                         <span className="ml-1">
//                           {getSortIndicator("poNumber")}
//                         </span>
//                       </div>
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
//                       onClick={() => requestSort("vendorName")}
//                     >
//                       <div className="flex items-center">
//                         Vendor & Company
//                         <span className="ml-1">
//                           {getSortIndicator("vendorName")}
//                         </span>
//                       </div>
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
//                       onClick={() => requestSort("requestedAmount")}
//                     >
//                       <div className="flex items-center">
//                         Amount & Type
//                         <span className="ml-1">
//                           {getSortIndicator("requestedAmount")}
//                         </span>
//                       </div>
//                     </th>
//                     <th
//                       className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
//                       onClick={() => requestSort("createdAt")}
//                     >
//                       <div className="flex items-center">
//                         Request Info
//                         <span className="ml-1">
//                           {getSortIndicator("createdAt")}
//                         </span>
//                       </div>
//                     </th>
//                     <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="bg-white divide-y divide-gray-200">
//                   {filteredRequests.map((request) => (
//                     <tr
//                       key={request.paymentRequestId}
//                       className="hover:bg-gray-50 transition-colors group"
//                     >
//                       {/* PO Details */}
//                       <td className="px-6 py-4">
//                         <div>
//                           <div className="flex items-center">
//                             <div className="p-2 bg-blue-50 rounded-lg">
//                               <svg
//                                 className="h-5 w-5 text-blue-600"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
//                                 />
//                               </svg>
//                             </div>
//                             <div className="ml-3">
//                               <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
//                                 {request.poNumber || "N/A"}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Vendor & Company */}
//                       <td className="px-6 py-4">
//                         <div className="space-y-3">
//                           <div>
//                             <div className="flex items-center text-sm">
//                               <svg
//                                 className="h-4 w-4 text-gray-400 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//                                 />
//                               </svg>
//                               <span className="font-medium text-gray-900">
//                                 {request.vendorName || "N/A"}
//                               </span>
//                             </div>
//                           </div>
//                           <div>
//                             <div className="flex items-center text-sm text-gray-600">
//                               <svg
//                                 className="h-4 w-4 text-gray-400 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
//                                 />
//                               </svg>
//                               <span className="truncate">
//                                 {request.companyName || "N/A"}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Amount & Type */}
//                       <td className="px-6 py-4">
//                         <div className="space-y-3">
//                           <div className="flex items-center">
//                             <svg
//                               className="h-5 w-5 text-green-500 mr-2"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                               />
//                             </svg>
//                             <div>
//                               <span className="text-lg font-bold text-gray-900">
//                                 {formatCurrency(
//                                   request.requestedAmount,
//                                   request.currency,
//                                 )}
//                               </span>
//                               <div className="text-xs text-gray-500">
//                                 {request.currency || "USD"}
//                               </div>
//                             </div>
//                           </div>
//                           <div>
//                             <span
//                               className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
//                               ${
//                                 request.billpaymentType === "Advance_Payment"
//                                   ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
//                                   : request.billpaymentType === "Partial_Payment"
//                                   ? "bg-blue-50 text-blue-700 border border-blue-200"
//                                   : "bg-gray-50 text-gray-700 border border-gray-200"
//                               }`}
//                             >
//                               <svg
//                                 className="h-3 w-3 mr-1"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
//                                 />
//                               </svg>
//                               {request.billpaymentType ? request.billpaymentType.replace("_", " ") : "Unknown"}
//                             </span>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Request Info */}
//                       <td className="px-6 py-4">
//                         <div className="space-y-3">
//                           <div>
//                             <div className="flex items-center text-sm">
//                               <svg
//                                 className="h-4 w-4 text-gray-400 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
//                                 />
//                               </svg>
//                               <span className="font-medium text-gray-700">
//                                 {request.paymentRequestedBy || "N/A"}
//                               </span>
//                             </div>
//                           </div>
//                           <div>
//                             <div className="flex items-center text-sm text-gray-500">
//                               <svg
//                                 className="h-4 w-4 text-gray-400 mr-2"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                                 />
//                               </svg>
//                               <span>{formatDate(request.createdAt)}</span>
//                             </div>
//                           </div>
//                         </div>
//                       </td>

//                       {/* Actions */}
//                       <td className="px-6 py-4">
//                         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
//                           <button
//                             onClick={() =>
//                               handleApprove(
//                                 request.paymentRequestId,
//                                 request.poNumber,
//                                 "Approved"
//                               )
//                             }
//                             disabled={
//                               processingRequest === request.paymentRequestId
//                             }
//                             className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm btn-approve focus:outline-none focus:ring-2 focus:ring-offset-2 transition flex-1 sm:flex-none ${
//                               processingRequest === request.paymentRequestId
//                                 ? "opacity-70 cursor-not-allowed"
//                                 : ""
//                             }`}
//                           >
//                             {processingRequest === request.paymentRequestId ? (
//                               <>
//                                 <svg
//                                   className="animate-spin h-4 w-4 mr-2 text-white"
//                                   fill="none"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <circle
//                                     className="opacity-25"
//                                     cx="12"
//                                     cy="12"
//                                     r="10"
//                                     stroke="currentColor"
//                                     strokeWidth="4"
//                                   />
//                                   <path
//                                     className="opacity-75"
//                                     fill="currentColor"
//                                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                   />
//                                 </svg>
//                                 Processing...
//                               </>
//                             ) : (
//                               <>
//                                 <svg
//                                   className="h-4 w-4 mr-2"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                                   />
//                                 </svg>
//                                 Approve
//                               </>
//                             )}
//                           </button>
//                           <button
//                             onClick={() =>
//                               handleReject(
//                                 request.paymentRequestId,
//                                 request.poNumber,
//                                 "Reject"
//                               )
//                             }
//                             disabled={
//                               processingRequest === request.paymentRequestId
//                             }
//                             className={`inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm btn-decline focus:outline-none focus:ring-2 focus:ring-offset-2 transition flex-1 sm:flex-none ${
//                               processingRequest === request.paymentRequestId
//                                 ? "opacity-70 cursor-not-allowed"
//                                 : ""
//                             }`}
//                           >
//                             {processingRequest === request.paymentRequestId ? (
//                               <>
//                                 <svg
//                                   className="animate-spin h-4 w-4 mr-2 text-white"
//                                   fill="none"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <circle
//                                     className="opacity-25"
//                                     cx="12"
//                                     cy="12"
//                                     r="10"
//                                     stroke="currentColor"
//                                     strokeWidth="4"
//                                   />
//                                   <path
//                                     className="opacity-75"
//                                     fill="currentColor"
//                                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                                   />
//                                 </svg>
//                                 Processing...
//                               </>
//                             ) : (
//                               <>
//                                 <svg
//                                   className="h-4 w-4 mr-2"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
//                                   />
//                                 </svg>
//                                 Reject
//                               </>
//                             )}
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Table Footer */}
//             <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
//               <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//                 <div className="text-sm text-gray-600 mb-2 md:mb-0">
//                   Showing{" "}
//                   <span className="font-medium">
//                     {filteredRequests.length}
//                   </span>{" "}
//                   of{" "}
//                   <span className="font-medium">{filteredRequests.length}</span>{" "}
//                   payment requests
//                   {searchTerm && (
//                     <span>
//                       {" "}
//                       matching "
//                       <span className="font-medium">{searchTerm}</span>"
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex items-center space-x-4">
//                   <div className="flex items-center space-x-2">
//                     <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
//                       <svg
//                         className="h-4 w-4"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M15 19l-7-7 7-7"
//                         />
//                       </svg>
//                     </button>
//                     <span className="text-sm text-gray-600">1 of 1</span>
//                     <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
//                       <svg
//                         className="h-4 w-4"
//                         fill="none"
//                         stroke="currentColor"
//                         viewBox="0 0 24 24"
//                       >
//                         <path
//                           strokeLinecap="round"
//                           strokeLinejoin="round"
//                           strokeWidth={2}
//                           d="M9 5l7 7-7 7"
//                         />
//                       </svg>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PaymentRequestDetails;

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  fetchPaymentRequestsApi,
  updatePaymentRequestStatusApi,
} from "../../config/apiPaths";

const PaymentRequestDetails = () => {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [processingRequest, setProcessingRequest] = useState(null);

  // Modal state for remarks
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [modalAction, setModalAction] = useState(null); // 'approve' or 'reject'
  const [modalRequestId, setModalRequestId] = useState(null);
  const [modalPoNumber, setModalPoNumber] = useState("");
  const [remarkText, setRemarkText] = useState("");
  const [remarkError, setRemarkError] = useState("");

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const userRole = localStorage.getItem("roleName");
      const response = await fetchPaymentRequestsApi(userRole);
      setPaymentRequests(response?.data?.data || []);
    } catch (error) {
      console.error("Error fetching payment requests:", error);
      setError(error?.response?.data?.message || "Failed to fetch payment requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  // Filter by search term
  const filteredRequests = paymentRequests.filter((request) => {
    const matchesSearch =
      (request.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (request.vendorName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (request.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (request.paymentRequestedBy?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount, currency) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Open modal for approve
  const openApproveModal = (requestId, poNumber) => {
    setModalAction("approve");
    setModalRequestId(requestId);
    setModalPoNumber(poNumber);
    setRemarkText("");
    setRemarkError("");
    setShowRemarkModal(true);
  };

  // Open modal for reject
  const openRejectModal = (requestId, poNumber) => {
    setModalAction("reject");
    setModalRequestId(requestId);
    setModalPoNumber(poNumber);
    setRemarkText("");
    setRemarkError("");
    setShowRemarkModal(true);
  };

  // Handle modal submit
  const handleRemarkSubmit = async () => {
    // Validation: reject requires a reason
    if (modalAction === "reject" && !remarkText.trim()) {
      setRemarkError("Rejection reason is required");
      return;
    }

    try {
      setProcessingRequest(modalRequestId);
      const userRole = localStorage.getItem("roleName");

      let updateStatus;
      if (modalAction === "reject") {
        updateStatus = "REJECTED";
      } else {
        updateStatus = userRole === "Accounts" ? "PAID" : "Approved";
      }

      await updatePaymentRequestStatusApi({
        role: userRole,
        paymentRequestId: modalRequestId,
        status: updateStatus,
        remarks: remarkText.trim() || "",
      });

      toast.success(
        `Payment request for ${modalPoNumber} ${
          modalAction === "approve" ? "approved" : "rejected"
        } successfully!`
      );

      setShowRemarkModal(false);
      fetchPaymentRequests();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || `Failed to ${modalAction} payment request`
      );
      console.error(error);
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow p-6">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="h-96 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-end">
            <div className="mt-4 md:mt-0 flex space-x-3">
              <button
                onClick={fetchPaymentRequests}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                disabled={processingRequest}
              >
                <svg
                  className={`h-4 w-4 mr-2 ${processingRequest ? "animate-spin" : ""}`}
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
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-400 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading payment requests
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <svg
                  className="h-5 w-5"
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
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6 p-6">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
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
              placeholder="Search by PO Number, Vendor, Company, or Requester..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
            />
          </div>
        </div>

        {/* Payment Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="h-12 w-12 text-gray-400"
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
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? "No matching results" : "No payment requests found"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm
                ? "Try adjusting your search criteria"
                : "All payment requests have been processed or there are no pending requests"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      PO Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Vendor & Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Amount & Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Request Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.paymentRequestId}
                      className="hover:bg-gray-50 transition-colors group"
                    >
                      {/* PO Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <svg
                              className="h-5 w-5 text-blue-600"
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
                          <div className="ml-3">
                            <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {request.poNumber || "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Vendor & Company */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center text-sm">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="font-medium text-gray-900">
                                {request.vendorName || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center text-sm text-gray-600">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                              <span className="truncate">
                                {request.companyName || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount & Type */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <svg
                              className="h-5 w-5 text-green-500 mr-2"
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
                            <div>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(
                                  request.requestedAmount,
                                  request.currency
                                )}
                              </span>
                              <div className="text-xs text-gray-500">
                                {request.currency || "USD"}
                              </div>
                            </div>
                          </div>
                          <div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                              ${
                                request.billpaymentType === "Advance_Payment"
                                  ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                  : request.billpaymentType === "Partial_Payment"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-gray-50 text-gray-700 border border-gray-200"
                              }`}
                            >
                              <svg
                                className="h-3 w-3 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                              </svg>
                              {request.billpaymentType
                                ? request.billpaymentType.replace("_", " ")
                                : "Unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Request Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-center text-sm">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                              <span className="font-medium text-gray-700">
                                {request.paymentRequestedBy || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg
                                className="h-4 w-4 text-gray-400 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span>{formatDate(request.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                          <button
                            onClick={() =>
                              openApproveModal(
                                request.paymentRequestId,
                                request.poNumber
                              )
                            }
                            disabled={processingRequest === request.paymentRequestId}
                            className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg shadow-sm btn-approve transition flex-1 sm:flex-none ${
                              processingRequest === request.paymentRequestId
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {processingRequest === request.paymentRequestId ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4 mr-2 text-white"
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
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() =>
                              openRejectModal(
                                request.paymentRequestId,
                                request.poNumber
                              )
                            }
                            disabled={processingRequest === request.paymentRequestId}
                            className={`inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg shadow-sm btn-decline transition flex-1 sm:flex-none ${
                              processingRequest === request.paymentRequestId
                                ? "opacity-70 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            {processingRequest === request.paymentRequestId ? (
                              <>
                                <svg
                                  className="animate-spin h-4 w-4 mr-2 text-white"
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
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Processing...
                              </>
                            ) : (
                              <>
                                <svg
                                  className="h-4 w-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Reject
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-600 mb-2 md:mb-0">
                  Showing{" "}
                  <span className="font-medium">{filteredRequests.length}</span> of{" "}
                  <span className="font-medium">{filteredRequests.length}</span>{" "}
                  payment requests
                  {searchTerm && (
                    <span>
                      {" "}
                      matching "<span className="font-medium">{searchTerm}</span>"
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg
                        className="h-4 w-4"
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
                    <span className="text-sm text-gray-600">1 of 1</span>
                    <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                      <svg
                        className="h-4 w-4"
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Remark Modal */}
      {showRemarkModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowRemarkModal(false)}
            ></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg
                      className="h-6 w-6 text-blue-600"
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
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {modalAction === "approve" ? "Approve" : "Reject"} Payment Request
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-3">
                        Please enter remarks for {modalPoNumber}:
                      </p>
                      <textarea
                        rows="4"
                        className={`w-full px-3 py-2 border ${
                          remarkError ? "border-red-300" : "border-gray-300"
                        } rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                        placeholder="Enter remarks..."
                        value={remarkText}
                        onChange={(e) => {
                          setRemarkText(e.target.value);
                          if (remarkError) setRemarkError("");
                        }}
                      ></textarea>
                      {remarkError && (
                        <p className="mt-1 text-sm text-red-600">{remarkError}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleRemarkSubmit}
                  disabled={processingRequest === modalRequestId}
                  className={`w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 text-base font-medium ${
                    modalAction === "approve"
                      ? "btn-approve"
                      : "btn-decline"
                  } sm:ml-3 sm:w-auto sm:text-sm ${
                    processingRequest === modalRequestId
                      ? "opacity-70 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {processingRequest === modalRequestId ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processing...
                    </>
                  ) : modalAction === "approve" ? (
                    "Approve"
                  ) : (
                    "Reject"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemarkModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRequestDetails;