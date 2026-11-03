import React, { useState, useEffect } from 'react';
import Api from '../../../../auth/Api'

const StockUpdateHistory = () => {
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStockHistory();
  }, []);

  const fetchStockHistory = async () => {
    try {
      const response = await Api.get('/store-keeper/getStockMovementHistory');
      console.log('API Response:', response);
      
      if (response.data && response.data.success) {
        setStockHistory(response.data.data || []);
      } else {
        setError(response.data?.message);
      }
    } catch (err) {
      setError('Failed to fetch stock history');
      console.log('Error fetching stock history:', err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async (imageUrl, filename) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `bill-photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
      alert('Failed to download image');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeClass = (type) => {
    return type === 'IN' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-5 font-sans">
        <div className="text-center py-10 text-gray-600 text-lg">Loading stock history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-5 font-sans">
        <div className="text-center py-10 text-red-500 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-5 font-sans">

      <div className="space-y-6">
        {!stockHistory || stockHistory.length === 0 ? (
          <div className="text-center py-10 text-gray-600 text-lg">No stock history available</div>
        ) : (
          stockHistory.map((historyItem) => (
            <div 
              key={historyItem.id} 
              className="bg-white rounded-xl shadow-md overflow-hidden border-l-4  animate-fade-in-up"
            >
              <div className="flex flex-col lg:flex-row">
                {/* Left side - Stock movements */}
                <div className="flex-1 p-5 border-r-0 lg:border-r-2 ">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Stock Movements</h4>
                    <div className="space-y-2">
                      {historyItem.stockMovement && historyItem.stockMovement.map((movement, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border-l-4 ">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                            <span className="font-semibold text-gray-800 flex-1">
                              {movement.rawMaterial?.name || 'Unknown Material'}
                            </span>
                            <div className="flex items-center gap-2 font-medium">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase border ${getMovementTypeClass(movement.type)}`}>
                                {movement.type}
                              </span>
                              <span>
                                {movement.quantity} {movement.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right side - Bill photos */}
                <div className="w-full lg:w-80 bg-gray-50 p-5">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Bill Photos</h4>
                    <div className="flex flex-col space-y-4">
                      {historyItem.billPhotos && historyItem.billPhotos.map((photoUrl, index) => (
                        <div key={index} className="flex flex-col items-center gap-3">
                          <img 
                            src={photoUrl} 
                            alt={`Bill ${index + 1}`}
                            className="w-full max-w-xs h-32 object-cover rounded-lg border-2 border-gray-300 transition-transform duration-200 hover:scale-105"
                            onError={(e) => {
                              e.target.src = '/placeholder-bill.jpg';
                            }}
                          />
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm transition-colors duration-200 flex items-center gap-1"
                            onClick={() => downloadImage(photoUrl, `bill-${historyItem.id}-${index + 1}.jpg`)}
                            title="Download Bill Photo"
                          >
                            📥 Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StockUpdateHistory;