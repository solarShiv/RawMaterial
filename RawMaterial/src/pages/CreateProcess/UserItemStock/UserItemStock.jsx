import React, { useEffect, useState } from "react";
import Api from "../../../auth/Api";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import Button from "../../../components/Button/Button";

const UserItemStock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { serviceProcessId } = location?.state || {};

  const [userItemStock, setUserItemStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [extraRawMaterialRequired, setExtraRawMaterialRequired] =
    useState(false);
  const [requestItems, setRequestItems] = useState([
    { material: "", quantity: "" },
  ]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchUserItemStock = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Api.get("/line-worker/showUserItemStock");
      setUserItemStock(response?.data?.data || []);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserItemStock();
  }, []);

  const toggleMaterialSelection = (material) => {
    setSelectedMaterials((prev) => {
      const isSelected = prev.find(
        (m) => m.rawMaterialId === material.rawMaterialId
      );
      if (isSelected) {
        const newSelected = prev.filter(
          (m) => m.rawMaterialId !== material.rawMaterialId
        );
        const newQuantities = { ...quantities };
        delete newQuantities[material.rawMaterialId];
        setQuantities(newQuantities);
        return newSelected;
      } else {
        return [...prev, material];
      }
    });
  };

  const handleQuantityChange = (materialId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [materialId]: value,
    }));
  };

  const handleExtraMaterialToggle = (e) => {
    const value = e.target.value === "yes";
    setExtraRawMaterialRequired(value);

    if (value) {
      navigate("/item-request", {
        state: {
          serviceProcessId: serviceProcessId,
          Type: serviceProcessId ? "IN" : "PRE",
        },
      });
    }
  };

  const isMaterialSelected = (materialId) => {
    return selectedMaterials.some((m) => m.rawMaterialId === materialId);
  };

  const getSelectedMaterialQuantity = (materialId) => {
    return quantities[materialId] || "";
  };

  const handleSubmit = async () => {
    if (!serviceProcessId) {
      alert("Service Process ID is required");
      return;
    }

    if (selectedMaterials.length === 0) {
      alert("Please select at least one material");
      return;
    }

    const rawMaterialList = selectedMaterials.map((material) => {
      const quantity = quantities[material.rawMaterialId];
      if (!quantity || quantity <= 0) {
        alert(`Please enter a valid quantity for ${material.rawMaterialName}`);
        return null;
      }
      if (parseFloat(quantity) > parseFloat(material.itemStock)) {
        alert(
          `Quantity for ${material.rawMaterialName} exceeds available stock`
        );
        return null;
      }
      return {
        rawMaterialId: material.rawMaterialId,
        quantity: quantity.toString(),
        unit: material.unit,
      };
    });

    if (rawMaterialList.some((item) => item === null)) {
      return;
    }

    const requestData = {
      serviceProcessId: serviceProcessId,
      rawMaterialList: rawMaterialList,
    };

    try {
      setSubmitting(true);
      const response = await Api.post(
        "/line-worker/createItemUsageLog",
        requestData
      );

      if (response.status === 200 || response.status === 201) {
        alert("Item usage log created successfully!");
        setSelectedMaterials([]);
        setQuantities({});
        fetchUserItemStock();
      }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message;
      alert(`Failed to create item usage log: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center p-8 text-lg">
        Loading stock data...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-red-600 text-lg">Error: {error}</p>
        <button
          onClick={fetchUserItemStock}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Available Stock
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userItemStock.map((item) => (
              <div
                key={item.rawMaterialId}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {item.rawMaterialName}
                  </h4>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      item.itemStock > 50
                        ? "bg-green-100 text-green-800"
                        : item.itemStock > 20
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.itemStock} {item.unit}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Current Quantity:</strong>{" "}
                    {item.quantity} {item.unit}
                  </p>
                  <p className="text-gray-600">
                    <strong className="text-gray-800">Available Stock:</strong>{" "}
                    {item.itemStock} {item.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <label className="block text-lg font-semibold text-gray-700 mb-4">
            Select Materials (Multiple Selection):
          </label>

          <div className="relative">
            <div
              className="flex justify-between items-center p-4 border border-gray-300 rounded-lg cursor-pointer bg-white hover:border-gray-400 transition-colors"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="text-gray-700">
                {selectedMaterials.length === 0
                  ? "Select materials"
                  : `${selectedMaterials.length} material(s) selected`}
              </span>
              <span
                className={`transform transition-transform ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </div>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {userItemStock.map((item) => (
                  <div
                    key={item.rawMaterialId}
                    className={`flex justify-between items-center p-4 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                      isMaterialSelected(item.rawMaterialId)
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    onClick={() => toggleMaterialSelection(item)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">
                        {item.rawMaterialName}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {item.itemStock} {item.unit}
                      </span>
                    </div>
                    <div className="w-6 h-6 flex items-center justify-center border-2 border-gray-300 rounded">
                      {isMaterialSelected(item.rawMaterialId) && (
                        <span className="text-blue-600 font-bold">✓</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedMaterials.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-4">
                Selected Materials & Quantities:
              </h4>
              <div className="space-y-4">
                {selectedMaterials.map((material) => (
                  <div
                    key={material.rawMaterialId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex flex-col mb-3 sm:mb-0">
                      <span className="font-medium text-gray-800">
                        {material.rawMaterialName}
                      </span>
                      <span className="text-sm text-gray-500">
                        Available: {material.itemStock} {material.unit}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={getSelectedMaterialQuantity(
                          material.rawMaterialId
                        )}
                        onChange={(e) =>
                          handleQuantityChange(
                            material.rawMaterialId,
                            e.target.value
                          )
                        }
                        placeholder="Enter quantity"
                        min="0"
                        max={material.itemStock}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-gray-600 font-medium min-w-12">
                        {material.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Extra Raw Material Section */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <label className="text-lg font-semibold text-gray-700 mb-3 sm:mb-0">
              Extra Raw Material Requirement:
            </label>
            <div className="flex space-x-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="yes"
                  checked={extraRawMaterialRequired === true}
                  onChange={handleExtraMaterialToggle}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="no"
                  checked={extraRawMaterialRequired === false}
                  onChange={handleExtraMaterialToggle}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          
          <Button
            title={submitting ? "Submitting..." : "Submit Item Usage"}
            onClick={handleSubmit}
            disabled={submitting || selectedMaterials.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              submitting || selectedMaterials.length === 0
                ? "bg-gray-400 cursor-not-allowed text-gray-200"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default UserItemStock;
