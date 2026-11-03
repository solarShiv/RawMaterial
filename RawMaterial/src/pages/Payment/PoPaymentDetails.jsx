import React, { useEffect, useState } from "react";
import Api from "../../auth/Api";
import {
  Search,
  X,
  RefreshCw,
  ChevronDown,
  FileText,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Building2,
  Store,
  CalendarDays,
  User,
  Ban,
  Inbox,
} from "lucide-react";

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

const PoPaymentDetails = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [cancelingRequestId, setCancelingRequestId] = useState(null);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const getOverallStatus = (request) => {
    const docs = request.docsVerification?.status;
    const admin = request.adminVerification?.status;
    const accounts = request.accountsVerification?.status;

    if (accounts === true) return "Completed";
    if (accounts === false) return "Rejected by Accounts";
    if (admin === true) return "Admin Approved";
    if (admin === false) return "Rejected by Admin";
    if (docs === true) return "Docs Verified";
    if (docs === false) return "Rejected by Docs";
    return "Pending";
  };

  const getStatusGroup = (request) => {
    const status = getOverallStatus(request);
    if (status === "Completed") return "completed";
    if (status.includes("Rejected")) return "rejected";
    if (status === "Pending") return "pending";
    return "progress";
  };

  useEffect(() => {
    const searchLower = searchTerm.toLowerCase();
    const filtered = data.filter((request) => {
      const matchesSearch =
        !searchTerm ||
        request.poNumber?.toLowerCase().includes(searchLower) ||
        request.vendorName?.toLowerCase().includes(searchLower) ||
        request.companyName?.toLowerCase().includes(searchLower) ||
        request.paymentRequestId?.toLowerCase().includes(searchLower) ||
        request.requestedAmount?.toString().includes(searchTerm) ||
        request.currency?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === "all" || getStatusGroup(request) === statusFilter;
      return matchesSearch && matchesStatus;
    });
    setFilteredData(filtered);
  }, [searchTerm, statusFilter, data]);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await Api.get("/purchase/purchase-orders/payments/show");
      setData(response?.data?.data || []);
    } catch (err) {
      setError("Failed to connect to server");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpansion = (paymentRequestId) => {
    setExpandedRows((prev) => ({
      ...prev,
      [paymentRequestId]: !prev[paymentRequestId],
    }));
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrencySymbol = (currencyCode) => {
    const currencySymbols = {
      USD: "$",
      INR: "₹",
      EUR: "€",
      GBP: "£",
      JPY: "¥",
      CAD: "C$",
      AUD: "A$",
      CNY: "¥",
    };
    return currencySymbols[currencyCode?.toUpperCase()] || currencyCode || "$";
  };

  const formatAmount = (amount, currencyCode) => {
    const symbol = getCurrencySymbol(currencyCode);
    if (currencyCode?.toUpperCase() === "INR") {
      return `${symbol} ${Number(amount).toLocaleString("en-IN")}`;
    }
    return `${symbol}${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const STATUS_STYLES = {
    completed: "badge-green",
    rejected: "badge-red",
    progress: "badge bg-blue-50 text-blue-700",
    pending: "badge-yellow",
  };

  const handleCancel = async (paymentRequestId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this payment request? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      setCancelingRequestId(paymentRequestId);
      await Api.put(`/purchase/purchase-orders/payments/reject?id=${paymentRequestId}`);
      await fetchPaymentRequests();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to cancel payment request");
      console.log("Cancel error:", err?.response?.data?.message);
    } finally {
      setCancelingRequestId(null);
    }
  };

  const counts = data.reduce(
    (acc, r) => {
      acc[getStatusGroup(r)] += 1;
      return acc;
    },
    { pending: 0, progress: 0, completed: 0, rejected: 0 }
  );

  const stats = [
    { label: "Total Requests", value: data.length, icon: FileText, tone: "bg-ink-100 text-ink-700", key: "all" },
    { label: "Pending", value: counts.pending, icon: Clock, tone: "bg-brand-100 text-brand-700", key: "pending" },
    { label: "In Progress", value: counts.progress, icon: Loader2, tone: "bg-blue-50 text-blue-600", key: "progress" },
    { label: "Completed", value: counts.completed, icon: CheckCircle2, tone: "bg-green-50 text-green-600", key: "completed" },
    { label: "Rejected", value: counts.rejected, icon: XCircle, tone: "bg-red-50 text-red-600", key: "rejected" },
  ];

  // ---------- Approval steps ----------
  const getSteps = (request) => [
    { title: "Accounts Verification", v: request.docsVerification || {} },
    { title: "Payment Approval", sub: "Super Admin", v: request.adminVerification || {} },
    { title: "Payment Done", v: request.accountsVerification || {} },
  ];

  const stepState = (v) => (v.status === true ? "done" : v.status === false ? "rejected" : "pending");

  const StepIcon = ({ state }) => {
    if (state === "done")
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
          <CheckCircle2 className="h-4 w-4" />
        </span>
      );
    if (state === "rejected")
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white">
          <XCircle className="h-4 w-4" />
        </span>
      );
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-ink-300 bg-white text-ink-400">
        <Clock className="h-4 w-4" />
      </span>
    );
  };

  const ApprovalTracker = ({ request }) => (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink-900">Approval Progress</h4>
        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          <User className="h-3.5 w-3.5" />
          Requested by <span className="font-semibold text-ink-800">{request.requestedBy || "N/A"}</span>
        </div>
      </div>

      <ol className="grid gap-3 md:grid-cols-3">
        {getSteps(request).map((step, i) => {
          const state = stepState(step.v);
          return (
            <li
              key={i}
              className={`rounded-xl border bg-white p-4 ${
                state === "done" ? "border-green-200" : state === "rejected" ? "border-red-200" : "border-ink-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <StepIcon state={state} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Step {i + 1}</div>
                  <div className="font-semibold text-ink-950 leading-tight">
                    {step.title}
                    {step.sub && <span className="ml-1 text-xs font-normal text-ink-500">({step.sub})</span>}
                  </div>
                  <span
                    className={`mt-1.5 ${
                      state === "done" ? "badge-green" : state === "rejected" ? "badge-red" : "badge-yellow"
                    }`}
                  >
                    {state === "done" ? "Approved" : state === "rejected" ? "Rejected" : "Pending"}
                  </span>
                </div>
              </div>

              <dl className="mt-3 space-y-1.5 border-t border-ink-100 pt-3 text-xs">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">By</dt>
                  <dd className="font-medium text-ink-800 text-right break-words">{step.v.approvedBy || "N/A"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-500">Date</dt>
                  <dd className="text-ink-800 text-right">{formatDate(step.v.approvedDate)}</dd>
                </div>
                <div>
                  <dt className="text-ink-500">Remarks</dt>
                  <dd className="mt-0.5 text-ink-800 break-words">{step.v.remarks || "No remarks"}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
    </div>
  );

  const Actions = ({ request, full = false }) => {
    const expanded = !!expandedRows[request.paymentRequestId];
    return (
      <div className={`flex items-center gap-2 ${full ? "w-full" : "justify-end"}`}>
        <button
          onClick={() => toggleRowExpansion(request.paymentRequestId)}
          className={`btn-outline py-1.5 ${full ? "flex-1" : ""}`}
        >
          {expanded ? "Hide" : "Details"}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {getOverallStatus(request) !== "Completed" && (
          <button
            onClick={() => handleCancel(request.paymentRequestId)}
            disabled={cancelingRequestId === request.paymentRequestId}
            className={`btn py-1.5 border border-red-200 bg-white text-red-600 hover:bg-red-50 ${full ? "flex-1" : ""}`}
            title="Cancel request"
          >
            {cancelingRequestId === request.paymentRequestId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            Cancel
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="page space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const active = statusFilter === s.key;
          return (
            <button
              key={s.label}
              onClick={() => setStatusFilter(s.key)}
              className={`card flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-ink-300 ${
                active ? "ring-2 ring-brand-400 border-brand-400" : ""
              } ${i === 0 ? "col-span-2 md:col-span-1" : ""}`}
            >
              <div>
                <div className="text-xs font-medium text-ink-500">{s.label}</div>
                <div className="text-2xl font-bold tabular-nums text-ink-950">{s.value}</div>
              </div>
              <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search PO, vendor, company, amount, currency..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input h-10 pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? "bg-ink-950 text-brand-400"
                    : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button onClick={fetchPaymentRequests} disabled={loading} className="btn-outline ml-1 h-9 py-0" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-red-500 hover:text-red-700" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading && data.length === 0 ? (
        <div className="card space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink-800">
            {searchTerm || statusFilter !== "all" ? "No matching payment requests" : "No payment requests yet"}
          </p>
          {(searchTerm || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="mt-2 text-sm font-semibold text-ink-900 underline underline-offset-2 hover:text-brand-600"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Company</th>
                  <th>Vendor</th>
                  <th className="!text-right">Amount</th>
                  <th>Created</th>
                  <th>Status</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((request) => {
                  const group = getStatusGroup(request);
                  const expanded = !!expandedRows[request.paymentRequestId];
                  return (
                    <React.Fragment key={request.paymentRequestId}>
                      <tr className={expanded ? "bg-brand-50" : ""}>
                        <td className="font-semibold text-ink-950 whitespace-nowrap">{request.poNumber}</td>
                        <td className="max-w-[220px] break-words">{request.companyName}</td>
                        <td className="max-w-[220px] break-words">{request.vendorName}</td>
                        <td className="text-right whitespace-nowrap">
                          <div className="font-bold tabular-nums text-ink-950">
                            {formatAmount(request.requestedAmount, request.currency)}
                          </div>
                          <div className="text-[11px] text-ink-400">{request.currency}</div>
                        </td>
                        <td className="whitespace-nowrap text-ink-600">{formatDate(request.createdAt)}</td>
                        <td>
                          <span className={`${STATUS_STYLES[group]} whitespace-nowrap`}>{getOverallStatus(request)}</span>
                        </td>
                        <td>
                          <Actions request={request} />
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="!bg-ink-50">
                          <td colSpan={7} className="!py-5">
                            <ApprovalTracker request={request} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid gap-3 md:grid-cols-2 lg:hidden">
            {filteredData.map((request) => {
              const group = getStatusGroup(request);
              const expanded = !!expandedRows[request.paymentRequestId];
              return (
                <div key={request.paymentRequestId} className={`card overflow-hidden ${expanded ? "md:col-span-2" : ""}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">PO Number</div>
                        <div className="font-bold text-ink-950 break-words">{request.poNumber}</div>
                      </div>
                      <span className={`${STATUS_STYLES[group]} shrink-0`}>{getOverallStatus(request)}</span>
                    </div>

                    <div className="mt-3 flex items-end justify-between gap-3 rounded-lg bg-ink-50 px-3 py-2.5">
                      <div className="flex items-center gap-2 text-ink-500">
                        <CreditCard className="h-4 w-4" />
                        <span className="text-xs">Amount</span>
                      </div>
                      <div className="text-lg font-bold tabular-nums text-ink-950">
                        {formatAmount(request.requestedAmount, request.currency)}
                      </div>
                    </div>

                    <dl className="mt-3 space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                        <dd className="text-ink-800 break-words">{request.companyName}</dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Store className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                        <dd className="text-ink-800 break-words">{request.vendorName}</dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                        <dd className="text-ink-600">{formatDate(request.createdAt)}</dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      <Actions request={request} full />
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-ink-200 bg-ink-50 p-4">
                      <ApprovalTracker request={request} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-ink-500">
            Showing {filteredData.length} of {data.length} payment requests
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </>
      )}
    </div>
  );
};

export default PoPaymentDetails;
