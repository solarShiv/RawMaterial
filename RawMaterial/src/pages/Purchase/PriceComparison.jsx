import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";

const PriceComparision = () => {
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState("");
    const [selectedItemName, setSelectedItemName] = useState("");
    const [selectedVendor, setSelectedVendor] = useState("");
    const [priceHistory, setPriceHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cheapestItem, setCheapestItem] = useState(null);

    // 🔽 Dropdown states
    const [isOpen, setIsOpen] = useState(false);
    const [isVendorOpen, setIsVendorOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [vendorSearchTerm, setVendorSearchTerm] = useState("");

    const dropdownRef = useRef();
    const vendorDropdownRef = useRef();

    // ✅ Fetch Items
    const fetchItemData = async () => {
        setLoading(true);
        try {
            const res = await Api.get(`/purchase/items`);
            setItems(res?.data?.items || []);
        } catch (err) {
            alert(err?.message);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Fetch Price History with vendor filter
    const fetchPriceHistory = async (itemName, vendorName = "") => {
        if (!itemName) return;

        setLoading(true);
        try {
            let url = `/common/item/price/comparison?item=${encodeURIComponent(itemName)}&page=1&limit=25`;
            if (vendorName) {
                url += `&vendor=${encodeURIComponent(vendorName)}`;
            }
            
            const res = await Api.get(url);
            const data = res?.data?.data || [];
            setPriceHistory(data);
            
            // Find cheapest item from response
            if (data.length > 0) {
                const cheapest = data.reduce((min, current) => {
                    return (current.rate < min.rate) ? current : min;
                }, data[0]);
                setCheapestItem(cheapest);
            } else {
                setCheapestItem(null);
            }
        } catch (err) {
            console.log(err.response);
            alert( err?.response?.data?.message);
            setPriceHistory([]);
            setCheapestItem(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItemData();
    }, []);

    useEffect(() => {
        if (selectedItemName) {
            fetchPriceHistory(selectedItemName, selectedVendor);
        }
    }, [selectedItemName, selectedVendor]);

    // ✅ Handle item select
    const handleItemSelect = (item) => {
        setSelectedItem(item.id);
        setSelectedItemName(item.name);
        setSelectedVendor("");
        setIsOpen(false);
        setSearchTerm("");
    };

    // ✅ Handle vendor select
    const handleVendorSelect = (vendor) => {
        setSelectedVendor(vendor);
        setIsVendorOpen(false);
        setVendorSearchTerm("");
    };

    // ✅ Clear vendor filter
    const clearVendorFilter = () => {
        setSelectedVendor("");
    };

    // ✅ Filter items
    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ Close dropdown outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
            if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target)) {
                setIsVendorOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // ✅ Get unique vendors from price history
    const uniqueVendors = [...new Set(priceHistory.map(h => h.vendor))];

    // ✅ Calculate statistics (separate by currency if needed)
    const calculateStats = () => {
        const pricesByCurrency = {};
        priceHistory.forEach(h => {
            const currency = h.currency || 'INR';
            if (!pricesByCurrency[currency]) {
                pricesByCurrency[currency] = [];
            }
            pricesByCurrency[currency].push(h.rate);
        });

        const stats = {};
        for (const [currency, prices] of Object.entries(pricesByCurrency)) {
            stats[currency] = {
                lowest: Math.min(...prices),
                highest: Math.max(...prices),
                avg: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)
            };
        }
        return stats;
    };

    const stats = calculateStats();

    // Format currency symbol
    const getCurrencySymbol = (currency) => {
        return currency === 'USD' ? '$' : '₹';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">

                {/* Filters Section */}
                <div className="bg-white rounded-xl shadow-md p-4 md:p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Item Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Item
                            </label>
                            <div
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 transition-colors"
                            >
                                <span className={selectedItemName ? "text-gray-900" : "text-gray-500"}>
                                    {selectedItemName || "Choose an item..."}
                                </span>
                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>

                            {isOpen && (
                                <div className="absolute w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl z-20 animate-fadeIn">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            placeholder="Search item..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredItems.length > 0 ? (
                                            filteredItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => handleItemSelect(item)}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                >
                                                    {item.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-3 text-gray-500 text-center">
                                                No items found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vendor Filter Dropdown */}
                        {selectedItemName && uniqueVendors.length > 0 && (
                            <div className="relative" ref={vendorDropdownRef}>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Filter by Vendor
                                </label>
                                <div
                                    onClick={() => setIsVendorOpen(!isVendorOpen)}
                                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 transition-colors"
                                >
                                    <span className={selectedVendor ? "text-gray-900" : "text-gray-500"}>
                                        {selectedVendor || "All Vendors"}
                                    </span>
                                    <svg className={`w-5 h-5 text-gray-400 transition-transform ${isVendorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>

                                {isVendorOpen && (
                                    <div className="absolute w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-xl z-20 animate-fadeIn">
                                        <div className="p-2 border-b">
                                            <input
                                                type="text"
                                                placeholder="Search vendor..."
                                                value={vendorSearchTerm}
                                                onChange={(e) => setVendorSearchTerm(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            <div
                                                onClick={clearVendorFilter}
                                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer font-semibold transition-colors"
                                            >
                                                All Vendors
                                            </div>
                                            {uniqueVendors
                                                .filter(vendor => vendor.toLowerCase().includes(vendorSearchTerm.toLowerCase()))
                                                .map((vendor, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => handleVendorSelect(vendor)}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
                                                    >
                                                        {vendor}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Selected Item Badge */}
                    {selectedItemName && (
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="font-medium">{selectedItemName}</span>
                            </div>
                            {selectedVendor && (
                                <div className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span className="font-medium">{selectedVendor}</span>
                                    <button
                                        onClick={clearVendorFilter}
                                        className="ml-2 text-red-600 hover:text-red-800"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Loader */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Cheapest Item Highlight */}
                {!loading && cheapestItem && (
                    <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 md:p-6 shadow-lg animate-slideIn">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-500 rounded-full p-2 animate-bounce">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-sm text-green-700 font-semibold">BEST DEAL AVAILABLE</div>
                                    <div className="text-xl md:text-2xl font-bold text-green-800">Cheapest Price</div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                                <div className="bg-white rounded-lg px-4 py-2 shadow">
                                    <div className="text-xs text-gray-500">Vendor</div>
                                    <div className="font-semibold text-gray-900">{cheapestItem.vendor}</div>
                                </div>
                                <div className="bg-white rounded-lg px-4 py-2 shadow">
                                    <div className="text-xs text-gray-500">Price</div>
                                    <div className="text-2xl font-bold text-green-600">
                                        {getCurrencySymbol(cheapestItem.currency)}{cheapestItem.rate.toLocaleString()}
                                        <span className="text-sm text-gray-500 ml-1">{cheapestItem.currency}</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg px-4 py-2 shadow">
                                    <div className="text-xs text-gray-500">Date</div>
                                    <div className="font-semibold text-gray-900">
                                        {new Date(cheapestItem.date).toLocaleDateString('en-IN', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Price History Table */}
                {!loading && priceHistory.length > 0 && (
                    <>
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Vendor
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Currency
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {priceHistory.map((h, i) => {
                                            const isCheapest = cheapestItem && 
                                                h.rate === cheapestItem.rate && 
                                                h.vendor === cheapestItem.vendor &&
                                                h.currency === cheapestItem.currency;
                                            
                                            return (
                                                <tr key={i} className={`hover:bg-gray-50 transition-colors ${isCheapest ? 'bg-green-50' : ''}`}>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                        {new Date(h.date).toLocaleDateString('en-IN', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {h.vendor}
                                                        {isCheapest && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                Cheapest
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                        <span className={isCheapest ? "text-green-600" : "text-gray-900"}>
                                                            {getCurrencySymbol(h.currency)}{h.rate.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                                        {h.currency}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Statistics Summary */}
                        {/* <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Price Statistics by Currency
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.entries(stats).map(([currency, data]) => (
                                    <div key={currency} className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                                        <h4 className="text-lg font-bold text-gray-900 mb-3 pb-2 border-b">
                                            {currency}
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-2 bg-green-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Lowest</span>
                                                <span className="text-lg font-bold text-green-600">
                                                    {getCurrencySymbol(currency)}{data.lowest.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Highest</span>
                                                <span className="text-lg font-bold text-red-600">
                                                    {getCurrencySymbol(currency)}{data.highest.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 bg-blue-50 rounded-lg">
                                                <span className="text-sm text-gray-600">Average</span>
                                                <span className="text-lg font-bold text-blue-600">
                                                    {getCurrencySymbol(currency)}{Number(data.avg).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div> */}
                    </>
                )}

                {/* No Data Message */}
                {!loading && priceHistory.length === 0 && selectedItemName && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 text-gray-500">
                            No data found for {selectedItemName}
                            {selectedVendor && ` from ${selectedVendor}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Add custom CSS for animations */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out;
                }
                
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default PriceComparision;