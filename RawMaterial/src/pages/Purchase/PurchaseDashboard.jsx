import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";

const PurchaseDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    poStats: { total: 0, yearly: 0, monthly: 0, weekly: 0, today: 0 },
    spendStats: { total: 0, yearly: 0, monthly: 0, weekly: 0, today: 0 }
  });

  const [paymentsData, setPaymentsData] = useState({
    totalFinancialYear: "0",
    today: "0",
    week: "0",
    month: "0",
    year: "0",
    companyWise: [],
    vendorWise: []
  });

  const [unsettledPayments, setUnsettledPayments] = useState([]);
  const [filteredUnsettledPayments, setFilteredUnsettledPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("monthly");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Unsettled Payments Filters
  const [unsettledSearchTerm, setUnsettledSearchTerm] = useState("");
  const [selectedUnsettledVendor, setSelectedUnsettledVendor] = useState("");
  const [unsettledDateFrom, setUnsettledDateFrom] = useState("");
  const [unsettledDateTo, setUnsettledDateTo] = useState("");
  const [loadingUnsettled, setLoadingUnsettled] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both APIs in parallel
      const [purchaseRes, paymentsRes] = await Promise.all([
        Api.get("/purchase/dashboard"),
        Api.get("/common/payments/dashboard")
      ]);

      setDashboardData(purchaseRes?.data?.data);

      if (paymentsRes?.data?.success) {
        setPaymentsData(paymentsRes.data.data);
      } else if (paymentsRes?.success) {
        setPaymentsData(paymentsRes.data);
      } else {
        console.log("Payments API returned unsuccessful response", paymentsRes);
      }

      // Fetch unsettled payments
      await fetchUnsettledPayments();

    } catch (err) {
      setError("Failed to fetch dashboard data");
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnsettledPayments = async () => {
    try {
      setLoadingUnsettled(true);
      const response = await Api.get("/common/payments/advance/unsettled");
      
      if (response.data?.success) {
        setUnsettledPayments(response.data.data);
        setFilteredUnsettledPayments(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching unsettled payments:", err);
    } finally {
      setLoadingUnsettled(false);
    }
  };

  // Filter unsettled payments
  useEffect(() => {
    let filtered = [...unsettledPayments];
    
    if (unsettledSearchTerm) {
      const searchLower = unsettledSearchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.poNumber?.toLowerCase().includes(searchLower) ||
        p.vendorName?.toLowerCase().includes(searchLower)
      );
    }
    
    if (selectedUnsettledVendor) {
      filtered = filtered.filter(p => p.vendorId === selectedUnsettledVendor);
    }
    
    if (unsettledDateFrom) {
      filtered = filtered.filter(p => new Date(p.paymentDate) >= new Date(unsettledDateFrom));
    }
    
    if (unsettledDateTo) {
      filtered = filtered.filter(p => new Date(p.paymentDate) <= new Date(unsettledDateTo));
    }
    
    setFilteredUnsettledPayments(filtered);
  }, [unsettledSearchTerm, selectedUnsettledVendor, unsettledDateFrom, unsettledDateTo, unsettledPayments]);

  // Get unique vendors for unsettled payments filter
  const uniqueUnsettledVendors = [...new Map(unsettledPayments.map(p => [p.vendorId, p.vendorName])).entries()]
    .map(([id, name]) => ({ id, name }));

  // Calculate unsettled payments totals
  const totalUnsettledAmount = filteredUnsettledPayments.reduce((sum, p) => sum + (p.advanceAmount || 0), 0);
  const uniqueUnsettledVendorsCount = new Set(filteredUnsettledPayments.map(p => p.vendorId)).size;

  const formatCurrency = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return "₹0";

    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(2)} L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatCurrencyFull = (amount) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return "₹0";

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const formatNumberFull = (num) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeRangeLabel = {
    today: "Today",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
    total: "Total"
  };

  const paymentsTimeRangeMap = {
    today: "today",
    weekly: "week",
    monthly: "month",
    yearly: "year",
    total: "totalFinancialYear"
  };

  const getPaymentsAmount = (range) => {
    const key = paymentsTimeRangeMap[range];
    const amount = paymentsData[key] || "0";
    return typeof amount === 'string' ? parseFloat(amount) : amount;
  };

  const calculatePercentage = (current, total) => {
    if (total === 0) return 0;
    return Math.round((current / total) * 100);
  };

  // Export unsettled payments to CSV
  const exportUnsettledPaymentsToCSV = () => {
    try {
      const headers = ["PO Number", "PO Date", "Vendor Name", "Currency", "Advance Amount", "Payment Date"];
      const rows = filteredUnsettledPayments.map(p => [
        p.poNumber,
        formatDateTime(p.poDate),
        p.vendorName,
        p.currency,
        p.advanceAmount,
        formatDateTime(p.paymentDate)
      ]);

      let csvContent = headers.join(",") + "\n";
      rows.forEach(row => {
        const escapedRow = row.map(cell => `"${String(cell).replace(/"/g, '""')}"`);
        csvContent += escapedRow.join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute("download", `unsettled_advances_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting unsettled payments:", err);
      alert("Failed to export unsettled payments data.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-base font-medium text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-50 gap-3 p-4">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-3">⚠️</div>
          <p className="text-red-600 text-base font-medium mb-1">{error}</p>
          <p className="text-sm text-gray-600 mb-3">Please try again</p>
          <button
            onClick={fetchAllData}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-md font-medium text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { poStats, spendStats } = dashboardData;
  const currentPaymentsAmount = getPaymentsAmount(timeRange);
  const totalPaymentsAmount = getPaymentsAmount("total");

  const topCompanies = [...(paymentsData.companyWise || [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);
  const topVendors = [...(paymentsData.vendorWise || [])]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-5 w-full max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            onClick={fetchAllData}
            className="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            <span className="text-xs">↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "overview"
            ? "border-b-2 border-yellow-500 text-yellow-700"
            : "text-gray-600 hover:text-gray-900"}`}
        >
          PO Overview
        </button>
        <button
          onClick={() => setActiveTab("payments")}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap ${activeTab === "payments"
            ? "border-b-2 border-yellow-500 text-yellow-700"
            : "text-gray-600 hover:text-gray-900"}`}
        >
          Advance Payments Overview
        </button>
        <button
          onClick={() => setActiveTab("unsettled")}
          className={`px-3 py-2 text-sm font-medium whitespace-nowrap flex items-center gap-1 ${activeTab === "unsettled"
            ? "border-b-2 border-yellow-500 text-yellow-700"
            : "text-gray-600 hover:text-gray-900"}`}
        >
          ADVANCE PAYMENT - ITEMS UNSETTLED
          {unsettledPayments.length > 0 && (
            <span className="ml-1 bg-yellow-100 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full">
              {unsettledPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* Time Range Filter - Only for Overview and Payments tabs */}
      {(activeTab === "overview" || activeTab === "payments") && (
        <div className="mb-4 md:mb-6">
          <div className="flex flex-wrap gap-1 md:gap-2">
            {["today", "weekly", "monthly", "yearly", "total"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2 md:px-3 py-1.5 rounded text-xs md:text-sm font-medium transition-all ${timeRange === range
                  ? "bg-yellow-500 text-white shadow-sm"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
              >
                {timeRangeLabel[range]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Overview Section */}
      {activeTab === "overview" && (
        <div className="space-y-4 md:space-y-6">
          {/* Key Metrics - Responsive grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* PO Count Card */}
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="text-lg bg-yellow-50 p-1.5 rounded">📊</div>
                <span className="text-xs font-medium text-gray-500">
                  {timeRangeLabel[timeRange]}
                </span>
              </div>
              <h3 className="font-medium text-gray-600 text-xs mb-1">Purchase Orders</h3>
              <div className="mb-2">
                <p className="text-lg md:text-xl font-bold text-gray-900 truncate" title={formatNumberFull(poStats[timeRange])}>
                  {formatNumber(poStats[timeRange])}
                </p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(poStats[timeRange], poStats.total)}% of total
                </p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, calculatePercentage(poStats[timeRange], poStats.total))}%` }}
                ></div>
              </div>
            </div>

            {/* PO Spend Card */}
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="text-lg bg-green-50 p-1.5 rounded">💰</div>
                <span className="text-xs font-medium text-gray-500">
                  {timeRangeLabel[timeRange]}
                </span>
              </div>
              <h3 className="font-medium text-gray-600 text-xs mb-1">PO Spend</h3>
              <div className="mb-2">
                <p className="text-lg md:text-xl font-bold text-gray-900 truncate" title={formatCurrencyFull(spendStats[timeRange])}>
                  {formatCurrency(spendStats[timeRange])}
                </p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(spendStats[timeRange], spendStats.total)}% of total
                </p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, calculatePercentage(spendStats[timeRange], spendStats.total))}%` }}
                ></div>
              </div>
            </div>

            {/* Average PO Value Card */}
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="text-lg bg-purple-50 p-1.5 rounded">📦</div>
                <span className="text-xs font-medium text-gray-500">Average</span>
              </div>
              <h3 className="font-medium text-gray-600 text-xs mb-1">Avg. PO Value</h3>
              <div className="mb-2">
                <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
                  {formatCurrency(
                    poStats[timeRange] > 0
                      ? spendStats[timeRange] / poStats[timeRange]
                      : 0
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  Based on {timeRangeLabel[timeRange].toLowerCase()}
                </p>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Orders: {formatNumber(poStats[timeRange])}</span>
                <span>Spend: {formatCurrency(spendStats[timeRange])}</span>
              </div>
            </div>

            {/* Payments Made Card */}
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
              
                <span className="text-xs font-medium text-gray-500">
                  {timeRangeLabel[timeRange]}
                </span>
              </div>
              <h3 className="font-medium text-gray-600 text-xs mb-1">Payments Made</h3>
              <div className="mb-2">
                <p className="text-lg md:text-xl font-bold text-gray-900 truncate" title={formatCurrencyFull(currentPaymentsAmount)}>
                  {formatCurrency(currentPaymentsAmount)}
                </p>
                <p className="text-xs text-gray-500">
                  {calculatePercentage(currentPaymentsAmount, totalPaymentsAmount)}% of total
                </p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, calculatePercentage(currentPaymentsAmount, totalPaymentsAmount))}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments Analytics Section */}
      {activeTab === "payments" && (
        <div className="space-y-4 md:space-y-6">
          {/* Payment Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "year", label: "This Year" },
              { key: "totalFinancialYear", label: "Total" }
            ].map((item) => {
              const amount = paymentsData[item.key] || "0";
              const numAmount = parseFloat(amount);
              return (
                <div key={item.key} className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-lg bg-blue-50 p-1.5 rounded">💵</div>
                    <span className="text-xs font-medium text-gray-500">{item.label}</span>
                  </div>
                  <h3 className="font-medium text-gray-600 text-xs mb-1">Payments</h3>
                  <p className="text-base md:text-lg font-bold text-gray-900 break-words" title={formatCurrencyFull(numAmount)}>
                    {formatCurrency(numAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {calculatePercentage(numAmount, parseFloat(paymentsData.totalFinancialYear || "0"))}% of total
                  </p>
                </div>
              );
            })}
          </div>

          {/* Complete Company List */}
          {paymentsData.companyWise && paymentsData.companyWise.length > 0 && (
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-base md:text-lg font-bold text-gray-900">📋 Complete Company-wise Payment Details</h3>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 text-left text-gray-700 font-medium">Company Name</th>
                        <th className="py-2 px-2 text-right text-gray-700 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.companyWise.map((company, idx) => (
                        <tr key={`full-company-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2">{company.companyName}</td>
                          <td className="py-2 px-2 text-right font-bold whitespace-nowrap">{formatCurrency(company.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}

          {/* Complete Vendor List */}
          {paymentsData.vendorWise && paymentsData.vendorWise.length > 0 && (
            <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none">
                  <h3 className="text-base md:text-lg font-bold text-gray-900">📋 Complete Vendor-wise Payment Details</h3>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full text-xs md:text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-2 text-left text-gray-700 font-medium">Vendor Name</th>
                        <th className="py-2 px-2 text-right text-gray-700 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentsData.vendorWise.map((vendor, idx) => (
                        <tr key={`full-vendor-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-2">{vendor.vendorName}</td>
                          <td className="py-2 px-2 text-right font-bold whitespace-nowrap">{formatCurrency(vendor.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>
          )}
        </div>
      )}
      {activeTab === "unsettled" && (
        <div className="space-y-4 md:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Unsettled Amount</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrencyFull(totalUnsettledAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredUnsettledPayments.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 ">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Unique Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{uniqueUnsettledVendorsCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search by PO/Vendor..."
                  value={unsettledSearchTerm}
                  onChange={(e) => setUnsettledSearchTerm(e.target.value)}
                  className="border rounded-md px-3 py-2 pl-9 w-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              
              <select
                value={selectedUnsettledVendor}
                onChange={(e) => setSelectedUnsettledVendor(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">All Vendors</option>
                {uniqueUnsettledVendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
              
              <input
                type="date"
                value={unsettledDateFrom}
                onChange={(e) => setUnsettledDateFrom(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              
              <input
                type="date"
                value={unsettledDateTo}
                onChange={(e) => setUnsettledDateTo(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            
            <div className="mt-3 flex justify-end">
              <button
                onClick={exportUnsettledPaymentsToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm flex items-center gap-2 hover:bg-green-700 transition-colors"
              >
                📥 Export to CSV
              </button>
            </div>
          </div>

          {/* Unsettled Payments Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              {loadingUnsettled ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  <span className="ml-3 text-gray-600">Loading unsettled payments...</span>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Advance Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUnsettledPayments.length > 0 ? (
                      filteredUnsettledPayments.map((payment) => (
                        <tr key={payment.paymentId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{payment.poNumber}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{payment.vendorName}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                            {formatCurrencyFull(payment.advanceAmount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(payment.poDate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(payment.paymentDate)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                          No unsettled advance payments found
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {/* {filteredUnsettledPayments.length > 0 && (
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="2" className="px-4 py-3 text-sm font-semibold text-gray-900">Total</td>
                        <td className="px-4 py-3 text-sm font-semibold text-right text-green-600">
                          {formatCurrencyFull(totalUnsettledAmount)}
                        </td>
                        <td colSpan="2"></td>
                      </tr>
                    </tfoot>
                  )} */}
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseDashboard;