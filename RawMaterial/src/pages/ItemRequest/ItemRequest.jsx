import React, { useState, useEffect, useMemo } from "react";
import Api from "../../auth/Api";
import { useLocation } from "react-router-dom";
import SingleSelect from "../../components/dropdown/SingleSelect";
import MultiSelect from "../../components/dropdown/MultiSelect";
import Button from '../../components/Button/Button';
import InputField from '../../components/InputField/InputField'

const ItemRequest = () => {
  const location = useLocation();
  const { serviceProcessId, Type } = location?.state || {};

  const [rawMaterials, setRawMaterials] = useState([]);
  const [storePersons, setStorePersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedStorePerson, setSelectedStorePerson] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // New state for search term

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [materialsResponse, storePersonsResponse] = await Promise.all([
        Api.get("/line-worker/rawMaterialForItemRequest"),
        Api.get("/line-worker/showStorePersons"),
      ]);

      setRawMaterials(materialsResponse?.data?.data || []);
      setStorePersons(storePersonsResponse?.data?.data || []);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter materials based on search term
  const filteredMaterials = useMemo(() => {
    if (!searchTerm.trim()) {
      return rawMaterials;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return rawMaterials.filter(material => 
      material.name?.toLowerCase().includes(searchLower)
    );
  }, [rawMaterials, searchTerm]);

  // Handler for MultiSelect component
  const handleMultiSelectChange = (selectedIds) => {
    const newSelectedMaterials = selectedIds.map(id =>
      rawMaterials.find(m => m.id === id)
    ).filter(Boolean);
    
    setSelectedMaterials(newSelectedMaterials);

    // Update quantities
    const newQuantities = { ...quantities };
    
    // Add new selections
    selectedIds.forEach(id => {
      if (!newQuantities[id]) {
        newQuantities[id] = 1;
      }
    });

    // Remove deselected items. Object keys are always strings, so compare as
    // strings or numeric ids would wipe every quantity on each change.
    const selectedKeys = selectedIds.map(String);
    Object.keys(newQuantities).forEach(key => {
      if (!selectedKeys.includes(key)) {
        delete newQuantities[key];
      }
    });

    setQuantities(newQuantities);
  };

  const handleQuantityChange = (materialId, value) => {
    const numValue = parseInt(value) || 0;
    const material = rawMaterials.find((m) => m.id === materialId);
    if (!material) return;

    // Clamp to [0, stock]
    const stock = Number(material.stock) || 0;
    setQuantities((prev) => ({
      ...prev,
      [materialId]: Math.max(0, Math.min(numValue, stock)),
    }));
  };

  const handleStorePersonSelect = (personId) => {
    if (!personId) {
      setSelectedStorePerson(null);
      return;
    }
    // <select> always yields a string; ids from the API may be numbers
    const person = storePersons.find((p) => String(p.id) === String(personId));
    setSelectedStorePerson(person || null);
  };

  const handleSubmitRequest = async () => {
    if (!selectedStorePerson) {
      alert("Please select a store person");
      return;
    }

    if (selectedMaterials.length === 0) {
      alert("Please select at least one material");
      return;
    }

    const invalidMaterials = selectedMaterials.filter((material) => {
      const quantity = quantities[material.id] || 0;
      return quantity <= 0;
    });

    if (invalidMaterials.length > 0) {
      alert("Please enter valid quantities for all selected materials");
      return;
    }

    try {
      setSubmitting(true);

      const requestData = {
        type: Type || "PRE",
        rawMaterialRequested: selectedMaterials.map((material) => ({
          rawMaterialId: material.id,
          quantity: quantities[material.id].toString(),
          unit: material.unit,
        })),
        requestedTo: selectedStorePerson.id,
        serviceProcessId: serviceProcessId || null,
      };

      const response = await Api.post(
        "/line-worker/createItemRequest",
        requestData
      );

      if (response.data.success) {
        setSelectedMaterials([]);
        setSelectedStorePerson(null);
        setQuantities({});
        setSearchTerm(""); // Clear search term on successful submit
        setTimeout(() => fetchData(), 1000);
        alert("Successfully: " + (response?.data?.message || "Request submitted"));
      } else {
        alert("Failed: " + response?.data?.message);
      }
    } catch (err) {
      console.log(err?.response?.data?.error);
      alert("Error - " + (err?.response?.data?.error || err?.response?.data?.message || err?.message));
    } finally {
      setSubmitting(false);
    }
  };

  const disabledSubmit =
    submitting || !selectedStorePerson || selectedMaterials.length === 0;

  // Prepare materials for MultiSelect with disabled state for out-of-stock items
  const multiSelectMaterials = filteredMaterials.map(mat => ({
    id: mat.id,
    name: `${mat.name} (${mat.stock} ${mat.unit})`,
    disabled: Boolean(mat.outOfStock) || Number(mat.stock) <= 0,
  }));

  if (loading)
    return (
      <div className="text-center text-lg font-semibold py-8">Loading...</div>
    );
  if (error)
    return (
      <div className="text-center text-red-600 text-lg font-semibold py-8">
        Error: {error}
      </div>
    );
  return (
    <div className="min-h-[60vh] bg-white p-4 text-ink-950 ">
      <div className="text-center mb-2">
        <p className="text-black-600 mt-1 text-lg font-bold">
          REQUEST RAW MATERIALS FROM THE STORE
        </p>
      </div>
      
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        {/* Store Person Selection */}
        <SingleSelect
          lists={storePersons}
          selectedValue={selectedStorePerson?.id || ""}
          setSelectedValue={handleStorePersonSelect}
          label="Select Store Person"
        />

        {/* Materials Selection */}
        <div className="border shadow-card rounded-xl p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Select Materials *</h2>
          
          {/* Search Bar */}
          <div className="mb-4">
            <InputField
              type="text"
              placeholder="Search materials by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              label=""
              className="w-full"
            />
          </div>

          <MultiSelect
            lists={multiSelectMaterials}
            selectedValues={selectedMaterials.map(m => m.id)}
            setSelectedValues={handleMultiSelectChange}
            label=""
            placeholder={searchTerm ? `Search results for "${searchTerm}"...` : "Select materials..."}
            loadingText="Loading materials..."
          />

          {/* Search Results Info */}
          {searchTerm && (
            <div className="mt-2 text-sm text-ink-600">
              Showing {filteredMaterials.length} of {rawMaterials.length} materials matching "{searchTerm}"
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded-full"></span>
              <p className="text-sm text-ink-600">In Stock</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded-full"></span>
              <p className="text-sm text-ink-600">Out of Stock</p>
            </div>
          </div>
        </div>

        {/* Selected Materials List */}
        {selectedMaterials.length > 0 && (
          <div className="border shadow-card rounded-xl p-6 bg-white">
            <h2 className="text-xl font-semibold mb-4">
              Selected Materials ({selectedMaterials.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedMaterials.map((mat) => (
                <div
                  key={mat.id}
                  className="border rounded-lg p-4 shadow-sm bg-white"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold">{mat.name}</h3>
                    <span
                      className={`px-3 py-1 text-sm rounded-lg ${
                        mat.outOfStock
                          ? "bg-red-200 text-red-700"
                          : mat.stock <= 10
                          ? "bg-brand-200 text-brand-700"
                          : "bg-green-200 text-green-700"
                      }`}
                    >
                      {mat.outOfStock
                        ? "OUT OF STOCK"
                        : mat.stock <= 10
                        ? "LOW STOCK"
                        : "IN STOCK"}
                    </span>
                  </div>

                  <p className="text-ink-700 mt-2">
                    Available: <b>{mat.stock}</b> {mat.unit}
                  </p>

                  <InputField
                    label="Quantity:"
                    type="text"
                    min="1"
                    max={mat.stock}
                    value={quantities[mat.id] || ""}
                    onChange={(e) =>
                      handleQuantityChange(mat.id, e.target.value)
                    }
                    disabled={mat.outOfStock}
                    placeholder="Enter quantity"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-4">
        
          <Button
            onClick={handleSubmitRequest}
            variant="primary"
            loading={submitting}
            disabled={disabledSubmit}
            className="w-32 rounded-lg bg-brand-400 hover:bg-brand-500 text-ink-950 font-semibold py-2 border border-brand-500 hover:scale-[1.03] transition-all duration-200"
            title="Submit" 
          />
           
        </div>
      </div>
    </div>
  );
};

export default ItemRequest;