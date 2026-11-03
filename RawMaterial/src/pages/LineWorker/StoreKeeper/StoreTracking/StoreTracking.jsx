import React, { useState, useEffect } from 'react';
import Api from '../../../../auth/Api';

const StoreTracking = () => {
  const [processData, setProcessData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedProcess, setExpandedProcess] = useState(null);
  
  const [filters, setFilters] = useState({
    filterType: 'Custom',
    startDate: '',
    endDate: '',
    status: '',
    itemType: '',
    product: ''
  });

  useEffect(() => {
    fetchProcessData();
    fetchItemTypes();
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [processData, filters]);

  const fetchProcessData = async () => {
    try {
      setLoading(true);
      const response = await Api.get(`/store-keeper/showProcessData`);
      setProcessData(response?.data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch process data');
      console.error('Error fetching process data:', err?.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const response = await Api.get(`/common/getItemType`);
      setItemTypes(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching item types:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await Api.get(`/common/getProduct`);
      setProducts(response?.data?.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    let filtered = [...processData];

    // Apply filters based on filterType
    switch (filters.filterType) {
      case 'Custom':
        if (filters.startDate) {
          filtered = filtered.filter(process => 
            new Date(process.createdAt) >= new Date(filters.startDate)
          );
        }
        if (filters.endDate) {
          filtered = filtered.filter(process => 
            new Date(process.createdAt) <= new Date(filters.endDate + 'T23:59:59')
          );
        }
        break;

      case 'Today':
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
        
        filtered = filtered.filter(process => {
          const processDate = new Date(process.createdAt);
          return processDate >= todayStart && processDate <= todayEnd;
        });
        break;

      case 'Week':
        const now = new Date();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6, 23, 59, 59);
        
        filtered = filtered.filter(process => {
          const processDate = new Date(process.createdAt);
          return processDate >= weekStart && processDate <= weekEnd;
        });
        break;

      case 'Month':
        const current = new Date();
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59);
        
        filtered = filtered.filter(process => {
          const processDate = new Date(process.createdAt);
          return processDate >= monthStart && processDate <= monthEnd;
        });
        break;

      case 'Year':
        const currentYear = new Date();
        const yearStart = new Date(currentYear.getFullYear(), 0, 1);
        const yearEnd = new Date(currentYear.getFullYear(), 11, 31, 23, 59, 59);
        
        filtered = filtered.filter(process => {
          const processDate = new Date(process.createdAt);
          return processDate >= yearStart && processDate <= yearEnd;
        });
        break;

      case 'Status':
        if (filters.status) {
          filtered = filtered.filter(process => 
            process.processStatus === filters.status
          );
        }
        break;

      case 'ItemType':
        if (filters.itemType) {
          filtered = filtered.filter(process => 
            process.itemType === filters.itemType
          );
        }
        break;

      case 'Product':
        if (filters.product) {
          filtered = filtered.filter(process => 
            process.productName === filters.product
          );
        }
        break;

      default:
        break;
    }

    // Apply additional filters for all filter types
    if (filters.itemType && filters.filterType !== 'ItemType') {
      filtered = filtered.filter(process => 
        process.itemType === filters.itemType
      );
    }

    if (filters.product && filters.filterType !== 'Product') {
      filtered = filtered.filter(process => 
        process.productName === filters.product
      );
    }

    setFilteredData(filtered);
  };

  const resetFilters = () => {
    setFilters({
      filterType: 'Custom',
      startDate: '',
      endDate: '',
      status: '',
      itemType: '',
      product: ''
    });
  };

  const toggleProcessDetails = (serviceProcessId) => {
    setExpandedProcess(expandedProcess === serviceProcessId ? null : serviceProcessId);
  };

  const getStatusBadgeClass = (status) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border";
    
    switch (status) {
      case 'COMPLETED':
        return `${baseClasses} bg-green-100 text-green-800 border-green-200`;
      case 'IN_PROGRESS':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-200`;
      case 'PENDING':
        return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`;
      case 'FAILED':
        return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
      case 'REJECTED':
        return `${baseClasses} bg-red-100 text-red-800 border-red-200`;
      case 'SKIPPED':
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
      case 'REDIRECTED':
        return `${baseClasses} bg-purple-100 text-purple-800 border-purple-200`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-200`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStageProgress = (stageActivities) => {
    if (!stageActivities || stageActivities.length === 0) return 0;
    
    const completedStages = stageActivities.filter(activity => 
      activity.activityStatus && ['COMPLETED', 'SKIPPED'].includes(activity.activityStatus)
    ).length;
    
    const progress = Math.round((completedStages / stageActivities.length) * 100);
    return isNaN(progress) ? 0 : progress;
  };

  const getTimelineMarkerClass = (status) => {
    const baseClasses = "w-4 h-4 rounded-full border-2 border-white shadow-sm";
    
    switch (status?.toLowerCase()) {
      case 'completed':
        return `${baseClasses} bg-green-500 shadow-green-500/50`;
      case 'in_progress':
        return `${baseClasses} bg-blue-500 shadow-blue-500/50`;
      case 'pending':
        return `${baseClasses} bg-yellow-500 shadow-yellow-500/50`;
      case 'failed':
      case 'rejected':
        return `${baseClasses} bg-red-500 shadow-red-500/50`;
      case 'skipped':
        return `${baseClasses} bg-gray-500 shadow-gray-500/50`;
      case 'redirected':
        return `${baseClasses} bg-purple-500 shadow-purple-500/50`;
      default:
        return `${baseClasses} bg-gray-400 shadow-gray-400/50`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading process data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button 
            onClick={fetchProcessData} 
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Filters</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <label htmlFor="filterType" className="block text-sm font-medium text-gray-700 mb-2">
                Filter Type
              </label>
              <select 
                id="filterType"
                value={filters.filterType}
                onChange={(e) => handleFilterChange('filterType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="Custom">Custom Date Range</option>
                <option value="Today">Today</option>
                <option value="Week">This Week</option>
                <option value="Month">This Month</option>
                <option value="Year">This Year</option>
                <option value="Status">Status</option>
                <option value="ItemType">Item Type</option>
                <option value="Product">Product</option>
              </select>
            </div>

            {/* Date filters for Custom */}
            {filters.filterType === 'Custom' && (
              <>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Status filter */}
            {filters.filterType === 'Status' && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REDIRECTED">REDIRECTED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            )}

            {/* Item Type filter for ItemType mode */}
            {filters.filterType === 'ItemType' && (
              <div>
                <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type
                </label>
                <select
                  id="itemType"
                  value={filters.itemType}
                  onChange={(e) => handleFilterChange('itemType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Item Types</option>
                  {itemTypes.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Product filter for Product mode */}
            {filters.filterType === 'Product' && (
              <div>
                <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-2">
                  Product
                </label>
                <select
                  id="product"
                  value={filters.product}
                  onChange={(e) => handleFilterChange('product', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Products</option>
                  {products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Additional Item Type filter for other modes */}
            {filters.filterType !== 'ItemType' && (
              <div>
                <label htmlFor="itemType" className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type (Additional)
                </label>
                <select
                  id="itemType"
                  value={filters.itemType}
                  onChange={(e) => handleFilterChange('itemType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Item Types</option>
                  {itemTypes.map(type => (
                    <option key={type.id} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-200">
            <button 
              onClick={resetFilters} 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset Filters
            </button>
            <span className="text-sm text-gray-600 font-medium">
              Showing {filteredData.length} of {processData.length} processes
            </span>
          </div>
        </div>

        {/* Process List */}
        <div className="space-y-6">
          {filteredData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-gray-500 text-lg">No process data found matching your filters</div>
            </div>
          ) : (
            filteredData.map((process) => {
              const progressPercentage = getStageProgress(process.stageActivities);
              
              return (
                <div key={process.serviceProcessId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">
                  {/* Process Summary */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleProcessDetails(process.serviceProcessId)}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {process.productName} - {process.itemName}
                            </h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="font-medium">Serial: {process.serialNumber}</p>
                              <p>Sub Item: {process.subItemName}</p>
                              <p>Type: {process.itemType}</p>
                              <p>Quantity: {process.quantity}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-start lg:items-end gap-3 min-w-[200px]">
                            <span className={getStatusBadgeClass(process.processStatus)}>
                              {process.processStatus?.replace('_', ' ') || 'N/A'}
                            </span>
                            <p className="text-sm text-gray-600">Current Stage: {process.currentStage}</p>
                            <p className="text-xs text-gray-500">
                              Created: {formatDate(process.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-gray-500 px-2">
                        {expandedProcess === process.serviceProcessId ? '▼' : '►'}
                      </div>
                    </div>
                  </div>

                  {/* Process Details */}
                  {expandedProcess === process.serviceProcessId && (
                    <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50 animate-slideDown">
                      <h4 className="text-lg font-semibold text-gray-900 my-6">Stage Activities</h4>
                      
                      <div className="relative pl-8">
                        {process.stageActivities?.map((activity, index) => (
                          <div key={activity.activityId || index} className="flex mb-6 last:mb-0">
                            {/* Timeline */}
                            <div className="flex flex-col items-center mr-4">
                              <div className={getTimelineMarkerClass(activity.activityStatus)}></div>
                              {index < (process.stageActivities?.length || 0) - 1 && (
                                <div className="w-0.5 bg-gray-300 flex-1 my-1"></div>
                              )}
                            </div>
                            
                            {/* Activity Content */}
                            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                                <h5 className="text-md font-semibold text-gray-900 flex-1">
                                  {activity.stageName}
                                </h5>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={getStatusBadgeClass(activity.activityStatus)}>
                                    {activity.activityStatus}
                                  </span>
                                  {activity.isCurrent && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                {/* Activity Times */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                                  <div className="text-gray-600">
                                    <strong className="text-gray-700">Accepted:</strong> {formatDate(activity.acceptedAt)}
                                  </div>
                                  <div className="text-gray-600">
                                    <strong className="text-gray-700">Started:</strong> {formatDate(activity.startedAt)}
                                  </div>
                                  <div className="text-gray-600">
                                    <strong className="text-gray-700">Completed:</strong> {formatDate(activity.completedAt)}
                                  </div>
                                </div>
                                
                                {/* Remarks */}
                                {activity.remarks && (
                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                    <strong className="text-gray-700 text-sm">Remarks:</strong>
                                    <p className="text-sm text-gray-600 mt-1">{activity.remarks}</p>
                                  </div>
                                )}
                                
                                {/* Failure Reason */}
                                {activity.failureReason && (
                                  <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded">
                                    <strong className="text-gray-700 text-sm">Failure Reason:</strong>
                                    <p className="text-sm text-gray-600 mt-1">{activity.failureReason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreTracking;