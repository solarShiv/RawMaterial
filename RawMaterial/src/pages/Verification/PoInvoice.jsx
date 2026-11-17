// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import Api from "../../auth/Api";
// import { useUser } from "../../Context/UserContext";
// import {
//   ChevronDown,
//   ChevronUp,
//   FileText,
//   Download,
//   ExternalLink,
//   Search,
//   Filter,
//   Building,
//   User,
//   Calendar,
//   AlertCircle,
//   Hash,
//   Receipt,
//   Store,
//   Image as ImageIcon,
//   File as FileIcon,
//   X,
// } from "lucide-react";
// import { useDebounce } from "../../hooks/UseDebounce";

// const PoInvoice = () => {
//   const { user, logout } = useUser();
//   console.log("user Data ->", user?.role)
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [filteredOrders, setFilteredOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [expandedRows, setExpandedRows] = useState({});
//   const [filters, setFilters] = useState({
//     search: "",
//     hasBill: "all",
//     company: "all",
//     vendor: "all",
//     currency: "all",
//     invoiceType: "all",
//     invoiceStatus: "all",
//     paymentStatus: "all",
//   });
//   const [searchInput, setSearchInput] = useState("");
//   const [stats, setStats] = useState({
//     totalAmount: 0,
//     totalPaid: 0,
//     totalRemaining: 0,
//     totalPOs: 0,
//     withBill: 0,
//     withoutBill: 0,
//     poInvoices: 0,
//     vendorInvoices: 0,
//   });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [activeFilters, setActiveFilters] = useState([]);
//   const [pdfError, setPdfError] = useState(null);
//   const [downloadingPdf, setDownloadingPdf] = useState({});
//   const [mobileView, setMobileView] = useState(false);
//   const [vendorInvoiceStats, setVendorInvoiceStats] = useState({
//     totalVendorInvoices: 0,
//     totalVendorAmount: 0,
//     paidVendorAmount: 0,
//     pendingVendorAmount: 0,
//   });

//   // State for image preview modal
//   const [imagePreview, setImagePreview] = useState({
//     isOpen: false,
//     imageUrl: null,
//     fileName: null,
//   });

//   // Debounce search input
//   const debouncedSearch = useDebounce(searchInput, 300);

//   // Helper function to determine file type from URL or filename
//   const getFileType = (fileUrl) => {
//     if (!fileUrl) return 'unknown';

//     const extension = fileUrl.split('.').pop()?.toLowerCase();

//     // Check if it's an image
//     const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
//     if (imageExtensions.includes(extension)) {
//       return 'image';
//     }

//     // Check if it's a PDF
//     if (extension === 'pdf') {
//       return 'pdf';
//     }

//     // If no extension or unknown, try to check from URL structure
//     if (fileUrl.includes('/images/') || fileUrl.includes('/img/')) {
//       return 'image';
//     }

//     return 'unknown';
//   };

//   // Get appropriate icon for file type
//   const getFileIcon = (fileType) => {
//     switch (fileType) {
//       case 'pdf':
//         return <FileText size={16} className="text-red-500" />;
//       case 'image':
//         return <ImageIcon size={16} className="text-green-500" />;
//       default:
//         return <FileIcon size={16} className="text-ink-500" />;
//     }
//   };

//   // Open image in modal
//   const openImagePreview = (imageUrl, fileName) => {
//     setImagePreview({
//       isOpen: true,
//       imageUrl: imageUrl,
//       fileName: fileName,
//     });
//   };

//   // Close image preview modal
//   const closeImagePreview = () => {
//     setImagePreview({
//       isOpen: false,
//       imageUrl: null,
//       fileName: null,
//     });
//   };

//   // Open PO PDF in new tab with proper authentication
//   const openPdfInNewTab = async (poId, poNumber) => {
//     try {
//       // Fetch PDF as blob with authentication
//       const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
//         responseType: 'blob',
//       });

//       // Create blob URL from the response
//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const pdfUrl = URL.createObjectURL(blob);

//       // Open in new tab with proper PDF viewer
//       const newWindow = window.open();
//       if (newWindow) {
//         newWindow.document.write(`
//           <!DOCTYPE html>
//           <html>
//             <head>
//               <title>PO-${poNumber}</title>
//               <style>
//                 body {
//                   margin: 0;
//                   padding: 0;
//                   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
//                 }
//                 .pdf-container {
//                   width: 100%;
//                   height: 100vh;
//                   display: flex;
//                   flex-direction: column;
//                 }
//                 .toolbar {
//                   background: #f8f9fa;
//                   padding: 10px 20px;
//                   border-bottom: 1px solid #dee2e6;
//                   display: flex;
//                   justify-content: space-between;
//                   align-items: center;
//                 }
//                 .toolbar-title {
//                   font-size: 16px;
//                   font-weight: 500;
//                   color: #212529;
//                 }
//                 iframe {
//                   width: 100%;
//                   height: 100%;
//                   border: none;
//                 }
//                 .btn {
//                   padding: 8px 16px;
//                   border: none;
//                   border-radius: 4px;
//                   cursor: pointer;
//                   font-size: 14px;
//                   font-weight: 500;
//                   margin-left: 8px;
//                 }
//                 .btn-primary {
//                   background: #28a745;
//                   color: white;
//                 }
//                 .btn-primary:hover {
//                   background: #218838;
//                 }
//                 .btn-secondary {
//                   background: #6c757d;
//                   color: white;
//                 }
//                 .btn-secondary:hover {
//                   background: #5a6268;
//                 }
//               </style>
//             </head>
//             <body>
//               <div class="pdf-container">
//                 <div class="toolbar">
//                   <span class="toolbar-title">Purchase Order: ${poNumber}</span>
//                   <div>
//                     <button class="btn btn-primary" onclick="window.print()">
//                       Print
//                     </button>
//                     <button class="btn btn-secondary" onclick="window.close()">
//                       Close
//                     </button>
//                   </div>
//                 </div>
//                 <iframe src="${pdfUrl}" title="PO-${poNumber}"></iframe>
//               </div>
//               <script>
//                 window.addEventListener('beforeunload', function() {
//                   URL.revokeObjectURL("${pdfUrl}");
//                 });
//               </script>
//             </body>
//           </html>
//         `);

//         newWindow.document.close();
//         newWindow.focus();
//       }

//     } catch (error) {
//       console.error("Error loading PDF:", error);

//       // Show error in new tab
//       const errorWindow = window.open();
//       if (errorWindow) {
//         errorWindow.document.write(`
//           <!DOCTYPE html>
//           <html>
//             <head>
//               <title>Error Loading PDF</title>
//               <style>
//                 body {
//                   font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
//                   margin: 0;
//                   padding: 0;
//                   background: #f8f9fa;
//                 }
//                 .error-container {
//                   max-width: 600px;
//                   margin: 100px auto;
//                   padding: 40px;
//                   background: white;
//                   border-radius: 8px;
//                   box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//                   text-align: center;
//                 }
//                 .error-icon {
//                   font-size: 48px;
//                   margin-bottom: 20px;
//                 }
//                 h2 {
//                   color: #dc3545;
//                   margin-bottom: 20px;
//                 }
//                 p {
//                   color: #6c757d;
//                   margin-bottom: 10px;
//                   line-height: 1.6;
//                 }
//                 .btn {
//                   padding: 12px 24px;
//                   background: #007bff;
//                   color: white;
//                   border: none;
//                   border-radius: 4px;
//                   cursor: pointer;
//                   font-size: 16px;
//                   margin-top: 20px;
//                 }
//                 .btn:hover {
//                   background: #0056b3;
//                 }
//               </style>
//             </head>
//             <body>
//               <div class="error-container">
//                 <div class="error-icon">📄</div>
//                 <h2>Failed to Load PDF</h2>
//                 <p>Unable to load the PDF document for PO: ${poNumber}</p>
//                 <p>Error: ${error.message || "Unknown error"}</p>
//                 <button class="btn" onclick="window.close()">Close Window</button>
//               </div>
//             </body>
//           </html>
//         `);
//         errorWindow.document.close();
//         errorWindow.focus();
//       }

//       setPdfError(`Failed to load PDF for PO ${poNumber}. Please try again.`);
//     }
//   };

//   // Download PO PDF
//   const downloadPdf = async (poId, poNumber) => {
//     try {
//       const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
//         responseType: 'blob',
//       });

//       const blob = new Blob([response.data], { type: 'application/pdf' });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `${poNumber}.pdf`;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);

//       // Clean up
//       setTimeout(() => {
//         window.URL.revokeObjectURL(url);
//       }, 100);
//     } catch (error) {
//       console.error("Error downloading PDF:", error);
//       setPdfError(`Failed to download PDF for PO ${poNumber}. Please try again.`);
//     }
//   };

//   // Handle file actions (view/download) for both PDF and images
//   const handleFileAction = async (
//     fileUrl,
//     fileName,
//     action = "view",
//     fileType = "unknown"
//   ) => {
//     const id = fileUrl?.split("/").pop() || "file";
//     setDownloadingPdf((prev) => ({ ...prev, [id]: true }));
//     setPdfError(null);

//     try {
//       const fullUrl = `${import.meta.env.VITE_API_URL}${fileUrl}`;

//       if (action === "download") {
//         // Download for any file type
//         const response = await fetch(fullUrl);
//         if (!response.ok) throw new Error("Failed to fetch file");

//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement("a");
//         a.href = url;

//         // Get proper extension
//         const extension = fileUrl.split('.').pop() || 'pdf';
//         a.download = `${fileName || "file"}.${extension}`;

//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//       } else {
//         // View - handle based on file type
//         if (fileType === 'pdf') {
//           window.open(fullUrl, "_blank", "noopener,noreferrer");
//         } else if (fileType === 'image') {
//           // Open image in modal
//           openImagePreview(fullUrl, fileName);
//         } else {
//           // For unknown types, try to open in new tab
//           window.open(fullUrl, "_blank", "noopener,noreferrer");
//         }
//       }
//     } catch (error) {
//       console.error("Error handling file:", error);
//       setPdfError(
//         `Failed to ${action} file. Please check the file URL or try again.`,
//       );
//     } finally {
//       setDownloadingPdf((prev) => ({ ...prev, [id]: false }));
//     }
//   };
//   const changableApi = user.role === "Admin" ? "/verification-dept/purchase-orders/invoices" : "/verification-dept/purchase-orders/company-wise/invoices"
//   // Fetch data from both APIs
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setInitialLoading(true);
//         setError(null);

//         // Fetch data from both APIs in parallel
//         const [poResponse, vendorInvoicesResponse] = await Promise.all([
//           Api.get(changableApi),
//           Api.get("/common/vendors/invoices"),
//         ]);

//         if (poResponse.data.success && vendorInvoicesResponse.data.success) {
//           const poData = poResponse.data.data;
//           const vendorInvoiceData = vendorInvoicesResponse.data.data;

//           // Calculate vendor invoice statistics
//           const vendorStats = calculateVendorInvoiceStats(vendorInvoiceData);
//           setVendorInvoiceStats(vendorStats);

//           // Create a map of PO ID to vendor invoices for quick lookup
//           const vendorInvoiceMap = new Map();
//           vendorInvoiceData.forEach((item) => {
//             vendorInvoiceMap.set(item.poId, {
//               vendorId: item.vendorId,
//               vendorName: item.vendorName,
//               vendorInvoices: (item.invoices || []).map((invoice) => ({
//                 ...invoice,
//                 vendorInvoiceId:
//                   invoice.invoiceId || `vendor-${Date.now()}-${Math.random()}`,
//                 vendorInvoiceNumber:
//                   invoice.invoiceNumber || "No Vendor Invoice#",
//                 vendorInvoiceDate: invoice.invoiceDate,
//                 vendorDueDate: invoice.dueDate,
//                 vendorInvoiceAmount: invoice.invoiceAmount || 0,
//                 vendorTaxAmount: invoice.taxAmount || 0,
//                 vendorTotalAmount: invoice.totalAmount || 0,
//                 vendorAmountPaid: invoice.amountPaid || 0,
//                 vendorBalanceDue: invoice.balanceDue || 0,
//                 vendorPaymentTerms: invoice.paymentTerms || "N/A",
//                 vendorPaymentStatus: invoice.paymentStatus || "Pending",
//                 vendorInvoiceStatus: invoice.invoiceStatus || "Draft",
//                 vendorDescription: invoice.description || "",
//                 vendorPoNumber: invoice.poNumber || "",
//                 vendorCreatedBy: invoice.createdBy,
//                 vendorApprovedBy: invoice.approvedBy,
//                 vendorRejectionReason: invoice.rejectionReason || null,
//                 vendorFileUrl: invoice.invoiceUrl,
//                 vendorCreatedAt: invoice.createdAt || new Date().toISOString(),
//                 vendorUpdatedAt: invoice.updatedAt,
//                 invoiceType: "vendor",
//                 // Add file type detection
//                 fileType: getFileType(invoice.invoiceUrl),
//               })),
//             });
//           });

//           // Merge the data with clear separation
//           const mergedData = poData.map((po) => {
//             const vendorInvoiceInfo = vendorInvoiceMap.get(po.poId);

//             // Keep PO bills as they are (from the first API)
//             const poBills = (po.bills || []).map((bill) => ({
//               ...bill,
//               poInvoiceId: bill.id || `po-${Date.now()}-${Math.random()}`,
//               poInvoiceNumber: bill.invoiceNumber || "No PO Invoice#",
//               poInvoiceDate: bill.createdAt || po.poDate,
//               poFileUrl: bill.fileUrl,
//               poSource: "po",
//               invoiceType: "po",
//               // Add file type detection
//               fileType: getFileType(bill.fileUrl),
//             }));

//             // Get vendor invoices separately
//             const vendorInvoices = vendorInvoiceInfo?.vendorInvoices || [];

//             return {
//               ...po,
//               poBills: poBills,
//               vendorInvoices: vendorInvoices,
//               allBills: [...poBills, ...vendorInvoices],
//               hasBill: poBills.length > 0 || vendorInvoices.length > 0,
//               hasPoBill: poBills.length > 0,
//               hasVendorInvoice: vendorInvoices.length > 0,
//               poBillCount: poBills.length,
//               vendorInvoiceCount: vendorInvoices.length,
//             };
//           });

//           setPurchaseOrders(mergedData);
//           setFilteredOrders(mergedData);

//           // Calculate statistics
//           const calculatedStats = {
//             totalAmount: mergedData.reduce(
//               (sum, po) => sum + (po.grandTotal || 0),
//               0,
//             ),
//             totalPaid: mergedData.reduce(
//               (sum, po) => sum + (po.totalPaid || 0),
//               0,
//             ),
//             totalRemaining: mergedData.reduce(
//               (sum, po) => sum + (po.remainingAmount || 0),
//               0,
//             ),
//             totalPOs: mergedData.length,
//             withBill: mergedData.filter((po) => po.hasBill).length,
//             withoutBill: mergedData.filter((po) => !po.hasBill).length,
//             poInvoices: mergedData.reduce((sum, po) => sum + po.poBillCount, 0),
//             vendorInvoices: mergedData.reduce(
//               (sum, po) => sum + po.vendorInvoiceCount,
//               0,
//             ),
//           };
//           setStats(calculatedStats);
//         }
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         setError(
//           err.response?.data?.message ||
//             "Failed to fetch purchase orders. Please try again later.",
//         );
//       } finally {
//         setLoading(false);
//         setInitialLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Calculate vendor invoice statistics
//   const calculateVendorInvoiceStats = (vendorInvoiceData) => {
//     let totalVendorInvoices = 0;
//     let totalVendorAmount = 0;
//     let paidVendorAmount = 0;
//     let pendingVendorAmount = 0;

//     vendorInvoiceData.forEach((item) => {
//       item.invoices?.forEach((invoice) => {
//         totalVendorInvoices++;
//         totalVendorAmount += invoice.totalAmount || 0;
//         paidVendorAmount += invoice.amountPaid || 0;
//         pendingVendorAmount += invoice.balanceDue || 0;
//       });
//     });

//     return {
//       totalVendorInvoices,
//       totalVendorAmount,
//       paidVendorAmount,
//       pendingVendorAmount,
//     };
//   };

//   // Update search filter with debounced value
//   useEffect(() => {
//     setFilters((prev) => ({ ...prev, search: debouncedSearch }));
//   }, [debouncedSearch]);

//   // Track active filters
//   useEffect(() => {
//     const active = [];
//     if (filters.search) active.push(`Search: "${filters.search}"`);
//     if (filters.hasBill !== "all")
//       active.push(
//         `Bill Status: ${
//           filters.hasBill === "with" ? "With Bills" : "Without Bills"
//         }`,
//       );
//     if (filters.company !== "all") active.push(`Company: ${filters.company}`);
//     if (filters.vendor !== "all") active.push(`Vendor: ${filters.vendor}`);
//     if (filters.currency !== "all")
//       active.push(`Currency: ${filters.currency}`);
//     if (filters.invoiceType !== "all")
//       active.push(
//         `Invoice Type: ${filters.invoiceType === "po" ? "Uploaded By Warehouse" : "Uploaded By Purchase Dept"}`,
//       );
//     if (filters.invoiceStatus !== "all")
//       active.push(`Invoice Status: ${filters.invoiceStatus}`);
//     if (filters.paymentStatus !== "all")
//       active.push(`Payment Status: ${filters.paymentStatus}`);
//     setActiveFilters(active);
//   }, [filters]);

//   // Apply filters
//   useEffect(() => {
//     let filtered = [...purchaseOrders];

//     // Search filter
//     if (filters.search) {
//       const searchLower = filters.search.toLowerCase();
//       filtered = filtered.filter(
//         (po) =>
//           po.poNumber?.toLowerCase().includes(searchLower) ||
//           po.companyName?.toLowerCase().includes(searchLower) ||
//           po.vendorName?.toLowerCase().includes(searchLower) ||
//           po.currency?.toLowerCase().includes(searchLower) ||
//           po.items?.some((item) =>
//             item.itemName?.toLowerCase().includes(searchLower),
//           ) ||
//           po.poBills?.some((bill) =>
//             bill.poInvoiceNumber?.toLowerCase().includes(searchLower),
//           ) ||
//           po.vendorInvoices?.some((invoice) =>
//             invoice.vendorInvoiceNumber?.toLowerCase().includes(searchLower),
//           ),
//       );
//     }

//     // Bill status filter
//     if (filters.hasBill !== "all") {
//       filtered = filtered.filter((po) =>
//         filters.hasBill === "with" ? po.hasBill : !po.hasBill,
//       );
//     }

//     // Company filter
//     if (filters.company !== "all") {
//       filtered = filtered.filter((po) => po.companyName === filters.company);
//     }

//     // Vendor filter
//     if (filters.vendor !== "all") {
//       filtered = filtered.filter((po) => po.vendorName === filters.vendor);
//     }

//     // Currency filter
//     if (filters.currency !== "all") {
//       filtered = filtered.filter((po) => po.currency === filters.currency);
//     }

//     // Invoice Type filter
//     if (filters.invoiceType !== "all") {
//       filtered = filtered.filter((po) =>
//         filters.invoiceType === "po" ? po.hasPoBill : po.hasVendorInvoice,
//       );
//     }

//     // Invoice Status filter (applies to vendor invoices)
//     if (filters.invoiceStatus !== "all") {
//       filtered = filtered.filter((po) =>
//         po.vendorInvoices?.some(
//           (invoice) => invoice.vendorInvoiceStatus === filters.invoiceStatus,
//         ),
//       );
//     }

//     // Payment Status filter (applies to vendor invoices)
//     if (filters.paymentStatus !== "all") {
//       filtered = filtered.filter((po) =>
//         po.vendorInvoices?.some(
//           (invoice) => invoice.vendorPaymentStatus === filters.paymentStatus,
//         ),
//       );
//     }

//     setFilteredOrders(filtered);
//     setCurrentPage(1);
//   }, [filters, purchaseOrders]);

//   // Get unique values for filters
//   const companies = useMemo(
//     () => [
//       ...new Set(purchaseOrders.map((po) => po.companyName).filter(Boolean)),
//     ],
//     [purchaseOrders],
//   );

//   const vendors = useMemo(
//     () => [
//       ...new Set(purchaseOrders.map((po) => po.vendorName).filter(Boolean)),
//     ],
//     [purchaseOrders],
//   );

//   const currencies = useMemo(
//     () => [...new Set(purchaseOrders.map((po) => po.currency).filter(Boolean))],
//     [purchaseOrders],
//   );

//   // Pagination calculations
//   const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedOrders = useMemo(
//     () => filteredOrders.slice(startIndex, endIndex),
//     [filteredOrders, startIndex, endIndex],
//   );

//   // Toggle functions
//   const toggleRowExpansion = useCallback((poId) => {
//     setExpandedRows((prev) => ({
//       ...prev,
//       [poId]: !prev[poId],
//     }));
//   }, []);

//   // Clear all filters
//   const clearAllFilters = () => {
//     setFilters({
//       search: "",
//       hasBill: "all",
//       company: "all",
//       vendor: "all",
//       currency: "all",
//       invoiceType: "all",
//       invoiceStatus: "all",
//       paymentStatus: "all",
//     });
//     setSearchInput("");
//   };

//   // Remove specific filter
//   const removeFilter = (filterToRemove) => {
//     if (filterToRemove.startsWith("Search:")) {
//       setFilters((prev) => ({ ...prev, search: "" }));
//       setSearchInput("");
//     } else if (filterToRemove.startsWith("Bill Status:")) {
//       setFilters((prev) => ({ ...prev, hasBill: "all" }));
//     } else if (filterToRemove.startsWith("Company:")) {
//       setFilters((prev) => ({ ...prev, company: "all" }));
//     } else if (filterToRemove.startsWith("Vendor:")) {
//       setFilters((prev) => ({ ...prev, vendor: "all" }));
//     } else if (filterToRemove.startsWith("Currency:")) {
//       setFilters((prev) => ({ ...prev, currency: "all" }));
//     } else if (filterToRemove.startsWith("Invoice Type:")) {
//       setFilters((prev) => ({ ...prev, invoiceType: "all" }));
//     } else if (filterToRemove.startsWith("Invoice Status:")) {
//       setFilters((prev) => ({ ...prev, invoiceStatus: "all" }));
//     } else if (filterToRemove.startsWith("Payment Status:")) {
//       setFilters((prev) => ({ ...prev, paymentStatus: "all" }));
//     }
//   };

//   // Format date
//   const formatDate = (dateString) => {
//     if (!dateString) return "N/A";
//     return new Date(dateString).toLocaleDateString("en-IN", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric",
//     });
//   };

//   // Get currency symbol
//   const getCurrencySymbol = (currencyCode) => {
//     const currencySymbols = {
//       USD: "$",
//       INR: "₹",
//       EUR: "€",
//       GBP: "£",
//       JPY: "¥",
//       CAD: "C$",
//       AUD: "A$",
//       CNY: "¥",
//     };
//     return currencySymbols[currencyCode?.toUpperCase()] || currencyCode || "₹";
//   };

//   // Format currency
//   const formatCurrency = (amount, currencyCode = "INR") => {
//     if (!amount && amount !== 0) return "N/A";
//     const symbol = getCurrencySymbol(currencyCode);

//     if (currencyCode?.toUpperCase() === "USD") {
//       return `${symbol}${Number(amount).toLocaleString("en-US", {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })}`;
//     }

//     if (currencyCode?.toUpperCase() === "INR") {
//       return `${symbol} ${Number(amount).toLocaleString("en-IN", {
//         minimumFractionDigits: 0,
//         maximumFractionDigits: 0,
//       })}`;
//     }

//     return `${symbol}${Number(amount).toLocaleString("en-US", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     })}`;
//   };

//   // Get status badge color
//   const getStatusBadgeColor = (status) => {
//     const statusColors = {
//       Paid: "bg-green-100 text-green-800",
//       "Partially Paid": "bg-brand-100 text-brand-700",
//       Pending: "bg-orange-100 text-orange-800",
//       Overdue: "bg-red-100 text-red-800",
//       Cancelled: "bg-ink-100 text-ink-800",
//       Draft: "bg-ink-100 text-ink-800",
//       Approved: "bg-brand-100 text-ink-950",
//       Rejected: "bg-red-100 text-red-800",
//       Submitted: "bg-purple-100 text-purple-800",
//     };
//     return statusColors[status] || "bg-ink-100 text-ink-800";
//   };

//   // Check screen size for mobile view
//   useEffect(() => {
//     const handleResize = () => {
//       setMobileView(window.innerWidth < 768);
//     };
//     handleResize();
//     window.addEventListener("resize", handleResize);
//     return () => window.removeEventListener("resize", handleResize);
//   }, []);

//   // Render file actions based on file type
//   const renderFileActions = (file, invoiceType = "po") => {
//     const fileType = file.fileType || getFileType(file.poFileUrl || file.vendorFileUrl);
//     const fileUrl = file.poFileUrl || file.vendorFileUrl;
//     const fileId = file.poInvoiceId || file.vendorInvoiceId;
//     const fileName = file.poInvoiceNumber || file.vendorInvoiceNumber;

//     const buttonColor = invoiceType === "po" ? "blue" : "purple";

//     return (
//       <div className="flex space-x-2">
//         {/* Download Button */}
//         <button
//           onClick={() =>
//             handleFileAction(
//               fileUrl,
//               fileName,
//               "download",
//               fileType
//             )
//           }
//           disabled={downloadingPdf[fileId]}
//           className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-${buttonColor}-600 hover:bg-${buttonColor}-700 disabled:opacity-50`}
//         >
//           {downloadingPdf[fileId] ? (
//             <>
//               <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
//               Downloading...
//             </>
//           ) : (
//             <>
//               <Download size={14} className="mr-1" />
//               Download
//             </>
//           )}
//         </button>

//         {/* View Button - Different based on file type */}
//         <button
//           onClick={() =>
//             handleFileAction(
//               fileUrl,
//               fileName,
//               "view",
//               fileType
//             )
//           }
//           className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-ink-300 text-xs font-medium rounded-lg text-ink-700 bg-white hover:bg-ink-50"
//         >
//           {getFileIcon(fileType)}
//           <span className="ml-1">
//             {fileType === 'image' ? 'Preview' : 'View'}
//           </span>
//         </button>
//       </div>
//     );
//   };

//   // Image Preview Modal
//   const ImagePreviewModal = () => {
//     if (!imagePreview.isOpen) return null;

//     return (
//       <div className="fixed inset-0 z-50 overflow-y-auto">
//         <div className="flex items-center justify-center min-h-[60vh] px-4 pt-4 pb-20 text-center sm:block sm:p-0">
//           <div className="fixed inset-0 transition-opacity" aria-hidden="true">
//             <div className="absolute inset-0 bg-ink-500 opacity-75"></div>
//           </div>

//           <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

//           <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-card transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
//             <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-medium text-ink-900">
//                   {imagePreview.fileName || 'Image Preview'}
//                 </h3>
//                 <button
//                   onClick={closeImagePreview}
//                   className="text-ink-400 hover:text-ink-500"
//                 >
//                   <X size={24} />
//                 </button>
//               </div>
//               <div className="mt-2">
//                 <img
//                   src={imagePreview.imageUrl}
//                   alt={imagePreview.fileName || 'Preview'}
//                   className="max-w-full max-h-[70vh] mx-auto"
//                   onError={(e) => {
//                     e.target.onerror = null;
//                     e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
//                   }}
//                 />
//               </div>
//             </div>
//             <div className="bg-ink-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
//               <button
//                 type="button"
//                 onClick={closeImagePreview}
//                 className="w-full inline-flex justify-center rounded-lg border border-ink-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400/40 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
//               >
//                 Close
//               </button>
//               <button
//                 type="button"
//                 onClick={() => {
//                   handleFileAction(
//                     imagePreview.imageUrl,
//                     imagePreview.fileName,
//                     "download",
//                     "image"
//                   );
//                   closeImagePreview();
//                 }}
//                 className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-ink-950 text-base font-medium text-white hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400/40 sm:mt-0 sm:w-auto sm:text-sm"
//               >
//                 <Download size={16} className="mr-2" />
//                 Download
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Skeleton loading component
//   const SkeletonRow = () => (
//     <tr className="animate-pulse">
//       <td className="px-6 py-4">
//         <div className="flex items-center">
//           <div className="h-4 bg-ink-200 rounded w-24"></div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="space-y-2">
//           <div className="h-4 bg-ink-200 rounded w-32"></div>
//           <div className="h-3 bg-ink-200 rounded w-24"></div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-4 bg-ink-200 rounded w-40"></div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="space-y-2">
//           <div className="h-4 bg-ink-200 rounded w-20"></div>
//           <div className="h-3 bg-ink-200 rounded w-16"></div>
//         </div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 bg-ink-200 rounded w-24"></div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-6 bg-ink-200 rounded w-28"></div>
//       </td>
//       <td className="px-6 py-4">
//         <div className="h-8 bg-ink-200 rounded w-24"></div>
//       </td>
//     </tr>
//   );

//   if (initialLoading) {
//     return (
//       <div className="flex flex-col justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-500 border-t-transparent"></div>
//         <p className="mt-4 text-ink-600">Loading purchase orders...</p>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="bg-red-50 border border-red-200 rounded-lg p-6">
//           <div className="flex items-center">
//             <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
//             <div>
//               <h3 className="text-lg font-medium text-red-800">
//                 Error Loading Data
//               </h3>
//               <p className="text-red-700 mt-1">{error}</p>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
//               >
//                 Retry
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       {/* Image Preview Modal */}
//       <ImagePreviewModal />

//       {/* PDF Error Alert */}
//       {pdfError && (
//         <div className="fixed top-4 right-4 z-50 max-w-sm">
//           <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-card">
//             <div className="flex items-center">
//               <AlertCircle className="h-5 w-5 mr-2" />
//               <span>{pdfError}</span>
//               <button
//                 onClick={() => setPdfError(null)}
//                 className="ml-auto text-red-500 hover:text-red-700"
//               >
//                 ×
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="bg-white rounded-xl shadow p-6 mb-8">
//         <div className="flex items-center mb-4">
//           <Filter className="h-5 w-5 text-ink-500 mr-2" />
//           <h3 className="text-lg font-medium text-ink-800">Filters</h3>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//           {/* Search */}
//           <div>
//             <label className="block text-sm font-medium text-ink-700 mb-1">
//               Search
//             </label>
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
//               <input
//                 type="text"
//                 placeholder="Search PO, Company, Vendor, Invoice#..."
//                 className="w-full pl-10 pr-3 py-2.5 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-transparent"
//                 value={searchInput}
//                 onChange={(e) => setSearchInput(e.target.value)}
//               />
//             </div>
//           </div>

//           {/* Company Filter */}
//           <div>
//             <label className="block text-sm font-medium text-ink-700 mb-1">
//               Company
//             </label>
//             <div className="relative">
//               <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
//               <select
//                 className="w-full pl-10 pr-3 py-2.5 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-transparent"
//                 value={filters.company}
//                 onChange={(e) =>
//                   setFilters({ ...filters, company: e.target.value })
//                 }
//               >
//                 <option value="all">All Companies</option>
//                 {companies.map((company, index) => (
//                   <option key={index} value={company}>
//                     {company}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           {/* Vendor Filter */}
//           <div>
//             <label className="block text-sm font-medium text-ink-700 mb-1">
//               Vendor
//             </label>
//             <div className="relative">
//               <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
//               <select
//                 className="w-full pl-10 pr-3 py-2.5 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-transparent"
//                 value={filters.vendor}
//                 onChange={(e) =>
//                   setFilters({ ...filters, vendor: e.target.value })
//                 }
//               >
//                 <option value="all">All Vendors</option>
//                 {vendors.map((vendor, index) => (
//                   <option key={index} value={vendor}>
//                     {vendor}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Active Filters */}
//         {activeFilters.length > 0 && (
//           <div className="mt-6">
//             <div className="flex flex-wrap items-center gap-2">
//               <span className="text-sm text-ink-600">Active filters:</span>
//               {activeFilters.map((filter, index) => (
//                 <span
//                   key={index}
//                   className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950"
//                 >
//                   {filter}
//                   <button
//                     onClick={() => removeFilter(filter)}
//                     className="ml-2 text-brand-700 hover:text-ink-950"
//                   >
//                     ×
//                   </button>
//                 </span>
//               ))}
//               <button
//                 onClick={clearAllFilters}
//                 className="text-sm text-red-600 hover:text-red-800 ml-2"
//               >
//                 Clear all
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Results and Pagination Controls */}
//       <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between">
//         <div className="text-ink-600 mb-2 md:mb-0">
//           Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to{" "}
//           {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
//           results
//           {filters.search && ` for "${filters.search}"`}
//         </div>

//         {filteredOrders.length > itemsPerPage && (
//           <div className="flex items-center space-x-4">
//             <div className="flex items-center space-x-2">
//               <span className="text-sm text-ink-600">Show:</span>
//               <select
//                 className="px-2 py-1 border border-ink-300 rounded text-sm"
//                 value={itemsPerPage}
//                 onChange={(e) => setItemsPerPage(Number(e.target.value))}
//               >
//                 <option value="10">10</option>
//                 <option value="25">25</option>
//                 <option value="50">50</option>
//                 <option value="100">100</option>
//               </select>
//               <span className="text-sm text-ink-600">per page</span>
//             </div>

//             <div className="flex items-center space-x-2">
//               <button
//                 onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//                 disabled={currentPage === 1}
//                 className="px-3 py-1 border border-ink-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Previous
//               </button>
//               <span className="text-sm text-ink-600">
//                 Page {currentPage} of {totalPages}
//               </span>
//               <button
//                 onClick={() =>
//                   setCurrentPage((prev) => Math.min(totalPages, prev + 1))
//                 }
//                 disabled={currentPage === totalPages}
//                 className="px-3 py-1 border border-ink-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 Next
//               </button>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Desktop Table View */}
//       {!mobileView && (
//         <div className="bg-white rounded-xl shadow overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-ink-200">
//               <thead className="bg-ink-50">
//                 <tr>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     PO Details
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     Company & Vendor
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     Amount
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                    Uploaded By Warehouse
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     Uploaded By Purchase Dept
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     Status
//                   </th>
//                   <th
//                     scope="col"
//                     className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase tracking-wider"
//                   >
//                     Actions
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-ink-200">
//                 {loading ? (
//                   Array.from({ length: 5 }).map((_, index) => (
//                     <SkeletonRow key={index} />
//                   ))
//                 ) : paginatedOrders.length === 0 ? (
//                   <tr>
//                     <td colSpan="7" className="px-6 py-12 text-center">
//                       <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
//                       <h3 className="text-lg font-medium text-ink-900 mb-2">
//                         No purchase orders found
//                       </h3>
//                       <p className="text-ink-600 mb-4">
//                         Try adjusting your filters or search term
//                       </p>
//                       <button
//                         onClick={clearAllFilters}
//                         className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-ink-950 hover:bg-ink-800"
//                       >
//                         Clear all filters
//                       </button>
//                     </td>
//                   </tr>
//                 ) : (
//                   paginatedOrders.map((po) => (
//                     <React.Fragment key={po.poId}>
//                       {/* Main Row */}
//                       <tr className="hover:bg-ink-50 transition-colors duration-150">
//                         {/* PO Details */}
//                         <td className="px-6 py-4">
//                           <div className="flex items-center">
//                             <button
//                               onClick={() => toggleRowExpansion(po.poId)}
//                               className="mr-2 text-ink-500 hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 rounded"
//                             >
//                               {expandedRows[po.poId] ? (
//                                 <ChevronUp size={16} />
//                               ) : (
//                                 <ChevronDown size={16} />
//                               )}
//                             </button>
//                             <div>
//                               <div className="text-sm font-semibold text-ink-900">
//                                 {po.poNumber}
//                               </div>
//                               <div className="text-sm text-ink-500 flex items-center">
//                                 <Calendar className="h-3 w-3 mr-1" />
//                                 {formatDate(po.poDate)}
//                               </div>
//                             </div>
//                           </div>
//                         </td>

//                         {/* Company & Vendor */}
//                         <td className="px-6 py-4">
//                           <div>
//                             <div className="flex items-center text-sm font-medium text-ink-900">
//                               <Building className="h-3 w-3 mr-1 text-ink-400" />
//                               {po.companyName}
//                             </div>
//                             <div className="flex items-center text-sm text-ink-600 mt-1">
//                               <User className="h-3 w-3 mr-1 text-ink-400" />
//                               {po.vendorName}
//                             </div>
//                           </div>
//                         </td>

//                         {/* Amount */}
//                         <td className="px-6 py-4">
//                           <div>
//                             <div className="text-sm font-semibold text-ink-900">
//                               {formatCurrency(po.grandTotal, po.currency)}
//                             </div>
//                             <div className="text-sm text-green-600">
//                               Paid: {formatCurrency(po.totalPaid, po.currency)}
//                             </div>
//                             <div className="text-sm text-orange-600">
//                               Due:{" "}
//                               {formatCurrency(po.remainingAmount, po.currency)}
//                             </div>
//                           </div>
//                         </td>

//                         {/* PO Invoices */}
//                         <td className="px-6 py-4">
//                           {po.poBillCount > 0 ? (
//                             <div className="space-y-1">
//                               <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-100 text-ink-950">
//                                 <FileText size={12} className="mr-1" />
//                                 {po.poBillCount} PO Invoice
//                                 {po.poBillCount > 1 ? "s" : ""}
//                               </span>
//                             </div>
//                           ) : (
//                             <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-ink-100 text-ink-800">
//                               No PO Invoices
//                             </span>
//                           )}
//                         </td>

//                         {/* Vendor Invoices */}
//                         <td className="px-6 py-4">
//                           {po.vendorInvoiceCount > 0 ? (
//                             <div className="space-y-1">
//                               <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">
//                                 <Store size={12} className="mr-1" />
//                                 {po.vendorInvoiceCount} Vendor Invoice
//                                 {po.vendorInvoiceCount > 1 ? "s" : ""}
//                               </span>
//                             </div>
//                           ) : (
//                             <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-ink-100 text-ink-800">
//                               No Vendor Invoices
//                             </span>
//                           )}
//                         </td>

//                         {/* Status */}
//                         <td className="px-6 py-4">
//                           <span
//                             className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                               po.hasBill
//                                 ? "bg-green-100 text-green-800"
//                                 : "bg-brand-100 text-brand-700"
//                             }`}
//                           >
//                             {po.hasBill ? "Bills Attached" : "Pending Bills"}
//                           </span>
//                         </td>

//                         {/* Actions */}
//                         <td className="px-6 py-4">
//                           <button
//                             onClick={() => toggleRowExpansion(po.poId)}
//                             className="inline-flex items-center px-3 py-1.5 border border-ink-300 text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600"
//                           >
//                             {expandedRows[po.poId] ? (
//                               <>
//                                 <ChevronUp size={14} className="mr-1" />
//                                 Hide Details
//                               </>
//                             ) : (
//                               <>
//                                 <ChevronDown size={14} className="mr-1" />
//                                 View Details
//                               </>
//                             )}
//                           </button>
//                         </td>
//                       </tr>

//                       {/* Expanded Details Row */}
//                       {expandedRows[po.poId] && (
//                         <tr className="bg-ink-50">
//                           <td colSpan="7" className="px-6 py-4">
//                             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//                               {/* PO Items Section */}
//                               {/* <div className="lg:col-span-1">
//                                 <div className="flex justify-between items-center mb-3">
//                                   <h3 className="text-lg font-medium text-ink-900 flex items-center">
//                                     <FileText size={18} className="mr-2" />
//                                     PO Items
//                                     <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-ink-950">
//                                       {po.items?.length || 0} items
//                                     </span>
//                                   </h3>
//                                 </div>

//                                 <div className="bg-white rounded-lg border border-ink-200 overflow-hidden">
//                                   <div className="divide-y divide-ink-200 max-h-96 overflow-y-auto">
//                                     {po.items?.map((item, index) => (
//                                       <div
//                                         key={index}
//                                         className="px-4 py-3 hover:bg-ink-50"
//                                       >
//                                         <div className="text-sm font-medium text-ink-900">
//                                           {item.itemName}
//                                         </div>
//                                         <div className="text-xs text-ink-500 mt-1">
//                                           Qty: {item.quantity} {item.unit} | Rate:{" "}
//                                           {formatCurrency(item.rate, po.currency)} | Amount:{" "}
//                                           {formatCurrency(item.amount || (item.quantity * item.rate), po.currency)}
//                                         </div>
//                                       </div>
//                                     ))}
//                                   </div>
//                                 </div>
//                               </div> */}

//                               {/* PO Invoices Section */}
//                               <div className="lg:col-span-1">
//                                 <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
//                                   <Receipt
//                                     size={18}
//                                     className="mr-2 text-brand-700"
//                                   />
//                                   Warehouse
//                                   <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-ink-950">
//                                     {po.poBillCount} invoices
//                                   </span>
//                                 </h3>
//                                 {po.poBillCount > 0 ? (
//                                   <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
//                                     {po.poBills.map((bill, index) => {
//                                       const fileType = bill.fileType || getFileType(bill.poFileUrl);
//                                       return (
//                                         <div
//                                           key={bill.poInvoiceId || index}
//                                           className="bg-white rounded-lg border border-brand-300 p-4"
//                                         >
//                                           <div className="flex justify-between items-start mb-2">
//                                             <div>
//                                               <div className="flex items-center">
//                                                 <Hash className="h-4 w-4 text-ink-400 mr-1" />
//                                                 <span className="text-sm font-semibold text-ink-900">
//                                                   {bill.poInvoiceNumber}
//                                                 </span>
//                                               </div>
//                                               <div className="text-xs text-ink-500 mt-1 flex items-center">
//                                                 {getFileIcon(fileType)}
//                                                 <span className="ml-1">
//                                                   Date: {formatDate(bill.poInvoiceDate)}
//                                                 </span>
//                                               </div>
//                                             </div>
//                                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950">
//                                               {fileType === 'pdf' ? 'PDF' : fileType === 'image' ? 'Image' : 'File'}
//                                             </span>
//                                           </div>

//                                           {renderFileActions(bill, "po")}
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                 ) : (
//                                   <div className="bg-white rounded-lg border border-ink-200 p-6 text-center">
//                                     <Receipt
//                                       size={40}
//                                       className="mx-auto text-ink-400 mb-2"
//                                     />
//                                     <p className="text-sm text-ink-600">
//                                       No PO invoices attached
//                                     </p>
//                                   </div>
//                                 )}
//                               </div>

//                               {/* Vendor Invoices Section */}
//                               <div className="lg:col-span-1">
//                                 <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
//                                   <Store
//                                     size={18}
//                                     className="mr-2 text-purple-600"
//                                   />
//                                   Purchase Dept
//                                   <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                                     {po.vendorInvoiceCount} invoices
//                                   </span>
//                                 </h3>
//                                 {po.vendorInvoiceCount > 0 ? (
//                                   <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
//                                     {po.vendorInvoices.map((invoice, index) => {
//                                       const fileType = invoice.fileType || getFileType(invoice.vendorFileUrl);
//                                       return (
//                                         <div
//                                           key={invoice.vendorInvoiceId || index}
//                                           className="bg-white rounded-lg border border-purple-200 p-4"
//                                         >
//                                           <div className="flex justify-between items-start mb-2">
//                                             <div>
//                                               <div className="flex items-center">
//                                                 <Hash className="h-4 w-4 text-ink-400 mr-1" />
//                                                 <span className="text-sm font-semibold text-ink-900">
//                                                   {invoice.vendorInvoiceNumber}
//                                                 </span>
//                                               </div>
//                                               {/* <div className="text-xs text-ink-500 mt-1 flex items-center">
//                                                 {getFileIcon(fileType)}
//                                                 <span className="ml-1">
//                                                   Date: {formatDate(invoice.vendorInvoiceDate)}
//                                                 </span>
//                                               </div> */}
//                                             </div>
//                                             <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
//                                               {fileType === 'pdf' ? 'PDF' : fileType === 'image' ? 'Image' : 'File'}
//                                             </span>
//                                           </div>

//                                           {/* Approval Info */}
//                                           {(invoice.vendorCreatedBy ||
//                                             invoice.vendorApprovedBy) && (
//                                             <div className="border-t border-ink-200 pt-2 mt-2 text-xs">
//                                               <div className="grid grid-cols-2 gap-2">
//                                                 {invoice.vendorCreatedBy && (
//                                                   <div>
//                                                     <span className="text-ink-500">
//                                                       Created By:
//                                                     </span>
//                                                     <span className="ml-1 text-ink-700">
//                                                       {invoice.vendorCreatedBy}
//                                                     </span>
//                                                   </div>
//                                                 )}
//                                                 {invoice.vendorApprovedBy && (
//                                                   <div>
//                                                     <span className="text-ink-500">
//                                                       Approved By:
//                                                     </span>
//                                                     <span className="ml-1 text-ink-700">
//                                                       {invoice.vendorApprovedBy}
//                                                     </span>
//                                                   </div>
//                                                 )}
//                                               </div>
//                                               {invoice.vendorRejectionReason && (
//                                                 <div className="mt-2 p-2 bg-red-50 rounded text-red-700">
//                                                   <span className="font-medium">
//                                                     Rejection Reason:
//                                                   </span>{" "}
//                                                   {invoice.vendorRejectionReason}
//                                                 </div>
//                                               )}
//                                             </div>
//                                           )}

//                                           {renderFileActions(invoice, "vendor")}
//                                         </div>
//                                       );
//                                     })}
//                                   </div>
//                                 ) : (
//                                   <div className="bg-white rounded-lg border border-ink-200 p-6 text-center">
//                                     <Store
//                                       size={40}
//                                       className="mx-auto text-ink-400 mb-2"
//                                     />
//                                     <p className="text-sm text-ink-600">
//                                       No vendor invoices attached
//                                     </p>
//                                   </div>
//                                 )}
//                               </div>

//                               {/* PO Document Section */}
//                               <div className="lg:col-span-1">
//                                 <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
//                                   <FileText size={18} className="mr-2 text-green-600" />
//                                   PO Document
//                                 </h3>
//                                 <div className="bg-white rounded-lg border border-green-200 p-4">
//                                   <div className="flex flex-col items-center text-center">
//                                     <FileText size={48} className="text-green-500 mb-3" />
//                                     <h4 className="font-medium text-ink-900 text-base mb-4">{po.poNumber}</h4>

//                                     <div className="flex gap-3 w-full">
//                                       {/* View PO PDF Button */}
//                                       <button
//                                         onClick={() => openPdfInNewTab(po.poId, po.poNumber)}
//                                         className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
//                                       >
//                                         <FileText size={16} className="mr-2" />
//                                         View PO PDF
//                                       </button>

//                                       {/* Download PDF Button */}
//                                       <button
//                                         onClick={() => downloadPdf(po.poId, po.poNumber)}
//                                         className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
//                                       >
//                                         <Download size={16} className="mr-2" />
//                                         Download PDF
//                                       </button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           </td>
//                         </tr>
//                       )}
//                     </React.Fragment>
//                   ))
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* Mobile Card View */}
//       {mobileView && (
//         <div className="space-y-4">
//           {loading ? (
//             Array.from({ length: 3 }).map((_, index) => (
//               <div
//                 key={index}
//                 className="bg-white rounded-lg shadow p-4 animate-pulse"
//               >
//                 <div className="h-4 bg-ink-200 rounded w-1/3 mb-3"></div>
//                 <div className="h-3 bg-ink-200 rounded w-1/2 mb-2"></div>
//                 <div className="h-3 bg-ink-200 rounded w-2/3"></div>
//               </div>
//             ))
//           ) : paginatedOrders.length === 0 ? (
//             <div className="bg-white rounded-lg shadow p-8 text-center">
//               <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-ink-900 mb-2">
//                 No purchase orders found
//               </h3>
//               <p className="text-ink-600 mb-4">
//                 Try adjusting your filters or search term
//               </p>
//               <button
//                 onClick={clearAllFilters}
//                 className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-ink-950 hover:bg-ink-800"
//               >
//                 Clear all filters
//               </button>
//             </div>
//           ) : (
//             paginatedOrders.map((po) => (
//               <div
//                 key={po.poId}
//                 className="bg-white rounded-lg shadow border border-ink-200 overflow-hidden"
//               >
//                 <div className="p-4">
//                   <div className="flex justify-between items-start mb-3">
//                     <div>
//                       <h3 className="font-bold text-ink-900">{po.poNumber}</h3>
//                       <div className="flex items-center text-sm text-ink-500 mt-1">
//                         <Calendar className="h-3 w-3 mr-1" />
//                         {formatDate(po.poDate)}
//                       </div>
//                     </div>
//                     <button
//                       onClick={() => toggleRowExpansion(po.poId)}
//                       className="text-ink-500 hover:text-ink-700"
//                     >
//                       {expandedRows[po.poId] ? (
//                         <ChevronUp size={20} />
//                       ) : (
//                         <ChevronDown size={20} />
//                       )}
//                     </button>
//                   </div>

//                   <div className="grid grid-cols-2 gap-4 mb-3">
//                     <div>
//                       <div className="text-xs text-ink-500">Company</div>
//                       <div className="font-medium text-sm">
//                         {po.companyName}
//                       </div>
//                     </div>
//                     <div>
//                       <div className="text-xs text-ink-500">Vendor</div>
//                       <div className="font-medium text-sm">{po.vendorName}</div>
//                     </div>
//                   </div>

//                   <div className="mb-3">
//                     <div className="text-xs text-ink-500">Amount</div>
//                     <div className="font-bold text-lg">
//                       {formatCurrency(po.grandTotal, po.currency)}
//                     </div>
//                   </div>

//                   <div className="flex flex-wrap gap-2 mb-3">
//                     <span
//                       className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                         po.hasPoBill
//                           ? "bg-brand-100 text-ink-950"
//                           : "bg-ink-100 text-ink-800"
//                       }`}
//                     >
//                       <FileText size={12} className="mr-1" />
//                       PO: {po.poBillCount}
//                     </span>
//                     <span
//                       className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                         po.hasVendorInvoice
//                           ? "bg-purple-100 text-purple-800"
//                           : "bg-ink-100 text-ink-800"
//                       }`}
//                     >
//                       <Store size={12} className="mr-1" />
//                       Vendor: {po.vendorInvoiceCount}
//                     </span>
//                   </div>

//                   <div className="flex justify-between items-center">
//                     <span
//                       className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
//                         po.hasBill
//                           ? "bg-green-100 text-green-800"
//                           : "bg-brand-100 text-brand-700"
//                       }`}
//                     >
//                       {po.hasBill ? "Bills Attached" : "Pending Bills"}
//                     </span>
//                     <button
//                       onClick={() => openPdfInNewTab(po.poId, po.poNumber)}
//                       className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
//                     >
//                       <FileText size={14} className="mr-1" />
//                       View PO
//                     </button>
//                   </div>
//                 </div>

//                 {expandedRows[po.poId] && (
//                   <div className="border-t border-ink-200 p-4 bg-ink-50">
//                     {/* PO Document Section */}
//                     <div className="mb-4">
//                       <h4 className="font-medium text-ink-900 mb-2 flex items-center">
//                         <FileText size={16} className="mr-1 text-green-600" />
//                         PO Document
//                       </h4>
//                       <div className="bg-white rounded-lg border border-green-200 p-4">
//                         <div className="flex flex-col items-center text-center">
//                           <FileText size={40} className="text-green-500 mb-2" />
//                           <div className="text-sm font-medium text-ink-900 mb-3">{po.poNumber}</div>

//                           <div className="flex gap-2 w-full">
//                             <button
//                               onClick={() => openPdfInNewTab(po.poId, po.poNumber)}
//                               className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
//                             >
//                               <FileText size={14} className="mr-1" />
//                               View PDF
//                             </button>

//                             <button
//                               onClick={() => downloadPdf(po.poId, po.poNumber)}
//                               className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
//                             >
//                               <Download size={14} className="mr-1" />
//                               Download
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     </div>

//                     {/* PO Items */}
//                     <div className="mb-4">
//                       <h4 className="font-medium text-ink-900 mb-2 flex items-center">
//                         <FileText size={16} className="mr-1" />
//                         PO Items ({po.items?.length || 0})
//                       </h4>
//                       <div className="bg-white rounded border border-ink-200 divide-y max-h-60 overflow-y-auto">
//                         {po.items?.map((item, index) => (
//                           <div key={index} className="p-3">
//                             <div className="text-sm font-medium">{item.itemName}</div>
//                             <div className="text-xs text-ink-500 mt-1">
//                               Qty: {item.quantity} {item.unit} | Rate: {formatCurrency(item.rate, po.currency)} | Amount: {formatCurrency(item.amount || (item.quantity * item.rate), po.currency)}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>

//                     {/* PO Invoices */}
//                     {po.poBillCount > 0 && (
//                       <div className="mb-4">
//                         <h4 className="font-medium text-ink-900 mb-2 flex items-center">
//                           <Receipt size={16} className="mr-1 text-brand-700" />
//                           Warehouse ({po.poBillCount})
//                         </h4>
//                         <div className="space-y-2 max-h-60 overflow-y-auto">
//                           {po.poBills.map((bill, index) => {
//                             const fileType = bill.fileType || getFileType(bill.poFileUrl);
//                             return (
//                               <div
//                                 key={bill.poInvoiceId || index}
//                                 className="bg-white rounded border border-brand-300 p-3"
//                               >
//                                 <div className="flex justify-between items-start mb-2">
//                                   <div className="text-sm font-medium">
//                                     {bill.poInvoiceNumber}
//                                   </div>
//                                   <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950">
//                                     {fileType === 'pdf' ? 'PDF' : fileType === 'image' ? 'Image' : 'File'}
//                                   </span>
//                                 </div>
//                                 <div className="text-xs text-ink-500 mb-2 flex items-center">
//                                   {getFileIcon(fileType)}
//                                   <span className="ml-1">
//                                     Date: {formatDate(bill.poInvoiceDate)}
//                                   </span>
//                                 </div>
//                                 {renderFileActions(bill, "po")}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     )}

//                     {/* Vendor Invoices */}
//                     {po.vendorInvoiceCount > 0 && (
//                       <div>
//                         <h4 className="font-medium text-ink-900 mb-2 flex items-center">
//                           <Store size={16} className="mr-1 text-purple-600" />
//                           Purchase Dept ({po.vendorInvoiceCount})
//                         </h4>
//                         <div className="space-y-2 max-h-60 overflow-y-auto">
//                           {po.vendorInvoices.map((invoice, index) => {
//                             const fileType = invoice.fileType || getFileType(invoice.vendorFileUrl);
//                             return (
//                               <div
//                                 key={invoice.vendorInvoiceId || index}
//                                 className="bg-white rounded border border-purple-200 p-3"
//                               >
//                                 <div className="flex justify-between items-start mb-1">
//                                   <div className="text-sm font-medium">
//                                     {invoice.vendorInvoiceNumber}
//                                   </div>
//                                   <span
//                                     className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeColor(invoice.vendorInvoiceStatus)}`}
//                                   >
//                                     {invoice.vendorInvoiceStatus}
//                                   </span>
//                                 </div>
//                                 <div className="text-xs text-ink-600">
//                                   <div className="flex items-center">
//                                     {getFileIcon(fileType)}
//                                     <span className="ml-1">Date: {formatDate(invoice.vendorInvoiceDate)}</span>
//                                   </div>
//                                   <div>Due: {formatDate(invoice.vendorDueDate)}</div>
//                                   <div className="font-medium mt-1">
//                                     Amount: {formatCurrency(invoice.vendorTotalAmount, po.currency)}
//                                   </div>
//                                 </div>
//                                 {renderFileActions(invoice, "vendor")}
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       )}

//       {/* Bottom Pagination */}
//       {filteredOrders.length > itemsPerPage && (
//         <div className="mt-6 flex flex-col md:flex-row items-center justify-between">
//           <div className="text-sm text-ink-600 mb-4 md:mb-0">
//             Showing {startIndex + 1} to{" "}
//             {Math.min(endIndex, filteredOrders.length)} of{" "}
//             {filteredOrders.length} entries
//           </div>
//           <div className="flex items-center space-x-2">
//             <button
//               onClick={() => setCurrentPage(1)}
//               disabled={currentPage === 1}
//               className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
//             >
//               «
//             </button>
//             <button
//               onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
//               disabled={currentPage === 1}
//               className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
//             >
//               ‹
//             </button>
//             <span className="px-3 py-1.5 text-sm text-ink-700">
//               Page {currentPage} of {totalPages}
//             </span>
//             <button
//               onClick={() =>
//                 setCurrentPage((prev) => Math.min(totalPages, prev + 1))
//               }
//               disabled={currentPage === totalPages}
//               className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
//             >
//               ›
//             </button>
//             <button
//               onClick={() => setCurrentPage(totalPages)}
//               disabled={currentPage === totalPages}
//               className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
//             >
//               »
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PoInvoice;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Api from "../../auth/Api";
import { useUser } from "../../Context/UserContext";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  Search,
  Filter,
  Building,
  User,
  Calendar,
  AlertCircle,
  Hash,
  Receipt,
  Store,
  Image as ImageIcon,
  File as FileIcon,
  X,
} from "lucide-react";
import { useDebounce } from "../../hooks/UseDebounce";

const PoInvoice = () => {
  const { user } = useUser();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  // Only search filter remains
  const [filters, setFilters] = useState({
    search: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeFilters, setActiveFilters] = useState([]);
  const [pdfError, setPdfError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState({});
  const [mobileView, setMobileView] = useState(false);

  // State for image preview modal
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    imageUrl: null,
    fileName: null,
  });

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Helper function to determine file type from URL or filename
  const getFileType = (fileUrl) => {
    if (!fileUrl) return "unknown";
    const extension = fileUrl.split(".").pop()?.toLowerCase();
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    if (imageExtensions.includes(extension)) return "image";
    if (extension === "pdf") return "pdf";
    if (fileUrl.includes("/images/") || fileUrl.includes("/img/"))
      return "image";
    return "unknown";
  };

  // Get appropriate icon for file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "pdf":
        return <FileText size={16} className="text-red-500" />;
      case "image":
        return <ImageIcon size={16} className="text-green-500" />;
      default:
        return <FileIcon size={16} className="text-ink-500" />;
    }
  };

  // Open image in modal
  const openImagePreview = (imageUrl, fileName) => {
    setImagePreview({ isOpen: true, imageUrl, fileName });
  };

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, imageUrl: null, fileName: null });
  };

  // Open PO PDF in new tab with authentication
  const openPdfInNewTab = async (poId, poNumber) => {
    try {
      const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(blob);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>PO-${poNumber}</title>
            <style>body{margin:0;font-family:sans-serif;}.pdf-container{width:100%;height:100vh;display:flex;flex-direction:column;}.toolbar{background:#f8f9fa;padding:10px 20px;border-bottom:1px solid #dee2e6;display:flex;justify-content:space-between;align-items:center;}.toolbar-title{font-size:16px;font-weight:500;color:#212529;}iframe{width:100%;height:100%;border:none;}.btn{padding:8px 16px;border:none;border-radius:4px;cursor:pointer;font-size:14px;font-weight:500;margin-left:8px;}.btn-primary{background:#28a745;color:white;}.btn-primary:hover{background:#218838;}.btn-secondary{background:#6c757d;color:white;}.btn-secondary:hover{background:#5a6268;}</style>
            </head>
            <body>
              <div class="pdf-container">
                <div class="toolbar">
                  <span class="toolbar-title">Purchase Order: ${poNumber}</span>
                  <div>
                    <button class="btn btn-primary" onclick="window.print()">Print</button>
                    <button class="btn btn-secondary" onclick="window.close()">Close</button>
                  </div>
                </div>
                <iframe src="${pdfUrl}" title="PO-${poNumber}"></iframe>
              </div>
              <script>window.addEventListener('beforeunload',function(){URL.revokeObjectURL("${pdfUrl}");});</script>
            </body>
          </html>
        `);
        newWindow.document.close();
        newWindow.focus();
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      setPdfError(`Failed to load PDF for PO ${poNumber}. Please try again.`);
    }
  };

  // Download PO PDF
  const downloadPdf = async (poId, poNumber) => {
    try {
      const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
        responseType: "blob",
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${poNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      setPdfError(
        `Failed to download PDF for PO ${poNumber}. Please try again.`,
      );
    }
  };

  // Handle file actions (view/download) for both PDF and images
  const handleFileAction = async (
    fileUrl,
    fileName,
    action = "view",
    fileType = "unknown",
  ) => {
    const id = fileUrl?.split("/").pop() || "file";
    setDownloadingPdf((prev) => ({ ...prev, [id]: true }));
    setPdfError(null);

    try {
      const fullUrl = `${import.meta.env.VITE_API_URL}${fileUrl}`;
      if (action === "download") {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch file");
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extension = fileUrl.split(".").pop() || "pdf";
        a.download = `${fileName || "file"}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        if (fileType === "pdf") {
          window.open(fullUrl, "_blank", "noopener,noreferrer");
        } else if (fileType === "image") {
          openImagePreview(fullUrl, fileName);
        } else {
          window.open(fullUrl, "_blank", "noopener,noreferrer");
        }
      }
    } catch (error) {
      console.error("Error handling file:", error);
      setPdfError(
        `Failed to ${action} file. Please check the file URL or try again.`,
      );
    } finally {
      setDownloadingPdf((prev) => ({ ...prev, [id]: false }));
    }
  };

  const changableApi =
    user.role === "Admin"
      ? "/verification-dept/purchase-orders/invoices"
      : "/verification-dept/purchase-orders/company-wise/invoices";

  // Fetch data from both APIs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        const [poResponse, vendorInvoicesResponse] = await Promise.all([
          Api.get(changableApi),
          Api.get("/common/vendors/invoices"),
        ]);

        if (poResponse.data.success && vendorInvoicesResponse.data.success) {
          const poData = poResponse.data.data;
          const vendorInvoiceData = vendorInvoicesResponse.data.data;

          // Create a map of PO ID to vendor invoices for quick lookup
          const vendorInvoiceMap = new Map();
          vendorInvoiceData.forEach((item) => {
            vendorInvoiceMap.set(item.poId, {
              vendorId: item.vendorId,
              vendorName: item.vendorName,
              vendorInvoices: (item.invoices || []).map((invoice) => ({
                ...invoice,
                vendorInvoiceId:
                  invoice.invoiceId || `vendor-${Date.now()}-${Math.random()}`,
                vendorInvoiceNumber:
                  invoice.invoiceNumber || "No Vendor Invoice#",
                vendorInvoiceDate: invoice.invoiceDate,
                vendorDueDate: invoice.dueDate,
                vendorInvoiceAmount: invoice.invoiceAmount || 0,
                vendorTaxAmount: invoice.taxAmount || 0,
                vendorTotalAmount: invoice.totalAmount || 0,
                vendorAmountPaid: invoice.amountPaid || 0,
                vendorBalanceDue: invoice.balanceDue || 0,
                vendorPaymentTerms: invoice.paymentTerms || "N/A",
                vendorPaymentStatus: invoice.paymentStatus || "Pending",
                vendorInvoiceStatus: invoice.invoiceStatus || "Draft",
                vendorDescription: invoice.description || "",
                vendorPoNumber: invoice.poNumber || "",
                vendorCreatedBy: invoice.createdBy,
                vendorApprovedBy: invoice.approvedBy,
                vendorRejectionReason: invoice.rejectionReason || null,
                vendorFileUrl: invoice.invoiceUrl,
                vendorCreatedAt: invoice.createdAt || new Date().toISOString(),
                vendorUpdatedAt: invoice.updatedAt,
                invoiceType: "vendor",
                fileType: getFileType(invoice.invoiceUrl),
              })),
            });
          });

          // Merge the data with clear separation
          const mergedData = poData.map((po) => {
            const vendorInvoiceInfo = vendorInvoiceMap.get(po.poId);
            const poBills = (po.bills || []).map((bill) => ({
              ...bill,
              poInvoiceId: bill.id || `po-${Date.now()}-${Math.random()}`,
              poInvoiceNumber: bill.invoiceNumber || "No PO Invoice#",
              poInvoiceDate: bill.createdAt || po.poDate,
              poFileUrl: bill.fileUrl,
              poSource: "po",
              invoiceType: "po",
              fileType: getFileType(bill.fileUrl),
            }));
            const vendorInvoices = vendorInvoiceInfo?.vendorInvoices || [];

            return {
              ...po,
              poBills,
              vendorInvoices,
              allBills: [...poBills, ...vendorInvoices],
              hasBill: poBills.length > 0 || vendorInvoices.length > 0,
              hasPoBill: poBills.length > 0,
              hasVendorInvoice: vendorInvoices.length > 0,
              poBillCount: poBills.length,
              vendorInvoiceCount: vendorInvoices.length,
            };
          });

          setPurchaseOrders(mergedData);
          setFilteredOrders(mergedData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch purchase orders. Please try again later.",
        );
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update search filter with debounced value
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Track active filters (only search)
  useEffect(() => {
    const active = [];
    if (filters.search) active.push(`Search: "${filters.search}"`);
    setActiveFilters(active);
  }, [filters]);

  // Apply filters (only search)
  useEffect(() => {
    let filtered = [...purchaseOrders];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (po) =>
          po.poNumber?.toLowerCase().includes(searchLower) ||
          po.companyName?.toLowerCase().includes(searchLower) ||
          po.vendorName?.toLowerCase().includes(searchLower) ||
          po.currency?.toLowerCase().includes(searchLower) ||
          po.items?.some((item) =>
            item.itemName?.toLowerCase().includes(searchLower),
          ) ||
          po.poBills?.some((bill) =>
            bill.poInvoiceNumber?.toLowerCase().includes(searchLower),
          ) ||
          po.vendorInvoices?.some((invoice) =>
            invoice.vendorInvoiceNumber?.toLowerCase().includes(searchLower),
          ),
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [filters, purchaseOrders]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = useMemo(
    () => filteredOrders.slice(startIndex, endIndex),
    [filteredOrders, startIndex, endIndex],
  );

  const toggleRowExpansion = useCallback((poId) => {
    setExpandedRows((prev) => ({ ...prev, [poId]: !prev[poId] }));
  }, []);

  // Clear all filters (just search)
  const clearAllFilters = () => {
    setFilters({ search: "" });
    setSearchInput("");
  };

  // Remove specific filter (only search possible)
  const removeFilter = (filterToRemove) => {
    if (filterToRemove.startsWith("Search:")) {
      setFilters({ search: "" });
      setSearchInput("");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CNY: "¥",
    };
    return symbols[currencyCode?.toUpperCase()] || currencyCode || "₹";
  };

  // Format currency
  const formatCurrency = (amount, currencyCode = "INR") => {
    if (!amount && amount !== 0) return "N/A";
    const symbol = getCurrencySymbol(currencyCode);
    if (currencyCode?.toUpperCase() === "USD") {
      return `${symbol}${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (currencyCode?.toUpperCase() === "INR") {
      return `${symbol} ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return `${symbol}${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get status badge color (only for vendor invoice statuses)
  const getStatusBadgeColor = (status) => {
    const colors = {
      Paid: "bg-green-100 text-green-800",
      "Partially Paid": "bg-brand-100 text-brand-700",
      Pending: "bg-orange-100 text-orange-800",
      Overdue: "bg-red-100 text-red-800",
      Cancelled: "bg-ink-100 text-ink-800",
      Draft: "bg-ink-100 text-ink-800",
      Approved: "bg-brand-100 text-ink-950",
      Rejected: "bg-red-100 text-red-800",
      Submitted: "bg-purple-100 text-purple-800",
    };
    return colors[status] || "bg-ink-100 text-ink-800";
  };

  // Check screen size for mobile view
  useEffect(() => {
    const handleResize = () => setMobileView(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render file actions – responsive
  const renderFileActions = (file, invoiceType = "po") => {
    const fileType =
      file.fileType || getFileType(file.poFileUrl || file.vendorFileUrl);
    const fileUrl = file.poFileUrl || file.vendorFileUrl;
    const fileId = file.poInvoiceId || file.vendorInvoiceId;
    const fileName = file.poInvoiceNumber || file.vendorInvoiceNumber;
    const buttonColor = invoiceType === "po" ? "blue" : "purple";

    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() =>
            handleFileAction(fileUrl, fileName, "download", fileType)
          }
          disabled={downloadingPdf[fileId]}
          className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-medium rounded-lg text-white bg-${buttonColor}-600 hover:bg-${buttonColor}-700 disabled:opacity-50`}
        >
          {downloadingPdf[fileId] ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
              Downloading...
            </>
          ) : (
            <>
              <Download size={14} className="mr-1" />
              Download
            </>
          )}
        </button>
        <button
          onClick={() => handleFileAction(fileUrl, fileName, "view", fileType)}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-ink-300 text-xs font-medium rounded-lg text-ink-700 bg-white hover:bg-ink-50"
        >
          {getFileIcon(fileType)}
          <span className="ml-1">
            {fileType === "image" ? "Preview" : "View"}
          </span>
        </button>
      </div>
    );
  };

  // Image Preview Modal – responsive
  const ImagePreviewModal = () => {
    if (!imagePreview.isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-[60vh] px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-ink-500 opacity-75"></div>
          </div>
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-card transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-ink-900 break-words">
                  {imagePreview.fileName || "Image Preview"}
                </h3>
                <button
                  onClick={closeImagePreview}
                  className="text-ink-400 hover:text-ink-500"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mt-2">
                <img
                  src={imagePreview.imageUrl}
                  alt={imagePreview.fileName || "Preview"}
                  className="max-w-full max-h-[70vh] mx-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Image+Not+Available";
                  }}
                />
              </div>
            </div>
            <div className="bg-ink-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
              <button
                onClick={closeImagePreview}
                className="w-full inline-flex justify-center rounded-lg border border-ink-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-ink-700 hover:bg-ink-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400/40 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleFileAction(
                    imagePreview.imageUrl,
                    imagePreview.fileName,
                    "download",
                    "image",
                  );
                  closeImagePreview();
                }}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-ink-950 text-base font-medium text-white hover:bg-ink-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400/40 sm:mt-0 sm:w-auto sm:text-sm"
              >
                <Download size={16} className="mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Skeleton loading
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-ink-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-ink-200 rounded w-32"></div>
        <div className="h-3 bg-ink-200 rounded w-24 mt-1"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-ink-200 rounded w-40"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-ink-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-ink-200 rounded w-28"></div>
      </td>
      <td className="px-6 py-4">
        <div className="h-8 bg-ink-200 rounded w-24"></div>
      </td>
    </tr>
  );

  if (initialLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-500 border-t-transparent"></div>
        <p className="mt-4 text-ink-600">Loading purchase orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <AlertCircle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h3 className="text-lg font-medium text-red-800">
                Error Loading Data
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ImagePreviewModal />

      {pdfError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-card">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{pdfError}</span>
              <button
                onClick={() => setPdfError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters – only search */}
      <div className="bg-white rounded-xl shadow p-6 mb-8">
        <div className="flex items-center mb-4">
          <Filter className="h-5 w-5 text-ink-500 mr-2" />
          <h3 className="text-lg font-medium text-ink-800">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search PO, Company, Vendor, Invoice#..."
                className="w-full pl-10 pr-3 py-2.5 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-transparent"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-ink-600">Active filters:</span>
              {activeFilters.map((filter, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950"
                >
                  {filter}
                  <button
                    onClick={() => removeFilter(filter)}
                    className="ml-2 text-brand-700 hover:text-ink-950"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 ml-2"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results and Pagination */}
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between">
        <div className="text-ink-600 mb-2 md:mb-0">
          Showing {filteredOrders.length > 0 ? startIndex + 1 : 0} to{" "}
          {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}{" "}
          results
          {filters.search && ` for "${filters.search}"`}
        </div>
        {filteredOrders.length > itemsPerPage && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-ink-600">Show:</span>
              <select
                className="px-2 py-1 border border-ink-300 rounded text-sm"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-ink-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-ink-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-ink-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View (6 columns) */}
      {!mobileView && (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink-200">
              <thead className="bg-ink-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    PO Details
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    Company & Vendor
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    Purchase Dept
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-ink-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-ink-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} />
                  ))
                ) : paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-ink-900 mb-2">
                        No purchase orders found
                      </h3>
                      <p className="text-ink-600 mb-4">
                        Try adjusting your filters or search term
                      </p>
                      <button
                        onClick={clearAllFilters}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-ink-950 hover:bg-ink-800"
                      >
                        Clear all filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((po) => (
                    <React.Fragment key={po.poId}>
                      <tr className="hover:bg-ink-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <button
                              onClick={() => toggleRowExpansion(po.poId)}
                              className="mr-2 text-ink-500 hover:text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-400/40 rounded"
                            >
                              {expandedRows[po.poId] ? (
                                <ChevronUp size={16} />
                              ) : (
                                <ChevronDown size={16} />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-semibold text-ink-900">
                                {po.poNumber}
                              </div>
                              <div className="text-sm text-ink-500 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(po.poDate)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center text-sm font-medium text-ink-900">
                              <Building className="h-3 w-3 mr-1 text-ink-400" />
                              {po.companyName}
                            </div>
                            <div className="flex items-center text-sm text-ink-600 mt-1">
                              <User className="h-3 w-3 mr-1 text-ink-400" />
                              {po.vendorName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-ink-900">
                              {formatCurrency(po.grandTotal, po.currency)}
                            </div>
                            <div className="text-sm text-green-600">
                              Paid: {formatCurrency(po.totalPaid, po.currency)}
                            </div>
                            <div className="text-sm text-orange-600">
                              Due:{" "}
                              {formatCurrency(po.remainingAmount, po.currency)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {po.poBillCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-brand-100 text-ink-950">
                              <FileText size={12} className="mr-1" />
                              {po.poBillCount} PO Invoice
                              {po.poBillCount > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-ink-100 text-ink-800">
                              No PO Invoices
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {po.vendorInvoiceCount > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800">
                              <Store size={12} className="mr-1" />
                              {po.vendorInvoiceCount} Vendor Invoice
                              {po.vendorInvoiceCount > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-ink-100 text-ink-800">
                              No Vendor Invoices
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => toggleRowExpansion(po.poId)}
                            className="inline-flex items-center px-3 py-1.5 border border-ink-300 text-sm font-medium rounded-lg text-white bg-green-500 hover:bg-green-600"
                          >
                            {expandedRows[po.poId] ? (
                              <>
                                <ChevronUp size={14} className="mr-1" />
                                {/* Hide Details */}
                              </>
                            ) : (
                              <>
                                <ChevronDown size={14} className="mr-1" />
                                {/* View Details */}
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows[po.poId] && (
                        <tr className="bg-ink-50">
                          <td colSpan="6" className="px-6 py-4">
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                              {/* PO Invoices */}
                              <div className="lg:col-span-1">
                                <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
                                  <Receipt
                                    size={18}
                                    className="mr-2 text-brand-700"
                                  />{" "}
                                  Warehouse{" "}
                                  {/* <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-ink-950">
                                    {po.poBillCount} invoices
                                  </span> */}
                                </h3>
                                {po.poBillCount > 0 ? (
                                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                    {po.poBills.map((bill, idx) => {
                                      const ft =
                                        bill.fileType ||
                                        getFileType(bill.poFileUrl);
                                      return (
                                        <div
                                          key={bill.poInvoiceId || idx}
                                          className="bg-white rounded-lg border border-brand-300 p-4"
                                        >
                                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center">
                                                <Hash className="h-4 w-4 text-ink-400 mr-1 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-ink-900 break-words">
                                                  {bill.poInvoiceNumber}
                                                </span>
                                              </div>
                                              <div className="text-xs text-ink-500 mt-1 flex items-center flex-wrap">
                                                {getFileIcon(ft)}
                                                <span className="ml-1">
                                                  Date:{" "}
                                                  {formatDate(
                                                    bill.poInvoiceDate,
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950 whitespace-nowrap">
                                              {ft === "pdf"
                                                ? "PDF"
                                                : ft === "image"
                                                  ? "Image"
                                                  : "File"}
                                            </span>
                                          </div>
                                          {renderFileActions(bill, "po")}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-lg border border-ink-200 p-6 text-center">
                                    <Receipt
                                      size={40}
                                      className="mx-auto text-ink-400 mb-2"
                                    />
                                    <p className="text-sm text-ink-600">
                                      No PO invoices attached
                                    </p>
                                  </div>
                                )}
                              </div>
                              {/* Vendor Invoices */}
                              <div className="lg:col-span-1">
                                <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
                                  <Store
                                    size={18}
                                    className="mr-2 text-purple-600"
                                  />{" "}
                                  Purchase Dept{" "}
                                  {/* <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {po.vendorInvoiceCount} invoices
                                  </span> */}
                                </h3>
                                {po.vendorInvoiceCount > 0 ? (
                                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                    {po.vendorInvoices.map((inv, idx) => {
                                      const ft =
                                        inv.fileType ||
                                        getFileType(inv.vendorFileUrl);
                                      return (
                                        <div
                                          key={inv.vendorInvoiceId || idx}
                                          className="bg-white rounded-lg border border-purple-200 p-4"
                                        >
                                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex items-center">
                                                <Hash className="h-4 w-4 text-ink-400 mr-1 flex-shrink-0" />
                                                <span className="text-sm font-semibold text-ink-900 break-words">
                                                  {inv.vendorInvoiceNumber}
                                                </span>
                                              </div>
                                            </div>
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 whitespace-nowrap">
                                              {ft === "pdf"
                                                ? "PDF"
                                                : ft === "image"
                                                  ? "Image"
                                                  : "File"}
                                            </span>
                                          </div>
                                          {(inv.vendorCreatedBy ||
                                            inv.vendorApprovedBy) && (
                                            <div className="border-t border-ink-200 pt-2 mt-2 text-xs">
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {inv.vendorCreatedBy && (
                                                  <div>
                                                    <span className="text-ink-500">
                                                      Created By:
                                                    </span>
                                                    <span className="ml-1 text-ink-700 break-words">
                                                      {inv.vendorCreatedBy}
                                                    </span>
                                                  </div>
                                                )}
                                                {inv.vendorApprovedBy && (
                                                  <div>
                                                    <span className="text-ink-500">
                                                      Approved By:
                                                    </span>
                                                    <span className="ml-1 text-ink-700 break-words">
                                                      {inv.vendorApprovedBy}
                                                    </span>
                                                  </div>
                                                )}
                                              </div>
                                              {inv.vendorRejectionReason && (
                                                <div className="mt-2 p-2 bg-red-50 rounded text-red-700 break-words">
                                                  <span className="font-medium">
                                                    Rejection Reason:
                                                  </span>{" "}
                                                  {inv.vendorRejectionReason}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                          {renderFileActions(inv, "vendor")}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="bg-white rounded-lg border border-ink-200 p-6 text-center">
                                    <Store
                                      size={40}
                                      className="mx-auto text-ink-400 mb-2"
                                    />
                                    <p className="text-sm text-ink-600">
                                      No vendor invoices attached
                                    </p>
                                  </div>
                                )}
                              </div>
                              {/* PO Document */}
                              <div className="lg:col-span-1">
                                <h3 className="text-lg font-medium text-ink-900 mb-3 flex items-center">
                                  <FileText
                                    size={18}
                                    className="mr-2 text-green-600"
                                  />{" "}
                                  PO Document
                                </h3>
                                <div className="bg-white rounded-lg border border-green-200 p-4">
                                  <div className="flex flex-col items-center text-center">
                                    <FileText
                                      size={48}
                                      className="text-green-500 mb-3"
                                    />
                                    <h4 className="font-medium text-ink-900 text-base mb-4 break-words">
                                      {po.poNumber}
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                                      <button
                                        onClick={() =>
                                          openPdfInNewTab(po.poId, po.poNumber)
                                        }
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                                      >
                                        <FileText size={16} className="mr-2" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          downloadPdf(po.poId, po.poNumber)
                                        }
                                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700"
                                      >
                                        <Download size={16} className="mr-2" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Card View – improved responsiveness */}
      {mobileView && (
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg shadow p-4 animate-pulse"
              >
                <div className="h-4 bg-ink-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-ink-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-ink-200 rounded w-2/3"></div>
              </div>
            ))
          ) : paginatedOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <FileText className="h-12 w-12 text-ink-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink-900 mb-2">
                No purchase orders found
              </h3>
              <p className="text-ink-600 mb-4">
                Try adjusting your filters or search term
              </p>
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-ink-950 hover:bg-ink-800"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            paginatedOrders.map((po) => (
              <div
                key={po.poId}
                className="bg-white rounded-lg shadow border border-ink-200 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-ink-900 break-words">
                        {po.poNumber}
                      </h3>
                      <div className="flex items-center text-sm text-ink-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          {formatDate(po.poDate)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRowExpansion(po.poId)}
                      className="text-ink-500 hover:text-ink-700 flex-shrink-0 ml-2"
                    >
                      {expandedRows[po.poId] ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <div className="text-xs text-ink-500">Company</div>
                      <div className="font-medium text-sm break-words">
                        {po.companyName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-500">Vendor</div>
                      <div className="font-medium text-sm break-words">
                        {po.vendorName}
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-xs text-ink-500">Amount</div>
                    <div className="font-bold text-lg break-words">
                      {formatCurrency(po.grandTotal, po.currency)}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${po.hasPoBill ? "bg-brand-100 text-ink-950" : "bg-ink-100 text-ink-800"}`}
                    >
                      <FileText size={12} className="mr-1" />
                      PO: {po.poBillCount}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${po.hasVendorInvoice ? "bg-purple-100 text-purple-800" : "bg-ink-100 text-ink-800"}`}
                    >
                      <Store size={12} className="mr-1" />
                      Vendor: {po.vendorInvoiceCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => openPdfInNewTab(po.poId, po.poNumber)}
                      className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                    >
                      <FileText size={14} className="mr-1" />
                      View PO
                    </button>
                  </div>
                </div>
                {expandedRows[po.poId] && (
                  <div className="border-t border-ink-200 p-4 bg-ink-50">
                    {/* PO Document */}
                    <div className="mb-4">
                      <h4 className="font-medium text-ink-900 mb-2 flex items-center">
                        <FileText size={16} className="mr-1 text-green-600" />
                        PO Document
                      </h4>
                      <div className="bg-white rounded-lg border border-green-200 p-4">
                        <div className="flex flex-col items-center text-center">
                          <FileText size={40} className="text-green-500 mb-2" />
                          <div className="text-sm font-medium text-ink-900 mb-3 break-words">
                            {po.poNumber}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            <button
                              onClick={() =>
                                openPdfInNewTab(po.poId, po.poNumber)
                              }
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                            >
                              <FileText size={14} className="mr-1" />
                              View PDF
                            </button>
                            <button
                              onClick={() => downloadPdf(po.poId, po.poNumber)}
                              className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700"
                            >
                              <Download size={14} className="mr-1" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* PO Items */}
                    <div className="mb-4">
                      <h4 className="font-medium text-ink-900 mb-2 flex items-center">
                        <FileText size={16} className="mr-1" />
                        PO Items ({po.items?.length || 0})
                      </h4>
                      <div className="bg-white rounded border border-ink-200 divide-y max-h-60 overflow-y-auto">
                        {po.items?.map((item, idx) => (
                          <div key={idx} className="p-3">
                            <div className="text-sm font-medium break-words">
                              {item.itemName}
                            </div>
                            <div className="text-xs text-ink-500 mt-1 break-words">
                              Qty: {item.quantity} {item.unit} | Rate:{" "}
                              {formatCurrency(item.rate, po.currency)} | Amount:{" "}
                              {formatCurrency(
                                item.amount || item.quantity * item.rate,
                                po.currency,
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* PO Invoices */}
                    {po.poBillCount > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-ink-900 mb-2 flex items-center">
                          <Receipt size={16} className="mr-1 text-brand-700" />
                          Warehouse ({po.poBillCount})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {po.poBills.map((bill, idx) => {
                            const ft =
                              bill.fileType || getFileType(bill.poFileUrl);
                            return (
                              <div
                                key={bill.poInvoiceId || idx}
                                className="bg-white rounded border border-brand-300 p-3"
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                                  <div className="text-sm font-medium break-words flex-1">
                                    {bill.poInvoiceNumber}
                                  </div>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-950 whitespace-nowrap">
                                    {ft === "pdf"
                                      ? "PDF"
                                      : ft === "image"
                                        ? "Image"
                                        : "File"}
                                  </span>
                                </div>
                                <div className="text-xs text-ink-500 mb-2 flex items-center flex-wrap">
                                  {getFileIcon(ft)}
                                  <span className="ml-1">
                                    Date: {formatDate(bill.poInvoiceDate)}
                                  </span>
                                </div>
                                {renderFileActions(bill, "po")}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Vendor Invoices */}
                    {po.vendorInvoiceCount > 0 && (
                      <div>
                        <h4 className="font-medium text-ink-900 mb-2 flex items-center">
                          <Store size={16} className="mr-1 text-purple-600" />
                          Purchase Dept ({po.vendorInvoiceCount})
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {po.vendorInvoices.map((inv, idx) => {
                            const ft =
                              inv.fileType || getFileType(inv.vendorFileUrl);
                            return (
                              <div
                                key={inv.vendorInvoiceId || idx}
                                className="bg-white rounded border border-purple-200 p-3"
                              >
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-1">
                                  <div className="text-sm font-medium break-words flex-1">
                                    {inv.vendorInvoiceNumber}
                                  </div>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${getStatusBadgeColor(inv.vendorInvoiceStatus)}`}
                                  >
                                    {inv.vendorInvoiceStatus}
                                  </span>
                                </div>
                                <div className="text-xs text-ink-600 space-y-1">
                                  <div className="flex items-center flex-wrap">
                                    {getFileIcon(ft)}
                                    <span className="ml-1">
                                      Date: {formatDate(inv.vendorInvoiceDate)}
                                    </span>
                                  </div>
                                  <div>
                                    Due: {formatDate(inv.vendorDueDate)}
                                  </div>
                                  <div className="font-medium mt-1 break-words">
                                    Amount:{" "}
                                    {formatCurrency(
                                      inv.vendorTotalAmount,
                                      po.currency,
                                    )}
                                  </div>
                                </div>
                                {renderFileActions(inv, "vendor")}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Bottom Pagination */}
      {filteredOrders.length > itemsPerPage && (
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between">
          <div className="text-sm text-ink-600 mb-4 md:mb-0">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredOrders.length)} of{" "}
            {filteredOrders.length} entries
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
            >
              «
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
            >
              ‹
            </button>
            <span className="px-3 py-1.5 text-sm text-ink-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
            >
              ›
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-ink-300 rounded text-sm disabled:opacity-50 hover:bg-ink-50"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoInvoice;
