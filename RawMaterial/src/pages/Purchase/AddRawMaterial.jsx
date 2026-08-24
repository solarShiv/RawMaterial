// import React, { useEffect, useState } from "react";
import React, { useEffect, useRef, useState } from "react";
import Api from "../../auth/Api";

const AddRawMaterial = ({
  isEditMode = false,
  editData = null,
  onSuccess,
  onCancel,
  closeModal,
}) => {
  const [rawMaterialName, setRawMaterialName] = useState("");
  const [rawMaterialDescription, setRawMaterialDescription] = useState("");
  const [unit, setUnit] = useState("");
  const [unitList, setUnitList] = useState([]);
  const [unitLoading, setUnitLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [conversionUnit, setConversionUnit] = useState("");
  const [conversionFactor, setConversionFactor] = useState("");
  const [hsnCode, setHsnCode] = useState("");
  const [source, setSource] = useState("");

  // mohit changes 
    const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const bulkFileRef = useRef(null);


  const SourceOption = [
    { value: "Installation Material", label: "Installation Material" },
    { value: "Raw Material", label: "Raw Material" },
  ];

  useEffect(() => {
    if (isEditMode && editData) {
      setRawMaterialName(editData.name || "");
      setRawMaterialDescription(editData.description || "");
      setUnit(editData.unit || "");
      setConversionUnit(editData.conversionUnit || "");
      setConversionFactor(
        editData.conversionFactor ? String(editData.conversionFactor) : "",
      );
      setSource(editData.source || "");
      setHsnCode(editData.hsnCode || "");
    }
  }, [isEditMode, editData]);

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setUnitLoading(true);
        const res = await Api.get("/common/unit/view");
        setUnitList(res?.data?.data || []);
      } catch (err) {
        alert(err?.response?.data?.message || "Failed to fetch units");
      } finally {
        setUnitLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const buildPayload = () => {
    return {
      name: rawMaterialName,
      description: rawMaterialDescription || null,
      unit,
      source,
      hsnCode: hsnCode.trim(),
      conversionUnit:
        conversionUnit && conversionFactor ? conversionUnit : null,
      conversionFactor:
        conversionUnit && conversionFactor ? Number(conversionFactor) : null,
    };
  };

  const resetForm = () => {
    setRawMaterialName("");
    setRawMaterialDescription("");
    setUnit("");
    setConversionUnit("");
    setConversionFactor("");
    setSource("");
    setHsnCode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!rawMaterialName || !unit || !source || !hsnCode) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();

      if (isEditMode && editData?.id) {
        payload.id = editData.id;
        const response = await Api.put("/common/item/update", payload);

        if (response?.data?.success) {
          alert(response?.data?.message || "Item updated successfully");

          if (onSuccess) {
            // Pass back the updated item data (id + payload)
            onSuccess({
              ...payload,
              id: editData.id,
            });
          }

          closeModal(false);
        }
      } else {
        const response = await Api.post("/common/item/create", payload);

        if (response?.data?.success) {
          alert(response?.data?.message || "Item created successfully");
          // 🔽 Pass back the created item data (either from response or payload)
          const createdData = response?.data?.data || payload;
          if (onSuccess) onSuccess(createdData);
          resetForm();
        }
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!rawMaterialName || !unit || !source || !hsnCode) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      const payload = buildPayload();

      const response = await Api.post("/common/item/create", payload);

      if (response?.data?.success) {
        alert(response?.data?.message || "Item created successfully");
        // 🔽 Pass back the created item data
        const createdData = response?.data?.data || payload;
        if (onSuccess) onSuccess(createdData);
        resetForm();
        closeModal(false);
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversion = () => {
    setConversionUnit("");
    setConversionFactor("");
  };
// mohit changes 
  const downloadTemplate = () => {
    const header = "name,unit,source,hsnCode,description,conversionUnit,conversionFactor";
    const example1 = "Iron Rod,KG,Raw Material,7214,Iron rod 10mm,G,1000";
    const example2 = "Cable 1.5mm,MTR,Installation Material,8544,1.5mm electrical cable,,";
    const csv = [header, example1, example2].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bulk_items_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      alert("Please select a CSV file first");
      return;
    }
    try {
      setBulkLoading(true);
      setBulkResult(null);
      const formData = new FormData();
      formData.append("file", bulkFile);
      const res = await Api.post("/common/item/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res?.data?.success) {
        setBulkResult(res.data.summary);
        setBulkFile(null);
        if (bulkFileRef.current) bulkFileRef.current.value = "";
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      alert(error?.response?.data?.message || "Bulk upload failed");
    } finally {
      setBulkLoading(false);
    }
  };


  return (
    <div className="w-full bg-gradient-to-br from-slate-100 flex items-center justify-center px-4">
      <div className="w-full bg-white shadow-xs p-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800">
            {isEditMode ? "Edit Item" : "Add Item"}
          </h2>
          <p className="text-gray-500 mt-2">
            {isEditMode ? "Update item details" : "Enter item details"}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6"
        >
          {/* NAME */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-1">Name *</label>
            <input
              value={rawMaterialName}
              onChange={(e) => setRawMaterialName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border"
              required
            />
          </div>

          {/* SOURCE */}
          <div>
            <label className="block text-sm font-semibold mb-2">Source *</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border`}

              required
            >
              <option value="">Select Source</option>
              {SourceOption.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* BASE UNIT */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Base Unit *
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
                            className={`w-full px-4 py-3 rounded-lg border`}

              required
            >
              <option value="">
                {unitLoading ? "Loading..." : "Select Unit"}
              </option>
              {unitList.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* CONVERSION UNIT */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Conversion Unit
            </label>
            <select
              value={conversionUnit}
              onChange={(e) => setConversionUnit(e.target.value)}
              disabled={!unit}
              className="w-full px-4 py-3 rounded-lg border"
            >
              <option value="">Select Conversion Unit</option>
              {unitList.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* CONVERSION FACTOR */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Conversion Factor
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                min="0"
                step="0.001"
                value={conversionFactor}
                onChange={(e) => setConversionFactor(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border"
              />
            </div>
          </div>

          {/* HSN CODE */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              HSN Code *
            </label>
            <input
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              maxLength="10"
              className="w-full px-4 py-3 rounded-lg border"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Description
            </label>
            <textarea
              rows="3"
              value={rawMaterialDescription}
              onChange={(e) => setRawMaterialDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border resize-none"
            />
          </div>

          {/* BUTTONS */}
          <div className="sm:col-span-2 flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className={`h-[48px] rounded-lg bg-yellow-400 font-semibold hover:bg-yellow-500 transition-all ${
                isEditMode ? "flex-1" : "w-full"
              }`}
            >
              {loading
                ? isEditMode
                  ? "Updating..."
                  : "Saving..."
                : isEditMode
                  ? "Update Item"
                  : "Add Item"}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={loading}
                className="h-[48px] flex-1 rounded-lg bg-yellow-400 text-dark font-semibold hover:bg-yellow-400 transition-all"
              >
                Create New Item
              </button>
            )}
          </div>
        </form>
        {/* mohit changes */}
        
        {/* multiple items upload */}
        {!isEditMode && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-700 mb-1">Bulk Upload via CSV</h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload a CSV with columns:{" "}
              <code className="bg-gray-100 px-1 rounded text-xs">
                name, unit, source, hsnCode, description, conversionUnit, conversionFactor
              </code>
              . Source must be <strong>Raw Material</strong> or{" "}
              <strong>Installation Material</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                ⬇ Download Template
              </button>

              <input
                ref={bulkFileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  setBulkResult(null);
                  setBulkFile(e.target.files[0] || null);
                }}
                className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-yellow-400 file:font-semibold file:text-sm hover:file:bg-yellow-500"
              />

              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={bulkLoading || !bulkFile}
                className="px-4 py-2 rounded-lg bg-yellow-400 font-semibold text-sm hover:bg-yellow-500 transition-all disabled:opacity-50"
              >
                {bulkLoading ? "Uploading..." : "Upload"}
              </button>
            </div>

            {bulkResult && (
              <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-sm">
                <p className="font-semibold text-green-800 mb-1">Upload Summary</p>
                <p>Total rows: <strong>{bulkResult.totalRows}</strong></p>
                <p>Raw Materials inserted: <strong>{bulkResult.rawMaterialInserted}</strong></p>
                <p>Installation Materials inserted: <strong>{bulkResult.installationInserted}</strong></p>
                {bulkResult.skipped?.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-red-600 font-semibold">
                      Skipped ({bulkResult.skipped.length})
                    </summary>
                    <ul className="mt-1 list-disc list-inside text-red-700">
                      {bulkResult.skipped.map((s, i) => (
                        <li key={i}>{s.name} — {s.reason}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AddRawMaterial;