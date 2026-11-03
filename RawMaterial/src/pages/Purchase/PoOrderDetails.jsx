import React, { useEffect, useState, useMemo } from "react";
import Api from "../../auth/Api";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  X,
  Download,
  Package,
  PackageCheck,
  PackageOpen,
  Clock,
  Warehouse,
  CalendarDays,
  MessageSquarePlus,
  History,
  Inbox,
  AlertTriangle,
  FileText,
} from "lucide-react";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "partial", label: "Partially Received" },
  { key: "received", label: "Received" },
];

const statusGroup = (status) => {
  if (status === "PartiallyReceived") return "partial";
  if (status === "FullyReceived" || status === "Received") return "received";
  return "pending";
};

const PoOrderDetails = () => {
  const [stockReceived, setStockReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState(""); // "" means "All"
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [flowUps, setFlowUps] = useState({});
  // Per-row download loading state
  const [downloadingPdf, setDownloadingPdf] = useState({});

  // Follow-up modal state
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null); // { id, vendorId, poNumber }
  const [followUpData, setFollowUpData] = useState({
    expectedDeliveryDate: "",
    remark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await Api.get("/purchase/purchase-orders/receiving");
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

    fetchData();
  }, []);

  // Download as PDF – per-row loading
  const handleDownload = async (poId, poName) => {
    if (!poId) return;

    setDownloadingPdf((prev) => ({ ...prev, [poId]: true }));

    try {
      const response = await Api.post(
        `/purchase/purchase-orders/download/${poId}`,
        {},
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${poName}.pdf`);

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);

      if (error.response) {
        if (error.response.status === 404) {
          alert("PDF file not found for this purchase order");
        } else if (error.response.status === 500) {
          alert("Server error while generating PDF. Please try again.");
        } else {
          alert(
            `Error downloading PDF: ${error.response.status} ${error.response.statusText}`,
          );
        }
      } else if (error.request) {
        alert("Network error. Please check your connection and try again.");
      } else {
        alert("Error downloading PDF. Please try again.");
      }
    } finally {
      setDownloadingPdf((prev) => ({ ...prev, [poId]: false }));
    }
  };

  const fetchFlowUp = async (poId, forceRefresh = false) => {
    if (!forceRefresh && flowUps[poId]) {
      setFlowUps((prev) => {
        const updated = { ...prev };
        delete updated[poId];
        return updated;
      });
      return;
    }

    try {
      const response = await Api.get(
        `/common/purchase-orders/${poId}/follow-ups`,
      );

      if (response.data.success) {
        setFlowUps((prev) => ({
          ...prev,
          [poId]: response.data.data || [],
        }));
      }
    } catch (err) {
      console.error("Error fetching follow-ups:", err);
    }
  };

  // Extract unique warehouses from the data (handle null/empty)
  const warehouseOptions = useMemo(() => {
    const warehouses = new Set();
    stockReceived.forEach((po) => {
      const name = po.warehouseName?.trim();
      warehouses.add(name || "__none__");
    });
    return Array.from(warehouses).map((w) => ({
      value: w,
      label: w === "__none__" ? "No Warehouse" : w,
    }));
  }, [stockReceived]);

  // Filter data based on search term, warehouse and status
  const filteredData = useMemo(() => {
    return stockReceived.filter((po) => {
      if (warehouseFilter) {
        const poWarehouse = po.warehouseName?.trim();
        if (warehouseFilter === "__none__") {
          if (poWarehouse) return false;
        } else if (poWarehouse !== warehouseFilter) {
          return false;
        }
      }

      if (statusFilter && statusGroup(po.status) !== statusFilter) return false;

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        po.poNumber?.toLowerCase().includes(term) ||
        po.companyName?.toLowerCase().includes(term) ||
        po.vendorName?.toLowerCase().includes(term) ||
        po.warehouseName?.toLowerCase().includes(term) ||
        po.status?.toLowerCase().includes(term) ||
        po.items?.some(
          (item) =>
            item.itemName?.toLowerCase().includes(term) ||
            item.modelNumber?.toLowerCase().includes(term) ||
            item.hsnCode?.toString().toLowerCase().includes(term),
        )
      );
    });
  }, [stockReceived, searchTerm, warehouseFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const currentItems = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredData.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredData, currentPage, itemsPerPage]);

  const counts = useMemo(
    () =>
      stockReceived.reduce(
        (acc, po) => {
          acc[statusGroup(po.status)] += 1;
          return acc;
        },
        { pending: 0, partial: 0, received: 0 },
      ),
    [stockReceived],
  );

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    setExpandedRows(new Set());
  };

  const toggleRowExpand = (id) => {
    const newExpandedRows = new Set(expandedRows);
    newExpandedRows.has(id) ? newExpandedRows.delete(id) : newExpandedRows.add(id);
    setExpandedRows(newExpandedRows);
  };

  // Follow-up handlers
  const flowUpData = (poId, vendorId, poNumber) => {
    setSelectedPo({ id: poId, vendorId, poNumber });
    setFollowUpData({ expectedDeliveryDate: "", remark: "" });
    setModalMessage({ type: "", text: "" });
    setShowFollowUpModal(true);
  };

  const handleFollowUpChange = (e) => {
    const { name, value } = e.target;
    setFollowUpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFollowUpSubmit = async (e) => {
    e.preventDefault();
    if (!followUpData.expectedDeliveryDate) {
      setModalMessage({ type: "error", text: "Expected delivery date is required." });
      return;
    }
    if (!followUpData.remark.trim()) {
      setModalMessage({ type: "error", text: "Remark is required." });
      return;
    }

    setSubmitting(true);
    setModalMessage({ type: "", text: "" });

    try {
      const payload = {
        purchaseOrderId: selectedPo.id,
        vendorId: selectedPo.vendorId,
        expectedDeliveryDate: new Date(followUpData.expectedDeliveryDate).toISOString(),
        remark: followUpData.remark.trim(),
      };
      const response = await Api.post("/common/purchase-orders/follow-up", payload);
      if (response.data.success) {
        await fetchFlowUp(selectedPo.id, true);
        setModalMessage({ type: "success", text: "Follow-up submitted successfully!" });
        setTimeout(() => {
          setShowFollowUpModal(false);
          setSelectedPo(null);
          setFollowUpData({ expectedDeliveryDate: "", remark: "" });
        }, 1500);
      } else {
        setModalMessage({
          type: "error",
          text: response.data.message || "Failed to submit follow-up.",
        });
      }
    } catch (err) {
      console.error("Error submitting follow-up:", err);
      setModalMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (!submitting) {
      setShowFollowUpModal(false);
      setSelectedPo(null);
      setModalMessage({ type: "", text: "" });
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "PartiallyReceived":
        return "badge-yellow";
      case "FullyReceived":
      case "Received":
        return "badge-green";
      default:
        return "badge-gray";
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case "PartiallyReceived":
        return "Partially Received";
      case "FullyReceived":
        return "Fully Received";
      default:
        return status;
    }
  };

  const getProgress = (po) => {
    const ordered = (po.items || []).reduce((s, i) => s + (Number(i.quantity) || 0), 0);
    const received = (po.items || []).reduce((s, i) => s + (Number(i.receivedQty) || 0), 0);
    const pct = ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0;
    return { ordered, received, pct };
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A";

  const clearFilters = () => {
    setSearchTerm("");
    setWarehouseFilter("");
    setStatusFilter("");
    setCurrentPage(1);
  };

  const hasFilters = searchTerm || warehouseFilter || statusFilter;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  // ---------- Small pieces ----------
  const ProgressBar = ({ po }) => {
    const { ordered, received, pct } = getProgress(po);
    return (
      <div className="min-w-[120px]">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-ink-500">
            {received.toLocaleString()} / {ordered.toLocaleString()}
          </span>
          <span className="font-semibold text-ink-800">{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
          <div
            className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : pct > 0 ? "bg-brand-400" : "bg-ink-300"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  const ActionButtons = ({ po, full = false }) => {
    const itemsOpen = expandedRows.has(po.id);
    const historyOpen = !!flowUps[po.id];
    const base = `btn py-1.5 px-2.5 text-xs border ${full ? "flex-1" : ""}`;
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${full ? "" : "justify-end"}`}>
        <button
          onClick={() => toggleRowExpand(po.id)}
          className={`${base} ${itemsOpen ? "bg-ink-950 text-brand-400 border-ink-950" : "bg-white text-ink-800 border-ink-300 hover:bg-ink-100"}`}
        >
          <Package className="h-3.5 w-3.5" /> Items
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${itemsOpen ? "rotate-180" : ""}`} />
        </button>
        <button
          onClick={() => fetchFlowUp(po.id)}
          className={`${base} ${historyOpen ? "bg-ink-950 text-brand-400 border-ink-950" : "bg-white text-ink-800 border-ink-300 hover:bg-ink-100"}`}
        >
          <History className="h-3.5 w-3.5" /> History
        </button>
        {po.status !== "Received" && (
          <button
            onClick={() => flowUpData(po.id, po.vendorId, po.poNumber)}
            className={`${base} bg-brand-400 text-ink-950 border-brand-400 hover:bg-brand-500`}
          >
            <MessageSquarePlus className="h-3.5 w-3.5" /> Follow Up
          </button>
        )}
        <button
          onClick={() => handleDownload(po.id, po.poNumber)}
          disabled={downloadingPdf[po.id] || false}
          className={`${base} bg-white text-ink-700 border-ink-300 hover:bg-ink-100 ${full ? "!flex-none" : ""}`}
          title="Download PDF"
        >
          {downloadingPdf[po.id] ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          PDF
        </button>
      </div>
    );
  };

  const ItemsPanel = ({ po }) => (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <Package className="h-4 w-4" /> Items ({po.items.length})
      </div>

      {/* Table on md+, stacked list on mobile */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-ink-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-100 text-[11px] uppercase tracking-wider text-ink-600">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">Item Name</th>
              <th className="px-3 py-2 text-left font-semibold">HSN</th>
              <th className="px-3 py-2 text-left font-semibold">Model</th>
              <th className="px-3 py-2 text-left font-semibold">Unit</th>
              <th className="px-3 py-2 text-right font-semibold">Ordered</th>
              <th className="px-3 py-2 text-right font-semibold">Received</th>
              <th className="px-3 py-2 text-right font-semibold">Pending</th>
              <th className="px-3 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {po.items.map((item) => {
              const isFull = item.receivedQty >= item.quantity;
              const isPartial = item.receivedQty > 0 && item.receivedQty < item.quantity;
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-medium text-ink-900 break-words min-w-[200px]">{item.itemName}</td>
                  <td className="px-3 py-2 text-ink-600">{item.hsnCode || "N/A"}</td>
                  <td className="px-3 py-2 text-ink-600 break-words">{item.modelNumber || "N/A"}</td>
                  <td className="px-3 py-2 text-ink-600">{item.unit}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{item.quantity.toLocaleString()}</td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${isFull ? "text-green-600" : isPartial ? "text-brand-600" : "text-ink-500"}`}>
                    {item.receivedQty.toLocaleString()}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold tabular-nums ${item.pendingQty > 0 ? "text-orange-600" : "text-green-600"}`}>
                    {item.pendingQty.toLocaleString()}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`${isFull ? "badge-green" : isPartial ? "badge-yellow" : "badge-gray"} whitespace-nowrap`}>
                      {isFull ? "Fully Received" : isPartial ? "Partially Received" : "Not Received"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden space-y-2">
        {po.items.map((item) => {
          const isFull = item.receivedQty >= item.quantity;
          const isPartial = item.receivedQty > 0 && item.receivedQty < item.quantity;
          return (
            <li key={item.id} className="rounded-lg border border-ink-200 bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 font-medium text-ink-900 break-words">{item.itemName}</div>
                <span className={`${isFull ? "badge-green" : isPartial ? "badge-yellow" : "badge-gray"} shrink-0`}>
                  {isFull ? "Full" : isPartial ? "Partial" : "Not Received"}
                </span>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                HSN {item.hsnCode || "N/A"} · {item.modelNumber || "N/A"} · {item.unit}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded bg-ink-50 py-1.5">
                  <div className="text-ink-500">Ordered</div>
                  <div className="font-bold text-ink-900">{item.quantity.toLocaleString()}</div>
                </div>
                <div className="rounded bg-green-50 py-1.5">
                  <div className="text-ink-500">Received</div>
                  <div className="font-bold text-green-700">{item.receivedQty.toLocaleString()}</div>
                </div>
                <div className="rounded bg-orange-50 py-1.5">
                  <div className="text-ink-500">Pending</div>
                  <div className="font-bold text-orange-700">{item.pendingQty.toLocaleString()}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  const HistoryPanel = ({ po }) => (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-900">
        <History className="h-4 w-4" /> Follow-up History
      </div>
      {flowUps[po.id].length === 0 ? (
        <p className="rounded-lg border border-dashed border-ink-300 bg-white px-3 py-4 text-center text-sm text-ink-500">
          No follow-ups yet
        </p>
      ) : (
        <ol className="relative space-y-3 border-l-2 border-ink-200 pl-5">
          {flowUps[po.id].map((f) => (
            <li key={f.id} className="relative rounded-lg border border-ink-200 bg-white p-3">
              <span className="absolute -left-[27px] top-4 h-3 w-3 rounded-full border-2 border-white bg-brand-400 ring-2 ring-brand-200" />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-900">
                  <CalendarDays className="h-4 w-4 text-ink-400" />
                  Expected: {formatDate(f.expectedDeliveryDate)}
                </span>
                <span className="text-xs text-ink-500">
                  {f.createdBy} · {new Date(f.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-ink-700 break-words">{f.remark}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );

  const ExpandedPanels = ({ po }) =>
    (expandedRows.has(po.id) || flowUps[po.id]) && (
      <div className="space-y-5">
        {expandedRows.has(po.id) && <ItemsPanel po={po} />}
        {flowUps[po.id] && <HistoryPanel po={po} />}
      </div>
    );

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
        <div className="card space-y-3 p-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-ink-100" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="card card-body mx-auto max-w-lg text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink-900">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-dark mt-4">
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { key: "", label: "Total POs", value: stockReceived.length, icon: FileText, tone: "bg-ink-100 text-ink-700" },
    { key: "pending", label: "Pending", value: counts.pending, icon: Clock, tone: "bg-ink-100 text-ink-600" },
    { key: "partial", label: "Partially Received", value: counts.partial, icon: PackageOpen, tone: "bg-brand-100 text-brand-700" },
    { key: "received", label: "Received", value: counts.received, icon: PackageCheck, tone: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const active = statusFilter === s.key;
          return (
            <button
              key={s.label}
              onClick={() => {
                setStatusFilter(s.key);
                setCurrentPage(1);
              }}
              className={`card flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:border-ink-300 ${
                active ? "ring-2 ring-brand-400 border-brand-400" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-ink-500 truncate">{s.label}</div>
                <div className="text-2xl font-bold tabular-nums text-ink-950">{s.value}</div>
              </div>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="card p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              className="input h-10 pl-9 pr-9"
              placeholder="Search PO, vendor, company, item, model, HSN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
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

          <div className="relative">
            <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <select
              className="input h-10 pl-9"
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Warehouses</option>
              {warehouseOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <select
            className="input h-10"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.key ? f.label : "All Statuses"}
              </option>
            ))}
          </select>

          <select
            className="input h-10"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 25, 50, 100, 250].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-500">
          <span>
            Showing <span className="font-semibold text-ink-900">{filteredData.length}</span> of{" "}
            <span className="font-semibold text-ink-900">{stockReceived.length}</span> purchase orders
          </span>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="font-semibold text-ink-900 underline underline-offset-2 hover:text-brand-600"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="card py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink-800">No purchase orders found</p>
          {hasFilters && <p className="text-sm text-ink-500">Try adjusting your filters.</p>}
          {hasFilters && (
            <button onClick={clearFilters} className="btn-dark mt-4">
              Clear All Filters
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
                  <th>PO Details</th>
                  <th>Vendor / Company</th>
                  <th>Warehouse</th>
                  <th>Status</th>
                  <th>Received</th>
                  <th>Last Update</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((po) => {
                  const open = expandedRows.has(po.id) || !!flowUps[po.id];
                  return (
                    <React.Fragment key={po.id}>
                      <tr className={open ? "bg-brand-50" : ""}>
                        <td className="whitespace-nowrap">
                          <div className="font-semibold text-ink-950">{po.poNumber}</div>
                          <div className="text-xs text-ink-500">{formatDate(po.poDate)}</div>
                        </td>
                        <td className="min-w-[220px]">
                          <div className="font-medium text-ink-900 break-words">{po.vendorName}</div>
                          {po.companyName && <div className="text-xs text-ink-500 break-words">{po.companyName}</div>}
                        </td>
                        <td className="text-ink-700">{po.warehouseName || "N/A"}</td>
                        <td>
                          <span className={`${getStatusBadgeClass(po.status)} whitespace-nowrap`}>
                            {getStatusDisplay(po.status)}
                          </span>
                          {po.approvalStatus && po.approvalStatus !== "Pending" && (
                            <div className="mt-1 text-[11px] text-ink-500">{po.approvalStatus}</div>
                          )}
                        </td>
                        <td>
                          <ProgressBar po={po} />
                          <div className="mt-1 text-[11px] text-ink-400">{po.items.length} item(s)</div>
                        </td>
                        <td className="whitespace-nowrap text-ink-600">{formatDate(po.date)}</td>
                        <td>
                          <ActionButtons po={po} />
                        </td>
                      </tr>
                      {open && (
                        <tr className="!bg-ink-50">
                          <td colSpan={7} className="!py-5">
                            <ExpandedPanels po={po} />
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
            {currentItems.map((po) => {
              const open = expandedRows.has(po.id) || !!flowUps[po.id];
              return (
                <div key={po.id} className={`card overflow-hidden ${open ? "md:col-span-2" : ""}`}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-ink-950 break-words">{po.poNumber}</div>
                        <div className="text-xs text-ink-500">{formatDate(po.poDate)}</div>
                      </div>
                      <span className={`${getStatusBadgeClass(po.status)} shrink-0`}>{getStatusDisplay(po.status)}</span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-sm">
                      <div className="font-medium text-ink-900 break-words">{po.vendorName}</div>
                      {po.companyName && <div className="text-xs text-ink-500 break-words">{po.companyName}</div>}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
                        <span className="inline-flex items-center gap-1">
                          <Warehouse className="h-3.5 w-3.5" /> {po.warehouseName || "N/A"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" /> Updated {formatDate(po.date)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2.5">
                      <ProgressBar po={po} />
                    </div>

                    <div className="mt-3">
                      <ActionButtons po={po} full />
                    </div>
                  </div>

                  {open && (
                    <div className="border-t border-ink-200 bg-ink-50 p-4">
                      <ExpandedPanels po={po} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="card flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
            <p className="text-sm text-ink-600">
              Showing{" "}
              <span className="font-semibold text-ink-900">{(currentPage - 1) * itemsPerPage + 1}</span>–
              <span className="font-semibold text-ink-900">
                {Math.min(currentPage * itemsPerPage, filteredData.length)}
              </span>{" "}
              of <span className="font-semibold text-ink-900">{filteredData.length}</span>
            </p>

            <div className="flex items-center gap-1">
              {[
                { icon: ChevronsLeft, go: 1, disabled: currentPage === 1, label: "First page" },
                { icon: ChevronLeft, go: currentPage - 1, disabled: currentPage === 1, label: "Previous page" },
              ].map(({ icon: Icon, go, disabled, label }) => (
                <button
                  key={label}
                  onClick={() => goToPage(go)}
                  disabled={disabled}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
              {getPageNumbers().map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  aria-current={currentPage === pageNum ? "page" : undefined}
                  className={`h-8 min-w-8 rounded-md px-2.5 text-sm font-semibold ${
                    currentPage === pageNum
                      ? "bg-ink-950 text-brand-400"
                      : "border border-ink-200 text-ink-700 hover:bg-ink-100"
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              {[
                { icon: ChevronRight, go: currentPage + 1, disabled: currentPage === totalPages, label: "Next page" },
                { icon: ChevronsRight, go: totalPages, disabled: currentPage === totalPages, label: "Last page" },
              ].map(({ icon: Icon, go, disabled, label }) => (
                <button
                  key={label}
                  onClick={() => goToPage(go)}
                  disabled={disabled}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-ink-200 text-ink-600 hover:bg-ink-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm text-ink-600">
              Go to
              <input
                type="number"
                min="1"
                max={totalPages}
                defaultValue={currentPage}
                key={currentPage}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToPage(parseInt(e.currentTarget.value, 10));
                }}
                onBlur={(e) => goToPage(parseInt(e.currentTarget.value, 10))}
                className="input h-8 w-16 px-2 py-0 text-center"
                aria-label="Jump to page"
              />
              of {totalPages}
            </div>
          </div>
        </>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={closeModal} />

          <div className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-pop animate-slideDown">
            <div className="flex items-start justify-between gap-3 border-b border-ink-200 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-ink-950">Purchase Order Follow-up</h3>
                {selectedPo?.poNumber && <p className="text-xs text-ink-500">PO {selectedPo.poNumber}</p>}
              </div>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex h-8 w-8 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFollowUpSubmit} className="space-y-4 px-5 py-5">
              {modalMessage.text && (
                <div
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    modalMessage.type === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-red-200 bg-red-50 text-red-800"
                  }`}
                >
                  {modalMessage.text}
                </div>
              )}

              <div>
                <label htmlFor="expectedDeliveryDate" className="label">
                  Expected Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="expectedDeliveryDate"
                  name="expectedDeliveryDate"
                  value={followUpData.expectedDeliveryDate}
                  onChange={handleFollowUpChange}
                  required
                  className="input h-10"
                />
              </div>

              <div>
                <label htmlFor="remark" className="label">
                  Remark <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="remark"
                  name="remark"
                  rows="3"
                  value={followUpData.remark}
                  onChange={handleFollowUpChange}
                  required
                  placeholder="Add any remarks or notes..."
                  className="input resize-none"
                />
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModal} disabled={submitting} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Submitting..." : "Submit Follow-up"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PoOrderDetails;
