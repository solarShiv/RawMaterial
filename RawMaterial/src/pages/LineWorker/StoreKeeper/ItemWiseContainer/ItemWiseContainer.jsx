import React, { useEffect, useState } from "react";
import Api from "../../../../auth/Api";
import { Boxes, CheckCircle2, AlertCircle, Trash2, Send } from "lucide-react";
import ContainerMultiSelect from "../../../../components/dropdown/ContainerMultiSelect";
import SearchableSelect from "../../../../components/dropdown/SearchableSelect";

// Accepts { data: [...] } or a bare array; records may use id or _id
const normalizeList = (payload) => {
  const list = Array.isArray(payload) ? payload : payload?.data;
  return (Array.isArray(list) ? list : [])
    .map((x) => ({ ...x, id: x.id ?? x._id, name: x.name }))
    .filter((x) => x.id != null && x.name);
};

// Warehouse list repeats an item once per warehouse; merge them and sum the stock
const mergeWarehouseItems = (list) => {
  const map = new Map();
  list.forEach((item) => {
    const stock = Number(item.stock) || 0;
    const existing = map.get(item.id);
    if (existing) existing.stock += stock;
    else map.set(item.id, { ...item, stock });
  });
  return [...map.values()].map((item) => ({
    ...item,
    hint: `${item.stock} ${item.unit || ""}`.trim(),
  }));
};

const ItemWiseContainer = () => {
  const [items, setItems] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [itemId, setItemId] = useState("");
  const [containerIds, setContainerIds] = useState([]);
  const [quantities, setQuantities] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemRes, containerRes] = await Promise.all([
          Api.get("/store-keeper/getWarehouseRawMaterialList"),
          Api.get("/common/container"),
        ]);
        setItems(mergeWarehouseItems(normalizeList(itemRes.data)));
        setContainers(normalizeList(containerRes.data));
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Failed to load items/containers");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const selectedItem = items.find((i) => String(i.id) === String(itemId));

  const handleContainersChange = (ids) => {
    setContainerIds(ids);
    setQuantities((prev) => {
      const next = {};
      ids.forEach((id) => (next[id] = prev[id] ?? ""));
      return next;
    });
    setError("");
  };

  const handleQuantityChange = (id, value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantities((prev) => ({ ...prev, [id]: value }));
    }
  };

  const removeContainer = (id) => handleContainersChange(containerIds.filter((c) => c !== id));

  const resetForm = () => {
    setItemId("");
    setContainerIds([]);
    setQuantities({});
  };

  const totalQuantity = containerIds.reduce((sum, id) => sum + (parseFloat(quantities[id]) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!itemId) {
      setError("Please select an item");
      return;
    }
    if (containerIds.length === 0) {
      setError("Please select at least one container");
      return;
    }
    const payload = {
      itemId,
      containers: containerIds.map((id) => ({
        containerId: id,
        quantity: parseFloat(quantities[id]) || 0,
      })),
    };

    setSubmitting(true);
    try {
      const response = await Api.post("/store-keeper/addItemContainerStock", payload);
      if (response.data?.success === false) {
        setError(response.data?.message || "Failed to add item container stock");
      } else {
        setMessage(response.data?.message || `Container stock added for "${selectedItem?.name}"`);
        resetForm();
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to add item container stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <form onSubmit={handleSubmit} className="card mx-auto max-w-2xl">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-950 text-brand-400">
              <Boxes className="h-5 w-5" />
            </span>
            <h2 className="card-title">Item Wise Container</h2>
          </div>
        </div>

        <div className="card-body space-y-5">
          {/* Item */}
          <div>
            <label className="label">
              Item <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={items}
              value={itemId}
              onChange={(id) => {
                setItemId(id);
                setError("");
              }}
              loading={loading}
              disabled={submitting}
              placeholder={`Select an item (${items.length})`}
              searchPlaceholder="Search items…"
            />
          </div>

          {/* Containers */}
          <div>
            <label className="label">
              Containers <span className="text-red-500">*</span>
            </label>
            <ContainerMultiSelect
              options={containers}
              value={containerIds}
              onChange={handleContainersChange}
              loading={loading}
            />
          </div>

          {containerIds.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-sm">
                <thead className="bg-ink-50 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-3 py-2">Container</th>
                    <th className="px-3 py-2 w-40">Quantity</th>
                    <th className="px-3 py-2 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {containerIds.map((id) => {
                    const c = containers.find((x) => x.id === id);
                    return (
                      <tr key={id}>
                        <td className="px-3 py-2 font-medium text-ink-900">{c?.name || id}</td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={quantities[id] ?? ""}
                            onChange={(e) => handleQuantityChange(id, e.target.value)}
                            placeholder="0"
                            className="input h-8 py-1"
                            disabled={submitting}
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeContainer(id)}
                            aria-label="Remove container"
                            className="text-red-500 hover:text-red-700"
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-ink-50 font-semibold text-ink-900">
                  <tr>
                    <td className="px-3 py-2">Total</td>
                    <td className="px-3 py-2 tabular-nums" colSpan={2}>
                      {totalQuantity} {selectedItem?.unit || ""}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

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

          <button type="submit" disabled={submitting || loading} className="btn-primary w-full">
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {submitting ? "Saving…" : "Add Container Stock"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemWiseContainer;
