import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Api from "../../../../auth/Api";
import ContainerMultiSelect from "../../../../components/dropdown/ContainerMultiSelect";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  FileText,
  Truck,
  Upload,
  Paperclip,
  X,
  PackageCheck,
  Search,
} from "lucide-react";

const toNum = (value) => parseFloat(value) || 0;

// Tolerant comparison so decimal quantities (e.g. 0.1 + 0.2) still match
const qtyEquals = (a, b) => Math.abs(a - b) < 1e-9;

// With a single container, that container always holds the whole good quantity
const syncSingleContainer = (input) => {
  const ids = input.containerIds || [];
  return ids.length === 1 ? { ...input, containerQty: { [ids[0]]: input.goodQty } } : input;
};

const getAssignedQty = (input) =>
  (input.containerIds || []).reduce((sum, id) => sum + toNum(input.containerQty?.[id]), 0);

// Good stock must be placed into containers whose quantities add up to goodQty
const getContainerError = (input) => {
  const good = toNum(input.goodQty);
  if (good <= 0) return null;
  if (!input.containerIds?.length) return "Select a container for the good quantity";
  const assigned = getAssignedQty(input);
  if (!qtyEquals(assigned, good)) return `Containers hold ${assigned}, good qty is ${good}`;
  return null;
};

// Accepts { data: [...] } or a bare array; containers may use id or _id
const normalizeContainers = (payload) => {
  const list = Array.isArray(payload) ? payload : payload?.data;
  return (Array.isArray(list) ? list : [])
    .map((c) => ({ id: c.id ?? c._id, name: c.name }))
    .filter((c) => c.id != null && c.name);
};

const ReceivedPurchaseStock = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { poData } = location?.state || {};
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [itemInputs, setItemInputs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [billFile, setBillFile] = useState(null);
  const [filteredItems, setFilteredItems] = useState([]);
  const [fetchVehicle, setFetchVehicle] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedVehicleNo, setSelectedVehicleNo] = useState("");
  const [userWarehouseId, setUserWarehouseId] = useState(null);
  const [containers, setContainers] = useState([]);
  const [containersLoading, setContainersLoading] = useState(true);

  // Search state
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState("");
  const [isVehicleDropdownOpen, setIsVehicleDropdownOpen] = useState(false);
  const vehicleSearchRef = useRef(null);

  // Warehouse to Vehicle Warehouse mapping
  const WAREHOUSE_VEHICLE_MAP = {
    "697b06b52da83d53d0e30731": "p891225a-af11-11ef-a344-1a2cd4d9c0d8",
    "67446a8b27dae6f7f4d985dd": "b691221b-af10-11ef-a344-1a2cd4d9c0d1",
  };

  // Target warehouses that require vehicle selection
  const TARGET_WAREHOUSE_IDS = Object.keys(WAREHOUSE_VEHICLE_MAP);

  // Get the vehicle warehouse ID based on user's warehouse
  const getVehicleWarehouseId = (warehouseId) => {
    return WAREHOUSE_VEHICLE_MAP[warehouseId] || null;
  };

  // Fetch vehicles from a specific warehouse
  async function fetchVehiclesForWarehouse(vehicleWarehouseId) {
    try {
      const response = await fetch(
        `https://logistics.umanerp.com/api/vehicleIN/getVehicleSummary?workLocation=${vehicleWarehouseId}`,
        {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      return [];
    }
  }

  // Fetch vehicles based on user's warehouse
  async function fetchVehicles() {
    try {
      if (!userWarehouseId) return;

      const vehicleWarehouseId = getVehicleWarehouseId(userWarehouseId);
      if (!vehicleWarehouseId) {
        setFetchVehicle([]);
        return;
      }

      const vehicles = await fetchVehiclesForWarehouse(vehicleWarehouseId);
      setFetchVehicle(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      setFetchVehicle([]);
    }
  }

  // Get warehouse ID from logged-in user data
  useEffect(() => {
    const getWarehouseId = () => {
      // Option 1: From localStorage
      const storedWarehouse = localStorage.getItem("warehouseId");
      if (storedWarehouse) return storedWarehouse;

      // Option 2: From sessionStorage
      const sessionWarehouse = sessionStorage.getItem("warehouseId");
      if (sessionWarehouse) return sessionWarehouse;

      // Option 3: From user object in localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.warehouseId) return user.warehouseId;
          if (user.warehouse?.id) return user.warehouse.id;
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }

      return null;
    };

    setUserWarehouseId(getWarehouseId());
  }, []);

  // Fetch vehicles whenever userWarehouseId changes
  useEffect(() => {
    if (userWarehouseId && TARGET_WAREHOUSE_IDS.includes(userWarehouseId)) {
      fetchVehicles();
    } else {
      setFetchVehicle([]);
    }
  }, [userWarehouseId]);

  // Load containers for the per-item container dropdown
  useEffect(() => {
    const fetchContainers = async () => {
      try {
        const response = await Api.get("/common/container");
        setContainers(normalizeContainers(response.data));
      } catch (error) {
        console.error("Error fetching containers:", error);
        setContainers([]);
      } finally {
        setContainersLoading(false);
      }
    };
    fetchContainers();
  }, []);

  // Initialize items when poData changes
  useEffect(() => {
    if (poData?.items) {
      const pendingItems = poData.items.filter(
        (item) => toNum(item.quantity) > toNum(item.receivedQty),
      );

      setFilteredItems(pendingItems);
      setItemInputs(
        pendingItems.map(() => ({
          receivedQty: "",
          goodQty: "",
          damagedQty: "0",
          remarks: "",
          containerIds: [],
          containerQty: {},
        })),
      );
    }
  }, [poData]);

  // Handle click outside vehicle dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        vehicleSearchRef.current &&
        !vehicleSearchRef.current.contains(event.target)
      ) {
        setIsVehicleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter vehicles based on search term
  const filteredVehicles = fetchVehicle.filter((vehicle) => {
    const searchLower = vehicleSearchTerm.toLowerCase();
    return (
      vehicle.vehicleNo?.toLowerCase().includes(searchLower) ||
      vehicle.partyName?.toLowerCase().includes(searchLower) ||
      vehicle.vehicleId?.toString().toLowerCase().includes(searchLower)
    );
  });

  const handleVehicleSelect = (vehicleId, vehicleNo, partyName) => {
    setSelectedVehicle(vehicleId);
    setSelectedVehicleNo(vehicleNo);
    setVehicleSearchTerm(`${vehicleNo} - ${partyName}`);
    setIsVehicleDropdownOpen(false);
  };

  const handleVehicleSearchChange = (e) => {
    setVehicleSearchTerm(e.target.value);
    setIsVehicleDropdownOpen(true);
    if (e.target.value === "") {
      setSelectedVehicle("");
      setSelectedVehicleNo("");
    }
  };

  const handleInputChange = (index, field, value) => {
    setItemInputs((prev) => {
      const updated = [...prev];
      const current = { ...updated[index] };

      // Keep goodQty in step with receivedQty unless the user changed it
      if (field === "receivedQty") {
        const prevReceived = toNum(current.receivedQty);
        const currentGood = toNum(current.goodQty);
        if (currentGood === 0 || qtyEquals(currentGood, prevReceived)) {
          current.goodQty = value;
        }
      }

      current[field] = value;

      // Keep quantities of still-selected containers; give a newly added
      // container whatever good quantity is not yet assigned
      if (field === "containerIds") {
        const prevQty = current.containerQty || {};
        const nextQty = {};
        value.forEach((id) => {
          nextQty[id] = prevQty[id] ?? "";
        });
        const unassigned = toNum(current.goodQty) - getAssignedQty({ containerIds: value, containerQty: nextQty });
        const added = value.find((id) => !(id in prevQty));
        if (added && unassigned > 0) nextQty[added] = String(unassigned);
        current.containerQty = nextQty;
      }

      updated[index] = syncSingleContainer(current);
      return updated;
    });
  };

  const handleContainerQtyChange = (index, containerId, value) => {
    setItemInputs((prev) => {
      const updated = [...prev];
      const current = updated[index];
      updated[index] = { ...current, containerQty: { ...current.containerQty, [containerId]: value } };
      return updated;
    });
  };

  // Fill every pending item with its full remaining quantity
  const fillAllRemaining = () => {
    setItemInputs((prev) =>
      prev.map((input, i) => {
        const remaining = String(calculateRemainingQty(filteredItems[i]));
        return syncSingleContainer({ ...input, receivedQty: remaining, goodQty: remaining, damagedQty: "0" });
      }),
    );
  };

  const clearAllQuantities = () => {
    setItemInputs((prev) =>
      prev.map((input) =>
        syncSingleContainer({ ...input, receivedQty: "", goodQty: "", damagedQty: "0", containerQty: {} }),
      ),
    );
  };

  const getContainerName = (id) => containers.find((c) => c.id === id)?.name ?? String(id);

  // Backend expects stock as { "<container name>": "<qty>" }
  const buildStock = (input) =>
    (input.containerIds || []).reduce((stock, id) => {
      const qty = toNum(input.containerQty?.[id]);
      if (qty <= 0) return stock;
      const name = getContainerName(id);
      stock[name] = String(toNum(stock[name]) + qty);
      return stock;
    }, {});

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      if (filteredItems.length === 0) {
        alert("No items to receive");
        setIsSubmitting(false);
        return;
      }

      const validationErrors = [];
      const itemsToProcess = [];

      filteredItems.forEach((item, i) => {
        const input = itemInputs[i];
        const remainingQty = calculateRemainingQty(item);

        const receivedQty = toNum(input.receivedQty);
        const goodQty = toNum(input.goodQty);
        const damagedQty = toNum(input.damagedQty);

        if (receivedQty <= 0) return;

        if (receivedQty > remainingQty) {
          validationErrors.push(
            `Received quantity for ${item.itemName} cannot exceed remaining quantity (${remainingQty})`,
          );
        }

        if (!qtyEquals(goodQty + damagedQty, receivedQty)) {
          validationErrors.push(
            `For ${item.itemName}, Good Qty + Damaged Qty must equal Received Qty`,
          );
        }

        const containerError = getContainerError(input);
        if (containerError) {
          validationErrors.push(`For ${item.itemName}: ${containerError}`);
        }

        itemsToProcess.push({ index: i, item, input });
      });

      if (validationErrors.length > 0) {
        alert(validationErrors.join("\n"));
        setIsSubmitting(false);
        return;
      }

      if (itemsToProcess.length === 0) {
        alert("Please enter received quantity for at least one item");
        setIsSubmitting(false);
        return;
      }

      // Validate vehicle selection for target warehouses
      if (TARGET_WAREHOUSE_IDS.includes(userWarehouseId) && !selectedVehicle) {
        alert("Please select a vehicle number");
        setIsSubmitting(false);
        return;
      }

      if (!invoiceNumber.trim()) {
        alert("Please enter invoice number");
        setIsSubmitting(false);
        return;
      }

      const itemsToSend = itemsToProcess.map(({ item, input }) => ({
        purchaseOrderItemId: item.id,
        itemId: item.itemId,
        itemSource: item.itemSource,
        itemName: item.itemName,
        goodQty: toNum(input.goodQty),
        damagedQty: toNum(input.damagedQty),
        remarks: input.remarks || "",
        stock: buildStock(input),
      }));

      const formData = new FormData();

      formData.append("purchaseOrderId", poData.id);
      formData.append("items", JSON.stringify(itemsToSend));
      formData.append("invoiceNumber", invoiceNumber);

      // Only append vehicle data if warehouse matches
      if (TARGET_WAREHOUSE_IDS.includes(userWarehouseId)) {
        formData.append("vehicleId", selectedVehicle);
        formData.append("vehicleNumber", selectedVehicleNo);
        const vehicleWarehouseId = getVehicleWarehouseId(userWarehouseId);
        if (vehicleWarehouseId) {
          formData.append("vehicleWarehouseId", vehicleWarehouseId);
        }
      }

      if (billFile) {
        formData.append("billFile", billFile);
      }

      await Api.post("/store-keeper/purchaseOrder/receive", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert(`Purchase stock received successfully!`);
      navigate(-1);
    } catch (error) {
      console.error("Submission error:", error);
      alert(error?.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  function calculateRemainingQty(item) {
    return toNum(item.quantity) - toNum(item.receivedQty);
  }

  const totalItemsCount = poData?.items?.length || 0;
  const pendingItemsCount = filteredItems.length;
  const fullyReceivedItemsCount = totalItemsCount - pendingItemsCount;

  // Check if vehicle selection should be shown
  const shouldShowVehicleSelection =
    userWarehouseId && TARGET_WAREHOUSE_IDS.includes(userWarehouseId);

  // Per-row validation state for inline feedback
  const getRowState = (item, index) => {
    const input = itemInputs[index] || {};
    const received = toNum(input.receivedQty);
    if (received <= 0) return { status: "skip" };
    if (received > calculateRemainingQty(item)) {
      return { status: "error", message: `Exceeds remaining (${calculateRemainingQty(item)})` };
    }
    const sum = toNum(input.goodQty) + toNum(input.damagedQty);
    if (!qtyEquals(sum, received)) {
      return { status: "error", message: `Good + Damaged = ${sum}, should be ${received}` };
    }
    const containerError = getContainerError(input);
    if (containerError) return { status: "error", message: containerError };
    return { status: "ok" };
  };

  const rowStates = filteredItems.map((item, i) => getRowState(item, i));
  const receivingCount = rowStates.filter((s) => s.status !== "skip").length;
  const errorCount = rowStates.filter((s) => s.status === "error").length;
  const totals = itemInputs.reduce(
    (acc, input, i) => {
      if (rowStates[i]?.status === "skip") return acc;
      acc.good += toNum(input.goodQty);
      acc.damaged += toNum(input.damagedQty);
      return acc;
    },
    { good: 0, damaged: 0 },
  );

  const qtyInputClass = (hasError) =>
    `input text-right tabular-nums ${hasError ? "!border-red-400 focus:!ring-red-300" : ""}`;

  const renderRowStatus = (state) => {
    if (state.status === "ok") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Ready
        </span>
      );
    }
    if (state.status === "error") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" /> {state.message}
        </span>
      );
    }
    return <span className="text-xs text-ink-400">Skipped</span>;
  };

  const renderItemMeta = (item) =>
    [item.modelNumber, item.hsnCode && `HSN ${item.hsnCode}`, item.unit]
      .filter(Boolean)
      .join(" · ");

  if (!poData) {
    return (
      <div className="p-4 sm:p-6">
        <div className="card mx-auto max-w-xl p-8 text-center">
          <p className="font-semibold text-ink-900">No purchase order selected</p>
          <p className="mt-1 text-sm text-ink-500">
            Open this page from PO Stock Receiving to receive stock.
          </p>
          <button onClick={handleCancel} className="btn-outline mt-4">
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {/* PO header */}
        <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <button
              onClick={handleCancel}
              aria-label="Back"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-200 text-ink-600 hover:bg-ink-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-ink-500">
                Receiving against
              </p>
              <h2 className="break-words text-lg font-bold text-ink-950">
                {poData.poNumber || "N/A"}
              </h2>
              <p className="break-words text-sm text-ink-600">
                {[poData.vendorName, poData.companyName].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-yellow">
              {pendingItemsCount} item{pendingItemsCount !== 1 ? "s" : ""} pending
            </span>
            {fullyReceivedItemsCount > 0 && (
              <span className="badge-green">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {fullyReceivedItemsCount} fully received
              </span>
            )}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="card py-16 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <p className="font-semibold text-ink-800">All items already received</p>
            <p className="text-sm text-ink-500">
              There's nothing pending to receive on this purchase order.
            </p>
            <button onClick={handleCancel} className="btn-dark mt-4">
              <ArrowLeft className="h-4 w-4" /> Go back
            </button>
          </div>
        ) : (
          <>
            {/* Delivery details */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Delivery details</h3>
              </div>
              <div
                className={`card-body grid gap-4 ${
                  shouldShowVehicleSelection ? "lg:grid-cols-3" : "lg:grid-cols-2"
                }`}
              >
                <div>
                  <label className="label">
                    Invoice number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                    <input
                      type="text"
                      className="input pl-9"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Supplier's invoice number"
                      maxLength={50}
                      required
                    />
                  </div>
                </div>

                {/* Vehicle selection - only for specific warehouses */}
                {shouldShowVehicleSelection && (
                  <div className="relative" ref={vehicleSearchRef}>
                    <label className="label">
                      Vehicle number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Truck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        type="text"
                        className="input pl-9 pr-9"
                        placeholder="Search vehicle or party…"
                        value={vehicleSearchTerm}
                        onChange={handleVehicleSearchChange}
                        onFocus={() => setIsVehicleDropdownOpen(true)}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        aria-label="Toggle vehicle list"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-ink-400 hover:text-ink-700"
                        onClick={() => setIsVehicleDropdownOpen(!isVehicleDropdownOpen)}
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isVehicleDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {isVehicleDropdownOpen && (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-ink-200 bg-white py-1 shadow-pop animate-slideDown">
                        {filteredVehicles.length > 0 ? (
                          filteredVehicles.map((vehicle) => (
                            <button
                              type="button"
                              key={vehicle.vehicleId}
                              className={`block w-full px-3 py-2 text-left hover:bg-brand-50 ${
                                selectedVehicle === vehicle.vehicleId ? "bg-brand-50" : ""
                              }`}
                              onClick={() =>
                                handleVehicleSelect(
                                  vehicle.vehicleId,
                                  vehicle.vehicleNo,
                                  vehicle.partyName,
                                )
                              }
                            >
                              <div className="text-sm font-semibold text-ink-900">
                                {vehicle.vehicleNo}
                              </div>
                              <div className="text-xs text-ink-500">{vehicle.partyName}</div>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-3 text-sm text-ink-500">
                            {fetchVehicle.length === 0
                              ? "No vehicles available for this warehouse"
                              : "No matching vehicles found"}
                          </div>
                        )}
                      </div>
                    )}

                    <p className="mt-1 text-xs text-ink-500">
                      {selectedVehicle ? (
                        <span className="font-medium text-green-700">✓ Vehicle selected</span>
                      ) : (
                        `${fetchVehicle.length} vehicle(s) available`
                      )}
                    </p>
                  </div>
                )}

                <div>
                  <label className="label">Bill / invoice document</label>
                  {billFile ? (
                    <div className="flex items-center gap-2 rounded-lg border border-ink-300 bg-ink-50 px-3 py-2">
                      <Paperclip className="h-4 w-4 shrink-0 text-ink-500" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900">
                        {billFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBillFile(null)}
                        aria-label="Remove file"
                        className="rounded p-1 text-ink-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-sm text-ink-600 transition-colors hover:border-brand-500 hover:bg-brand-50">
                      <Upload className="h-4 w-4 shrink-0" />
                      <span>Upload PDF or image</span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setBillFile(e.target.files[0] || null)}
                      />
                    </label>
                  )}
                  <p className="mt-1 text-xs text-ink-500">Max 10MB · one file for the whole delivery</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="card overflow-hidden">
              <div className="flex flex-col gap-2 border-b border-ink-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-bold text-ink-950">Items to receive</h3>
                  <p className="text-xs text-ink-500">
                    Enter quantities only for items in this delivery. Leave the rest empty to skip.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={fillAllRemaining} className="btn-outline px-3 py-1.5 text-xs">
                    Fill all remaining
                  </button>
                  {receivingCount > 0 && (
                    <button type="button" onClick={clearAllQuantities} className="btn-outline px-3 py-1.5 text-xs">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-ink-200">
                {filteredItems.map((item, index) => {
                  const input = itemInputs[index] || {};
                  const remainingQty = calculateRemainingQty(item);
                  const orderedQty = toNum(item.quantity);
                  const alreadyReceived = toNum(item.receivedQty);
                  const state = rowStates[index];
                  const isError = state.status === "error";
                  const isReady = state.status === "ok";
                  const receivedPct = orderedQty > 0 ? Math.min(100, (alreadyReceived / orderedQty) * 100) : 0;
                  const nowPct =
                    orderedQty > 0
                      ? Math.min(100 - receivedPct, (toNum(input.receivedQty) / orderedQty) * 100)
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className={`relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] lg:gap-8 ${
                        isError ? "bg-red-50/70" : isReady ? "bg-green-50/60" : ""
                      }`}
                    >
                      <span
                        className={`absolute inset-y-0 left-0 w-1 ${
                          isError ? "bg-red-500" : isReady ? "bg-green-500" : "bg-transparent"
                        }`}
                      />

                      {/* Item info + progress */}
                      <div className="min-w-0">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-950 text-[11px] font-bold text-brand-400">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="break-words text-base font-bold text-ink-950">{item.itemName}</div>
                            {renderItemMeta(item) && (
                              <div className="text-xs font-medium text-ink-600">{renderItemMeta(item)}</div>
                            )}
                            {item.itemDetail && (
                              <div className="mt-1 break-words text-xs text-ink-500">{item.itemDetail}</div>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Ordered</div>
                            <div className="font-bold tabular-nums text-ink-950">{orderedQty}</div>
                          </div>
                          <div className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-center">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">Received</div>
                            <div className="font-bold tabular-nums text-green-700">{alreadyReceived}</div>
                          </div>
                          <div className="rounded-lg border border-orange-200 bg-orange-50 px-2 py-1.5 text-center">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-700">Remaining</div>
                            <div className="font-bold tabular-nums text-orange-600">{remainingQty}</div>
                          </div>
                        </div>

                        {/* Already received (green) + receiving now (yellow) */}
                        <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-ink-200">
                          <div className="h-full bg-green-500" style={{ width: `${receivedPct}%` }} />
                          <div className="h-full bg-brand-400 transition-all" style={{ width: `${nowPct}%` }} />
                        </div>
                      </div>

                      {/* Entry fields */}
                      <div className="min-w-0">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-[minmax(150px,1fr)_minmax(110px,0.8fr)_minmax(110px,0.8fr)_minmax(200px,1.6fr)]">
                          <div className="col-span-2 sm:col-span-1">
                            <label className="label">Receiving now</label>
                            <div className="relative">
                              <input
                                type="number"
                                min="0"
                                max={remainingQty}
                                step="any"
                                className={`${qtyInputClass(isError)} pr-16 font-semibold`}
                                value={input.receivedQty || ""}
                                onChange={(e) => handleInputChange(index, "receivedQty", e.target.value)}
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => handleInputChange(index, "receivedQty", String(remainingQty))}
                                title="Receive full remaining quantity"
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md bg-ink-950 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-400 hover:bg-ink-800"
                              >
                                Max
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="label">Good</label>
                            <input
                              type="number"
                              min="0"
                              max={remainingQty}
                              step="any"
                              className={qtyInputClass(isError)}
                              value={input.goodQty || ""}
                              onChange={(e) => handleInputChange(index, "goodQty", e.target.value)}
                              disabled={!input.receivedQty}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="label">Damaged</label>
                            <input
                              type="number"
                              min="0"
                              max={remainingQty}
                              step="any"
                              className={qtyInputClass(isError)}
                              value={input.damagedQty || ""}
                              onChange={(e) => handleInputChange(index, "damagedQty", e.target.value)}
                              disabled={!input.receivedQty}
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-3 xl:col-span-1">
                            <label className="label">Containers</label>
                            <ContainerMultiSelect
                              options={containers}
                              loading={containersLoading}
                              value={input.containerIds}
                              onChange={(ids) => handleInputChange(index, "containerIds", ids)}
                            />
                          </div>
                        </div>

                        {input.containerIds?.length > 0 && (
                          <div className="mt-3 rounded-lg border border-ink-300 bg-white p-3">
                            <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold uppercase tracking-wider text-ink-600">
                                Good qty by container
                              </span>
                              <span
                                className={`font-bold tabular-nums ${
                                  qtyEquals(getAssignedQty(input), toNum(input.goodQty))
                                    ? "text-green-700"
                                    : "text-red-600"
                                }`}
                              >
                                {getAssignedQty(input)} / {toNum(input.goodQty)}
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                              {input.containerIds.map((id) => (
                                <div key={id} className="flex items-center gap-2">
                                  <span className="min-w-0 flex-1 truncate rounded-md bg-brand-300 px-2 py-2 text-xs font-bold text-ink-950">
                                    {getContainerName(id)}
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    className="input w-28 text-right font-semibold tabular-nums"
                                    value={input.containerQty?.[id] ?? ""}
                                    onChange={(e) => handleContainerQtyChange(index, id, e.target.value)}
                                    disabled={input.containerIds.length === 1}
                                    title={input.containerIds.length === 1 ? "Matches good qty automatically" : undefined}
                                    placeholder="0"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                          <div className="min-w-0 flex-1">
                            <label className="label">Remarks</label>
                            <input
                              type="text"
                              className="input"
                              value={input.remarks || ""}
                              onChange={(e) => handleInputChange(index, "remarks", e.target.value)}
                              placeholder="Optional note for this item"
                            />
                          </div>
                          <div className="sm:w-56 sm:pb-2.5">{renderRowStatus(state)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sticky footer */}
            <div className="sticky bottom-0 z-20 -mx-4 border-t border-ink-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:shadow-pop">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span className="text-ink-600">
                    Receiving{" "}
                    <span className="font-semibold text-ink-950">
                      {receivingCount} of {pendingItemsCount}
                    </span>{" "}
                    items
                  </span>
                  {receivingCount > 0 && (
                    <>
                      <span className="text-ink-600">
                        Good <span className="font-semibold tabular-nums text-green-700">{totals.good}</span>
                      </span>
                      <span className="text-ink-600">
                        Damaged <span className="font-semibold tabular-nums text-red-600">{totals.damaged}</span>
                      </span>
                    </>
                  )}
                  {errorCount > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                      <AlertCircle className="h-4 w-4" /> {errorCount} row{errorCount !== 1 ? "s" : ""} need fixing
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCancel} className="btn-outline flex-1 sm:flex-none">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="btn-primary flex-1 sm:flex-none sm:px-6"
                  >
                    {isSubmitting ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-950/30 border-t-ink-950" />
                    ) : (
                      <PackageCheck className="h-4 w-4" />
                    )}
                    {isSubmitting ? "Processing…" : "Submit delivery"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReceivedPurchaseStock;
