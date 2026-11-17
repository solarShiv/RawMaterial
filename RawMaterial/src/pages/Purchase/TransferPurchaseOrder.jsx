import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  Loader2,
  Lock,
  Percent,
  UserPlus,
} from "lucide-react";
import Api from "../../auth/Api";
import SearchableSelect from "../../components/dropdown/SearchableSelect";


// TODO: DUMMY endpoint — replace with the real Transfer PO API when the backend is ready.
// (Do NOT use /purchase/purchase-orders/create for transfer.)
const TRANSFER_PO_API = "/purchase/purchase-orders/create";

const ITEMWISE_GST = ["IGST_ITEMWISE", "LGST_ITEMWISE"];

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const formatAmount = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£", CNY: "¥", AED: "د.إ" };

const GST_LABELS = {
  IGST_5: "IGST 5%",
  IGST_12: "IGST 12%",
  IGST_18: "IGST 18%",
  IGST_28: "IGST 28%",
  IGST_EXEMPTED: "IGST Exempted",
  LGST_5: "LGST 5%",
  LGST_12: "LGST 12%",
  LGST_18: "LGST 18%",
  LGST_28: "LGST 28%",
  LGST_EXEMPTED: "LGST Exempted",
  IGST_ITEMWISE: "IGST Itemwise",
  LGST_ITEMWISE: "LGST Itemwise",
};

// GST numbers compared without spaces and case
const normGst = (v) => String(v || "").replace(/\s+/g, "").toUpperCase();

// Never show NaN / Infinity in numeric inputs
const cleanNum = (v) => {
  const str = v === null || v === undefined ? "" : String(v);
  return /^(NaN|-?Infinity)$/.test(str) ? "" : str;
};

// Layout helpers — same look as Create Purchase Order
const SectionHeader = ({ step, title, subtitle, children }) => (
  <div className="flex flex-col gap-3 border-b border-ink-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-sm font-bold text-brand-400">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink-950">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, required, hint, children, className = "" }) => (
  <div className={className}>
    <label className="label">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
  </div>
);

// Locked (read-only) field styled like a disabled input
const ReadOnly = ({ label, value, className = "", multiline = false }) => (
  <Field label={label} className={className}>
    <div
      className={`input flex cursor-not-allowed items-center gap-2 bg-ink-50 text-ink-700 ${
        multiline ? "min-h-[62px] items-start whitespace-pre-wrap break-words" : "truncate"
      }`}
      title={typeof value === "string" ? value : undefined}
    >
      <span className={`min-w-0 flex-1 ${multiline ? "" : "truncate"}`}>{value || "—"}</span>
      <Lock className="h-3.5 w-3.5 shrink-0 text-ink-300" />
    </div>
  </Field>
);

const TransferPurchaseOrder = () => {
  const { poId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  const [vendorId, setVendorId] = useState("");
  // true when no active vendor has the current company's GST number
  const [vendorMissing, setVendorMissing] = useState(false);
  const vendorName =
    vendors.find((v) => String(v.id) === String(vendorId))?.displayName || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [orderRes, vendorRes, warehouseRes, companyRes, vendorDataRes] = await Promise.all([
          Api.get(`/purchase/purchase-orders/details/${poId}`),
          Api.get("/purchase/vendors"),
          Api.get("/purchase/warehouses"),
          Api.get("/purchase/companies"),
          // Has each vendor's gstNumber (the list above only has id + displayName)
          Api.get("/purchase/vendors/data").catch((err) => {
            console.error("Error loading vendor GST data:", err);
            return null;
          }),
        ]);
        const details = orderRes?.data?.data;
        if (!details) {
          alert("Purchase order not found");
          navigate("/show-purchase-orders");
          return;
        }
        setOrder(details);
        // On transfer the PO's current company becomes the vendor of the new PO,
        // and the user picks the company the new PO is raised from.
        const vendorList = vendorRes?.data?.data || [];
        const activeIds = new Set(vendorList.map((v) => String(v.id)));

        // The vendor is fixed: the active vendor whose GST number equals the company's GST number
        const companyGst = normGst(details.company?.gstNumber);
        const gstVendor = companyGst
          ? (vendorDataRes?.data?.data || []).find(
              (v) => activeIds.has(String(v.id)) && normGst(v.gstNumber) === companyGst,
            )
          : null;

        setVendorId(gstVendor ? String(gstVendor.id) : "");
        setVendorMissing(!gstVendor);
        setCompanyId("");
        setVendors(vendorList);
        setCompanies(companyRes?.data?.data || []);
        setWarehouses(warehouseRes?.data?.data || []);
        // For non-INR POs the API returns `rate` in INR and the PO-currency rate in
        // `rateInForeign`. The create API expects rates in the PO currency, so use that.
        const isForeign = (details.currency || "INR") !== "INR";
        setItems(
          (details.items || []).map((item) => {
            const quantity = parseFloat(item.quantity) || 0;
            const rateSource =
              isForeign && item.rateInForeign != null && item.rateInForeign !== ""
                ? item.rateInForeign
                : item.rate;
            const rate = parseFloat(rateSource) || 0;
            return {
              id: item.itemId || item.id,
              source: item.itemSource || "mysql",
              name: item.itemName || item.name || "",
              hsnCode: item.hsnCode ?? "",
              modelNumber: item.modelNumber || "",
              itemDetail: item.itemDetail || "",
              unit: item.unit || "",
              quantity: String(item.quantity ?? ""),
              gstRate: item.gstRate ?? "",
              rate: String(rate),
              originalRate: rate,
              increasePct: "",
              // Pre-GST amount in PO currency (same as "Total Amount" on Create PO)
              total: (rate * quantity).toFixed(3),
            };
          }),
        );
      } catch (error) {
        console.error("Error loading purchase order:", error);
        alert(
          "Error loading purchase order: " +
            (error?.response?.data?.message || error?.message),
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [poId, navigate]);

  const isItemWiseGST = ITEMWISE_GST.includes(order?.gstType);

  const handleAmountChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      const quantity = parseFloat(item.quantity) || 0;
      const num = parseFloat(value);
      if (field === "rate") {
        item.total = !isNaN(num) && quantity > 0 ? (num * quantity).toFixed(3) : "";
      } else if (field === "total") {
        item.rate = !isNaN(num) && quantity > 0 ? (num / quantity).toFixed(3) : "";
      }
      // Keep the % field in sync when rate/total is typed directly
      const newRate = parseFloat(item.rate);
      item.increasePct =
        item.originalRate > 0 && !isNaN(newRate)
          ? String(Number((((newRate - item.originalRate) / item.originalRate) * 100).toFixed(2)))
          : "";
      next[index] = item;
      return next;
    });
  };

  // Increase rate by % of the ORIGINAL PO rate (so repeated edits don't compound)
  const applyIncrease = (item, pctValue) => {
    const pct = parseFloat(pctValue);
    const quantity = parseFloat(item.quantity) || 0;
    if (pctValue === "" || isNaN(pct)) {
      const rate = item.originalRate;
      return {
        ...item,
        increasePct: pctValue,
        rate: String(rate),
        total: (rate * quantity).toFixed(3),
      };
    }
    const rate = item.originalRate * (1 + pct / 100);
    return {
      ...item,
      increasePct: pctValue,
      rate: rate.toFixed(3),
      total: (rate * quantity).toFixed(3),
    };
  };

  const handleIncreaseChange = (index, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? applyIncrease(it, value) : it)));
  };

  const [allPct, setAllPct] = useState("");
  const applyToAll = () => {
    if (allPct === "" || isNaN(parseFloat(allPct))) {
      alert("Please enter a percentage");
      return;
    }
    setItems((prev) => prev.map((it) => applyIncrease(it, allPct)));
  };

  // GST rate shown in the Items badge: order rate, or the rate in the GST type (e.g. IGST_18)
  const orderGstRate = useMemo(() => {
    if (!order) return 0;
    const fromOrder = parseFloat(order.gstRate);
    if (!isNaN(fromOrder)) return fromOrder;
    const fromType = parseFloat(String(order.gstType || "").split("_")[1]);
    return isNaN(fromType) ? 0 : fromType;
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyId) {
      alert("Please select a company");
      return;
    }
    if (!vendorId) {
      alert("Please add vendor first");
      return;
    }
    if (items.some((i) => i.rate === "" || isNaN(parseFloat(i.rate)))) {
      alert("Please enter a valid rate for all items");
      return;
    }

    const warehouseId =
      order.warehouseId ||
      warehouses.find((w) => w.warehouseName === order.warehouseName)?._id ||
      "";

    const payload = {
      companyId,
      vendorId,
      gstType: order.gstType,
      currency: order.currency || "INR",
      exchangeRate: order.exchangeRate || "1",
      paymentTerms: order.paymentTerms || "",
      deliveryTerms: order.deliveryTerms || "",
      warranty: order.warranty || "",
      contactPerson: order.contactPerson || "",
      cellNo: String(order.cellNo ?? ""),
      expectedDeliveryDate: order.expectedDeliveryDate
        ? order.expectedDeliveryDate.split("T")[0]
        : "",
      warehouseId,
      items: items.map((i) => {
        const data = {
          id: i.id,
          name: i.name,
          source: i.source,
          hsnCode: i.hsnCode,
          modelNumber: i.modelNumber,
          itemDetail: i.itemDetail,
          unit: i.unit,
          quantity: String(i.quantity ?? ""),
          rate: String(i.rate ?? ""),
        };
        if (isItemWiseGST) data.gstRate = String(i.gstRate ?? "");
        return data;
      }),
      otherCharges: (order.otherCharges || []).map((c) => ({
        name: c.name,
        amount: String(c.amount ?? ""),
      })),
    };

    const newCompanyName =
      companies.find((c) => String(c.id) === String(companyId))?.companyName ||
      "selected company";
    if (
      !window.confirm(
        `Transfer PO ${order.poNumber}?\n` +
          `Company: ${newCompanyName}\n` +
          `Vendor: ${vendorName || "—"}\n` +
          `A new PO with a new PO number will be created.\n` +
          `The original PO will not be changed.`,
      )
    )
      return;

    setSubmitting(true);
    try {
      const response = await Api.post(TRANSFER_PO_API, {
        ...payload,
        source_po_id: poId,
        transferFromPoNumber: order.poNumber,
      });
      if (response.data.success) {
        const newPoNumber = response.data.data?.poNumber;
        alert(
          `PO ${order.poNumber} transferred successfully.` +
            (newPoNumber ? `\nNew PO Number: ${newPoNumber}` : ""),
        );
        navigate("/show-purchase-orders");
      } else {
        alert("Error transferring purchase order: " + response.data.message);
      }
    } catch (error) {
      console.error("Error transferring purchase order:", error);
      alert(
        "Error transferring purchase order: " +
          (error?.response?.data?.message || error?.message),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-pop">
          <Loader2 className="h-6 w-6 animate-spin text-ink-900" />
          <p className="font-medium text-ink-800">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const currency = order.currency || "INR";
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const money = (n) => `${sym} ${formatAmount(n)}`;
  const charges = order.otherCharges || [];

  return (
    <div className="p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        // Enter inside an input must not submit the transfer; only the button does.
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
        }}
        className="mx-auto max-w-[1600px] space-y-5"
      >
        {submitting && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-pop">
              <Loader2 className="h-6 w-6 animate-spin text-ink-900" />
              <p className="font-medium text-ink-800">Transferring Purchase Order...</p>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-outline shrink-0 px-2.5"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              {order.companyName && (
                <p className="text-base font-bold uppercase tracking-wide text-ink-950">
                  {order.companyName}
                </p>
              )}
              <p className="text-xs text-ink-500">
                Transfer from PO <b className="text-ink-800">{order.poNumber}</b> (
                {formatDate(order.poDate)}) · a new PO with a new PO number will be created
              </p>
            </div>
          </div>
        </div>

        {vendorMissing && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <p className="text-sm text-red-800">
                <b>Please add vendor first.</b> No active vendor has the GST number of{" "}
                <b>{order.companyName || order.company?.name}</b>
                {order.company?.gstNumber ? (
                  <>
                    {" "}(<b>{order.company.gstNumber}</b>)
                  </>
                ) : (
                  " (company has no GST number)"
                )}
                . Add it as a vendor with this GST number, then open Transfer PO again.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/add-vendor")}
              className="btn-danger shrink-0"
            >
              <UserPlus className="h-4 w-4" /> Add Vendor
            </button>
          </div>
        )}

        {/* Info banner */}
        <div className="flex items-center gap-3 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3">
          <ArrowLeftRight className="h-5 w-5 shrink-0 text-brand-700" />
          <p className="text-sm text-ink-800">
            The current company <b>{order.companyName}</b> becomes the <b>Vendor</b> of the
            new PO — select the <b>Company</b> to transfer to. Item <b>Rate / Total</b> (or{" "}
            <b>Increase %</b>) can also be changed. The original PO is not modified.
          </p>
        </div>

        {/* 1. Basic Information */}
        <section className="card">
          <SectionHeader step="1" title="Basic Information" subtitle="Company, vendor, tax and delivery terms" />

          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Company"
              required
              hint={order.companyName ? `Original: ${order.companyName}` : undefined}
            >
              <SearchableSelect
                options={companies
                  .filter((c) => String(c.id) !== String(order.companyId))
                  .map((c) => ({ id: c.id, name: c.companyName }))}
                value={companyId}
                onChange={(id) => setCompanyId(String(id))}
                disabled={submitting}
                placeholder="Select company"
                searchPlaceholder="Search company…"
              />
            </Field>

            {vendorMissing ? (
              <Field label="Vendor" required>
                <div className="input flex cursor-not-allowed items-center gap-2 border-red-300 bg-red-50 text-red-700">
                  <span className="min-w-0 flex-1 truncate">Please add vendor first</span>
                  <Lock className="h-3.5 w-3.5 shrink-0 text-red-300" />
                </div>
              </Field>
            ) : (
              <ReadOnly
                label="Vendor"
                value={vendorName}
              />
            )}

            <ReadOnly label="GST Type" value={GST_LABELS[order.gstType] || order.gstType} />
            <ReadOnly label="Currency" value={currency} />
            <ReadOnly
              label={`Exchange Rate${currency !== "INR" ? ` (1 ${currency} = ? INR)` : ""}`}
              value={currency === "INR" ? "1.00 (Fixed)" : String(order.exchangeRate || "")}
            />
            <ReadOnly label="Warehouse" value={order.warehouseName} />
            <ReadOnly label="Expected Delivery Date" value={formatDate(order.expectedDeliveryDate)} />
            <ReadOnly label="Payment Terms" value={order.paymentTerms} />
            <ReadOnly label="Delivery Terms" value={order.deliveryTerms} />
            <ReadOnly label="Warranty" value={order.warranty} />
            <ReadOnly label="Contact Person" value={order.contactPerson} />
            <ReadOnly label="Contact Number" value={order.cellNo ? String(order.cellNo) : ""} />
            <ReadOnly label="Original PO Number" value={order.poNumber} />
            <ReadOnly label="Original PO Date" value={formatDate(order.poDate)} />
            <ReadOnly label="Original Status" value={order.status} />
          </div>
        </section>

        {/* 2. Items */}
        <section className="card">
          <SectionHeader
            step="2"
            title={`Items (${items.length})`}
            subtitle={`All amounts in ${currency} (${sym})${
              currency !== "INR" && order.exchangeRate
                ? ` · 1 ${currency} = ${parseFloat(order.exchangeRate).toFixed(3)} INR`
                : ""
            }`}
          >
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {order.gstType && (
                <span className="badge-gray">
                  <Percent className="h-3 w-3" />
                  {GST_LABELS[order.gstType] || order.gstType}
                  {isItemWiseGST ? " · rate per item" : ` · ${orderGstRate}%`}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="any"
                  value={allPct}
                  onChange={(e) => setAllPct(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyToAll()}
                  placeholder="Increase %"
                  className="input w-28 py-1.5 text-xs"
                />
                <button type="button" onClick={applyToAll} className="btn-dark py-1.5 text-xs">
                  <Percent className="h-3.5 w-3.5" /> Apply to all
                </button>
              </div>
            </div>
          </SectionHeader>

          <div className="space-y-4 p-5">
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity) || 0;
              return (
                <div key={`${item.id}-${index}`} className="rounded-xl border border-ink-200">
                  {/* Item header */}
                  <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-ink-200 bg-ink-50 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-400 text-xs font-bold text-ink-950">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-semibold text-ink-900">{item.name}</span>
                      {Number(item.total) > 0 && (
                        <span className="hidden sm:inline text-xs font-semibold text-ink-500 tabular-nums">
                          · {money(item.total)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
                    <ReadOnly label="Item" value={item.name} className="sm:col-span-2 lg:col-span-4" />
                    <ReadOnly label="Unit" value={item.unit} className="lg:col-span-2" />
                    <ReadOnly label="HSN Code" value={String(item.hsnCode ?? "")} className="lg:col-span-3" />
                    <ReadOnly label="Model Number" value={item.modelNumber} className="lg:col-span-3" />

                    <ReadOnly label="Quantity" value={String(item.quantity)} className="lg:col-span-2" />
                    <Field label="Rate" required className="lg:col-span-2">
                      <input
                        type="text"
                        value={cleanNum(item.rate)}
                        onChange={(e) =>
                          /^\d*\.?\d*$/.test(e.target.value) &&
                          handleAmountChange(index, "rate", e.target.value)
                        }
                        className="input text-right tabular-nums"
                        placeholder="0"
                        inputMode="decimal"
                        required
                      />
                    </Field>
                    <Field label="Total Amount" required className="sm:col-span-2 lg:col-span-2">
                      <input
                        type="text"
                        value={cleanNum(item.total)}
                        onChange={(e) =>
                          /^\d*\.?\d*$/.test(e.target.value) &&
                          handleAmountChange(index, "total", e.target.value)
                        }
                        className="input text-right font-semibold tabular-nums"
                        placeholder="0"
                        inputMode="decimal"
                        required
                      />
                    </Field>

                    {isItemWiseGST && (
                      <ReadOnly label="GST Rate (%)" value={String(item.gstRate ?? "")} className="lg:col-span-2" />
                    )}

                    {/* Increase % */}
                    <div className="sm:col-span-2 lg:col-span-6 flex flex-col gap-3 rounded-lg border border-dashed border-brand-300 bg-brand-50/60 px-3 py-2.5 sm:flex-row sm:items-center">
                      <label className="flex items-center gap-2 text-xs font-semibold text-ink-800">
                        <Percent className="h-3.5 w-3.5" /> Increase %
                        <input
                          type="number"
                          step="any"
                          value={item.increasePct}
                          onChange={(e) => handleIncreaseChange(index, e.target.value)}
                          placeholder="0"
                          className="input w-24 py-1 text-right text-xs tabular-nums"
                        />
                      </label>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600 tabular-nums">
                        <span>
                          Rate: {money(item.originalRate)} → <b className="text-ink-900">{money(item.rate)}</b>
                        </span>
                        <span>
                          Total: {money(item.originalRate * qty)} →{" "}
                          <b className="text-ink-900">{money(item.total)}</b>
                        </span>
                      </div>
                    </div>

                    <ReadOnly
                      label="Item Description"
                      value={item.itemDetail}
                      multiline
                      className="sm:col-span-2 lg:col-span-6"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Other Charges */}
        <section className="card">
          <SectionHeader step="3" title="Other Charges" subtitle="Freight, loading, packaging and more" />
          {charges.length > 0 ? (
            <div className="space-y-3 p-5">
              {charges.map((charge, index) => (
                <div
                  key={index}
                  className="grid items-end gap-3 rounded-lg border border-ink-200 p-3 sm:grid-cols-[32px_minmax(0,1fr)_200px]"
                >
                  <span className="hidden sm:flex h-[38px] items-center justify-center text-sm font-semibold text-ink-400">
                    {index + 1}
                  </span>
                  <ReadOnly label="Charge Name" value={charge.name} />
                  <ReadOnly label="Amount" value={formatAmount(charge.amount)} />
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-6 text-center text-sm text-ink-500">No other charges on this PO.</div>
          )}
        </section>

        {/* Submit */}
        <div className="card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500">
            {!vendorId
              ? "Please add vendor first."
              : !companyId
              ? "Select a company to continue."
              : "Review the details above, then transfer the purchase order."}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate(-1)} className="btn-outline h-11 px-5">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !companyId || !vendorId} className="btn-primary h-11 shrink-0 px-6">
              <ArrowLeftRight className="h-4 w-4" />
              Transfer Po
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default TransferPurchaseOrder;
