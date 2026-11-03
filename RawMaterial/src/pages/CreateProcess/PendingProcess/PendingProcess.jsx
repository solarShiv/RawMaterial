import React, { useEffect, useState, useMemo, useCallback } from "react";
import Api from "../../../auth/Api";
import UserItemStock from "../UserItemStock/UserItemStock";
import { useNavigate } from "react-router-dom";

const PendingProcess = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [selectedProcess, setSelectedProcess] = useState(null);
  const [showUserItemStock, setShowUserItemStock] = useState(false);
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarksData, setRemarksData] = useState({
    serviceProcessId: "",
    status: "",
    failureReason: "",
    remarks: "",
  });
  const [productFilter, setProductFilter] = useState("ALL");
  
  const navigate = useNavigate();

  const failureReasons = [
    "VIBRATION",
    "OVERLOAD", 
    "EARTHING",
    "LEAKAGE",
    "REJECTED",
  ];

  const productOptions = [
    { value: "ALL", label: "All Products" },
    { value: "MOTOR", label: "Motor" },
    { value: "PUMP", label: "Pump" },
    { value: "CONTROLLER", label: "Controller" },
  ];

  // Enhanced product type styling
  const getProductBadge = (productName) => {
    const productColors = {
      'MOTOR': 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm',
      'PUMP': 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-sm',
      'CONTROLLER': 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
    };
    
    return productColors[productName] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-sm';
  };

  // Enhanced status styling
  const getStatusColor = (status) => {
    const statusColors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800 border border-blue-200',
      'COMPLETED': 'bg-green-100 text-green-800 border border-green-200',
      'FAILED': 'bg-red-100 text-red-800 border border-red-200',
      'REJECTED': 'bg-red-100 text-red-800 border border-red-200',
      'SKIPPED': 'bg-gray-100 text-gray-800 border border-gray-200'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Filtered pending list based on product selection
  const filteredPendingList = useMemo(() => {
    if (productFilter === "ALL") {
      return pendingList;
    }
    return pendingList.filter(item => item.productName === productFilter);
  }, [pendingList, productFilter]);

  const isTestingProcess = (item) => {
    return item.processStage?.toLowerCase().includes("testing") || 
           item.itemName?.toLowerCase().includes("testing");
  };

  const shouldShowDisassembleForm = (item) => {
    return item.disassembleSessionId && item.disassembleStatus;
  };

  const isDisassembleWorkflow = (item) => {
    return shouldShowDisassembleForm(item);
  };

  // Count processes by product type
  const productCounts = useMemo(() => {
    const counts = {
      ALL: pendingList.length,
      MOTOR: 0,
      PUMP: 0,
      CONTROLLER: 0
    };

    pendingList.forEach(item => {
      if (item.productName === 'MOTOR') counts.MOTOR++;
      else if (item.productName === 'PUMP') counts.PUMP++;
      else if (item.productName === 'CONTROLLER') counts.CONTROLLER++;
    });

    return counts;
  }, [pendingList]);

  const fetchPendingActivities = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await Api.get(`/line-worker/getPendingActivitiesForUserStage`);
      if (res.data.success) {
        setPendingList(res.data.data);
      } else {
        setError("No pending activities found.");
      }
    } catch (err) {
      setError("Unable to load pending activities. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = useCallback(async (serviceProcessId) => {
    setProcessingId(serviceProcessId);
    setActionType("accept");
    try {
      const res = await Api.put(`/line-worker/acceptServiceProcess`, {
        serviceProcessId: serviceProcessId,
      });

      if (res.data.success) {
        setPendingList((prevList) =>
          prevList.map((item) =>
            item.serviceProcessId === serviceProcessId
              ? { ...item, processAccepted: true }
              : item
          )
        );
        alert("Process accepted successfully!");
      } else {
        setError("Failed to accept process: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      setError("Unable to accept process. Please try again.");
    } finally {
      setProcessingId(null);
      setActionType("");
    }
  }, []);

  const handleStarted = useCallback(async (serviceProcessId) => {
    setProcessingId(serviceProcessId);
    setActionType("start");
    try {
      const res = await Api.put(`/line-worker/startServiceProcess`, {
        serviceProcessId: serviceProcessId,
      });

      if (res.data.success) {
        setPendingList((prevList) =>
          prevList.map((item) =>
            item.serviceProcessId === serviceProcessId
              ? { ...item, processStarted: true }
              : item
          )
        );
        alert("Process started successfully!");
      } else {
        setError("Failed to start process: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      setError("Unable to start process. Please try again.");
    } finally {
      setProcessingId(null);
      setActionType("");
    }
  }, []);

  const handleTestingStatus = useCallback(async (serviceProcessId, status) => {
    if (status === "FAILED") {
      setRemarksData({
        serviceProcessId: serviceProcessId,
        status: status,
        failureReason: "",
        remarks: "",
      });
      setShowRemarksModal(true);
    } else {
      setRemarksData({
        serviceProcessId: serviceProcessId,
        status: status,
        failureReason: "",
        remarks: "",
      });
      setShowRemarksModal(true);
    }
  }, []);

  const openRemarksModal = useCallback((serviceProcessId, status) => {
    setRemarksData({
      serviceProcessId: serviceProcessId,
      status: status,
      failureReason: "",
      remarks: "",
    });
    setShowRemarksModal(true);
  }, []);

  const handleRemarksSubmit = async () => {
    if (remarksData.status === "FAILED" && !remarksData.failureReason) {
      alert("Please select a failure reason before submitting.");
      return;
    }

    if (!remarksData.remarks.trim()) {
      alert("Please enter remarks before submitting.");
      return;
    }

    setProcessingId(remarksData.serviceProcessId);
    setActionType(remarksData.status.toLowerCase());

    try {
      const res = await Api.post(`/line-worker/completeServiceProcess`, remarksData);

      if (res.data.success) {
        setPendingList((prevList) =>
          prevList.filter(
            (item) => item.serviceProcessId !== remarksData.serviceProcessId
          )
        );
        
        if (remarksData.status === "COMPLETED") {
          alert("Process completed successfully!");
        } else if (remarksData.status === "SKIPPED") {
          alert("Process skipped successfully!");
        } else if (remarksData.status === "REJECTED") {
          alert("Process rejected successfully!");
        } else if (remarksData.status === "FAILED") {
          alert("Process marked as failed successfully!");
        }
      } else {
        setError(`Failed to ${remarksData.status.toLowerCase()} process: ` + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      setError(`Unable to ${remarksData.status.toLowerCase()} process. Please try again.`);
    } finally {
      setProcessingId(null);
      setActionType("");
      setShowRemarksModal(false);
      setRemarksData({
        serviceProcessId: "",
        status: "",
        failureReason: "",
        remarks: "",
      });
    }
  };

  const handleCloseRemarksModal = () => {
    setShowRemarksModal(false);
    setRemarksData({
      serviceProcessId: "",
      status: "",
      failureReason: "",
      remarks: "",
    });
  };

  const handleFormFill = (item) => {
    navigate("/user-item-stock", {
      state: { serviceProcessId: item.serviceProcessId },
    });
  };

  const handleDisassembleForm = (item) => {
    navigate("/reusable-items", {
      state: { 
        serviceProcessId: item.serviceProcessId,
        disassembleSessionId: item.disassembleSessionId,
        isDisassemblePending: item.isDisassemblePending,
        disassembleStatus: item.disassembleStatus
      },
    });
  };

  const handleCloseUserItemStock = () => {
    setShowUserItemStock(false);
    setSelectedProcess(null);
  };

  const getButtonText = (buttonType, serviceProcessId) => {
    if (processingId === serviceProcessId && actionType === buttonType) {
      return (
        <>
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {buttonType === "accept"
            ? "Accepting..."
            : buttonType === "start"
            ? "Starting..."
            : buttonType === "complete"
            ? "Completing..."
            : buttonType === "rejected"
            ? "Rejecting..."
            : buttonType === "failed"
            ? "Marking as Failed..."
            : "Skipping..."}
        </>
      );
    }
    return buttonType === "accept"
      ? "Accept"
      : buttonType === "start"
      ? "Started"
      : buttonType === "complete"
      ? "Completed"
      : buttonType === "rejected"
      ? "Rejected"
      : buttonType === "failed"
      ? "Failed"
      : "Skip";
  };

  const isButtonDisabled = (serviceProcessId) => {
    return processingId === serviceProcessId;
  };

  const shouldShowActionButton = (item, buttonType) => {
    switch (buttonType) {
      case "accept":
        return !item.processAccepted;
      case "start":
        return item.processAccepted && !item.processStarted;
      case "complete":
        return item.processStarted && !item.processCompleted;
      default:
        return false;
    }
  };

  const isProcessAccepted = (item) => {
    return item.processAccepted;
  };

  useEffect(() => {
    fetchPendingActivities();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="animate-fadeIn flex flex-col items-center gap-4 text-lg text-gray-700">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium">Loading your pending tasks...</p>
        <p className="text-sm text-gray-500">Preparing MOTOR, PUMP, and CONTROLLER processes</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="animate-fadeIn bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 m-4 max-w-2xl mx-auto shadow-sm">
      <div className="flex items-center gap-3 text-red-700 mb-4">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Unable to load processes</span>
      </div>
      <p className="text-red-600 mb-4">{error}</p>
      <button
        onClick={fetchPendingActivities}
        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-sm"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <>
      {/* User Item Stock Modal */}
      {showUserItemStock && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl font-semibold text-gray-800">Form Fill - {selectedProcess.itemName}</h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl transition-colors bg-gray-100 hover:bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center"
                onClick={handleCloseUserItemStock}
              >
                ×
              </button>
            </div>
            <div className="max-h-[calc(90vh-80px)] overflow-auto">
              <UserItemStock
                processData={selectedProcess}
                onClose={handleCloseUserItemStock}
              />
            </div>
          </div>
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-md animate-fadeIn shadow-2xl overflow-hidden">
            <div className={`flex justify-between items-center p-6 ${
              remarksData.status === "COMPLETED" ? "bg-gradient-to-r from-green-50 to-teal-50" :
              remarksData.status === "REJECTED" ? "bg-gradient-to-r from-red-50 to-orange-50" :
              remarksData.status === "FAILED" ? "bg-gradient-to-r from-orange-50 to-amber-50" :
              "bg-gradient-to-r from-yellow-50 to-amber-50"
            }`}>
              <h3 className="text-xl font-semibold text-gray-800">
                {remarksData.status === "COMPLETED"
                  ? "Complete Process"
                  : remarksData.status === "REJECTED"
                  ? "Reject Process"
                  : remarksData.status === "FAILED"
                  ? "Mark as Failed"
                  : "Skip Process"}{" "}
                - Remarks
              </h3>
              <button 
                className="text-gray-500 hover:text-gray-700 text-2xl transition-colors bg-white hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                onClick={handleCloseRemarksModal}
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {remarksData.status === "FAILED" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please select the failure reason: *
                  </label>
                  <select
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white shadow-sm"
                    value={remarksData.failureReason}
                    onChange={(e) => {
                      const selectedReason = e.target.value;
                      setRemarksData(prev => ({
                        ...prev,
                        failureReason: selectedReason,
                        remarks: prev.remarks || `${selectedReason} issue detected during testing`
                      }));
                    }}
                  >
                    <option value="">Select a failure reason</option>
                    {failureReasons.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                  {remarksData.failureReason && (
                    <div className="mt-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200">
                      Selected: <strong>{remarksData.failureReason}</strong>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {remarksData.status === "COMPLETED"
                    ? "Please enter completion remarks: *"
                    : remarksData.status === "REJECTED"
                    ? "Please enter rejection details: *"
                    : remarksData.status === "FAILED"
                    ? "Please enter failure details: *"
                    : "Please enter reason for skipping: *"}
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] bg-white shadow-sm transition-all"
                  value={remarksData.remarks}
                  onChange={(e) =>
                    setRemarksData((prev) => ({
                      ...prev,
                      remarks: e.target.value,
                    }))
                  }
                  placeholder={
                    remarksData.status === "COMPLETED"
                      ? "Enter completion remarks..."
                      : remarksData.status === "REJECTED"
                      ? "Enter rejection details..."
                      : remarksData.status === "FAILED"
                      ? "Enter failure details..."
                      : "Enter reason for skipping..."
                  }
                  rows="4"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-all shadow-sm"
                  onClick={handleCloseRemarksModal}
                  disabled={processingId === remarksData.serviceProcessId}
                >
                  Cancel
                </button>
                <button
                  className={`px-5 py-2.5 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm ${
                    remarksData.status === "COMPLETED"
                      ? "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                      : remarksData.status === "REJECTED"
                      ? "btn-decline"
                      : remarksData.status === "FAILED"
                      ? "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                      : "bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-gray-800"
                  }`}
                  onClick={handleRemarksSubmit}
                  disabled={
                    processingId === remarksData.serviceProcessId ||
                    !remarksData.remarks.trim() ||
                    (remarksData.status === "FAILED" && !remarksData.failureReason)
                  }
                >
                  {processingId === remarksData.serviceProcessId ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      {remarksData.status === "COMPLETED"
                        ? "Completing..."
                        : remarksData.status === "REJECTED"
                        ? "Rejecting..."
                        : remarksData.status === "FAILED"
                        ? "Marking as Failed..."
                        : "Skipping..."}
                    </>
                  ) : remarksData.status === "COMPLETED" ? (
                    "Complete"
                  ) : remarksData.status === "REJECTED" ? (
                    "Reject"
                  ) : remarksData.status === "FAILED" ? (
                    "Mark as Failed"
                  ) : (
                    "Skip"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 max-w-7xl mx-auto animate-fadeIn">

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8 shadow-sm">
          {/* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"> */}
            {/* <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <label htmlFor="product-filter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filter by Product:
                </label>
              </div>
              <select
                id="product-filter"
                className="block w-full lg:w-64 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
              >
                {productOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({productCounts[option.value]})
                  </option>
                ))}
              </select>
            </div> */}
            
            {/* <div className="flex items-center gap-3 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
              <span className="text-sm font-medium text-blue-700">Showing:</span>
              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                {filteredPendingList.length} of {pendingList.length} processes
              </span>
            </div>
          </div> */}

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
            {productOptions.map(option => (
              <button
                key={option.value}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm ${
                  productFilter === option.value
                    ? option.value === 'ALL' 
                      ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md'
                      : option.value === 'MOTOR'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : option.value === 'PUMP'
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                    : option.value === 'ALL'
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                    : option.value === 'MOTOR'
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-md'
                    : option.value === 'PUMP'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200 hover:shadow-md'
                }`}
                onClick={() => setProductFilter(option.value)}
              >
                {option.label} ({productCounts[option.value]})
              </button>
            ))}
          </div>
        </div>

        {filteredPendingList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {productFilter === 'ALL' ? 'No Pending Activities' : `No Pending ${productFilter} Activities`}
              </h3>
              <p className="text-gray-500 mb-6">
                {productFilter === 'ALL' 
                  ? "You're all caught up! There are no pending processes waiting for your action."
                  : `No pending ${productFilter.toLowerCase()} processes found. Try changing the filter.`
                }
              </p>
              <div className="flex justify-center gap-3">
                {productFilter !== 'ALL' && (
                  <button
                    onClick={() => setProductFilter('ALL')}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
                  >
                    Show All Products
                  </button>
                )}
                <button
                  onClick={fetchPendingActivities}
                  className="px-5 py-2.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all shadow-sm"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPendingList.map((item) => (
              <div 
                key={item.activityId} 
                className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Header with product badge */}
                <div className="relative p-5 pb-3 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 group-hover:text-gray-900 transition-colors line-clamp-2">
                      {item.itemName}
                    </h3>
                    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${getProductBadge(item.productName)} shadow-sm`}>
                      {item.productName}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex justify-between items-center">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      Stage: {item.processStage}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium">Serial</p>
                      <p className="text-sm font-semibold text-gray-800">{item.serialNumber}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 font-medium">Quantity</p>
                      <p className="text-sm font-semibold text-gray-800">{item.quantity}</p>
                    </div>
                  </div>

                  {shouldShowDisassembleForm(item) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs text-orange-600 font-medium">Disassemble Status</p>
                      <p className="text-sm font-semibold text-orange-700">{item.disassembleStatus}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                    <p className="text-xs text-blue-600 font-medium">Created</p>
                    <p className="text-sm font-semibold text-blue-700">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Button Group */}
                <div className="p-5 pt-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {isDisassembleWorkflow(item) ? (
                      <>
                        {shouldShowActionButton(item, "accept") && (
                          <button
                            aria-label={`Accept disassembly process for ${item.itemName}`}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                              processingId === item.serviceProcessId && actionType === "accept"
                                ? "btn-approve bg-brand-600"
                                : "btn-approve"
                            }`}
                            onClick={() => handleAccept(item.serviceProcessId)}
                            disabled={isButtonDisabled(item.serviceProcessId)}
                          >
                            {getButtonText("accept", item.serviceProcessId)}
                          </button>
                        )}

                        {item.processAccepted && !item.processStarted && (
                          <button
                            aria-label={`Start disassembly process for ${item.itemName}`}
                            className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                              processingId === item.serviceProcessId && actionType === "start"
                                ? "bg-gradient-to-r from-blue-600 to-blue-700"
                                : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                            }`}
                            onClick={() => handleStarted(item.serviceProcessId)}
                            disabled={isButtonDisabled(item.serviceProcessId)}
                          >
                            {getButtonText("start", item.serviceProcessId)}
                          </button>
                        )}

                        {item.processStarted && !item.processCompleted && (
                          <button
                            aria-label={`Fill disassembly form for ${item.itemName}`}
                            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 transition-all shadow-sm"
                            onClick={() => handleDisassembleForm(item)}
                          >
                            Fill Form
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {shouldShowActionButton(item, "accept") && (
                          <button
                            aria-label={`Accept process for ${item.itemName}`}
                            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                              processingId === item.serviceProcessId && actionType === "accept"
                                ? "btn-approve bg-brand-600"
                                : "btn-approve"
                            }`}
                            onClick={() => handleAccept(item.serviceProcessId)}
                            disabled={isButtonDisabled(item.serviceProcessId)}
                          >
                            {getButtonText("accept", item.serviceProcessId)}
                          </button>
                        )}

                        {isProcessAccepted(item) && (
                          <>
                            {shouldShowActionButton(item, "start") && (
                              <button
                                aria-label={`Start process for ${item.itemName}`}
                                className={`flex-1 px-4 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                  processingId === item.serviceProcessId && actionType === "start"
                                    ? "bg-gradient-to-r from-blue-600 to-blue-700"
                                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                }`}
                                onClick={() => handleStarted(item.serviceProcessId)}
                                disabled={isButtonDisabled(item.serviceProcessId)}
                              >
                                {getButtonText("start", item.serviceProcessId)}
                              </button>
                            )}

                            {isTestingProcess(item) && item.processStarted && !item.processCompleted && (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  aria-label={`Complete testing for ${item.itemName}`}
                                  className={`px-3 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                    processingId === item.serviceProcessId && actionType === "complete"
                                      ? "bg-gradient-to-r from-teal-600 to-teal-700"
                                      : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                  }`}
                                  onClick={() => handleTestingStatus(item.serviceProcessId, "COMPLETED")}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  {getButtonText("complete", item.serviceProcessId)}
                                </button>

                                <button
                                  aria-label={`Reject testing for ${item.itemName}`}
                                  className={`px-3 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                    processingId === item.serviceProcessId && actionType === "rejected"
                                      ? "bg-gradient-to-r from-red-600 to-red-700"
                                      : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                  }`}
                                  onClick={() => handleTestingStatus(item.serviceProcessId, "REJECTED")}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  {getButtonText("rejected", item.serviceProcessId)}
                                </button>

                                <button
                                  aria-label={`Mark testing as failed for ${item.itemName}`}
                                  className={`px-3 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                    processingId === item.serviceProcessId && actionType === "failed"
                                      ? "bg-gradient-to-r from-orange-600 to-orange-700"
                                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                                  }`}
                                  onClick={() => handleTestingStatus(item.serviceProcessId, "FAILED")}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  {getButtonText("failed", item.serviceProcessId)}
                                </button>

                                <button
                                  aria-label={`Open form for ${item.itemName}`}
                                  className="px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm"
                                  onClick={() => handleFormFill(item)}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  Form Fill
                                </button>
                              </div>
                            )}

                            {!isTestingProcess(item) && item.processStarted && !item.processCompleted && (
                              <div className="grid grid-cols-2 gap-2 w-full">
                                <button
                                  aria-label={`Complete process for ${item.itemName}`}
                                  className={`px-3 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm ${
                                    processingId === item.serviceProcessId && actionType === "complete"
                                      ? "bg-gradient-to-r from-teal-600 to-teal-700"
                                      : "bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                  }`}
                                  onClick={() => openRemarksModal(item.serviceProcessId, "COMPLETED")}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  {getButtonText("complete", item.serviceProcessId)}
                                </button>

                                <button
                                  aria-label={`Skip process for ${item.itemName}`}
                                  className="px-3 py-2.5 bg-gradient-to-r from-yellow-500 to-yellow-600 text-gray-800 rounded-xl text-sm font-medium hover:from-yellow-600 hover:to-yellow-700 disabled:opacity-50 transition-all shadow-sm"
                                  onClick={() => openRemarksModal(item.serviceProcessId, "SKIPPED")}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  Skip
                                </button>

                                <button
                                  aria-label={`Open form for ${item.itemName}`}
                                  className="col-span-2 px-3 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm"
                                  onClick={() => handleFormFill(item)}
                                  disabled={isButtonDisabled(item.serviceProcessId)}
                                >
                                  Form Fill
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">Progress</span>
                      <span className="text-xs font-medium text-gray-500">
                        {item.processCompleted ? 'Completed' : item.processStarted ? 'In Progress' : item.processAccepted ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className={`flex flex-col items-center ${item.processAccepted ? "text-green-600" : "text-blue-600"}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          item.processAccepted ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        }`}>
                          1
                        </div>
                        <span className="text-xs mt-1">Accepted</span>
                      </div>
                      <div className={`flex-1 h-1.5 mx-2 rounded-full ${
                        item.processAccepted ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-200"
                      }`}></div>
                      <div className={`flex flex-col items-center ${
                        item.processStarted ? "text-green-600" : item.processAccepted ? "text-blue-600" : "text-gray-400"
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          item.processStarted ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : 
                          item.processAccepted ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : "bg-gray-300"
                        }`}>
                          2
                        </div>
                        <span className="text-xs mt-1">Started</span>
                      </div>
                      <div className={`flex-1 h-1.5 mx-2 rounded-full ${
                        item.processStarted ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gray-200"
                      }`}></div>
                      <div className={`flex flex-col items-center ${
                        item.processCompleted ? "text-green-600" : item.processStarted ? "text-blue-600" : "text-gray-400"
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                          item.processCompleted ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : 
                          item.processStarted ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white" : "bg-gray-300"
                        }`}>
                          3
                        </div>
                        <span className="text-xs mt-1">{isDisassembleWorkflow(item) ? "Fill Form" : "Completed"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default PendingProcess;