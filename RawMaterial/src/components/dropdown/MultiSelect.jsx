import { useState } from 'react';

const MultiSelect = ({ 
  lists, 
  selectedValues = [], 
  setSelectedValues, 
  label, 
  placeholder = "Select options...",
  loadingText = "Loading options..."
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (value) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(item => item !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };

  const clearSelection = () => {
    setSelectedValues([]);
  };

  const getSelectedNames = () => {
    return selectedValues.map(value => {
      const item = lists.find(list => list.id === value);
      return item ? item.name : '';
    }).filter(Boolean);
  };

  const selectedNames = getSelectedNames();
  const displayText = selectedNames.length > 0 
    ? `${selectedNames.length} selected` 
    : (lists?.length <= 0 ? loadingText : placeholder);

  return (
    <div className="relative">
      <label className="block mb-1.5 text-sm font-medium text-ink-700">{label}</label>
      <div 
        className="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-400/40 focus:outline-none cursor-pointer bg-white flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={`${selectedNames.length === 0 ? 'text-gray-400' : 'text-gray-900'}`}>
          {displayText}
        </span>
        <div className="flex items-center space-x-2">
          {selectedValues.length > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                clearSelection();
              }}
              className="text-gray-400 hover:text-gray-600 text-lg"
            >
              ×
            </button>
          )}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-ink-200 rounded-lg shadow-pop max-h-60 overflow-auto">
          {lists?.length > 0 ? (
            <div className="py-1">
              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`px-3 py-2 cursor-pointer flex items-center hover:bg-brand-50 ${
                    selectedValues.includes(list.id) ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                  onClick={() => toggleOption(list.id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(list.id)}
                    onChange={() => {}}
                    className="h-4 w-4 accent-brand-500 border-ink-300 rounded focus:ring-brand-400"
                  />
                  <span className="ml-2 text-sm">{list.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 text-center">
              {loadingText}
            </div>
          )}
        </div>
      )}

      {/* Selected items pills (optional display below dropdown) */}
      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedNames.map((name, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-ink-900"
            >
              {name}
              <button
                onClick={() => toggleOption(selectedValues[index])}
                className="ml-1 text-ink-500 hover:text-ink-950"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;