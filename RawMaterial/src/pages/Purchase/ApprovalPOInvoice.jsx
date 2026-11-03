import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";

const ApprovalPOInvoice = () => {
  const [approvalData, setApprovalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [selectedPOs, setSelectedPOs] = useState(new Set());
  const [viewItemModal, setViewItemModal] = useState({
    isOpen: false,
    items: [],
    poNumber: "",
  });

  useEffect(() => {
    fetchApprovalData();
  }, []);

  const fetchApprovalData = async () => {
    setLoading(true);
    try {
      const response = await Api.get(`/admin/getPOsForApproval`);
      const data = response?.data?.data || [];
      setApprovalData(data);
      setSelectedPOs(new Set());
    } catch (error) {
      console.log(
        "Error fetching Approval PO Data:",
        error?.response?.data?.message || error?.message,
      );
      alert(
        "Failed to fetch Approval PO Data: " +
          (error?.response?.data?.message || error?.message),
      );
    } finally {
      setLoading(false);
    }
  };

  // Open PDF in new tab
  const openPdfInNewTab = async (poId, poNumber) => {
    try {
      // Fetch PDF as blob
      const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
        responseType: 'blob',
      });
      
      // Create blob URL from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>PO-${poNumber}</title>
              <style>
                body { margin: 0; padding: 0; }
                .pdf-container { width: 100%; height: 100vh; }
                iframe { width: 100%; height: 100%; border: none; }
                .no-pdf { 
                  display: flex; 
                  flex-direction: column; 
                  justify-content: center; 
                  align-items: center; 
                  height: 100vh; 
                  text-align: center; 
                  font-family: Arial, sans-serif; 
                }
                .download-btn { 
                  margin-top: 20px; 
                  padding: 10px 20px; 
                  background: #4CAF50; 
                  color: white; 
                  border: none; 
                  border-radius: 4px; 
                  cursor: pointer; 
                  text-decoration: none; 
                }
              </style>
            </head>
            <body>
              <div class="pdf-container">
                <iframe src="${pdfUrl}" title="PO-${poNumber}"></iframe>
              </div>
              <script>
                // Clean up blob URL when window is closed
                window.addEventListener('beforeunload', function() {
                  URL.revokeObjectURL("${pdfUrl}");
                });
              </script>
            </body>
          </html>
        `);
        
        // Set focus to the new window
        newWindow.focus();
        
        // Store reference for cleanup on component unmount
        return { window: newWindow, blobUrl: pdfUrl };
      }
      
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Failed to load PDF. Please try again.");
      
      // Alternative: Show error in new tab
      const errorWindow = window.open();
      if (errorWindow) {
        errorWindow.document.write(`
          <html>
            <head><title>Error Loading PDF</title></head>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2 style="color: #d32f2f;">Failed to Load PDF</h2>
              <p>Unable to load the PDF document for PO: ${poNumber}</p>
              <p>Error: ${error.message || "Unknown error"}</p>
              <button onclick="window.close()" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Close Window
              </button>
            </body>
          </html>
        `);
        errorWindow.focus();
      }
    }
  };

  // Alternative: Direct download approach
  const downloadPdf = async (poId, poNumber) => {
    try {
      const response = await Api.get(`/admin/previewPOPdf?poId=${poId}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${poNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Handle single PO selection
  const handleSelectPO = (poId) => {
    const newSelected = new Set(selectedPOs);
    if (newSelected.has(poId)) {
      newSelected.delete(poId);
    } else {
      newSelected.add(poId);
    }
    setSelectedPOs(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedPOs.size === approvalData.length) {
      setSelectedPOs(new Set());
    } else {
      setSelectedPOs(new Set(approvalData.map((po) => po.poId)));
    }
  };

  // Open item view modal
  const openItemModal = (items, poNumber) => {
    setViewItemModal({
      isOpen: true,
      items,
      poNumber,
    });
  };

  // Close modal
  const closeItemModal = () => {
    setViewItemModal({
      isOpen: false,
      items: [],
      poNumber: "",
    });
  };

  // Handle single approval/decline
  const handleApprovalAction = async (poId, status) => {
    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} this PO?`,
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [poId]: true }));

    try {
      const response = await Api.put("/admin/poApprovalAction", {
        poId,
        status: status.toUpperCase(),
      });

      if (response.data.success) {
        alert(`PO ${status.toLowerCase()} successfully!`);
        setApprovalData((prev) => prev.filter((po) => po.poId !== poId));
        const newSelected = new Set(selectedPOs);
        newSelected.delete(poId);
        setSelectedPOs(newSelected);
      } else {
        throw new Error(response.data.message || "Action failed");
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()}ing PO:`, error);
      alert(
        `Failed to ${status.toLowerCase()} PO: ` +
          (error?.response?.data?.message || error?.message || "Unknown error"),
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [poId]: false }));
    }
  };

  // Handle bulk approval/decline
  const handleBulkApprovalAction = async (status) => {
    if (selectedPOs.size === 0) {
      alert("Please select at least one PO to perform bulk action.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to ${status.toLowerCase()} ${selectedPOs.size} selected PO(s)?`,
      )
    ) {
      return;
    }

    setBulkActionLoading(true);
    const promises = [];
    const selectedArray = Array.from(selectedPOs);

    selectedArray.forEach((poId) => {
      promises.push(
        Api.put("/admin/poApprovalAction", {
          poId,
          status: status.toUpperCase(),
        }),
      );
    });

    try {
      const results = await Promise.all(promises);
      const failedActions = results.filter((result) => !result.data.success);

      if (failedActions.length > 0) {
        throw new Error(`${failedActions.length} action(s) failed`);
      }

      alert(
        `Successfully ${status.toLowerCase()}ed ${selectedPOs.size} PO(s)!`,
      );

      setApprovalData((prev) => prev.filter((po) => !selectedPOs.has(po.poId)));
      setSelectedPOs(new Set());
    } catch (error) {
      console.error(`Error in bulk ${status.toLowerCase()}:`, error);
      alert(
        `Failed to ${status.toLowerCase()} some POs: ` +
          (error?.response?.data?.message || error?.message || "Unknown error"),
      );
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Check if current row is selected
  const isRowSelected = (poId) => selectedPOs.has(poId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-blue-500 border-t-transparent mb-2"></div>
          <p>Loading approval data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Bulk Actions Bar */}
      {selectedPOs.size > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-blue-700 font-semibold">
                {selectedPOs.size} PO(s) selected
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleBulkApprovalAction("APPROVED")}
                disabled={bulkActionLoading}
                className="px-4 py-2 btn-approve text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {bulkActionLoading ? (
                  <>
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
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Approve Selected
                  </>
                )}
              </button>
              <button
                onClick={() => handleBulkApprovalAction("REJECTED")}
                disabled={bulkActionLoading}
                className="px-4 py-2 btn-decline text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Decline Selected
              </button>
              <button
                onClick={() => setSelectedPOs(new Set())}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end items-center mb-6">
        <div className="flex space-x-3">
          <button
            onClick={fetchApprovalData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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

      {approvalData.length === 0 ? (
        <div className="text-center p-8 bg-white rounded-lg shadow">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Pending Approvals
          </h3>
          <p className="text-gray-500">
            All purchase orders have been processed.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedPOs.size === approvalData.length &&
                        approvalData.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {approvalData.map((po) => {
                  const isSelected = isRowSelected(po.poId);
                  return (
                    <tr
                      key={po.poId}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectPO(po.poId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {po.poNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {po.companyName}
                          </div>
                          <div className="flex flex-wrap gap-3 mt-1">
                            <button
                              onClick={() => openItemModal(po.items, po.poNumber)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Items ({po.items.length})
                            </button>
                            <button
                              onClick={() => openPdfInNewTab(po.poId, po.poNumber)}
                              className="text-xs text-green-600 hover:text-green-800 flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                />
                              </svg>
                              View PDF
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadPdf(po.poId, po.poNumber);
                              }}
                              className="text-xs text-purple-600 hover:text-purple-800 flex items-center"
                              title="Download PDF"
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Download
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {po.vendorName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {po.currency}{" "}
                          {parseFloat(po.grandTotal).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            po.approvalStatus === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : po.approvalStatus === "APPROVED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {po.approvalStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(po.poDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        {isSelected ? (
                          <div className="text-sm text-gray-500 italic">
                            Use bulk actions above
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleApprovalAction(po.poId, "APPROVED")
                              }
                              disabled={
                                actionLoading[po.poId] || selectedPOs.size > 0
                              }
                              className="px-4 py-2 btn-approve text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                              {actionLoading[po.poId] ? (
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
                                  ></path>
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                              {actionLoading[po.poId]
                                ? "Processing..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={() =>
                                handleApprovalAction(po.poId, "REJECTED")
                              }
                              disabled={
                                actionLoading[po.poId] || selectedPOs.size > 0
                              }
                              className="px-4 py-2 btn-decline text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              Decline
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item View Modal */}
      {viewItemModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-3/4 md:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Items in PO: {viewItemModal.poNumber}
              </h3>
              <button
                onClick={closeItemModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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

            <div className="overflow-y-auto max-h-96">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {viewItemModal.items.map((item, index) => (
                    <tr key={item.id || index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.itemName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeItemModal}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalPOInvoice;