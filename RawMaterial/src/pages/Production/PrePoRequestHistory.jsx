import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../../auth/Api";
import { useUser } from "../../Context/UserContext";
import {
  Search,
  X,
  RefreshCw,
  ChevronDown,
  Check,
  Ban,
  FilePlus2,
  FileText,
  FilePen,
  Send,
  CheckCircle2,
  XCircle,
  Inbox,
  AlertTriangle,
  Loader2,
  Phone,
  User,
  Package,
} from "lucide-react";

const STATUS = {
  PREPO_DRAFT: { label: "Draft", cls: "badge-gray", icon: FilePen },
  PREPO_REQUESTED: { label: "Requested", cls: "badge-yellow", icon: Send },
  PREPO_APPROVED: { label: "Approved", cls: "badge-green", icon: CheckCircle2 },
  PREPO_REJECTED: { label: "Rejected", cls: "badge-red", icon: XCircle },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "PREPO_DRAFT", label: "Draft" },
  { key: "PREPO_REQUESTED", label: "Requested" },
  { key: "PREPO_APPROVED", label: "Approved" },
  { key: "PREPO_REJECTED", label: "Rejected" },
];

const money = (n) =>
  `₹ ${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PrePoRequestHistory = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [prepoHistory, setPrepoHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState({});
  const [actionMessage, setActionMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPrePoHistory();
  }, []);

  const fetchPrePoHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await Api.get("/pre-po/pre-po-request");
      if (response.data.success) {
        setPrepoHistory(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatus = (status) =>
    STATUS[status] || { label: status || "Unknown", cls: "badge-gray", icon: FileText };

  // Determine if Approve/Reject buttons should be shown
  const isActionable = (status) => {
    if (user?.role === "Purchase") {
      return status === "PREPO_REQUESTED";
    }
    return status === "PREPO_DRAFT";
  };

  const updateStatus = async (requestId, status) => {
    setUpdating((prev) => ({ ...prev, [requestId]: true }));
    setActionMessage(null);
    try {
      const response = await Api.post(`/pre-po/pre-po-request/${requestId}`, { status });
      if (response.data.success) {
        setActionMessage({
          type: "success",
          text: `Request ${status.toLowerCase().replace("prepo_", "")} successfully!`,
        });
        await fetchPrePoHistory();
      } else {
        setActionMessage({ type: "error", text: response.data.message || "Update failed" });
      }
    } catch (err) {
      console.error("Update error:", err);
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Something went wrong",
      });
    } finally {
      setUpdating((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleApprove = (id) => {
    const targetStatus = user?.role === "Purchase" ? "PREPO_APPROVED" : "PREPO_REQUESTED";
    updateStatus(id, targetStatus);
  };

  const handleReject = (id) => {
    if (window.confirm("Are you sure you want to reject this request?")) {
      updateStatus(id, "PREPO_REJECTED");
    }
  };

  const handleCreatePO = (request) => {
    const vendor = request.vendor || {};
    const items = request.prePoItems || [];

    const reorderData = {
      vendorId: vendor.id || request.vendorId || "",
      contactPerson: vendor.contactPerson || "",
      cellNo: vendor.contactNumber || "",
      items: items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        prePoId: item.prePoId,
      })),
      prePoId: request.id,
      fromPrePo: true,
    };

    navigate("/create-purchase-order", {
      state: { reorderData },
    });
  };

  const requestTotal = (request) =>
    (request.prePoItems || []).reduce(
      (sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.rate) || 0),
      0,
    );

  // ---------- Derived ----------
  const counts = prepoHistory.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {},
  );

  const term = searchTerm.trim().toLowerCase();
  const visible = prepoHistory.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!term) return true;
    const v = r.vendor || {};
    return (
      v.name?.toLowerCase().includes(term) ||
      v.contactPerson?.toLowerCase().includes(term) ||
      v.contactNumber?.toString().includes(term) ||
      (r.prePoItems || []).some((i) => i.itemName?.toLowerCase().includes(term))
    );
  });

  const stats = [
    { key: "all", label: "Total Requests", value: prepoHistory.length, icon: FileText, tone: "bg-ink-100 text-ink-700" },
    { key: "PREPO_DRAFT", label: "Draft", value: counts.PREPO_DRAFT || 0, icon: FilePen, tone: "bg-ink-100 text-ink-600" },
    { key: "PREPO_REQUESTED", label: "Requested", value: counts.PREPO_REQUESTED || 0, icon: Send, tone: "bg-brand-100 text-brand-700" },
    { key: "PREPO_APPROVED", label: "Approved", value: counts.PREPO_APPROVED || 0, icon: CheckCircle2, tone: "bg-green-50 text-green-600" },
    { key: "PREPO_REJECTED", label: "Rejected", value: counts.PREPO_REJECTED || 0, icon: XCircle, tone: "bg-red-50 text-red-600" },
  ];

  const toggle = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  // ---------- Pieces ----------
  const Actions = ({ request, full = false }) => {
    const isUpdating = updating[request.id] || false;
    if (isActionable(request.status)) {
      return (
        <div className={`flex items-center gap-2 ${full ? "" : "justify-end"}`}>
          <button
            onClick={() => handleApprove(request.id)}
            disabled={isUpdating}
            className={`btn btn-approve py-1.5 text-xs ${full ? "flex-1" : ""}`}
          >
            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {user?.role === "Purchase" ? "Approve" : "Send Request"}
          </button>
          <button
            onClick={() => handleReject(request.id)}
            disabled={isUpdating}
            className={`btn btn-decline py-1.5 text-xs ${full ? "flex-1" : ""}`}
          >
            <Ban className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      );
    }
    if (user?.role === "Purchase" && request.status === "PREPO_APPROVED") {
      return (
        <div className={`flex ${full ? "" : "justify-end"}`}>
          <button onClick={() => handleCreatePO(request)} className={`btn-primary py-1.5 text-xs ${full ? "w-full" : ""}`}>
            <FilePlus2 className="h-3.5 w-3.5" /> Create PO
          </button>
        </div>
      );
    }
    return full ? null : <div className="text-right text-xs text-ink-400">—</div>;
  };

  const ItemsTable = ({ items }) =>
    items.length === 0 ? (
      <p className="rounded-lg border border-dashed border-ink-300 bg-white px-4 py-4 text-center text-sm text-ink-500">
        No items
      </p>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-100 text-[11px] uppercase tracking-wider text-ink-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item</th>
              <th className="px-3 py-2 text-right font-semibold">Qty</th>
              <th className="px-3 py-2 text-left font-semibold">Unit</th>
              <th className="px-3 py-2 text-right font-semibold">Rate</th>
              <th className="px-3 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="min-w-[180px] px-3 py-2 font-medium text-ink-900 break-words">{item.itemName}</td>
                <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                <td className="px-3 py-2 text-ink-600">{item.unit}</td>
                <td className="px-3 py-2 text-right tabular-nums">{money(item.rate)}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {money((Number(item.quantity) || 0) * (Number(item.rate) || 0))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-ink-200 bg-ink-50">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                Total
              </td>
              <td className="px-3 py-2 text-right font-bold tabular-nums text-ink-950">
                {money(items.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.rate) || 0), 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );

  // ---------- Render states ----------
  if (loading && prepoHistory.length === 0) {
    return (
      <div className="page space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
        <div className="card space-y-3 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="card card-body mx-auto max-w-lg text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink-900">{error}</p>
          <button onClick={fetchPrePoHistory} className="btn-dark mt-4">
            <RefreshCw className="h-4 w-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const active = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`card flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-ink-300 ${
                active ? "border-brand-400 ring-2 ring-brand-400" : ""
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

      {/* Action feedback */}
      {actionMessage && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <span className="flex items-center gap-2">
            {actionMessage.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {actionMessage.text}
          </span>
          <button onClick={() => setActionMessage(null)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* List */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-ink-200 px-4 py-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendor, contact, phone or item..."
              className="input h-10 pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-ink-400 hover:bg-ink-100 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                  statusFilter === f.key ? "bg-ink-950 text-brand-400" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                }`}
              >
                {f.label}
              </button>
            ))}
            <button onClick={fetchPrePoHistory} disabled={loading} className="btn-outline ml-1 h-9 py-0" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="font-semibold text-ink-800">
              {prepoHistory.length === 0 ? "No Pre-PO requests yet" : "No requests match your filters"}
            </p>
            <p className="text-sm text-ink-500">
              {prepoHistory.length === 0 ? "Create a new request to get started." : "Try a different search or status."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Items</th>
                    <th className="!text-right">Value</th>
                    <th>Status</th>
                    <th>Created / Updated</th>
                    <th className="!text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((request) => {
                    const st = getStatus(request.status);
                    const StIcon = st.icon;
                    const vendor = request.vendor || {};
                    const items = request.prePoItems || [];
                    const open = !!expanded[request.id];
                    return (
                      <React.Fragment key={request.id}>
                        <tr className={open ? "!bg-brand-50" : ""}>
                          <td className="min-w-[220px]">
                            <div className="font-semibold text-ink-950 break-words">{vendor.name || "—"}</div>
                            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                              {vendor.contactPerson && (
                                <span className="inline-flex items-center gap-1">
                                  <User className="h-3 w-3" /> {vendor.contactPerson}
                                </span>
                              )}
                              {vendor.contactNumber && (
                                <span className="inline-flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {vendor.contactNumber}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              onClick={() => toggle(request.id)}
                              disabled={items.length === 0}
                              className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:opacity-50"
                            >
                              <Package className="h-3.5 w-3.5" />
                              {items.length} item{items.length !== 1 ? "s" : ""}
                              {items.length > 0 && (
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                              )}
                            </button>
                            {items.length > 0 && !open && (
                              <div className="mt-1 max-w-[260px] truncate text-xs text-ink-500">
                                {items.map((i) => i.itemName).join(", ")}
                              </div>
                            )}
                          </td>
                          <td className="text-right font-semibold tabular-nums whitespace-nowrap text-ink-950">
                            {money(requestTotal(request))}
                          </td>
                          <td>
                            <span className={`${st.cls} whitespace-nowrap`}>
                              <StIcon className="h-3 w-3" /> {st.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap text-xs">
                            <div className="text-ink-800">{formatDate(request.createdAt)}</div>
                            <div className="text-ink-400">Updated {formatDate(request.updatedAt)}</div>
                          </td>
                          <td>
                            <Actions request={request} />
                          </td>
                        </tr>
                        {open && (
                          <tr className="!bg-ink-50">
                            <td colSpan={6} className="!py-4">
                              <ItemsTable items={items} />
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
            <div className="grid gap-3 p-3 md:grid-cols-2 lg:hidden">
              {visible.map((request) => {
                const st = getStatus(request.status);
                const StIcon = st.icon;
                const vendor = request.vendor || {};
                const items = request.prePoItems || [];
                const open = !!expanded[request.id];
                return (
                  <div key={request.id} className={`rounded-xl border border-ink-200 bg-white ${open ? "md:col-span-2" : ""}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold text-ink-950 break-words">{vendor.name || "—"}</div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-500">
                            {vendor.contactPerson && (
                              <span className="inline-flex items-center gap-1">
                                <User className="h-3 w-3" /> {vendor.contactPerson}
                              </span>
                            )}
                            {vendor.contactNumber && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {vendor.contactNumber}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`${st.cls} shrink-0`}>
                          <StIcon className="h-3 w-3" /> {st.label}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2">
                        <button
                          onClick={() => toggle(request.id)}
                          disabled={items.length === 0}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700 disabled:opacity-50"
                        >
                          <Package className="h-3.5 w-3.5" /> {items.length} item{items.length !== 1 ? "s" : ""}
                          {items.length > 0 && (
                            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                          )}
                        </button>
                        <span className="font-bold tabular-nums text-ink-950">{money(requestTotal(request))}</span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-ink-400">Created</div>
                          <div className="text-ink-800">{formatDate(request.createdAt)}</div>
                        </div>
                        <div>
                          <div className="text-ink-400">Updated</div>
                          <div className="text-ink-800">{formatDate(request.updatedAt)}</div>
                        </div>
                      </div>

                      <div className="mt-3 empty:hidden">
                        <Actions request={request} full />
                      </div>
                    </div>

                    {open && (
                      <div className="border-t border-ink-200 bg-ink-50 p-3">
                        <ItemsTable items={items} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="border-t border-ink-200 px-4 py-3 text-xs text-ink-500">
              Showing {visible.length} of {prepoHistory.length} requests
            </p>
          </>
        )}
      </section>
    </div>
  );
};

export default PrePoRequestHistory;
