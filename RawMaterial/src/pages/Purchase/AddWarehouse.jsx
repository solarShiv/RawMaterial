import React, { useState } from 'react';
import Api from '../../auth/Api';

const AddWarehouse = () => {
  const [warehouseName, setWarehouseName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!warehouseName.trim()) {
      setError('Warehouse name is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await Api.post('/purchase/warehouses/create', {
        warehouseName: warehouseName.trim()
      });
      if (response.status === 200 || response.status === 201 || response.success) {
        setMessage('Warehouse added successfully!');
        setWarehouseName('');
      } else {
        setError(response.message || response.error || 'Failed to add warehouse');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add warehouse. Please try again.');
      console.error('Error adding warehouse:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="warehouseName" className="block text-sm font-medium text-ink-700 mb-1">
            Warehouse Name *
          </label>
          <input
            type="text"
            id="warehouseName"
            value={warehouseName}
            onChange={(e) => setWarehouseName(e.target.value)}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            placeholder="Enter warehouse name"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-lg font-medium ${
            loading
              ? 'bg-ink-400 cursor-not-allowed'
              : 'bg-brand-400 hover:bg-brand-500 text-dark'
          }`}
        >
          {loading ? 'Adding...' : 'Add Warehouse'}
        </button>
      </form>
    </div>
  );
};

export default AddWarehouse;