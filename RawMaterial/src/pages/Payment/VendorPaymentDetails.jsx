import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import Api from "../../auth/Api";
import SearchableSelect from "../../components/dropdown/SearchableSelect";

const VENDOR_PAYMENTS_API = "/vendor/payments";
const STAGES = ["PENDING", "PAID"];
const PAGE_SIZES = [20, 50, 100];

const toInputDate = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Default range: 1st of last month → today
const defaultFilters = () => {
  const today = new Date();
  return {
    vendorId: "",
    stages: [...STAGES],
    fromDate: toInputDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
    toDate: toInputDate(today),
    sortOrder: "desc",
    limit: 20,
  };
};

const formatAmount = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d) => {
  const date = new Date(d);
  return isNaN(date.getTime())
    ? String(d)
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

// "pendingAmount" → "Pending Amount"
const toLabel = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());

const isHiddenKey = (key) => /^(_?id|__v|createdBy|updatedBy)$/.test(key) || /(Id|_id)$/.test(key);
const isAmountKey = (key) => /amount|total|paid|pending|balance|advance|rate|value/i.test(key);
const isDateKey = (key) => /date|(At|On)$/i.test(key);
const isStatusKey = (key) => /stage|status/i.test(key);

const STATUS_BADGE = {
  PAID: "badge-green",
  PENDING: "badge-orange",
  PARTIAL: "badge-blue",
  REJECTED: "badge-red",
  CANCELLED: "badge-red",
};

// The API response shape is read defensively: rows may sit at data, data.payments, data.rows…
const extractRows = (body) => {
  const d = body?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(body?.payments)) return body.payments;
  if (d && typeof d === "object") {
    for (const key of ["payments", "rows", "items", "results", "data", "list"]) {
      if (Array.isArray(d[key])) return d[key];
    }
    const firstArray = Object.values(d).find(Array.isArray);
    if (firstArray) return firstArray;
  }
  return [];
};

const extractPagination = (body) => {
  const d = body?.data && !Array.isArray(body.data) ? body.data : {};
  const p = body?.pagination || d.pagination || body?.meta || d.meta || {};
  const pick = (...keys) => {
    for (const src of [p, d, body || {}]) {
      for (const k of keys) {
        if (src[k] !== undefined && src[k] !== null && !isNaN(Number(src[k]))) return Number(src[k]);
      }
    }
    return null;
  };
  return {
    total: pick("total", "totalCount", "totalRecords", "totalItems", "count"),
    totalPages: pick("totalPages", "pages", "pageCount"),
  };
};

// Totals block (if the API sends one): data.summary / data.totals
const extractSummary = (body) => {
  const d = body?.data && !Array.isArray(body.data) ? body.data : {};
  const s = body?.summary || d.summary || body?.totals || d.totals;
  if (!s || typeof s !== "object") return [];
  return Object.entries(s).filter(([, v]) => v !== null && typeof v !== "object");
};

const renderCell = (key, value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? `${value.length} item(s)` : "—";
  if (typeof value === "object") {
    return (
      value.displayName || value.name || value.vendorName || value.companyName || value.poNumber || "—"
    );
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (isStatusKey(key)) {
    const text = String(value);
    return <span className={STATUS_BADGE[text.toUpperCase()] || "badge-gray"}>{text}</span>;
  }
  if (isDateKey(key)) return formatDate(value);
  if (isAmountKey(key) && !isNaN(Number(value))) return formatAmount(value);
  return String(value);
};

const VendorPaymentDetails = () => {
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState([]);
  const [pagination, setPagination] = useState({ total: null, totalPages: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Api.get("/purchase/vendors")
      .then((res) => setVendors(res?.data?.data || []))
      .catch((err) => console.error("Error loading vendors:", err))
      .finally(() => setVendorsLoading(false));
  }, []);

  const fetchPayments = useCallback(async () => {
    if (filters.stages.length === 0) {
      setRows([]);
      setSummary([]);
      setPagination({ total: 0, totalPages: 0 });
      setError("Select at least one stage.");
      return;
    }
    if (filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      setError("From date cannot be after To date.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = {
        stage: filters.stages.join(","),
        sortBy: "pendingAmount",
        sortOrder: filters.sortOrder,
        page,
        limit: filters.limit,
      };
      if (filters.vendorId) params.vendorId = filters.vendorId;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const res = await Api.get(VENDOR_PAYMENTS_API, { params });
      setRows(extractRows(res.data));
      setSummary(extractSummary(res.data));
      setPagination(extractPagination(res.data));
    } catch (err) {
      console.error("Error loading vendor payments:", err);
      setRows([]);
      setSummary([]);
      setError(err?.response?.data?.message || err?.message || "Failed to load vendor payments");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Any filter change goes back to page 1
  const updateFilter = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const toggleStage = (stage) =>
    updateFilter({
      stages: filters.stages.includes(stage)
        ? filters.stages.filter((s) => s !== stage)
        : [...filters.stages, stage],
    });

  const columns = useMemo(() => {
    const keys = [];
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => {
        if (!isHiddenKey(key) && !keys.includes(key)) keys.push(key);
      });
    });
    return keys;
  }, [rows]);

  const totalPages =
    pagination.totalPages ??
    (pagination.total !== null ? Math.max(1, Math.ceil(pagination.total / filters.limit)) : null);
  // Without a total from the API, a full page means there may be more
  const hasNext = totalPages !== null ? page < totalPages : rows.length >= filters.limit;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-950">Vendor Payment Details</h1>
            <p className="text-xs text-ink-500">Pending and paid amounts by vendor</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFilters(defaultFilters());
                setPage(1);
              }}
              className="btn-outline"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button type="button" onClick={fetchPayments} disabled={loading} className="btn-dark">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <section className="card">
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="label">Vendor</label>
              <SearchableSelect
                options={[
                  { id: "", name: "All vendors" },
                  ...vendors.map((v) => ({ id: v.id, name: v.displayName })),
                ]}
                value={filters.vendorId}
                onChange={(id) => updateFilter({ vendorId: String(id) })}
                loading={vendorsLoading}
                placeholder="All vendors"
                searchPlaceholder="Search vendor…"
              />
            </div>

            <div>
              <label className="label">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                max={filters.toDate || undefined}
                onChange={(e) => updateFilter({ fromDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                min={filters.fromDate || undefined}
                onChange={(e) => updateFilter({ toDate: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="label">Pending Amount</label>
              <button
                type="button"
                onClick={() =>
                  updateFilter({ sortOrder: filters.sortOrder === "desc" ? "asc" : "desc" })
                }
                className="btn-outline w-full justify-center"
              >
                {filters.sortOrder === "desc" ? (
                  <>
                    <ArrowDownWideNarrow className="h-4 w-4" /> High to low
                  </>
                ) : (
                  <>
                    <ArrowUpNarrowWide className="h-4 w-4" /> Low to high
                  </>
                )}
              </button>
            </div>

            <div className="sm:col-span-2 lg:col-span-5">
              <label className="label">Stage</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => {
                  const active = filters.stages.includes(stage);
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => toggleStage(stage)}
                      aria-pressed={active}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? "border-ink-950 bg-ink-950 text-brand-400"
                          : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Totals (only when the API sends them) */}
        {summary.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.map(([key, value]) => (
              <div key={key} className="card px-4 py-3">
                <p className="text-xs text-ink-500">{toLabel(key)}</p>
                <p className="text-lg font-bold text-ink-950 tabular-nums">
                  {isAmountKey(key) && !isNaN(Number(value)) ? `₹ ${formatAmount(value)}` : String(value)}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <section className="card">
          {error && (
            <div className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{error}</div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-3 px-5 py-16 text-ink-700">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">Loading vendor payments...</span>
            </div>
          ) : rows.length === 0 ? (
            !error && (
              <div className="px-5 py-16 text-center text-sm text-ink-500">
                No payments found for the selected filters.
              </div>
            )
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    {columns.map((key) => (
                      <th key={key} className={isAmountKey(key) ? "text-right" : ""}>
                        {toLabel(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id || row._id || index}>
                      <td className="text-ink-500">{(page - 1) * filters.limit + index + 1}</td>
                      {columns.map((key) => (
                        <td
                          key={key}
                          className={
                            isAmountKey(key) && typeof row[key] !== "object"
                              ? "text-right tabular-nums"
                              : ""
                          }
                        >
                          {renderCell(key, row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-ink-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-ink-500">
              <span>Rows per page</span>
              <select
                value={filters.limit}
                onChange={(e) => updateFilter({ limit: Number(e.target.value) })}
                className="input w-20 py-1 text-xs"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {pagination.total !== null && <span>· {pagination.total} total</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || page <= 1}
                className="btn-outline btn-sm"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-ink-700">
                Page {page}
                {totalPages !== null ? ` of ${totalPages}` : ""}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || !hasNext}
                className="btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VendorPaymentDetails;
