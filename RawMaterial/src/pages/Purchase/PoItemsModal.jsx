import React, { useEffect, useMemo } from "react";
import { HiX, HiCube, HiTruck, HiUser, HiCalendar } from "react-icons/hi";

const fmtQty = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });

// Per-item receiving state
const itemState = (row) => {
  if (row.quantity > 0 && row.receivedQty >= row.quantity)
    return { label: "Received", chip: "bg-green-50 text-green-700 ring-green-200", bar: "bg-green-500" };
  if (row.receivedQty > 0)
    return { label: "Partial", chip: "bg-blue-50 text-blue-700 ring-blue-200", bar: "bg-blue-500" };
  return { label: "Pending", chip: "bg-orange-50 text-orange-700 ring-orange-200", bar: "bg-orange-400" };
};

const pct = (row) =>
  row.quantity > 0 ? Math.min(100, Math.round((row.receivedQty / row.quantity) * 100)) : 0;

const StateChip = ({ state }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${state.chip}`}>
    {state.label}
  </span>
);

const ProgressBar = ({ value, barClass }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
    <div className={`h-full rounded-full ${barClass}`} style={{ width: `${value}%` }} />
  </div>
);

const Dash = () => <span className="text-ink-300">—</span>;

const ReceiptInfo = ({ row, formatDate }) =>
  row.receivedDate || row.vehicleNumber || row.receivedBy ? (
    <div className="space-y-1 text-xs text-ink-700">
      {row.receivedDate && (
        <div className="flex items-center gap-1.5">
          <HiCalendar className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="font-medium text-ink-900">{formatDate(row.receivedDate)}</span>
        </div>
      )}
      {row.vehicleNumber && (
        <div className="flex items-center gap-1.5">
          <HiTruck className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="break-all font-mono uppercase">{row.vehicleNumber}</span>
        </div>
      )}
      {row.receivedBy && (
        <div className="flex items-center gap-1.5">
          <HiUser className="h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span className="break-words">{row.receivedBy}</span>
        </div>
      )}
    </div>
  ) : (
    <span className="text-xs italic text-ink-400">Not received yet</span>
  );

const StatTile = ({ label, value, sub, tone = "text-ink-950" }) => (
  <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
    <p className={`mt-1 text-xl font-bold tabular-nums ${tone}`}>{value}</p>
    {sub && <p className="text-[11px] text-ink-500">{sub}</p>}
  </div>
);

/**
 * Items of one purchase order with what has been received against each.
 * rows: [{ id, itemName, unit, quantity, receivedQty, goodQty, damagedQty, receivedDate, vehicleNumber, receivedBy }]
 */
const PoItemsModal = ({ po, rows, onClose, formatDate, statusClass, statusLabel }) => {
  // Esc closes; page behind doesn't scroll while open
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const stats = useMemo(() => {
    const fully = rows.filter((r) => r.quantity > 0 && r.receivedQty >= r.quantity).length;
    const pending = rows.filter((r) => r.receivedQty <= 0).length;
    const damaged = rows.reduce((a, r) => a + (r.damagedQty || 0), 0);
    const progress = rows.length ? Math.round(rows.reduce((a, r) => a + pct(r), 0) / rows.length) : 0;
    return { fully, pending, damaged, progress };
  }, [rows]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-items-title"
    >
      <div
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-6xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-ink-200 px-4 py-4 sm:px-6">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-ink-950 sm:flex">
            <HiCube className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id="po-items-title" className="text-lg font-bold text-ink-950">
                {po.poNumber}
              </h3>
              {po.status && <span className={`badge whitespace-nowrap ${statusClass}`}>{statusLabel}</span>}
            </div>
            <p className="mt-0.5 break-words text-xs text-ink-500">
              <span className="font-medium text-ink-800">{po.vendorName || "—"}</span>
              {po.companyName && <> · {po.companyName}</>}
              {po.poDate && <> · PO date {formatDate(po.poDate)}</>}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-100 hover:text-ink-950"
            aria-label="Close"
          >
            <HiX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Summary */}
          <div className="border-b border-ink-200 bg-ink-50 px-4 py-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Items" value={rows.length} sub="on this PO" />
              <StatTile
                label="Fully received"
                value={`${stats.fully}/${rows.length}`}
                sub={`${stats.pending} not started`}
                tone="text-green-700"
              />
              <StatTile
                label="Damaged qty"
                value={fmtQty(stats.damaged)}
                sub="across all receipts"
                tone={stats.damaged > 0 ? "text-red-700" : "text-ink-950"}
              />
              <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Progress</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-ink-950">{stats.progress}%</p>
                <div className="mt-1.5">
                  <ProgressBar
                    value={stats.progress}
                    barClass={stats.progress >= 100 ? "bg-green-500" : stats.progress > 0 ? "bg-blue-500" : "bg-ink-300"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop / tablet table */}
          <div className="hidden md:block">
            <table className="w-full table-fixed text-[13px]">
              <colgroup>
                <col className="w-12" />
                <col />
                <col className="w-[96px]" />
                <col className="w-[150px]" />
                <col className="w-[72px]" />
                <col className="w-[84px]" />
                <col className="w-[200px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-ink-200 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                  <th className="px-4 py-3">#</th>
                  <th className="px-3 py-3">Item</th>
                  <th className="px-3 py-3 text-right">Ordered</th>
                  <th className="px-3 py-3">Received</th>
                  <th className="px-3 py-3 text-right">Good</th>
                  <th className="px-3 py-3 text-right">Damaged</th>
                  <th className="px-3 py-3 pr-6">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((row, i) => {
                  const state = itemState(row);
                  return (
                    <tr key={row.id || i} className="align-top transition hover:bg-ink-50/70">
                      <td className="px-4 py-3.5 text-xs font-medium text-ink-400 tabular-nums">{i + 1}</td>
                      <td className="px-3 py-3.5">
                        <p className="break-words font-semibold leading-snug text-ink-950">{row.itemName}</p>
                        {row.unit && <p className="mt-0.5 text-[11px] text-ink-500">Unit: {row.unit}</p>}
                      </td>
                      <td className="px-3 py-3.5 text-right font-medium tabular-nums text-ink-900">
                        {fmtQty(row.quantity)}
                        {row.unit && <span className="ml-1 text-[11px] font-normal text-ink-500">{row.unit}</span>}
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold tabular-nums text-ink-950">{fmtQty(row.receivedQty)}</span>
                          <StateChip state={state} />
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar value={pct(row)} barClass={state.bar} />
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-right tabular-nums text-green-700">
                        {row.goodQty !== null ? fmtQty(row.goodQty) : <Dash />}
                      </td>
                      <td
                        className={`px-3 py-3.5 text-right tabular-nums ${
                          row.damagedQty > 0 ? "font-semibold text-red-700" : "text-ink-700"
                        }`}
                      >
                        {row.damagedQty !== null ? fmtQty(row.damagedQty) : <Dash />}
                      </td>
                      <td className="px-3 py-3.5 pr-6">
                        <ReceiptInfo row={row} formatDate={formatDate} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 md:hidden">
            {rows.map((row, i) => {
              const state = itemState(row);
              return (
                <div key={row.id || i} className="rounded-xl border border-ink-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-sm font-semibold leading-snug text-ink-950">
                      <span className="mr-1.5 text-ink-400">{i + 1}.</span>
                      {row.itemName}
                    </p>
                    <StateChip state={state} />
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-ink-50 p-2.5 text-center">
                    {[
                      ["Ordered", fmtQty(row.quantity), "text-ink-950"],
                      ["Received", fmtQty(row.receivedQty), "text-ink-950"],
                      ["Good", row.goodQty !== null ? fmtQty(row.goodQty) : "—", "text-green-700"],
                      [
                        "Damaged",
                        row.damagedQty !== null ? fmtQty(row.damagedQty) : "—",
                        row.damagedQty > 0 ? "text-red-700" : "text-ink-950",
                      ],
                    ].map(([label, value, tone]) => (
                      <div key={label}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
                        <p className={`text-sm font-bold tabular-nums ${tone}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {row.unit && <p className="mt-1 text-right text-[11px] text-ink-500">Unit: {row.unit}</p>}

                  <div className="mt-2">
                    <ProgressBar value={pct(row)} barClass={state.bar} />
                  </div>

                  <div className="mt-3 border-t border-ink-100 pt-3">
                    <ReceiptInfo row={row} formatDate={formatDate} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-ink-200 bg-white px-4 py-3 sm:px-6">
          <p className="text-xs text-ink-500">
            {rows.length} item(s) · Good / damaged from goods receipts
          </p>
          <button type="button" onClick={onClose} className="btn-dark">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PoItemsModal;
