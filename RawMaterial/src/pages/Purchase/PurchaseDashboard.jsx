import React, { useState, useEffect } from "react";
import Api from "../../auth/Api";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Download,
  FileText,
  Package,
  Receipt,
  RefreshCw,
  Search,
  Users,
  Wallet,
} from "lucide-react";

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
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="loading-box">
          <span className="spinner" />
          Loading dashboard…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-narrow">
        <div className="alert-error items-center">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">{error}</p>
            <p className="text-xs opacity-80">Please try again.</p>
          </div>
          <button onClick={fetchAllData} className="btn-outline btn-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { poStats, spendStats } = dashboardData;
  const currentPaymentsAmount = getPaymentsAmount(timeRange);
  const totalPaymentsAmount = getPaymentsAmount("total");
  const rangeLabel = timeRangeLabel[timeRange];

  const TABS = [
    { key: "overview", label: "PO Overview" },
    { key: "payments", label: "Advance Payments" },
    { key: "unsettled", label: "Unsettled Advances", count: unsettledPayments.length },
  ];

  const StatCard = ({ icon: Icon, label, value, title, sub, progress, tone = "bg-brand-400" }) => (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <span className="stat-label">{label}</span>
        {Icon && (
          <span className="stat-icon">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="stat-value" title={title}>
        {value}
      </p>
      {sub && <p className="stat-sub">{sub}</p>}
      {progress != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${tone}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}
    </div>
  );

  const BreakdownTable = ({ title, icon: Icon, rows, nameKey }) => (
    <section className="card flex min-h-0 flex-col">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <span className="step-badge">
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <h3 className="card-title">{title}</h3>
            <p className="card-subtitle">{rows.length} entries · {rangeLabel === "Total" ? "financial year" : "all time"}</p>
          </div>
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <table className="table table-compact table-light">
          <thead>
            <tr>
              <th>Name</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx}>
                <td className="font-medium">{r[nameKey]}</td>
                <td className="num font-semibold" title={formatCurrencyFull(r.amount)}>
                  {formatCurrency(r.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="page">
      {/* Tabs + refresh (refresh pinned to the far right) */}
      <div className="tabs items-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            className={`tab ${activeTab === t.key ? "tab-active" : ""}`}
          >
            {t.label}
            {t.count > 0 && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
        <button
          onClick={fetchAllData}
          className="btn-outline btn-sm ml-auto mb-1.5 shrink-0"
          title="Refresh data"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* Time range (overview + payments) */}
      {(activeTab === "overview" || activeTab === "payments") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-ink-500">Period</span>
          {["today", "weekly", "monthly", "yearly", "total"].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={`chip ${timeRange === range ? "chip-active" : ""}`}
            >
              {timeRangeLabel[range]}
            </button>
          ))}
        </div>
      )}

      {/* ---------------- Overview ---------------- */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={FileText}
            label="Purchase Orders"
            value={formatNumber(poStats[timeRange])}
            title={formatNumberFull(poStats[timeRange])}
            sub={`${calculatePercentage(poStats[timeRange], poStats.total)}% of total · ${rangeLabel}`}
            progress={calculatePercentage(poStats[timeRange], poStats.total)}
          />
          <StatCard
            icon={Wallet}
            label="PO Spend"
            value={formatCurrency(spendStats[timeRange])}
            title={formatCurrencyFull(spendStats[timeRange])}
            sub={`${calculatePercentage(spendStats[timeRange], spendStats.total)}% of total · ${rangeLabel}`}
            progress={calculatePercentage(spendStats[timeRange], spendStats.total)}
            tone="bg-green-500"
          />
          <StatCard
            icon={Package}
            label="Avg. PO Value"
            value={formatCurrency(poStats[timeRange] > 0 ? spendStats[timeRange] / poStats[timeRange] : 0)}
            sub={`${formatNumber(poStats[timeRange])} orders · ${formatCurrency(spendStats[timeRange])} spend`}
          />
          <StatCard
            icon={CreditCard}
            label="Payments Made"
            value={formatCurrency(currentPaymentsAmount)}
            title={formatCurrencyFull(currentPaymentsAmount)}
            sub={`${calculatePercentage(currentPaymentsAmount, totalPaymentsAmount)}% of total · ${rangeLabel}`}
            progress={calculatePercentage(currentPaymentsAmount, totalPaymentsAmount)}
            tone="bg-ink-950"
          />
        </div>
      )}

      {/* ---------------- Advance payments ---------------- */}
      {activeTab === "payments" && (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {[
              { key: "today", label: "Today" },
              { key: "week", label: "This Week" },
              { key: "month", label: "This Month" },
              { key: "year", label: "This Year" },
              { key: "totalFinancialYear", label: "Total" },
            ].map((item) => {
              const numAmount = parseFloat(paymentsData[item.key] || "0");
              const total = parseFloat(paymentsData.totalFinancialYear || "0");
              return (
                <StatCard
                  key={item.key}
                  icon={CreditCard}
                  label={item.label}
                  value={formatCurrency(numAmount)}
                  title={formatCurrencyFull(numAmount)}
                  sub={`${calculatePercentage(numAmount, total)}% of total`}
                  progress={calculatePercentage(numAmount, total)}
                />
              );
            })}
          </div>

          {(paymentsData.companyWise?.length > 0 || paymentsData.vendorWise?.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {paymentsData.companyWise?.length > 0 && (
                <BreakdownTable
                  title="Company-wise Payments"
                  icon={Building2}
                  rows={paymentsData.companyWise}
                  nameKey="companyName"
                />
              )}
              {paymentsData.vendorWise?.length > 0 && (
                <BreakdownTable
                  title="Vendor-wise Payments"
                  icon={Users}
                  rows={paymentsData.vendorWise}
                  nameKey="vendorName"
                />
              )}
            </div>
          )}
        </>
      )}

      {/* ---------------- Unsettled advances ---------------- */}
      {activeTab === "unsettled" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard
              icon={Receipt}
              label="Unsettled Amount"
              value={formatCurrencyFull(totalUnsettledAmount)}
              sub="Advances not yet adjusted against invoices"
            />
            <StatCard icon={FileText} label="Transactions" value={filteredUnsettledPayments.length} />
            <StatCard icon={Users} label="Vendors" value={uniqueUnsettledVendorsCount} />
          </div>

          {/* Filters */}
          <section className="card">
            <div className="card-body grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto_auto] md:items-end">
              <div>
                <label className="label">Search</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    placeholder="PO number or vendor"
                    value={unsettledSearchTerm}
                    onChange={(e) => setUnsettledSearchTerm(e.target.value)}
                    className="input pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="label">Vendor</label>
                <select
                  value={selectedUnsettledVendor}
                  onChange={(e) => setSelectedUnsettledVendor(e.target.value)}
                  className="input"
                >
                  <option value="">All vendors</option>
                  {uniqueUnsettledVendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">From</label>
                <input
                  type="date"
                  value={unsettledDateFrom}
                  onChange={(e) => setUnsettledDateFrom(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">To</label>
                <input
                  type="date"
                  value={unsettledDateTo}
                  onChange={(e) => setUnsettledDateTo(e.target.value)}
                  className="input"
                />
              </div>
              <button
                onClick={exportUnsettledPaymentsToCSV}
                disabled={filteredUnsettledPayments.length === 0}
                className="btn-dark"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
          </section>

          {/* Table */}
          <section className="card overflow-hidden">
            <div className="card-header">
              <div>
                <h3 className="card-title">Unsettled Advance Payments</h3>
                <p className="card-subtitle">
                  Showing {filteredUnsettledPayments.length} of {unsettledPayments.length}
                </p>
              </div>
            </div>
            {loadingUnsettled ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm text-ink-500">
                <span className="spinner" /> Loading unsettled payments…
              </div>
            ) : filteredUnsettledPayments.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">
                  <Receipt className="h-6 w-6" />
                </span>
                <p className="font-semibold text-ink-800">No unsettled advance payments</p>
                <p className="text-xs">Try clearing the filters above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>PO Number</th>
                      <th>Vendor</th>
                      <th className="num">Advance Amount</th>
                      <th>PO Date</th>
                      <th>Payment Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnsettledPayments.map((payment) => (
                      <tr key={payment.paymentId}>
                        <td className="font-semibold">{payment.poNumber}</td>
                        <td>{payment.vendorName}</td>
                        <td className="num font-semibold text-green-700">
                          {formatCurrencyFull(payment.advanceAmount)}
                        </td>
                        <td className="whitespace-nowrap text-ink-600">{formatDateTime(payment.poDate)}</td>
                        <td className="whitespace-nowrap text-ink-600">{formatDateTime(payment.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-ink-50">
                      <td colSpan="2" className="border-t border-ink-200 px-4 py-3 text-sm font-semibold">
                        Total
                      </td>
                      <td className="num border-t border-ink-200 px-4 py-3 text-sm font-bold text-green-700">
                        {formatCurrencyFull(totalUnsettledAmount)}
                      </td>
                      <td colSpan="2" className="border-t border-ink-200" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PurchaseDashboard;