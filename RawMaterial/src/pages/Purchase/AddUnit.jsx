import React, { useState } from 'react';
import Api from '../../auth/Api';

const AddUnit = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Unit name is required');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await Api.post('/purchase/units/create', {
        name: name.trim()
      });
      if (response.status === 200 || response.status === 201 || response.success) {
        setMessage('Unit added successfully!');
        setName('');
      } else {
        setError(response.message || response.error || 'Failed to add unit');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add unit. Please try again.');
      console.error('Error adding unit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-700 mb-1">
            Unit Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-ink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400/40"
            placeholder="Enter unit name"
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
          {loading ? 'Adding...' : 'Add Unit'}
        </button>
      </form>
    </div>
  );
};

export default AddUnit;