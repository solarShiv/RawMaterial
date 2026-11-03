import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Api from "../../../../auth/Api";
import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  PackageOpen,
  FileText,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "Draft", label: "Draft" },
  { key: "PartiallyReceived", label: "Partially received" },
];

const getStatusLabel = (status) =>
  ({
    Draft: "Draft",
    PartiallyReceived: "Partially received",
    FullyReceived: "Fully received",
  }[status] || status || "N/A");

const getStatusBadgeClass = (status) => {
  switch (status) {
    case "PartiallyReceived":
      return "badge-yellow";
    case "FullyReceived":
      return "badge-green";
    default:
      return "badge-gray";
  }
};

const getApprovalBadgeClass = (status) => {
  switch (status) {
    case "Pending":
      return "badge-yellow";
    case "Approved":
      return "badge-green";
    case "Rejected":
      return "badge-red";
    default:
      return "badge-gray";
  }
};

const toText = (value) => (value == null ? "" : String(value)).toLowerCase();

// Ordered / received / pending totals across every item in a PO
const getPoTotals = (po) =>
  (po.items || []).reduce(
    (acc, item) => {
      acc.ordered += Number(item.quantity) || 0;
      acc.received += Number(item.receivedQty) || 0;
      acc.pending += Number(item.pendingQty) || 0;
      return acc;
    },
    { ordered: 0, received: 0, pending: 0 }
  );

const ProgressBar = ({ received, ordered }) => {
  const percent = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="mb-1 flex items-center justify-between text-xs tabular-nums">
        <span className="font-medium text-ink-800">
          {received} / {ordered}
        </span>
        <span className="font-semibold text-ink-900">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-200">
        <div
          className={`h-full rounded-full ${percent >= 100 ? "bg-green-500" : "bg-brand-400"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

const PoStockReceiving = () => {
  const [stockReceived, setStockReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFilter, setSearchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [approvalFilter, setApprovalFilter] = useState("all");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Api.get("/store-keeper/getPendingPOsForReceiving");
      if (response.data.success) {
        setStockReceived(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to fetch data");
      }
    } catch (err) {
      console.error("Error fetching PO data:", err);
      setError("Failed to fetch PO data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter data based on search criteria
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return stockReceived.filter((po) => {
      if (statusFilter !== "all" && po.status !== statusFilter) return false;
      if (approvalFilter !== "all" && po.approvalStatus !== approvalFilter) return false;
      if (!term) return true;

      switch (searchFilter) {
        case "poNumber":
          return toText(po.poNumber).includes(term);
        case "company":
          return toText(po.companyName).includes(term);
        case "vendor":
          return toText(po.vendorName).includes(term);
        case "item":
          return (po.items || []).some(
            (item) =>
              toText(item.itemName).includes(term) ||
              toText(item.modelNumber).includes(term) ||
              toText(item.hsnCode).includes(term)
          );
        case "all":
        default:
          return (
            toText(po.poNumber).includes(term) ||
            toText(po.companyName).includes(term) ||
            toText(po.vendorName).includes(term) ||
            toText(po.status).includes(term) ||
            (po.items || []).some(
              (item) =>
                toText(item.itemName).includes(term) ||
                toText(item.modelNumber).includes(term) ||
                toText(item.hsnCode).includes(term)
            )
          );
      }
    });
  }, [stockReceived, searchTerm, searchFilter, statusFilter, approvalFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [searchTerm, searchFilter, statusFilter, approvalFilter, itemsPerPage]);

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    setExpandedRows(new Set()); // Close all expanded rows when changing page
  };

  const toggleRowExpand = (id) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleReceiveStock = (po) => {
    try {
      navigate("../received-purchase-stock", {
        state: {
          poData: po,
          poId: po.id,
        },
      });
    } catch (err) {
      console.error("Navigation error:", err);
      setError("Failed to navigate to receive stock page");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearchFilter("all");
    setStatusFilter("all");
    setApprovalFilter("all");
  };

  const hasFilters = searchTerm || statusFilter !== "all" || approvalFilter !== "all";

  const stats = useMemo(() => {
    const counts = { Draft: 0, PartiallyReceived: 0 };
    stockReceived.forEach((po) => {
      if (counts[po.status] !== undefined) counts[po.status]++;
    });
    return counts;
  }, [stockReceived]);

  const statusCount = (key) =>
    key === "all" ? stockReceived.length : stats[key] ?? 0;

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    startPage = Math.max(1, endPage - maxPagesToShow + 1);

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return pageNumbers;
  };

  const statCards = [
    {
      label: "Pending POs",
      value: stockReceived.length,
      icon: <ClipboardList className="h-5 w-5" />,
      tone: "bg-ink-950 text-brand-400",
      filter: "all",
    },
    {
      label: "Draft",
      value: stats.Draft,
      icon: <FileText className="h-5 w-5" />,
      tone: "bg-ink-100 text-ink-700",
      filter: "Draft",
    },
    {
      label: "Partially received",
      value: stats.PartiallyReceived,
      icon: <PackageOpen className="h-5 w-5" />,
      tone: "bg-brand-100 text-brand-700",
      filter: "PartiallyReceived",
    },
  ];

  const ItemsTable = ({ items }) => (
    <div className="overflow-x-auto rounded-lg border border-ink-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
          <tr>
            <th className="px-4 py-2">Item</th>
            <th className="px-4 py-2">HSN</th>
            <th className="px-4 py-2">Model</th>
            <th className="px-4 py-2">Unit</th>
            <th className="px-4 py-2 text-right">Ordered</th>
            <th className="px-4 py-2 text-right">Received</th>
            <th className="px-4 py-2 text-right">Pending</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t border-ink-100">
              <td className="px-4 py-2 font-medium text-ink-900">{item.itemName}</td>
              <td className="px-4 py-2 text-ink-600">{item.hsnCode || "—"}</td>
              <td className="px-4 py-2 text-ink-600">{item.modelNumber || "—"}</td>
              <td className="px-4 py-2 text-ink-600">{item.unit || "—"}</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink-900">{item.quantity}</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums text-green-700">{item.receivedQty}</td>
              <td className="px-4 py-2 text-right font-semibold tabular-nums text-orange-600">{item.pendingQty}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-ink-200 border-t-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="card mx-auto max-w-xl p-6 text-center">
          <p className="font-semibold text-red-600">{error}</p>
          <button onClick={fetchData} className="btn-outline mt-4">
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {statCards.map((card) => {
            const active = card.filter && statusFilter === card.filter;
            const Tag = card.filter ? "button" : "div";
            return (
              <Tag
                key={card.label}
                {...(card.filter && { type: "button", onClick: () => setStatusFilter(card.filter) })}
                className={`card flex items-center justify-between gap-3 p-4 text-left transition ${
                  card.filter ? "hover:border-ink-300" : ""
                } ${active ? "!border-brand-400 ring-2 ring-brand-400/40" : ""}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-ink-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-ink-950">{card.value}</p>
                </div>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                  {card.icon}
                </span>
              </Tag>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="card p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] lg:items-end">
            <div>
              <label className="label">Search</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  className="input pl-9"
                  placeholder="PO number, vendor, company or item…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Search in</label>
              <select className="input" value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)}>
                <option value="all">All fields</option>
                <option value="poNumber">PO Number</option>
                <option value="company">Company</option>
                <option value="vendor">Vendor</option>
                <option value="item">Item / Model / HSN</option>
              </select>
            </div>
            <div>
              <label className="label">Approval</label>
              <select className="input" value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="btn-outline">
                <X className="h-4 w-4" /> Clear
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === tab.key
                    ? "bg-ink-950 text-brand-400"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-200"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 tabular-nums ${
                    statusFilter === tab.key ? "bg-brand-400 text-ink-950" : "bg-white text-ink-600"
                  }`}
                >
                  {statusCount(tab.key)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* PO list */}
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-950">POs awaiting receipt</h2>
              <p className="text-xs text-ink-500">
                {filteredData.length === 0
                  ? "No results"
                  : `Showing ${(currentPage - 1) * itemsPerPage + 1}–${Math.min(
                      currentPage * itemsPerPage,
                      filteredData.length
                    )} of ${filteredData.length}`}
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs text-ink-500">
              Rows per page
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="input h-8 w-20 py-0 text-xs"
              >
                {[10, 25, 50, 100, 250].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredData.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                <PackageCheck className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-800">
                {stockReceived.length === 0 ? "Nothing pending to receive" : "No POs match your filters"}
              </p>
              <p className="text-sm text-ink-500">
                {stockReceived.length === 0
                  ? "All purchase orders have been fully received."
                  : "Try changing your search or filters."}
              </p>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="btn-outline mt-4">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="w-10" />
                      <th>Purchase Order</th>
                      <th>Vendor</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Received</th>
                      <th className="!text-right">Pending</th>
                      <th className="!text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((po) => {
                      const totals = getPoTotals(po);
                      const expanded = expandedRows.has(po.id);
                      return (
                        <React.Fragment key={po.id}>
                          <tr className={expanded ? "!bg-brand-50" : ""}>
                            <td>
                              <button
                                type="button"
                                onClick={() => toggleRowExpand(po.id)}
                                aria-label={expanded ? "Hide items" : "View items"}
                                aria-expanded={expanded}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                                />
                              </button>
                            </td>
                            <td>
                              <div className="whitespace-nowrap font-semibold text-ink-950">{po.poNumber}</div>
                              <div className="text-xs text-ink-500">{po.items?.length ?? 0} item(s)</div>
                            </td>
                            <td className="min-w-[160px] max-w-[260px] break-words font-medium text-ink-900">
                              {po.vendorName || "N/A"}
                            </td>
                            <td className="min-w-[160px] max-w-[260px] break-words font-medium text-ink-800">
                              {po.companyName || "N/A"}
                            </td>
                            <td>
                              <div className="flex flex-col items-start gap-1">
                                <span className={`whitespace-nowrap ${getStatusBadgeClass(po.status)}`}>
                                  {getStatusLabel(po.status)}
                                </span>
                                {po.approvalStatus && po.approvalStatus !== "Approved" && (
                                  <span className={`whitespace-nowrap ${getApprovalBadgeClass(po.approvalStatus)}`}>
                                    Approval: {po.approvalStatus}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>
                              <ProgressBar received={totals.received} ordered={totals.ordered} />
                            </td>
                            <td className="text-right font-semibold tabular-nums text-orange-600">
                              {totals.pending}
                            </td>
                            <td className="text-right">
                              <button
                                type="button"
                                onClick={() => handleReceiveStock(po)}
                                className="btn-primary whitespace-nowrap px-3 py-1.5"
                              >
                                <PackageCheck className="h-4 w-4" /> Receive
                              </button>
                            </td>
                          </tr>
                          {expanded && (
                            <tr className="hover:!bg-transparent">
                              <td colSpan={8} className="bg-ink-50 !py-4">
                                <ItemsTable items={po.items || []} />
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
                {currentItems.map((po) => {
                  const totals = getPoTotals(po);
                  const expanded = expandedRows.has(po.id);
                  return (
                    <div key={po.id} className="rounded-xl border border-ink-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="break-words font-bold text-ink-950">{po.poNumber}</div>
                          <div className="text-xs text-ink-500">{po.items?.length ?? 0} item(s)</div>
                        </div>
                        <span className={`shrink-0 ${getStatusBadgeClass(po.status)}`}>
                          {getStatusLabel(po.status)}
                        </span>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="break-words font-medium text-ink-900">{po.vendorName || "N/A"}</div>
                        <div className="break-words text-xs text-ink-500">{po.companyName || "N/A"}</div>
                      </div>

                      <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2">
                        <ProgressBar received={totals.received} ordered={totals.ordered} />
                        <div className="mt-1.5 text-xs text-ink-500">
                          Pending:{" "}
                          <span className="font-semibold tabular-nums text-orange-600">{totals.pending}</span>
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-3 space-y-2">
                          {(po.items || []).map((item) => (
                            <div key={item.id} className="rounded-lg border border-ink-200 px-3 py-2 text-xs">
                              <div className="font-semibold text-ink-900">{item.itemName}</div>
                              <div className="text-ink-500">
                                {[item.modelNumber, item.hsnCode && `HSN ${item.hsnCode}`, item.unit]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </div>
                              <div className="mt-1 flex gap-3 tabular-nums">
                                <span>Ordered <b className="text-ink-900">{item.quantity}</b></span>
                                <span>Received <b className="text-green-700">{item.receivedQty}</b></span>
                                <span>Pending <b className="text-orange-600">{item.pendingQty}</b></span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => toggleRowExpand(po.id)} className="btn-outline flex-1">
                          {expanded ? "Hide items" : "View items"}
                        </button>
                        <button type="button" onClick={() => handleReceiveStock(po)} className="btn-primary flex-1">
                          <PackageCheck className="h-4 w-4" /> Receive
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-ink-200 px-4 py-3 sm:flex-row">
                <span className="text-xs text-ink-500">
                  Page <span className="font-semibold text-ink-900">{currentPage}</span> of{" "}
                  <span className="font-semibold text-ink-900">{totalPages}</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                    className="flex h-8 items-center gap-1 rounded-md border border-ink-200 px-2 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
                  </button>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-current={currentPage === page ? "page" : undefined}
                      className={`h-8 min-w-8 rounded-md px-2.5 text-xs font-semibold ${
                        currentPage === page
                          ? "bg-ink-950 text-brand-400"
                          : "border border-ink-200 text-ink-700 hover:bg-ink-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                    className="flex h-8 items-center gap-1 rounded-md border border-ink-200 px-2 text-xs font-semibold text-ink-700 hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoStockReceiving;
