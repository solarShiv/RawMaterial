import React, { useState, useEffect } from 'react';
import Api from '../../../auth/Api';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const AdminDashboard = () => {
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [actionType, setActionType] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [notification, setNotification] = useState(null);
  const [bulkSelect, setBulkSelect] = useState(false);
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // PDF Viewer states
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState('');
  const [pdfNumPages, setPdfNumPages] = useState(null);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(null);

  // Available search fields
  // const searchFields = [
  //   { value: 'all', label: 'All Fields' },
  //   { value: 'poNumber', label: 'PO Number' },
  //   { value: 'companyName', label: 'Company' },
  //   { value: 'vendorName', label: 'Vendor' },
  //   { value: 'paymentRequestedBy', label: 'Requested By' },
  //   { value: 'status', label: 'Status' }
  // ];

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filter payment requests when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRequests(paymentRequests);
      setCurrentPage(1);
      return;
    }

    const filtered = paymentRequests.filter(request => {
      const term = searchTerm.toLowerCase();
      
      if (searchField === 'all') {
        return (
          request.poNumber?.toLowerCase().includes(term) ||
          request.companyName?.toLowerCase().includes(term) ||
          request.vendorName?.toLowerCase().includes(term) ||
          request.paymentRequestedBy?.toLowerCase().includes(term) ||
          request.status?.toLowerCase().includes(term)
        );
      }
      
      return request[searchField]?.toString().toLowerCase().includes(term);
    });

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, searchField, paymentRequests]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const response = await Api.get('/admin/showPaymentRequests');
      
      if (response.data.success) {
        setPaymentRequests(response.data.data);
        setFilteredRequests(response.data.data);
        // Clear selection when data is refreshed
        setSelectedRequests([]);
        setBulkSelect(false);
      } else {
        setError('Failed to fetch payment requests');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Error fetching payment requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSingleActionClick = (request, action) => {
    setSelectedRequests([request]);
    setActionType(action);
    setRemarks('');
    setShowModal(true);
  };

  const handleBulkActionClick = (action) => {
    if (selectedRequests.length === 0) {
      setNotification({
        type: 'warning',
        message: 'Please select at least one payment request to perform bulk action'
      });
      return;
    }
    
    setActionType(action);
    setRemarks('');
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    if (selectedRequests.length === 0 || !actionType) return;

    try {
      setUpdateLoading(true);
      
      const updateData = {
        paymentRequestIds: selectedRequests.map(req => req.paymentRequestId),
        status: actionType === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        remarks: remarks || (actionType === 'APPROVE' ? 'Payment Approved' : 'Payment Rejected')
      };

      const response = await Api.patch(
        '/admin/updateApprovalStatus',
        updateData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setNotification({
          type: 'success',
          message: response.data.message || `Successfully ${actionType === 'APPROVE' ? 'approved' : 'rejected'} ${selectedRequests.length} payment request(s)! Refreshing data...`
        });

        // Set refreshing state
        setRefreshing(true);
        
        // Close modal first
        setShowModal(false);
        setSelectedRequests([]);
        setActionType(null);
        setRemarks('');
        setBulkSelect(false);
        
        // Refresh data after a short delay
        setTimeout(() => {
          fetchPaymentRequests().finally(() => {
            setRefreshing(false);
          });
        }, 500);
        
      } else {
        throw new Error(response.data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      
      setNotification({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Failed to update payment status'
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleSelectAllOnCurrentPage = () => {
    const allIdsOnPage = currentItems.map(item => item.paymentRequestId);
    const allSelectedOnPage = currentItems.every(item => 
      selectedRequests.some(selected => selected.paymentRequestId === item.paymentRequestId)
    );
    
    if (allSelectedOnPage) {
      // Deselect all on current page
      setSelectedRequests(prev => prev.filter(
        item => !allIdsOnPage.includes(item.paymentRequestId)
      ));
    } else {
      // Select all on current page
      const newSelections = currentItems.filter(
        item => !selectedRequests.some(selected => selected.paymentRequestId === item.paymentRequestId)
      );
      setSelectedRequests(prev => [...prev, ...newSelections]);
    }
  };

  const handleSelectItem = (request) => {
    const isSelected = selectedRequests.some(
      selected => selected.paymentRequestId === request.paymentRequestId
    );
    
    if (isSelected) {
      setSelectedRequests(prev => prev.filter(
        item => item.paymentRequestId !== request.paymentRequestId
      ));
    } else {
      setSelectedRequests(prev => [...prev, request]);
    }
  };

  const isItemSelected = (paymentRequestId) => {
    return selectedRequests.some(
      item => item.paymentRequestId === paymentRequestId
    );
  };

  // PDF Viewer Functions
  const handleViewPdf = (invoiceUrl) => {
   
    const baseUrl = import.meta.env.VITE_API_URL;
    const fullUrl = invoiceUrl.includes(baseUrl) ? invoiceUrl : baseUrl+invoiceUrl;
    console.log("full URL", fullUrl);
    
    setSelectedPdfUrl(fullUrl);
    setShowPdfModal(true);
    setPdfPageNumber(1);
    setPdfNumPages(null);
    setPdfLoading(true);
    setPdfError(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setPdfNumPages(numPages);
    setPdfLoading(false);
    setPdfError(null);
  };

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error);
    setPdfError('Failed to load PDF. Please try again.');
    setPdfLoading(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }
      
      if (start > 2) {
        pageNumbers.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }
      
      if (end < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Always show last page
      pageNumbers.push(totalPages);
    }
    
    return pageNumbers;
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === '...') return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle items per page change
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchField('all');
  };

  // Clear all selections
  const clearAllSelections = () => {
    setSelectedRequests([]);
    setBulkSelect(false);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        {/* Search skeleton */}
        <div className="bg-white rounded-lg shadow p-3 mb-4 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
          
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full overflow-x-hidden bg-gray-50 min-h-screen">
      {/* Global refreshing overlay */}
      {refreshing && (
        <div className="fixed inset-0 bg-gray-200 bg-opacity-75 z-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center max-w-[90%]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 text-center">Updating data...</p>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : notification.type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded shadow-lg transition-opacity duration-300`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : notification.type === 'warning' ? (
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span className="text-sm">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && selectedRequests.length > 0 && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm {actionType === 'APPROVE' ? 'Approval' : 'Rejection'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequests([]);
                    setActionType(null);
                    setRemarks('');
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  You are about to {actionType === 'APPROVE' ? 'approve' : 'reject'} {selectedRequests.length} payment request{selectedRequests.length > 1 ? 's' : ''}.
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Selected Items:</h4>
                  <ul className="space-y-2">
                    {selectedRequests.slice(0, 5).map((request, index) => (
                      <li key={request.paymentRequestId} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{request.poNumber}</p>
                          <p className="text-xs text-gray-500 truncate">{request.vendorName}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 ml-2">
                          {formatCurrency(request.requestedAmount, request.currency)}
                        </span>
                      </li>
                    ))}
                    {selectedRequests.length > 5 && (
                      <li className="text-center text-gray-500 text-sm py-2">
                        ...and {selectedRequests.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRequests([]);
                    setActionType(null);
                    setRemarks('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updateLoading}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
                    actionType === 'APPROVE'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  } ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {updateLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    `Confirm ${actionType === 'APPROVE' ? 'Approval' : 'Rejection'}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  Invoice Preview
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {selectedPdfUrl.split('/').pop()}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {pdfNumPages && pdfNumPages > 1 && (
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-md">
                    <button
                      onClick={() => setPdfPageNumber(prev => Math.max(prev - 1, 1))}
                      disabled={pdfPageNumber <= 1}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm font-medium">
                      Page {pdfPageNumber} of {pdfNumPages}
                    </span>
                    <button
                      onClick={() => setPdfPageNumber(prev => Math.min(prev + 1, pdfNumPages))}
                      disabled={pdfPageNumber >= pdfNumPages}
                      className="text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => window.open(selectedPdfUrl, '_blank')}
                    className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </button>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedPdfUrl;
                      link.download = selectedPdfUrl.split('/').pop() || 'invoice.pdf';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                  <button
                    onClick={() => {
                      setShowPdfModal(false);
                      setSelectedPdfUrl('');
                      setPdfNumPages(null);
                      setPdfPageNumber(1);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Body - PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {pdfLoading && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF document...</p>
                  </div>
                </div>
              )}
              
              {pdfError && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="mx-auto w-12 h-12 text-red-500 mb-4">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-700 mb-4">{pdfError}</p>
                    <button
                      onClick={() => window.open(selectedPdfUrl, '_blank')}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                    >
                      Open PDF in New Tab
                    </button>
                  </div>
                </div>
              )}
              
              {!pdfError && selectedPdfUrl && (
                <div className="h-full overflow-auto p-4 flex justify-center">
                  <Document
                    file={selectedPdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    }
                  >
                    <Page 
                      pageNumber={pdfPageNumber} 
                      className="shadow-lg"
                      renderAnnotationLayer={false}
                      renderTextLayer={false}
                      width={Math.min(800, window.innerWidth - 100)}
                    />
                  </Document>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Selection Summary Bar */}
      {selectedRequests.length > 0 && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedRequests.length} payment request{selectedRequests.length > 1 ? 's' : ''} selected
                </h3>
                <p className="text-sm text-gray-600">
                  Total amount: {formatCurrency(
                    selectedRequests.reduce((sum, req) => sum + req.requestedAmount, 0),
                    selectedRequests[0]?.currency || 'USD'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={clearAllSelections}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={() => handleBulkActionClick('APPROVE')}
                className="px-4 py-2 text-sm font-medium btn-approve rounded-lg transition-colors flex items-center"
                disabled={updateLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve All
              </button>
              <button
                onClick={() => handleBulkActionClick('REJECT')}
                className="px-4 py-2 text-sm font-medium btn-decline rounded-lg transition-colors flex items-center"
                disabled={updateLoading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Reject All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search payment requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>
          
          {/* <div className="flex items-center space-x-3">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {searchFields.map((field) => (
                <option key={field.value} value={field.value}>
                  {field.label}
                </option>
              ))}
            </select>
            
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div> */}
        </div>
        
        <div className="mt-4 flex flex-wrap items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{filteredRequests.length}</span> request(s) found
            {searchTerm && (
              <span className="ml-2">
                (filtered from {paymentRequests.length})
              </span>
            )}
          </div>
          
          <button
            onClick={fetchPaymentRequests}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content */}
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="mx-auto w-12 h-12 text-red-500 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchPaymentRequests}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900">Payment Requests</h2>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={currentItems.length > 0 && currentItems.every(item => 
                      selectedRequests.some(selected => selected.paymentRequestId === item.paymentRequestId)
                    )}
                    onChange={handleSelectAllOnCurrentPage}
                  />
                  <span className="text-sm text-gray-600">Select Page</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600">per page</span>
              </div>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredRequests.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRequests.length)} of {filteredRequests.length} entries
              {selectedRequests.length > 0 && (
                <span className="ml-2 text-blue-600 font-medium">
                  • {selectedRequests.length} selected
                </span>
              )}
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden">
            {currentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No results match your search criteria' : 'There are no payment requests pending approval'}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {currentItems.map((request) => (
                  <div key={request.paymentRequestId} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={isItemSelected(request.paymentRequestId)}
                          onChange={() => handleSelectItem(request)}
                        />
                        <div>
                          <div className="font-semibold text-gray-900">
                            {request.poNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.companyName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(request.requestedAmount, request.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(request.createdAt).split(',')[0]}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Vendor</div>
                        <div className="text-sm font-medium">{request.vendorName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Requested By</div>
                        <div className="text-sm font-medium">{request.paymentRequestedBy}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Type</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.billpaymentType === 'Advance_Payment' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {request.billpaymentType.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Invoices</div>
                        <div className="flex flex-wrap gap-1">
                          {request.invoices && request.invoices.length > 0 ? (
                            request.invoices.map((invoice, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleViewPdf(invoice.invoiceUrl)}
                                className="px-2 py-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                View PDF
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500 italic">No invoice</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleSingleActionClick(request, 'APPROVE')}
                        disabled={updateLoading || request.status === 'APPROVED'}
                        className={`
                          flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center
                          ${request.status === 'APPROVED' 
                            ? 'btn-approve opacity-60' 
                            : 'btn-approve'
                          }
                          ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {request.status === 'APPROVED' ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Approved
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>
                      
                      <button 
                        onClick={() => handleSingleActionClick(request, 'REJECT')}
                        disabled={updateLoading || request.status === 'REJECTED'}
                        className={`
                          flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center
                          ${request.status === 'REJECTED' 
                            ? 'btn-decline opacity-60' 
                            : 'btn-decline'
                          }
                          ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {request.status === 'REJECTED' ? (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Rejected
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={currentItems.length > 0 && currentItems.every(item => 
                        selectedRequests.some(selected => selected.paymentRequestId === item.paymentRequestId)
                      )}
                      onChange={handleSelectAllOnCurrentPage}
                    />
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested By
                  </th> */}
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((request) => (
                  <tr key={request.paymentRequestId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={isItemSelected(request.paymentRequestId)}
                        onChange={() => handleSelectItem(request)}
                      />
                    </td>
                    
                    {/* <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {request.poNumber}
                      </div>
                    </td> */}
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.companyName}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.vendorName}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(request.requestedAmount, request.currency)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        request.billpaymentType === 'Advance_Payment' 
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {request.billpaymentType.replace('_', ' ')}
                      </span>
                    </td>
                   
                    {/* <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {request.paymentRequestedBy}
                      </div>
                    </td> */}
                    
                    {/* <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {formatDate(request.createdAt).split(',')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(request.createdAt).split(',')[1]}
                      </div>
                    </td> */}
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-2">
                        {request.invoices && request.invoices.length > 0 ? (
                          request.invoices.map((invoice, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleViewPdf(invoice.invoiceUrl)}
                              className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {idx+1}
                            </button>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500 italic">No invoice</span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleSingleActionClick(request, 'APPROVE')}
                          disabled={updateLoading || request.status === 'APPROVED'}
                          className={`
                            px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center
                            ${request.status === 'APPROVED' 
                              ? 'btn-approve opacity-60' 
                              : 'btn-approve'
                            }
                            ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {request.status === 'APPROVED' ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </>
                          )}
                        </button>
                        
                        <button 
                          onClick={() => handleSingleActionClick(request, 'REJECT')}
                          disabled={updateLoading || request.status === 'REJECTED'}
                          className={`
                            px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center
                            ${request.status === 'REJECTED' 
                              ? 'btn-decline opacity-60' 
                              : 'btn-decline'
                            }
                            ${updateLoading ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                        >
                          {request.status === 'REJECTED' ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {currentItems.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 text-gray-300 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payment requests found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? 'No results match your search criteria' : 'There are no payment requests pending approval'}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span> •{' '}
                  <span className="font-medium">{filteredRequests.length}</span> total items
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {getPageNumbers().map((number, index) => (
                      <button
                        key={index}
                        onClick={() => handlePageChange(number)}
                        disabled={number === '...'}
                        className={`w-10 h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          number === '...'
                            ? 'text-gray-500 cursor-default'
                            : currentPage === number
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {number}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;