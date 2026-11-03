import React, { useState, useEffect, useMemo } from 'react';
import Api from '../../auth/Api';

const VendorAllDetails = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await Api.get(`/common/vendors/order`);
        setVendors(response?.data?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to load vendors');
      } finally {
        setLoading(false);
      }
    };
  
    fetchVendors();
  }, []);

  // Filter vendors based on search term (case‑insensitive)
  const filteredVendors = useMemo(() => {
    if (!searchTerm.trim()) return vendors;
    const lowerTerm = searchTerm.toLowerCase();
    return vendors.filter(vendor =>
      vendor.vendorName?.toLowerCase().includes(lowerTerm) ||
      vendor.contactPerson?.toLowerCase().includes(lowerTerm)
    );
  }, [vendors, searchTerm]);

  // Helper to format numbers consistently
  const formatQty = (value) => {
    if (value === null || value === undefined) return '0';
    return Number(value).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading vendor orders...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header with title and search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <div className="w-full md:w-72">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendor or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
          </div>
        </div>
      </div>

      {/* No results message */}
      {filteredVendors.length === 0 && (
        <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-lg">No vendors match your search.</p>
        </div>
      )}

      {/* Vendor cards */}
      {filteredVendors.map((vendor) => {
        const totalOrdered = vendor.items?.reduce((sum, item) => sum + (item.orderedQty || 0), 0) || 0;
        const totalReceived = vendor.items?.reduce((sum, item) => sum + (item.receivedQty || 0), 0) || 0;
        const totalPending = vendor.items?.reduce((sum, item) => sum + (item.pendingQty || 0), 0) || 0;

        return (
          <div
            key={vendor.vendorId}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Vendor Header */}
            <div className="p-4 md:p-5 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">{vendor.vendorName}</h2>
                <div className="text-sm text-gray-600 mt-1 space-x-2">
                  <span>👤 {vendor.contactPerson || 'N/A'}</span>
                  <span>📞 {vendor.contactNumber || 'N/A'}</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                  Ordered: {formatQty(totalOrdered)}
                </span>
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-200">
                  Received: {formatQty(totalReceived)}
                </span>
                <span className={`px-3 py-1 rounded-full border ${
                  totalPending > 0
                    ? 'bg-orange-50 text-orange-700 border-orange-200'
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  Pending: {formatQty(totalPending)}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              {vendor.items && vendor.items.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Item Name
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Unit
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Ordered Qty
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Received Qty
                      </th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Pending Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {vendor.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-800">{item.itemName || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.unit || '—'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-gray-700">
                          {formatQty(item.orderedQty)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono text-gray-700">
                          {formatQty(item.receivedQty)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium">
                          <span
                            className={
                              item.pendingQty > 0
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }
                          >
                            {formatQty(item.pendingQty)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-gray-500 italic">
                  No items for this vendor.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 text-right">
              Total items: {vendor.items?.length || 0}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VendorAllDetails;