import React, { useState, useEffect } from 'react';
import Api from '../../../auth/Api';
import { useLocation } from "react-router-dom";

const ReusableItems = () => {
  const location = useLocation();
  const { serviceProcessId, disassembleSessionId } = location?.state || {};
  const [assembleUsers, setAssembleUsers] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [tempSelectedMaterials, setTempSelectedMaterials] = useState([]);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch assemble users from API
  const fetchAssembleUsers = async () => {
    try {
      setLoading(true);
      const response = await Api.get('/line-worker/getAssembleUsers');
      
      if (response.data.success) {
        setAssembleUsers(response.data.data);
      } else {
        setError('Failed to fetch assemble users');
      }
    } catch (err) {
      console.error('Error fetching assemble users:', err);
      setError('Unable to load assemble users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch raw materials from API
  const fetchRawMaterials = async () => {
    try {
      setMaterialsLoading(true);
      const response = await Api.get('/line-worker/rawMaterialForItemRequest');
      
      if (response.data.success) {
        setRawMaterials(response.data.data);
      } else {
        setError('Failed to fetch raw materials');
      }
    } catch (err) {
      console.error('Error fetching raw materials:', err);
      setError('Unable to load raw materials. Please try again.');
    } finally {
      setMaterialsLoading(false);
    }
  };

  // Handle material selection from multi-select
  const handleMaterialSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedIds = selectedOptions.map(option => option.value).filter(id => id);
    setTempSelectedMaterials(selectedIds);
  };

  // Add selected materials with default quantity
  const addSelectedMaterials = () => {
    if (tempSelectedMaterials.length === 0) {
      alert('Please select at least one material');
      return;
    }

    const newMaterials = tempSelectedMaterials.map(materialId => {
      const material = rawMaterials.find(m => m.id === materialId);
      return {
        id: materialId,
        name: material.name,
        quantity: 1, // Default quantity
        unit: material.unit,
        stock: material.stock,
        outOfStock: material.outOfStock
      };
    });

    // Filter out duplicates and add new materials
    setSelectedMaterials(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const uniqueNewMaterials = newMaterials.filter(material => !existingIds.has(material.id));
      return [...prev, ...uniqueNewMaterials];
    });

    // Clear temporary selection
    setTempSelectedMaterials([]);
  };

  // Remove selected material
  const removeMaterial = (materialId) => {
    setSelectedMaterials(prev => prev.filter(item => item.id !== materialId));
  };

  // Update quantity of existing material
  const updateMaterialQuantity = (materialId, newQuantity) => {
    if (newQuantity === '' || parseInt(newQuantity) === 0) {
      removeMaterial(materialId);
      return;
    }

    if (isNaN(newQuantity) || parseInt(newQuantity) < 0) {
      return;
    }

    const material = rawMaterials.find(m => m.id === materialId);
    if (material && parseInt(newQuantity) > material.stock) {
      alert(`Quantity cannot exceed available stock (${material.stock} ${material.unit})`);
      return;
    }

    setSelectedMaterials(prev =>
      prev.map(item =>
        item.id === materialId
          ? { ...item, quantity: parseInt(newQuantity) }
          : item
      )
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('Please select an assemble user');
      return;
    }

    if (selectedMaterials.length === 0) {
      alert('Please select at least one raw material');
      return;
    }

    // Validate all quantities
    const invalidMaterials = selectedMaterials.filter(material => 
      !material.quantity || material.quantity <= 0
    );

    if (invalidMaterials.length > 0) {
      alert('Please enter valid quantities for all selected materials');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        serviceProcessId,
        disassembleSessionId,
        assembleEmpId: selectedUser,
        reusableItems: selectedMaterials.map(material => ({
          rawMaterialId: material.id,
          quantity: material.quantity.toString(),
          unit: material.unit
        })),
        remarks: remarks || "Reusable Items Form Filled & Process Is Closed."
      };

      console.log("Playload Data: ", payload)

      const response = await Api.post('/line-worker/disassembleItemsForm', payload);
      
      if (response.data.success) {
        alert(`Assemble user assigned successfully with ${selectedMaterials.length} materials!`);
        setSelectedUser('');
        setSelectedMaterials([]);
        setTempSelectedMaterials([]);
        setRemarks('');
      } else {
        throw new Error(response.data.message || 'Failed to submit form');
      }
      
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  const getAvailableMaterials = () => {
    return rawMaterials.filter(material => 
      !selectedMaterials.some(selected => selected.id === material.id)
    );
  };

  const getTotalSummary = () => {
    const totalItems = selectedMaterials.length;
    const totalQuantities = selectedMaterials.reduce((sum, material) => sum + material.quantity, 0);
    return { totalItems, totalQuantities };
  };

  useEffect(() => {
    fetchAssembleUsers();
    fetchRawMaterials();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assemble users...</p>
        </div>
      </div>
    );
  }

  const { totalItems, totalQuantities } = getTotalSummary();
  const availableMaterials = getAvailableMaterials();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Assemble User Selection */}
            <div>
              <label htmlFor="assembleUser" className="block text-sm font-semibold text-gray-900 mb-2">
                Assemble User *
              </label>
              <select
                id="assembleUser"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                disabled={submitting}
                required
              >
                <option value="">Select an assemble user</option>
                {assembleUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Raw Materials Multi-select */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Reusable Raw Materials *
              </label>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-3">
                  <span className="text-sm font-semibold text-gray-900">
                    Select Materials ({tempSelectedMaterials.length} selected)
                  </span>
                  {tempSelectedMaterials.length > 0 && (
                    <button
                      type="button"
                      onClick={addSelectedMaterials}
                      className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:bg-gray-500 disabled:transform-none disabled:shadow-none disabled:cursor-not-allowed"
                      disabled={submitting}
                    >
                      Add Selected Materials
                    </button>
                  )}
                </div>
                
                <select
                  multiple
                  size="6"
                  value={tempSelectedMaterials}
                  onChange={handleMaterialSelection}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed min-h-[180px]"
                  disabled={materialsLoading || submitting || availableMaterials.length === 0}
                >
                  {availableMaterials.length === 0 ? (
                    <option value="" disabled>All materials have been selected</option>
                  ) : (
                    availableMaterials.map((material) => (
                      <option 
                        key={material.id} 
                        value={material.id}
                        disabled={material.outOfStock}
                        className="px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 checked:bg-gradient-to-br checked:from-blue-600 checked:to-blue-800 checked:text-white"
                      >
                        {material.name} - Stock: {material.stock} {material.unit}
                        {material.outOfStock && ' (Out of Stock)'}
                      </option>
                    ))
                  )}
                </select>
                
                <div className="text-sm text-gray-500 text-center px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  Hold Ctrl/Cmd to select multiple materials • {availableMaterials.length} materials available
                </div>
              </div>

              {materialsLoading && (
                <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-gray-600">Loading materials...</span>
                </div>
              )}

              {/* Selected Materials with Quantity Inputs */}
              {selectedMaterials.length > 0 && (
                <div className="mt-6 border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  <div className="text-lg font-bold text-gray-900 mb-5 pb-3 border-b border-gray-300">
                    Selected Materials ({selectedMaterials.length}):
                  </div>
                  <div className="space-y-4">
                    {selectedMaterials.map(material => (
                      <div key={material.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-blue-500 transition-all">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="text-lg font-semibold text-gray-900 mb-1">{material.name}</div>
                            {/* <div className="text-sm text-gray-700">
                              Available Stock: <strong className="text-green-600">{material.stock} {material.unit}</strong>
                            </div> */}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                                Reusable Items Quantity:
                              </label>
                              <input
                                type="text"
                                value={material.quantity}
                                onChange={(e) => updateMaterialQuantity(material.id, e.target.value)}
                                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed"
                                min="1"
                                max={material.stock}
                                disabled={submitting || material.outOfStock}
                              />
                              <span className="text-sm font-semibold text-gray-600 min-w-[50px]">
                                {material.unit}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMaterial(material.id)}
                              className="w-9 h-9 bg-red-600 text-white rounded-lg flex items-center justify-center text-xl font-bold hover:bg-red-700 transform hover:scale-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                              disabled={submitting}
                              title="Remove material"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remarks Field */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-semibold text-gray-900 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed resize-y"
                placeholder="Enter any remarks or comments..."
                rows="3"
                disabled={submitting}
              />
            </div>

            {/* Summary Section */}
            {selectedMaterials.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500 shadow-md">
                <div className="text-gray-900 font-semibold">
                  <strong>Total Materials:</strong> {totalItems} item(s)
                </div>
                <div className="text-gray-900 font-semibold">
                  <strong>Total Quantities:</strong> {totalQuantities} units
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 mt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-br from-blue-600 to-blue-800 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 hover:shadow-lg transform hover:-translate-y-1 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[200px]"
                disabled={!selectedUser || selectedMaterials.length === 0 || submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-transparent border-t-white rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  `Submit Request (${selectedMaterials.length} materials)`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReusableItems;