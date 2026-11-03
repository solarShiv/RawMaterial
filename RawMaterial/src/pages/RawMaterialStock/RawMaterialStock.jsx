import React, { useEffect, useState } from "react";
import Api from "../../auth/Api";
import {
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CubeIcon,
  MagnifyingGlassIcon,
  CubeTransparentIcon,
  Squares2X2Icon,
  ListBulletIcon,
  EyeSlashIcon,
  BeakerIcon,
  ShoppingCartIcon,
  BuildingLibraryIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

const toNum = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

// Container-wise stock may arrive as a { "<container name>": qty } map (same shape
// the PO receiving screen sends) or as an array of { containerName, quantity } rows
const getContainerStock = (item) => {
  const source =
    item.containerStock ??
    item.containers ??
    (item.stock && typeof item.stock === "object" ? item.stock : null);
  if (!source) return [];

  const rows = Array.isArray(source)
    ? source.map((c) => ({
        name: c.containerName ?? c.name ?? c.container?.name ?? c.container ?? "Unknown",
        qty: toNum(c.quantity ?? c.qty ?? c.stock),
      }))
    : Object.entries(source).map(([name, qty]) => ({ name, qty: toNum(qty) }));

  return rows.filter((c) => c.qty > 0).sort((a, b) => a.name.localeCompare(b.name));
};

const getTotalStock = (item, containers) =>
  item.stock && typeof item.stock === "object"
    ? containers.reduce((sum, c) => sum + c.qty, 0)
    : item.stock;

const NO_CONTAINER = "__none__";

const RawMaterialStock = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [stockFilter, setStockFilter] = useState("all");
  const [usageTab, setUsageTab] = useState("used");
  const [viewMode, setViewMode] = useState("grid");
  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [warehouseLoading, setWarehouseLoading] = useState(true);
  const [containerFilter, setContainerFilter] = useState("all");

  const role = localStorage.getItem("roleName");

  // Out of stock only matters for materials that are in use
  const isOutOfStock = (item) => item.isUsed && item.outOfStock;

  const fetchWarehouses = async () => {
    if (role === "store") return;

    try {
      setWarehouseLoading(true);
      const res = await Api.get("/purchase/warehouses");
      const formatted = (res?.data?.data || []).map((w) => ({
        label: w.warehouseName,
        value: w._id,
      }));
      setWarehouseList(formatted);
      if (formatted.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(formatted[0].value);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWarehouseLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      fetchWarehouses();
    }
  }, [role]);

  const fetchRawMaterials = async () => {
    try {
      if (selectedWarehouse === null && role !== "Store") return;
      setLoading(true);
      const url = `/purchase/warehouses/raw-material${
        selectedWarehouse !== null ? `?warehouseId=${selectedWarehouse}` : ""
      }`;

      const res = await Api.get(url);
      const list = (res.data.data || []).map((item) => {
        const containers = getContainerStock(item);
        return { ...item, containers, stock: getTotalStock(item, containers) };
      });
      setRawMaterials(list);
      setFiltered(list);
    } catch (error) {
      console.log("Error fetching raw materials:", error?.response?.data?.message || error);
      alert("Failed to fetch raw materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRawMaterials();
  }, [selectedWarehouse]);

  useEffect(() => {
    let results = [...rawMaterials];

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (item) =>
          item.name?.toLowerCase().includes(s) ||
          item.unit?.toLowerCase().includes(s) ||
          item.stock?.toString().includes(s) ||
          item.containers.some((c) => c.name.toLowerCase().includes(s))
      );
    }

    if (containerFilter !== "all") {
      results = results.filter((item) =>
        containerFilter === NO_CONTAINER
          ? toNum(item.stock) > item.containers.reduce((sum, c) => sum + c.qty, 0)
          : item.containers.some((c) => c.name === containerFilter)
      );
    }

    if (stockFilter === "out-of-stock") results = results.filter((item) => isOutOfStock(item));
    if (stockFilter === "in-stock") results = results.filter((item) => item.isUsed && !item.outOfStock);

    setFiltered(results);
  }, [search, rawMaterials, stockFilter, containerFilter]);

  const toggleMaterialUsage = async (id, currentStatus) => {
    if (updating) return;

    setUpdating(id);
    try {
      const newStatus = !currentStatus;
      await Api.put(
        `/store-keeper/markRawMaterialUsedOrNotUsed?id=${id}&isUsed=${newStatus}${
          selectedWarehouse !== null ? `&warehouseId=${selectedWarehouse}` : ""
        }`
      );

      setRawMaterials((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isUsed: newStatus } : item))
      );

      alert(`Material marked as ${newStatus ? "Used" : "Not Used"} successfully!`);
    } catch (error) {
      console.error("Error updating material usage:", error);
      alert("Failed to update material status. Please try again.");
    } finally {
      setUpdating(null);
    }
  };

  // Filter materials by usage status
  const usedMaterials = filtered.filter((item) => item.isUsed);
  const notUsedMaterials = filtered.filter((item) => !item.isUsed);
  const currentList = usageTab === "used" ? usedMaterials : notUsedMaterials;

  const stats = {
    total: rawMaterials.length,
    used: rawMaterials.filter((item) => item.isUsed).length,
    notUsed: rawMaterials.filter((item) => !item.isUsed).length,
    outOfStock: rawMaterials.filter(isOutOfStock).length,
    inStock: rawMaterials.filter((item) => item.isUsed && !item.outOfStock).length,
  };

  const containerNames = [...new Set(rawMaterials.flatMap((item) => item.containers.map((c) => c.name)))].sort(
    (a, b) => a.localeCompare(b)
  );

  // Group the current list by container; a material kept in several containers appears under each
  const containerGroups = (() => {
    const groups = new Map();
    currentList.forEach((item) => {
      const unassigned = toNum(item.stock) - item.containers.reduce((sum, c) => sum + c.qty, 0);
      const entries = unassigned > 0 ? [...item.containers, { name: NO_CONTAINER, qty: unassigned }] : item.containers;
      entries.forEach((c) => {
        if (containerFilter !== "all" && c.name !== containerFilter) return;
        if (!groups.has(c.name)) groups.set(c.name, []);
        groups.get(c.name).push({ item, qty: c.qty });
      });
    });
    return [...groups.entries()]
      .sort(([a], [b]) => (a === NO_CONTAINER ? 1 : b === NO_CONTAINER ? -1 : a.localeCompare(b)))
      .map(([name, rows]) => ({ name, rows }));
  })();

  const pct = (n) => (stats.total > 0 ? `${Math.round((n / stats.total) * 100)}%` : "0%");

  if (loading && warehouseLoading) {
    return (
      <div className="page">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-white" />
          ))}
        </div>
        <div className="card h-64 animate-pulse" />
      </div>
    );
  }

  const UsageButton = ({ item, full = false }) => (
    <button
      onClick={() => toggleMaterialUsage(item.id, item.isUsed)}
      disabled={updating === item.id}
      className={`btn ${full ? "w-full" : "whitespace-nowrap"} border ${
        updating === item.id
          ? "bg-ink-100 text-ink-500 border-ink-200"
          : item.isUsed
          ? "bg-white text-red-600 border-red-200 hover:bg-red-50"
          : "bg-white text-green-700 border-green-200 hover:bg-green-50"
      }`}
    >
      {updating === item.id ? (
        <>
          <ArrowPathIcon className="h-4 w-4 animate-spin" /> Updating...
        </>
      ) : item.isUsed ? (
        <>
          <EyeSlashIcon className="h-4 w-4" /> Mark Not Used
        </>
      ) : (
        <>
          <BeakerIcon className="h-4 w-4" /> Mark Used
        </>
      )}
    </button>
  );

  const StockBadge = ({ item }) =>
    !item.isUsed ? (
      <span className="badge-gray">
        <EyeSlashIcon className="h-3 w-3" /> Not in Use
      </span>
    ) : item.outOfStock ? (
      <span className="badge-red">
        <ShoppingCartIcon className="h-3 w-3" /> Out of Stock
      </span>
    ) : (
      <span className="badge-green">
        <CheckCircleIcon className="h-3 w-3" /> In Stock
      </span>
    );

  const ContainerBreakdown = ({ item }) =>
    item.containers.length === 0 ? (
      <span className="text-xs text-ink-400">No container assigned</span>
    ) : (
      <div className="flex flex-wrap gap-1.5">
        {item.containers.map((c) => (
          <span
            key={c.name}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${
              containerFilter === c.name
                ? "border-brand-400 bg-brand-100 text-ink-950"
                : "border-ink-200 bg-white text-ink-700"
            }`}
          >
            <ArchiveBoxIcon className="h-3 w-3 text-ink-400" />
            {c.name}
            <span className="font-semibold tabular-nums">{c.qty}</span>
          </span>
        ))}
      </div>
    );

  const renderMaterialCard = (item) => {
    const outOfStock = isOutOfStock(item);

    return (
      <div
        key={item.id}
        className={`card flex flex-col overflow-hidden transition-shadow hover:shadow-pop ${
          outOfStock ? "border-red-200" : ""
        }`}
      >
        <div className="flex items-start gap-3 p-4">
          <div
            className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
              outOfStock ? "bg-red-50 text-red-600" : "bg-brand-100 text-brand-700"
            }`}
          >
            <CubeIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            {/* Full name, wraps instead of truncating */}
            <h3 className="font-semibold text-ink-950 text-sm leading-snug break-words" title={item.name}>
              {item.name}
            </h3>
            <div className="mt-1.5">
              <StockBadge item={item} />
            </div>
          </div>
        </div>

        <div className="mt-auto px-4 pb-4 space-y-3">
          <div className="flex items-end justify-between rounded-lg bg-ink-50 border border-ink-100 px-3 py-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Stock</div>
              <div className={`text-2xl font-bold tabular-nums ${outOfStock ? "text-red-600" : "text-ink-950"}`}>
                {item.stock}
              </div>
            </div>
            <span className="text-sm font-medium text-ink-500 pb-1">{item.unit}</span>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">By Container</div>
            <ContainerBreakdown item={item} />
          </div>
          <UsageButton item={item} full />
        </div>
      </div>
    );
  };

  const renderMaterialRow = (item) => (
    <tr key={item.id} className={isOutOfStock(item) ? "bg-red-50/50" : ""}>
      <td>
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 h-8 w-8 rounded-md flex items-center justify-center ${
              isOutOfStock(item) ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-700"
            }`}
          >
            <CubeIcon className="h-4 w-4" />
          </div>
          <span className="font-medium text-ink-950 break-words min-w-[180px]">{item.name}</span>
        </div>
      </td>
      <td className="text-right">
        <span className={`font-bold tabular-nums ${isOutOfStock(item) ? "text-red-600" : "text-ink-950"}`}>
          {item.stock}
        </span>
      </td>
      <td className="text-ink-600">{item.unit}</td>
      <td className="min-w-[200px]">
        <ContainerBreakdown item={item} />
      </td>
      <td>
        <StockBadge item={item} />
      </td>
      <td className="text-right">
        <UsageButton item={item} />
      </td>
    </tr>
  );

  const statTiles = [
    { key: "total", label: "Total Items", value: stats.total, sub: "In this warehouse", icon: CubeTransparentIcon, tone: "text-ink-950", iconBg: "bg-ink-100 text-ink-700", onClick: () => setStockFilter("all") },
    { key: "used", label: "In Use", value: stats.used, sub: pct(stats.used), icon: BeakerIcon, tone: "text-green-600", iconBg: "bg-green-50 text-green-600", onClick: () => setUsageTab("used"), active: usageTab === "used" },
    { key: "notUsed", label: "Not Used", value: stats.notUsed, sub: pct(stats.notUsed), icon: EyeSlashIcon, tone: "text-ink-700", iconBg: "bg-ink-100 text-ink-600", onClick: () => setUsageTab("notUsed"), active: usageTab === "notUsed" },
    { key: "inStock", label: "In Stock", value: stats.inStock, sub: pct(stats.inStock), icon: CheckCircleIcon, tone: "text-green-600", iconBg: "bg-green-50 text-green-600", onClick: () => { setUsageTab("used"); setStockFilter("in-stock"); }, active: stockFilter === "in-stock" },
    { key: "out", label: "Out of Stock", value: stats.outOfStock, sub: pct(stats.outOfStock), icon: ShoppingCartIcon, tone: "text-red-600", iconBg: "bg-red-50 text-red-600", onClick: () => { setUsageTab("used"); setStockFilter("out-of-stock"); }, active: stockFilter === "out-of-stock" },
  ];

  return (
    <div className="page space-y-5">
      {/* Toolbar */}
      <div className="card card-body">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[220px_minmax(0,1fr)_180px_180px_auto] xl:items-end">
          <div>
            <label className="label">Warehouse</label>
            <div className="relative">
              <BuildingLibraryIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <select
                value={selectedWarehouse ?? ""}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                disabled={warehouseLoading}
                className="input pl-9"
              >
                {warehouseLoading ? (
                  <option>Loading warehouses...</option>
                ) : (
                  warehouseList.map((warehouse) => (
                    <option key={warehouse.value} value={warehouse.value}>
                      {warehouse.label}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Search</label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search by name, unit, or stock..."
                className="input pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Stock</label>
            <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="input">
              <option value="all">All Stock</option>
              <option value="in-stock">In Stock Only</option>
              <option value="out-of-stock">Out of Stock Only</option>
            </select>
          </div>

          <div>
            <label className="label">Container</label>
            <div className="relative">
              <ArchiveBoxIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
              <select value={containerFilter} onChange={(e) => setContainerFilter(e.target.value)} className="input pl-9">
                <option value="all">All Containers</option>
                {containerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value={NO_CONTAINER}>No Container</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:col-span-2 xl:col-span-1">
            <div className="flex rounded-lg border border-ink-300 bg-white p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                title="Grid view"
                className={`h-8 w-9 rounded-md flex items-center justify-center ${
                  viewMode === "grid" ? "bg-ink-950 text-brand-400" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Squares2X2Icon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                title="List view"
                className={`h-8 w-9 rounded-md flex items-center justify-center ${
                  viewMode === "list" ? "bg-ink-950 text-brand-400" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <ListBulletIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("container")}
                title="Container-wise view"
                className={`h-8 w-9 rounded-md flex items-center justify-center ${
                  viewMode === "container" ? "bg-ink-950 text-brand-400" : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <ArchiveBoxIcon className="h-4 w-4" />
              </button>
            </div>

            <button onClick={fetchRawMaterials} disabled={loading} className="btn-outline" title="Refresh">
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {statTiles.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={t.onClick}
              className={`card text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors hover:border-ink-300 ${
                t.active ? "ring-2 ring-brand-400 border-brand-400" : ""
              } ${t.key === "total" ? "col-span-2 md:col-span-1" : ""}`}
            >
              <div className="min-w-0">
                <div className="text-xs font-medium text-ink-500">{t.label}</div>
                <div className={`text-2xl font-bold tabular-nums ${t.tone}`}>{t.value}</div>
                <div className="text-[11px] text-ink-400">{t.sub}</div>
              </div>
              <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${t.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Usage tabs: In Use first, Not Used separately */}
      <div className="card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-200 px-4 pt-3 sm:pb-0 pb-3">
          <div className="flex gap-1" role="tablist">
            {[
              { key: "used", label: "In Use", count: usedMaterials.length, icon: BeakerIcon },
              { key: "notUsed", label: "Not Used", count: notUsedMaterials.length, icon: EyeSlashIcon },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = usageTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setUsageTab(tab.key)}
                  className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "border-brand-400 text-ink-950"
                      : "border-transparent text-ink-500 hover:text-ink-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  <span className={active ? "badge bg-ink-950 text-brand-400" : "badge-gray"}>{tab.count}</span>
                </button>
              );
            })}
          </div>

          {(stockFilter !== "all" || containerFilter !== "all" || search) && (
            <div className="flex items-center gap-2 text-xs text-ink-500 sm:pb-2">
              Filters active
              <button
                onClick={() => {
                  setStockFilter("all");
                  setContainerFilter("all");
                  setSearch("");
                }}
                className="font-semibold text-ink-900 underline underline-offset-2 hover:text-brand-600"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className={viewMode === "list" ? "" : "p-4"}>
          {loading ? (
            <div className="py-16 flex justify-center">
              <ArrowPathIcon className="h-6 w-6 animate-spin text-ink-400" />
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center">
                <ExclamationTriangleIcon className="h-6 w-6" />
              </div>
              <p className="font-semibold text-ink-800">
                No {usageTab === "used" ? "materials in use" : "unused materials"} found
              </p>
              <p className="text-sm text-ink-500">
                {search || stockFilter !== "all" || containerFilter !== "all"
                  ? "Try adjusting your search or filter."
                  : usageTab === "used"
                  ? "Mark materials as used from the Not Used tab."
                  : "All materials are currently in use."}
              </p>
            </div>
          ) : viewMode === "container" ? (
            <div className="space-y-4">
              {containerGroups.map((group) => {
                const isUnassigned = group.name === NO_CONTAINER;
                return (
                  <div key={group.name} className="rounded-lg border border-ink-200 overflow-hidden">
                    <div className="flex items-center justify-between gap-3 bg-ink-50 border-b border-ink-200 px-4 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="shrink-0 h-8 w-8 rounded-md bg-ink-950 text-brand-400 flex items-center justify-center">
                          <ArchiveBoxIcon className="h-4 w-4" />
                        </div>
                        <h3 className="font-semibold text-ink-950 truncate">
                          {isUnassigned ? "No Container" : group.name}
                        </h3>
                      </div>
                      <span className="badge-gray">
                        {group.rows.length} item{group.rows.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th className="!text-right">Qty in Container</th>
                            <th className="!text-right">Total Stock</th>
                            <th>Unit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map(({ item, qty }) => (
                            <tr key={item.id} className={isOutOfStock(item) ? "bg-red-50/50" : ""}>
                              <td>
                                <span className="font-medium text-ink-950 break-words">{item.name}</span>
                              </td>
                              <td className="text-right font-bold tabular-nums text-ink-950">{qty}</td>
                              <td className="text-right tabular-nums text-ink-600">{item.stock}</td>
                              <td className="text-ink-600">{item.unit}</td>
                              <td>
                                <StockBadge item={item} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
              {currentList.map(renderMaterialCard)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th className="!text-right">Stock</th>
                    <th>Unit</th>
                    <th>Containers</th>
                    <th>Status</th>
                    <th className="!text-right">Action</th>
                  </tr>
                </thead>
                <tbody>{currentList.map(renderMaterialRow)}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RawMaterialStock;
