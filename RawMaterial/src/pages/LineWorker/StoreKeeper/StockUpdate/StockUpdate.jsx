import React, { useState, useEffect } from "react";
import Api from "../../../../auth/Api";

const StockUpdate = () => {
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [billPhoto, setBillPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRawMaterials = async () => {
      try {
        setLoading(true);
        const response = await Api.get("/store-keeper/getRawMaterialList");

        if (response.data.success) {
          setRawMaterials(response?.data?.data);
        } else {
          setError("Failed to fetch data");
        }
      } catch (err) {
        setError("Error fetching raw materials: " + (err?.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchRawMaterials();
  }, []);

  const filteredMaterials = rawMaterials.filter((material) =>
    material.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMaterialSelect = (material) => {
    const isAlreadySelected = selectedMaterials.find(
      (selected) => selected.id === material.id
    );

    if (isAlreadySelected) {
      setSelectedMaterials((prev) =>
        prev.filter((selected) => selected.id !== material.id)
      );

      setQuantities((prev) => {
        const newQuantities = { ...prev };
        delete newQuantities[material.id];
        return newQuantities;
      });
    } else {
      setSelectedMaterials((prev) => [...prev, material]);
      setQuantities((prev) => ({
        ...prev,
        [material.id]: "1",
      }));
    }

    setIsDropdownOpen(false);
    setError(null);
  };

  const handleQuantityChange = (materialId, value) => {
    if (value === "" || /^\d*$/.test(value)) {
      setQuantities((prev) => ({
        ...prev,
        [materialId]: value,
      }));
    }
  };

  const removeSelectedMaterial = (materialId) => {
    setSelectedMaterials((prev) =>
      prev.filter((material) => material.id !== materialId)
    );
    setQuantities((prev) => {
      const newQuantities = { ...prev };
      delete newQuantities[materialId];
      return newQuantities;
    });
  };

  const clearAllSelections = () => {
    setSelectedMaterials([]);
    setQuantities({});
    setBillPhoto(null);
    setError(null);
    setSuccess(null);
    setSearchTerm("");
  };

  const handleBillPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should be less than 5MB");
        return;
      }
      setBillPhoto(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedMaterials.length === 0) {
      setError("Please select at least one material");
      return;
    }

    if (!billPhoto) {
      setError("Please upload a bill photo");
      return;
    }

    const invalidQuantities = selectedMaterials.filter(
      (material) =>
        !quantities[material.id] ||
        quantities[material.id] === "" ||
        parseInt(quantities[material.id]) <= 0
    );

    if (invalidQuantities.length > 0) {
      setError(
        "Please enter valid quantities for all selected materials (minimum 1)"
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const rawMaterialList = selectedMaterials.map((material) => ({
        rawMaterialId: material.id,
        quantity: quantities[material.id].toString(),
        unit: material.unit,
      }));

      const formData = new FormData();
      formData.append("billPhoto", billPhoto);
      formData.append("rawMaterialList", JSON.stringify(rawMaterialList));

      const response = await Api.post("/store-keeper/updateStock", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Update Response: ", response?.data?.message);

      if (response.data.success) {
        setSuccess("Stock updated successfully!");
        clearAllSelections();

        const refreshResponse = await Api.get(
          "/store-keeper/getRawMaterialList"
        );
        if (refreshResponse.data.success) {
          setRawMaterials(refreshResponse.data.data);
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        "Error updating stock: " + (err.response?.data?.message || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setSearchTerm("");
    setError(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".multi-select-dropdown")) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading raw materials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Messages */}
        <div className="max-w-4xl mx-auto mb-6 space-y-4">
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-green-500 font-bold">✓</span>
                </div>
                <div className="ml-3">
                  <p className="text-green-700 font-medium">{success}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-red-500 font-bold">⚠</span>
                </div>
                <div className="ml-3">
                  <p className="text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
            {/* Material Selection */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Raw Materials *
              </label>
              <div className="multi-select-dropdown relative">
                <div 
                  className="flex items-center justify-between w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer hover:border-gray-400 transition-colors duration-200"
                  onClick={toggleDropdown}
                >
                  <span className={`${selectedMaterials.length > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                    {selectedMaterials.length > 0 ? (
                      <strong>{selectedMaterials.length} material(s) selected</strong>
                    ) : (
                      "Choose materials from the list..."
                    )}
                  </span>
                  <span className="text-gray-500 transform transition-transform duration-200">
                    {isDropdownOpen ? "▲" : "▼"}
                  </span>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search materials by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-400">🔍</span>
                        </div>
                      </div>
                    </div>

                    {/* Materials Count */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <strong className="text-sm text-gray-600">
                        {filteredMaterials.length} materials found
                      </strong>
                    </div>

                    {/* Materials List */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredMaterials.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <div className="text-4xl mb-2">📦</div>
                          <p className="text-gray-600 font-medium">No materials found</p>
                          <p className="text-gray-500 text-sm mt-1">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div className="p-2 space-y-1">
                          {filteredMaterials.map((material) => {
                            const isSelected = selectedMaterials.find(
                              (selected) => selected.id === material.id
                            );
                            return (
                              <div
                                key={material.id}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "bg-blue-50 border border-blue-200"
                                    : "hover:bg-gray-50"
                                }`}
                                onClick={() => handleMaterialSelect(material)}
                              >
                                <div className="flex items-center space-x-3 flex-1">
                                  <div
                                    className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors duration-200 ${
                                      isSelected
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    {isSelected && "✓"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <span className={`font-medium ${isSelected ? "text-blue-900" : "text-gray-900"}`}>
                                        {material.name}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Stock: {material.stock} {material.unit}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Materials */}
            {selectedMaterials.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Selected Materials
                    <span className="ml-2 text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded-full">
                      {selectedMaterials.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    onClick={clearAllSelections}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-3">
                  {selectedMaterials.map((material) => (
                    <div key={material.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-gray-900">{material.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedMaterial(material.id)}
                              className="text-gray-400 hover:text-red-500 text-xl font-bold transition-colors duration-200"
                              title="Remove material"
                            >
                              ×
                            </button>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <span className="text-sm text-gray-600">
                              Current Stock: {material.stock} {material.unit}
                            </span>
                            <div className="flex items-center space-x-3">
                              <label htmlFor={`quantity-${material.id}`} className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                Quantity to Add:
                              </label>
                              <input
                                id={`quantity-${material.id}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={quantities[material.id] || ""}
                                onChange={(e) =>
                                  handleQuantityChange(material.id, e.target.value)
                                }
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                                placeholder="Enter quantity"
                              />
                              <span className="text-sm text-gray-600 whitespace-nowrap">{material.unit}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bill Photo Upload */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Bill Photo *
              </label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors duration-200">
                  <input
                    id="billPhoto"
                    type="file"
                    accept="image/*"
                    onChange={handleBillPhotoChange}
                    className="hidden"
                  />
                  <label htmlFor="billPhoto" className="cursor-pointer">
                    <div className="text-4xl mb-3">📷</div>
                    <div className="space-y-1">
                      <p className="font-semibold text-gray-900">Click to upload bill photo</p>
                      <p className="text-sm text-gray-500">JPEG, PNG, JPG, GIF • Max 5MB</p>
                    </div>
                  </label>
                </div>

                {billPhoto && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">📄</span>
                        <div>
                          <p className="font-medium text-green-900">{billPhoto.name}</p>
                          <p className="text-sm text-green-700">
                            {(billPhoto.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBillPhoto(null)}
                        className="text-green-600 hover:text-green-800 text-xl font-bold transition-colors duration-200"
                        title="Remove file"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-6 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={clearAllSelections}
                disabled={submitting}
              >
                Reset Form
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                disabled={selectedMaterials.length === 0 || !billPhoto || submitting}
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating Stock...</span>
                  </>
                ) : (
                  "Update Stock"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StockUpdate;