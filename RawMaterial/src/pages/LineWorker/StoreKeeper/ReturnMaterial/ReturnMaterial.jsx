import React, { useEffect, useState, useRef } from "react";
import Api from "../../../../auth/Api";

const ReturnMaterial = () => {
  const [lineWorkers, setLineWorkers] = useState([]);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [outstandingItems, setOutstandingItems] = useState([]);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [remarks, setRemarks] = useState("");
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);

  /* ─── Fetch line worker list ─── */
  useEffect(() => {
    const fetchLineWorkers = async () => {
      setLoadingWorkers(true);
      try {
        const res = await Api.get("/store-keeper/getLineWorkerList");
        setLineWorkers(res?.data?.data || []);
      } catch (err) {
        alert(err?.response?.data?.message || err.message);
      } finally {
        setLoadingWorkers(false);
      }
    };
    fetchLineWorkers();
  }, []);

  /* ─── Fetch outstanding returnable items when worker changes ─── */
  useEffect(() => {
    if (!selectedWorker) {
      setOutstandingItems([]);
      setReturnQuantities({});
      setEmployeeName("");
      return;
    }

    const fetchOutstanding = async () => {
      setLoadingItems(true);
      setErrors({});
      try {
        const res = await Api.get(
          `/store-keeper/returnMaterial/outstanding?empId=${selectedWorker}`
        );
        if (res?.data?.success) {
          setOutstandingItems(res.data.data || []);
          setEmployeeName(res.data.employeeName || "");
          // Initialise return quantities to empty
          const initQty = {};
          (res.data.data || []).forEach((item) => {
            initQty[item.rawMaterialId] = "";
          });
          setReturnQuantities(initQty);
        }
      } catch (err) {
        alert(err?.response?.data?.message || err.message);
      } finally {
        setLoadingItems(false);
      }
    };

    fetchOutstanding();
  }, [selectedWorker]);

  const handleReturnQtyChange = (rawMaterialId, value) => {
    if (value === "" || parseFloat(value) >= 0) {
      setReturnQuantities({ ...returnQuantities, [rawMaterialId]: value });
      // Clear error for this field
      if (errors[`qty_${rawMaterialId}`]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[`qty_${rawMaterialId}`];
          return next;
        });
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedWorker) {
      newErrors.selectedWorker = "Please select an employee";
    }

    const activeReturns = outstandingItems.filter((item) => {
      const qty = returnQuantities[item.rawMaterialId];
      return qty !== "" && qty !== undefined;
    });

    if (activeReturns.length === 0) {
      newErrors.general = "Enter a return quantity for at least one material";
    }

    outstandingItems.forEach((item) => {
      const rawQty = returnQuantities[item.rawMaterialId];
      if (rawQty === "" || rawQty === undefined) return; // blank = skip this item

      const qty = parseFloat(rawQty);
      if (isNaN(qty) || qty <= 0) {
        newErrors[`qty_${item.rawMaterialId}`] = "Must be greater than 0";
      } else if (qty > item.remaining) {
        newErrors[`qty_${item.rawMaterialId}`] =
          `Max returnable: ${item.remaining} ${item.unit}`;
      }
    });

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const returns = outstandingItems
      .filter((item) => {
        const qty = returnQuantities[item.rawMaterialId];
        return qty !== "" && qty !== undefined && parseFloat(qty) > 0;
      })
      .map((item) => ({
        rawMaterialId: item.rawMaterialId,
        returnQty: String(returnQuantities[item.rawMaterialId]),
        unit: item.unit,
      }));

    setSubmitting(true);
    try {
      await Api.post("/store-keeper/returnMaterial", {
        empId: selectedWorker,
        returns,
        remarks: remarks || undefined,
      });

      alert("Material returned to store successfully ✅");
      handleReset();
    } catch (err) {
      alert(err?.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedWorker("");
    setEmployeeName("");
    setOutstandingItems([]);
    setReturnQuantities({});
    setRemarks("");
    setErrors({});
  };

  const hasAnyReturnQty = outstandingItems.some((item) => {
    const qty = returnQuantities[item.rawMaterialId];
    return qty !== "" && qty !== undefined && parseFloat(qty) > 0;
  });

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-4 md:p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
        Return Material to Store
      </h2>

      <form onSubmit={handleSubmit}>
        {/* ── EMPLOYEE SELECTION ── */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-gray-700">
            Select Employee <span className="text-red-500">*</span>
          </label>
          {loadingWorkers ? (
            <div className="text-gray-500 text-sm">Loading employees…</div>
          ) : (
            <select
              value={selectedWorker}
              onChange={(e) => {
                setSelectedWorker(e.target.value);
                setErrors({});
              }}
              className={`w-full border rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                errors.selectedWorker ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">— Select Employee —</option>
              {lineWorkers.map((worker) => (
                <option key={worker.id} value={worker.id}>
                  {worker.name} ({worker?.role?.name || "No Role"})
                </option>
              ))}
            </select>
          )}
          {errors.selectedWorker && (
            <p className="text-red-500 text-sm mt-1">{errors.selectedWorker}</p>
          )}
        </div>

        {/* ── OUTSTANDING RETURNABLE ITEMS TABLE ── */}
        {selectedWorker && (
          <div className="mb-6">
            {loadingItems ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-2 text-gray-600">Loading outstanding items…</p>
              </div>
            ) : outstandingItems.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mx-auto mb-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-600 font-medium">
                  No outstanding returnable materials for{" "}
                  {employeeName || "this employee"}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  All returnable items have been returned or none were issued.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">
                    Outstanding Returnable Materials
                    {employeeName && (
                      <span className="text-blue-600 ml-2">— {employeeName}</span>
                    )}
                  </h3>
                  <span className="text-sm text-gray-500 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {outstandingItems.length} item{outstandingItems.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {errors.general && (
                  <p className="text-red-500 text-sm mb-3">{errors.general}</p>
                )}

                {/* TABLE */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Material
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Issued
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Returned
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Remaining
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                          Return Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingItems.map((item, idx) => {
                        const retQtyRaw = returnQuantities[item.rawMaterialId];
                        const retQty = parseFloat(retQtyRaw) || 0;
                        const hasError = !!errors[`qty_${item.rawMaterialId}`];

                        return (
                          <tr
                            key={item.rawMaterialId}
                            className={`border-b border-gray-100 ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50 transition`}
                          >
                            {/* MATERIAL */}
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">
                                {item.name}
                              </div>
                              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block mt-1">
                                RETURNABLE
                              </div>
                            </td>

                            {/* ISSUED */}
                            <td className="px-4 py-3 text-center text-gray-700">
                              {item.totalIssued} {item.unit}
                            </td>

                            {/* RETURNED */}
                            <td className="px-4 py-3 text-center text-orange-600 font-medium">
                              {item.totalReturned} {item.unit}
                            </td>

                            {/* REMAINING */}
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`font-semibold ${
                                  item.remaining > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {item.remaining} {item.unit}
                              </span>
                            </td>

                            {/* RETURN QTY INPUT */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    max={item.remaining}
                                    value={retQtyRaw}
                                    onChange={(e) =>
                                      handleReturnQtyChange(
                                        item.rawMaterialId,
                                        e.target.value
                                      )
                                    }
                                    className={`w-24 border rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                                      hasError
                                        ? "border-red-500 bg-red-50"
                                        : "border-gray-300"
                                    }`}
                                    placeholder="0"
                                  />
                                  <span className="text-xs text-gray-500">
                                    {item.unit}
                                  </span>
                                </div>
                                {hasError && (
                                  <p className="text-red-500 text-xs">
                                    {errors[`qty_${item.rawMaterialId}`]}
                                  </p>
                                )}
                                {retQty > 0 && !hasError && (
                                  <p className="text-green-600 text-xs font-medium">
                                    Returning {retQty} {item.unit}
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── REMARKS ── */}
        {selectedWorker && outstandingItems.length > 0 && (
          <div className="mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
              placeholder="Add any notes about this return transaction…"
            />
          </div>
        )}

        {/* ── SUBMIT ── */}
        {selectedWorker && outstandingItems.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              type="submit"
              disabled={submitting || !hasAnyReturnQty}
              className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing…
                </span>
              ) : (
                "Submit Return"
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default ReturnMaterial;
