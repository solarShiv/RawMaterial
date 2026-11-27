import React, { useEffect, useState } from "react";
import Api from "../../../../auth/Api";
import { Box, CheckCircle2, AlertCircle, Plus, Search, RefreshCw, Warehouse } from "lucide-react";
import { getUserWarehouseId, containerListUrl, apiErrorText } from "../../../../utils/warehouse";

const NO_WAREHOUSE_MSG = "No warehouse is assigned to your login. Please contact the admin.";

// Accepts { data: [...] } or a bare array; containers may use id or _id
const normalizeContainers = (payload) => {
  const list = Array.isArray(payload) ? payload : payload?.data;
  return (Array.isArray(list) ? list : [])
    .map((c) => ({ id: c.id ?? c._id, name: c.name }))
    .filter((c) => c.id != null && c.name);
};

const AddContainer = () => {
  const [warehouseId] = useState(getUserWarehouseId);
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseLoading, setWarehouseLoading] = useState(!!warehouseId);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [containers, setContainers] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [search, setSearch] = useState("");

  const fetchContainers = async () => {
    if (!warehouseId) {
      setListError(NO_WAREHOUSE_MSG);
      setContainers([]);
      setListLoading(false);
      return;
    }
    try {
      setListLoading(true);
      setListError("");
      const response = await Api.get(containerListUrl(warehouseId));
      if (response.data?.success === false) {
        setListError(response.data?.message || "Failed to fetch containers");
        setContainers([]);
      } else {
        setContainers(normalizeContainers(response.data));
      }
    } catch (err) {
      console.error("Error fetching containers:", err);
      setListError(apiErrorText(err, "Failed to fetch containers"));
      setContainers([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  // Login saves only the warehouse ID; look up its name to show on screen
  useEffect(() => {
    if (!warehouseId) return;
    const fetchWarehouseName = async () => {
      try {
        const res = await Api.get("/purchase/warehouses");
        const match = (res?.data?.data || []).find(
          (w) => String(w._id ?? w.id) === String(warehouseId)
        );
        setWarehouseName(match?.warehouseName || "");
      } catch (err) {
        console.error("Error fetching warehouses:", err);
      } finally {
        setWarehouseLoading(false);
      }
    };
    fetchWarehouseName();
  }, [warehouseId]);

  const warehouseLabel = !warehouseId
    ? "Not assigned"
    : warehouseLoading
    ? "Loading…"
    : warehouseName || "Assigned warehouse";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Container name is required");
      return;
    }
    if (!warehouseId) {
      setError(NO_WAREHOUSE_MSG);
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await Api.post("/common/container", {
        name: name.trim(),
        warehouseId,
      });
      if (response.data?.success === false) {
        setError(response.data?.message || "Failed to add container");
      } else {
        setMessage(`Container "${name.trim()}" added to ${warehouseName || "your warehouse"}!`);
        setName("");
        fetchContainers();
      }
    } catch (err) {
      setError(apiErrorText(err, "Failed to add container. Please try again."));
      console.error("Error adding container:", err);
    } finally {
      setLoading(false);
    }
  };

  const term = search.trim().toLowerCase();
  const visibleContainers = term
    ? containers.filter((c) => c.name.toLowerCase().includes(term))
    : containers;

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-lg space-y-5">
        <form onSubmit={handleSubmit} className="card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-brand-400">
                <Box className="h-5 w-5" />
              </span>
              <h2 className="card-title">New container</h2>
            </div>
          </div>

          <div className="card-body space-y-4">
            {/* Read-only: containers are created in the logged-in user's warehouse */}
            <div>
              <label htmlFor="container-warehouse" className="label">
                Warehouse
              </label>
              <div className="relative">
                <Warehouse className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  id="container-warehouse"
                  type="text"
                  value={warehouseLabel}
                  readOnly
                  disabled
                  title="Containers are created in your assigned warehouse"
                  className={`input pl-9 disabled:cursor-not-allowed ${!warehouseId ? "text-red-600" : ""}`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="container-name" className="label">
                Container name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="container-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError("");
                }}
                className="input"
                placeholder="Enter container name"
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            {message && (
              <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {message}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {loading ? "Adding…" : "Add Container"}
            </button>
          </div>
        </form>

        {/* Existing containers */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h2 className="card-title">Containers</h2>
              <p className="text-xs text-ink-500">
                {containers.length} total{warehouseId ? ` in ${warehouseLabel}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={fetchContainers}
              disabled={listLoading}
              aria-label="Refresh"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-300 text-ink-700 hover:bg-ink-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {containers.length > 0 && (
            <div className="border-b border-ink-200 p-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search containers…"
                  className="input pl-9"
                />
              </div>
            </div>
          )}

          {listLoading && containers.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-500">Loading containers…</div>
          ) : listError ? (
            <div className="py-10 text-center text-sm font-medium text-red-600">{listError}</div>
          ) : visibleContainers.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-500">
              {containers.length === 0 ? "No containers added yet" : "No matching containers"}
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-ink-200 overflow-y-auto">
              {visibleContainers.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="w-6 text-xs tabular-nums text-ink-400">{i + 1}</span>
                  <span className="font-medium text-ink-950">{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddContainer;
