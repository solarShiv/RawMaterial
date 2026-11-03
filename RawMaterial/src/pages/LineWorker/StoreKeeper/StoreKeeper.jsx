import React, { useState, useEffect } from "react";
import Api from "../../../auth/Api";
import {
  FaUserCog,
  FaInbox,
  FaCheck,
  FaTimes,
  FaTruckLoading,
  FaClock,
  FaBoxOpen,
  FaExclamationTriangle,
} from "react-icons/fa";

const STATUS_META = {
  pending: { label: "Pending", cls: "badge-yellow", bar: "bg-brand-400", icon: FaClock },
  approved: { label: "Approved", cls: "badge-green", bar: "bg-green-500", icon: FaCheck },
  declined: { label: "Declined", cls: "badge-red", bar: "bg-red-500", icon: FaTimes },
  rejected: { label: "Rejected", cls: "badge-red", bar: "bg-red-500", icon: FaTimes },
};

const StoreKeeper = () => {
  const [lineWorkers, setLineWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [materialGivenLoading, setMaterialGivenLoading] = useState(null);
  const [declineRemarks, setDeclineRemarks] = useState({});
  const [showRemarksField, setShowRemarksField] = useState({});

  useEffect(() => {
    const fetchLineWorkers = async () => {
      try {
        const response = await Api.get("/store-keeper/getLineWorkerList");
        setLineWorkers(response?.data?.data || []);
      } catch (err) {
        setError("Error fetching workers: " + (err?.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    

    fetchLineWorkers();
  }, []);

  useEffect(() => {
    const fetchIncomingRequests = async () => {
      if (!selectedWorker) {
        setIncomingRequests([]);
        return;
      }

      setRequestsLoading(true);
      try {
        const response = await Api.get(
          `/store-keeper/showIncomingItemRequest?empId=${selectedWorker}`
        );

        if (response.data.success) {
          setIncomingRequests(response.data.data || []);
        } else {
          setIncomingRequests([]);
        }
      } catch (err) {
        setError("Error fetching incoming requests: " + (err?.response?.data?.message || err.message));
      } finally {
        setRequestsLoading(false);
      }
    };

    fetchIncomingRequests();
  }, [selectedWorker]);

  // ---------------- APPROVE ----------------
  const handleApprove = async (requestId) => {
    try {
      const response = await Api.put("/store-keeper/approveOrDeclineItemRequest", {
        itemRequestId: requestId,
        action: "APPROVE",
      });

      if (response.data.success) {
        alert("Request approved successfully!");
        refreshRequests();
      } else {
        alert("Failed to approve request: " + response.data.message);
      }
    } catch (err) {
      alert("Error approving request: " + (err?.response?.data?.message || err.message));
    }
  };

  // ---------------- DECLINE ----------------
  const handleDecline = async (requestId) => {
    const remarks = declineRemarks[requestId]?.trim();

    if (!remarks) {
      alert("Remarks are required to decline the request.");
      return;
    }

    try {
      const response = await Api.put("/store-keeper/approveOrDeclineItemRequest", {
        itemRequestId: requestId,
        action: "DECLINE",
        remarks,
      });

      if (response.data.success) {
        alert("Request declined successfully!");
        refreshRequests();
        // Reset remarks field
        setDeclineRemarks(prev => ({ ...prev, [requestId]: "" }));
        setShowRemarksField(prev => ({ ...prev, [requestId]: false }));
      } else {
        alert("Failed to decline request: " + response.data.message);
      }
    } catch (err) {
      alert("Error declining request: " + (err?.response?.data?.message || err.message));
    }
  };

  // ---------------- SANCTION MATERIAL ----------------
  const handleMaterialGiven = async (requestId) => {
    setMaterialGivenLoading(requestId);
    try {
      const response = await Api.post("/store-keeper/sanctionItemForRequest", {
        itemRequestId: requestId,
      });

      if (response.data.success) {
        alert("Material sanctioned successfully!");
        refreshRequests();
      } else {
        alert("Failed to sanction material: " + response.data.message);
      }
    } catch (err) {
      alert("Error sanctioning material: " + (err?.response?.data?.message || err.message));
    } finally {
      setMaterialGivenLoading(null);
    }
  };

  const refreshRequests = async () => {
    const response = await Api.get(
      `/store-keeper/showIncomingItemRequest?empId=${selectedWorker}`
    );
    if (response.data.success) {
      setIncomingRequests(response.data.data || []);
    }
  };

  const handleWorkerChange = (event) => {
    setSelectedWorker(event.target.value);
    setError(null);
  };

  const handleDeclineClick = (requestId) => {
    setShowRemarksField(prev => ({ ...prev, [requestId]: true }));
  };

  const handleCancelDecline = (requestId) => {
    setShowRemarksField(prev => ({ ...prev, [requestId]: false }));
    setDeclineRemarks(prev => ({ ...prev, [requestId]: "" }));
  };

  const handleRemarksChange = (requestId, value) => {
    setDeclineRemarks(prev => ({ ...prev, [requestId]: value }));
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  // Helper function to determine request status
  const getRequestStatus = (request) => {
    if (request.declined === true) return "declined";
    if (request.approved === true) return "approved";
    if (request.approved === false) return "rejected";
    return "pending";
  };

  const counts = incomingRequests.reduce(
    (acc, r) => {
      const st = getRequestStatus(r);
      acc.total += 1;
      if (st === "pending") acc.pending += 1;
      else if (st === "approved") acc.approved += 1;
      else acc.declined += 1;
      return acc;
    },
    { total: 0, pending: 0, approved: 0, declined: 0 }
  );

  const selectedWorkerObj = lineWorkers.find((w) => String(w.id) === String(selectedWorker));

  if (loading) {
    return (
      <div className="page">
        <div className="card card-body animate-pulse space-y-3">
          <div className="h-4 w-40 rounded bg-ink-100" />
          <div className="h-10 w-full rounded-lg bg-ink-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="card card-body max-w-lg mx-auto text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
            <FaExclamationTriangle size={20} />
          </div>
          <h3 className="font-semibold text-ink-950">Something went wrong</h3>
          <p className="mt-1 text-sm text-ink-500 break-words">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-dark mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page space-y-6">
      <p className="text-sm text-ink-500">
        Review material requests from line workers, approve or decline them, and issue the material.
      </p>

      {/* Toolbar */}
      <div className="card">
        <div className="card-body grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-end">
          <div>
            <label className="label" htmlFor="worker-select">Line Worker</label>
            <div className="relative">
              <FaUserCog className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <select
                id="worker-select"
                value={selectedWorker}
                onChange={handleWorkerChange}
                className="input pl-9"
              >
                <option value="">Select a line worker</option>
                {lineWorkers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name} - {worker.role.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedWorker && !requestsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: counts.total, cls: "text-ink-950" },
                { label: "Pending", value: counts.pending, cls: "text-brand-600" },
                { label: "Approved", value: counts.approved, cls: "text-green-600" },
                { label: "Declined", value: counts.declined, cls: "text-red-600" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-2.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">{s.label}</div>
                  <div className={`text-xl font-bold ${s.cls}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading incoming requests */}
      {requestsLoading && (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card card-body animate-pulse space-y-3">
              <div className="h-4 w-24 rounded bg-ink-100" />
              <div className="h-3 w-40 rounded bg-ink-100" />
              <div className="h-20 rounded-lg bg-ink-100" />
            </div>
          ))}
        </div>
      )}

      {/* Incoming Requests List */}
      {selectedWorker && !requestsLoading && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold text-ink-950">
            Incoming Requests
            {selectedWorkerObj && <span className="ml-2 font-normal text-ink-500">· {selectedWorkerObj.name}</span>}
          </h2>

          {incomingRequests.length === 0 ? (
            <div className="card card-body text-center py-12">
              <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-ink-100 text-ink-400 flex items-center justify-center">
                <FaInbox size={20} />
              </div>
              <p className="font-medium text-ink-800">No pending requests</p>
              <p className="text-sm text-ink-500">This worker has no material requests right now.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {incomingRequests.map((request) => {
                const status = getRequestStatus(request);
                const meta = STATUS_META[status];
                const StatusIcon = meta.icon;

                return (
                  <article key={request.id} className="card relative overflow-hidden flex flex-col">
                    <span className={`absolute inset-y-0 left-0 w-1 ${meta.bar}`} />

                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-ink-100">
                      <div className="min-w-0">
                        <div className="text-xs text-ink-500">Requested</div>
                        <div className="text-sm font-semibold text-ink-900">{formatDate(request.requestedAt)}</div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {request.isProcessRequest && <span className="badge-gray">Process</span>}
                        <span className={meta.cls}>
                          <StatusIcon className="text-[10px]" /> {meta.label}
                        </span>
                      </div>
                    </div>

                    {/* Materials */}
                    <div className="px-5 py-4 flex-1">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-500">
                        <FaBoxOpen /> Materials ({request.rawMaterialRequested.length})
                      </div>
                      <ul className="divide-y divide-ink-100 rounded-lg border border-ink-200">
                        {request.rawMaterialRequested.map((mat, i) => (
                          <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                            <span className="text-ink-800 min-w-0 break-words">{mat.name}</span>
                            <span className="shrink-0 font-semibold text-ink-950 tabular-nums">
                              {mat.quantity} <span className="font-normal text-ink-500">{mat.unit}</span>
                            </span>
                          </li>
                        ))}
                      </ul>

                      {request.declinedRemarks && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                          <span className="font-semibold">Decline reason:</span> {request.declinedRemarks}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-4">
                      {status === "pending" &&
                        (!showRemarksField[request.id] ? (
                          <div className="grid grid-cols-2 gap-3">
                            <button className="btn btn-approve" onClick={() => handleApprove(request.id)}>
                              <FaCheck /> Approve
                            </button>
                            <button className="btn btn-decline" onClick={() => handleDeclineClick(request.id)}>
                              <FaTimes /> Decline
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3 animate-slideDown">
                            <div>
                              <label className="label">Reason for declining</label>
                              <textarea
                                value={declineRemarks[request.id] || ""}
                                onChange={(e) => handleRemarksChange(request.id, e.target.value)}
                                placeholder="Enter reason for declining this request..."
                                className="input resize-none"
                                rows="3"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                className="btn btn-decline"
                                onClick={() => handleDecline(request.id)}
                                disabled={!declineRemarks[request.id]?.trim()}
                              >
                                Confirm Decline
                              </button>
                              <button className="btn-outline" onClick={() => handleCancelDecline(request.id)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ))}

                      {/* Sanction material - only for approved requests where material is not given */}
                      {status === "approved" && !request.materialGiven && (
                        <button
                          className="btn-primary w-full"
                          disabled={materialGivenLoading === request.id}
                          onClick={() => handleMaterialGiven(request.id)}
                        >
                          <FaTruckLoading />
                          {materialGivenLoading === request.id ? "Sanctioning..." : "Sanction & Send Material"}
                        </button>
                      )}

                      {request.materialGiven && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-green-50 py-2 text-sm font-semibold text-green-700">
                          <FaCheck /> Material Sanctioned & Sent
                        </div>
                      )}

                      {(status === "declined" || status === "rejected") && (
                        <div className="flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2 text-sm font-semibold text-red-700">
                          <FaTimes /> Request {meta.label}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {!selectedWorker && (
        <div className="card card-body text-center py-14">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
            <FaUserCog size={22} />
          </div>
          <p className="font-semibold text-ink-900">Select a line worker</p>
          <p className="text-sm text-ink-500">Choose a worker above to view their material requests.</p>
        </div>
      )}
    </div>
  );
};

export default StoreKeeper;
