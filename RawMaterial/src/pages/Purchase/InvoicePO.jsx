import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";
import {
  Search,
  X,
  Store,
  ChevronDown,
  FileText,
  FileImage,
  File,
  Eye,
  Download,
  Inbox,
  AlertTriangle,
  Loader2,
  ClipboardList,
  Files,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";

const PO_FILTERS = [
  { key: "all", label: "All" },
  { key: "with", label: "With invoices" },
  { key: "without", label: "Without invoices" },
];

const InvoicePO = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorName, setSelectedVendorName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const vendorBoxRef = useRef(null);

  // Invoice state
  const [invoices, setInvoices] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);
  const [expandedPOs, setExpandedPOs] = useState({});
  const [poSearch, setPoSearch] = useState("");
  const [poFilter, setPoFilter] = useState("all");

  // Fetch all vendors on component mount
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        setLoading(true);
        const response = await Api.get("/purchase/vendors");

        if (response.data.success) {
          setVendors(response?.data?.data || []);
        } else {
          setError("Failed to fetch vendors: " + response?.data?.message);
        }
      } catch (err) {
        setError("Error fetching vendors: " + (err?.response?.data?.message || err?.message));
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!selectedVendor) {
        setInvoices([]);
        return;
      }

      try {
        setInvoiceLoading(true);
        setInvoiceError(null);
        const response = await Api.get(`/common/vendors/invoices?vendorId=${selectedVendor}`);

        if (response.data.success) {
          setInvoices(response.data.data || []);
        } else {
          setInvoiceError("Failed to fetch invoices");
        }
      } catch (err) {
        setInvoiceError("Error fetching invoices: " + (err?.response?.data?.message || err.message));
      } finally {
        setInvoiceLoading(false);
      }
    };

    fetchInvoices();
  }, [selectedVendor]);

  // Close the vendor dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (vendorBoxRef.current && !vendorBoxRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Filter vendors based on search term
  const filteredVendors = vendors.filter((vendor) =>
    vendor.displayName?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handle vendor selection
  const handleVendorSelect = (vendorId, displayName) => {
    setSelectedVendor(vendorId);
    setSelectedVendorName(displayName);
    setSearchTerm(displayName);
    setIsDropdownOpen(false);
    setExpandedPOs({});
    setPoSearch("");
    setPoFilter("all");
  };

  // Handle input change for search
  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedVendor("");
    setSelectedVendorName("");
    setInvoices([]);
    if (!isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  // Toggle PO expansion
  const togglePOExpansion = (poId) => {
    setExpandedPOs((prev) => ({
      ...prev,
      [poId]: !prev[poId],
    }));
  };

  // Clear selection
  const handleClear = () => {
    setSelectedVendor("");
    setSelectedVendorName("");
    setSearchTerm("");
    setInvoices([]);
  };

  // Helper: determine file type from URL
  const getFileType = (url) => {
    if (!url) return "unknown";
    const extension = url.split("?")[0].split(".").pop().toLowerCase();
    if (extension === "pdf") return "pdf";
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];
    if (imageExtensions.includes(extension)) return "image";
    return "other";
  };

  // Format the full URL for invoice file
  const getInvoiceUrl = (invoiceUrl) => {
    try {
      if (!invoiceUrl) {
        console.warn("Invoice URL is empty");
        return "";
      }

      if (invoiceUrl.startsWith("http://") || invoiceUrl.startsWith("https://")) {
        return invoiceUrl;
      }

      let baseURL = "";
      if (typeof Api === "string") {
        baseURL = Api;
      } else if (Api.defaults && Api.defaults.baseURL) {
        baseURL = Api.defaults.baseURL;
      } else if (import.meta.env.VITE_API_URL) {
        baseURL = import.meta.env.VITE_API_URL;
      } else {
        baseURL = window.location.origin;
      }

      // Normalize slashes
      let normalizedInvoiceUrl = invoiceUrl;
      if (!normalizedInvoiceUrl.startsWith("/") && !baseURL.endsWith("/")) {
        normalizedInvoiceUrl = "/" + normalizedInvoiceUrl;
      }
      if (baseURL.endsWith("/") && normalizedInvoiceUrl.startsWith("/")) {
        normalizedInvoiceUrl = normalizedInvoiceUrl.substring(1);
      }

      return `${baseURL}${normalizedInvoiceUrl}`;
    } catch (error) {
      console.error("Error constructing invoice URL:", error);
      return "";
    }
  };

  // Handle file view (PDF or image)
  const handleViewFile = (invoiceUrl, invoiceNumber) => {
    const url = getInvoiceUrl(invoiceUrl);
    if (!url) {
      alert(`Unable to load file for invoice ${invoiceNumber}. The file URL is not available.`);
      return;
    }
    window.open(url, "_blank");
  };

  // Handle file download (keeps the file's real extension)
  const handleDownloadFile = (invoiceUrl, invoiceNumber) => {
    const url = getInvoiceUrl(invoiceUrl);
    if (!url) {
      alert(`Unable to download file for invoice ${invoiceNumber}. The file URL is not available.`);
      return;
    }
    const ext = invoiceUrl.split("?")[0].split(".").pop() || "pdf";
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice_${invoiceNumber}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get file name from URL
  const getFileName = (url) => {
    if (!url) return "Unknown file";
    const parts = url.split("/");
    return parts[parts.length - 1] || "invoice.pdf";
  };

  // ---------- Derived ----------
  const totalInvoices = invoices.reduce((total, po) => total + (po.invoices?.length || 0), 0);
  const withInvoices = invoices.filter((po) => po.invoices?.length > 0).length;

  const visiblePOs = invoices.filter((po) => {
    const count = po.invoices?.length || 0;
    if (poFilter === "with" && count === 0) return false;
    if (poFilter === "without" && count > 0) return false;
    if (poSearch && !po.poNumber?.toLowerCase().includes(poSearch.toLowerCase())) return false;
    return true;
  });

  const allExpanded = visiblePOs.length > 0 && visiblePOs.every((po) => expandedPOs[po.poId]);
  const toggleAll = () => {
    const next = {};
    visiblePOs.forEach((po) => (next[po.poId] = !allExpanded));
    setExpandedPOs((prev) => ({ ...prev, ...next }));
  };

  const stats = [
    { label: "Total POs", value: invoices.length, icon: ClipboardList, tone: "bg-ink-100 text-ink-700" },
    { label: "Total Invoices", value: totalInvoices, icon: Files, tone: "bg-brand-100 text-brand-700" },
    { label: "POs with Invoices", value: withInvoices, icon: CheckCircle2, tone: "bg-green-50 text-green-600" },
    { label: "POs without Invoices", value: invoices.length - withInvoices, icon: CircleDashed, tone: "bg-red-50 text-red-500" },
  ];

  const FileIcon = ({ type }) => {
    if (type === "pdf") return <FileText className="h-6 w-6" />;
    if (type === "image") return <FileImage className="h-6 w-6" />;
    return <File className="h-6 w-6" />;
  };

  return (
    <div className="page space-y-5">
      {/* Vendor picker */}
      <div className="card p-4 sm:p-5">
        <label className="label" htmlFor="vendor-search">
          Vendor
        </label>

        {loading ? (
          <div className="flex h-10 items-center gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading vendors...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </div>
        ) : (
          <div className="relative max-w-2xl" ref={vendorBoxRef}>
            <Store className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              id="vendor-search"
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={() => setIsDropdownOpen(true)}
              placeholder={`Search ${vendors.length} vendors...`}
              className={`input h-11 pl-9 pr-10 ${selectedVendor ? "font-semibold border-brand-400 ring-2 ring-brand-400/30" : ""}`}
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={handleClear}
                aria-label="Clear vendor"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-900"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {isDropdownOpen && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop animate-slideDown">
                {filteredVendors.length > 0 ? (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {filteredVendors.map((vendor) => (
                      <li key={vendor.id}>
                        <button
                          type="button"
                          onClick={() => handleVendorSelect(vendor.id, vendor.displayName)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-brand-50 ${
                            selectedVendor === vendor.id ? "bg-brand-50 font-semibold text-ink-950" : "text-ink-800"
                          }`}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-100 text-xs font-bold text-ink-600">
                            {vendor.displayName?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                          <span className="break-words">{vendor.displayName}</span>
                          {selectedVendor === vendor.id && <CheckCircle2 className="ml-auto h-4 w-4 text-ink-900" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-ink-500">
                    No vendors found matching "{searchTerm}"
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {!selectedVendor ? (
        <div className="card py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Store className="h-6 w-6" />
          </div>
          <p className="font-semibold text-ink-900">Select a vendor</p>
          <p className="text-sm text-ink-500">Choose a vendor above to see their purchase orders and invoices.</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          {!invoiceLoading && !invoiceError && invoices.length > 0 && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="card flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium text-ink-500">{s.label}</div>
                      <div className="text-2xl font-bold tabular-nums text-ink-950">{s.value}</div>
                    </div>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.tone}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* PO list */}
          <section className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-ink-950">Purchase Orders & Invoices</h2>
                <p className="truncate text-xs text-ink-500">{selectedVendorName}</p>
              </div>

              {invoices.length > 0 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative sm:w-56">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      value={poSearch}
                      onChange={(e) => setPoSearch(e.target.value)}
                      placeholder="Search PO number"
                      className="input h-9 pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {PO_FILTERS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setPoFilter(f.key)}
                        className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${
                          poFilter === f.key ? "bg-ink-950 text-brand-400" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                    <button onClick={toggleAll} className="btn-outline ml-1 h-8 whitespace-nowrap py-0 text-xs">
                      {allExpanded ? "Collapse all" : "Expand all"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {invoiceLoading ? (
              <div className="space-y-2 p-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-ink-100" />
                ))}
              </div>
            ) : invoiceError ? (
              <div className="m-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {invoiceError}
              </div>
            ) : invoices.length === 0 || visiblePOs.length === 0 ? (
              <div className="py-14 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="font-semibold text-ink-800">
                  {invoices.length === 0 ? "No purchase orders for this vendor" : "No purchase orders match your filter"}
                </p>
                {invoices.length > 0 && (
                  <button
                    onClick={() => {
                      setPoSearch("");
                      setPoFilter("all");
                    }}
                    className="mt-2 text-sm font-semibold text-ink-900 underline underline-offset-2 hover:text-brand-600"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {visiblePOs.map((po) => {
                  const count = po.invoices?.length || 0;
                  const open = !!expandedPOs[po.poId];
                  return (
                    <li key={po.poId} className={open ? "bg-ink-50/60" : ""}>
                      {/* PO row */}
                      <button
                        type="button"
                        onClick={() => togglePOExpansion(po.poId)}
                        aria-expanded={open}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-brand-50"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            count > 0 ? "bg-ink-950 text-brand-400" : "bg-ink-100 text-ink-400"
                          }`}
                        >
                          <ClipboardList className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-ink-950 break-words">{po.poNumber}</div>
                          <div className="text-xs text-ink-500">
                            {count} invoice{count !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <span className={`${count > 0 ? "badge-green" : "badge-gray"} hidden sm:inline-flex`}>
                          {count > 0 ? "Has invoices" : "No invoices"}
                        </span>
                        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>

                      {/* Invoices */}
                      {open && (
                        <div className="px-4 pb-4 sm:pl-16">
                          <div className="mb-3 text-xs text-ink-500">
                            Vendor: <span className="font-medium text-ink-800">{po.vendorName}</span>
                          </div>

                          {count === 0 ? (
                            <div className="rounded-lg border border-dashed border-ink-300 bg-white px-4 py-6 text-center text-sm text-ink-500">
                              No invoices attached to this PO
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {po.invoices.map((invoice, index) => {
                                const fileType = getFileType(invoice.invoiceUrl);
                                const isImage = fileType === "image";
                                const fullUrl = getInvoiceUrl(invoice.invoiceUrl);

                                return (
                                  <div key={index} className="flex flex-col overflow-hidden rounded-xl border border-ink-200 bg-white">
                                    {/* Preview */}
                                    <button
                                      type="button"
                                      onClick={() => handleViewFile(invoice.invoiceUrl, invoice.invoiceNumber)}
                                      className="flex h-28 items-center justify-center bg-ink-50 hover:bg-ink-100"
                                      title="Open file"
                                    >
                                      {isImage && fullUrl ? (
                                        <img src={fullUrl} alt={invoice.invoiceNumber} className="h-full w-full object-contain p-2" />
                                      ) : (
                                        <span
                                          className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                                            fileType === "pdf" ? "bg-red-50 text-red-500" : "bg-ink-100 text-ink-500"
                                          }`}
                                        >
                                          <FileIcon type={fileType} />
                                        </span>
                                      )}
                                    </button>

                                    <div className="flex flex-1 flex-col p-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="font-semibold text-ink-950 break-words">{invoice.invoiceNumber}</p>
                                        <span className="badge-gray shrink-0 uppercase">{fileType === "other" ? "file" : fileType}</span>
                                      </div>
                                      <p className="mt-0.5 truncate text-xs text-ink-500" title={getFileName(invoice.invoiceUrl)}>
                                        {getFileName(invoice.invoiceUrl)}
                                      </p>

                                      <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                          onClick={() => handleViewFile(invoice.invoiceUrl, invoice.invoiceNumber)}
                                          className="btn-dark py-1.5 text-xs"
                                        >
                                          <Eye className="h-3.5 w-3.5" /> View
                                        </button>
                                        <button
                                          onClick={() => handleDownloadFile(invoice.invoiceUrl, invoice.invoiceNumber)}
                                          className="btn-outline py-1.5 text-xs"
                                        >
                                          <Download className="h-3.5 w-3.5" /> Download
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default InvoicePO;
