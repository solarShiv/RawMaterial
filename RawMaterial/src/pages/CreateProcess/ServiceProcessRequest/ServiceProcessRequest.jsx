import React, { useState, useEffect } from "react";
import Api from "../../../auth/Api";
import InputField from "../../../components/InputField/InputField";
import Button from "../../../components/Button/Button";

const ServiceProcessRequest = () => {
  const [products, setProducts] = useState([]);
  const [items, setItems] = useState([]);
  const [defectiveItems, setDefectiveItems] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    items: false,
    defectiveItems: false,
    submit: false,
  });
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedDefectiveItem, setSelectedDefectiveItem] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isDefectiveDropdownOpen, setIsDefectiveDropdownOpen] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".dropdown-container")) {
        setIsProductDropdownOpen(false);
        setIsItemDropdownOpen(false);
        setIsDefectiveDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading((prev) => ({ ...prev, products: true }));
      const response = await Api.get("/common/getProduct");
      setProducts(response?.data?.data || []);
    } catch (err) {
      setError(
        "Error to fetch products: " +
          (err?.response?.data?.message || err.message)
      );
    } finally {
      setLoading((prev) => ({ ...prev, products: false }));
    }
  };

  const fetchItemsByProductId = async (productId) => {
    try {
      setLoading((prev) => ({ ...prev, items: true }));
      const response = await Api.get(
        `/common/getItemsByProductId?productId=${productId}`
      );
      setItems(response?.data?.data || []);
      setSelectedItem("");
      setSelectedDefectiveItem("");
      setDefectiveItems([]);
    } catch (err) {
      setError(
        "Failed to fetch items: " +
          (err?.response?.data?.message || err.message)
      );
    } finally {
      setLoading((prev) => ({ ...prev, items: false }));
    }
  };

  const fetchDefectiveItems = async (itemName) => {
    try {
      setLoading((prev) => ({ ...prev, defectiveItems: true }));
      const response = await Api.get(
        `/common/showDefectiveItemsList?itemName=${itemName}`
      );

      const transformedData = (response?.data?.data || []).map((item) => ({
        id: item._id,
        itemName: item.name,
        defective: item.defective,
        name: item.name,
      }));

      setDefectiveItems(transformedData);
      setSelectedDefectiveItem("");
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading((prev) => ({ ...prev, defectiveItems: false }));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !selectedProduct ||
      !selectedItem ||
      !selectedDefectiveItem ||
      !serialNumber ||
      !quantity
    ) {
      setError("Please fill all required fields");
      return;
    }

    // REMOVED: Quantity validation against available stock
    // if (parseInt(quantity) > selectedDefectiveItem.defective) {
    //   setError(`Quantity cannot exceed available defective items (${selectedDefectiveItem.defective})`);
    //   return;
    // }

    if (parseInt(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, submit: true }));
      setError(null);
      const requestData = {
        productName: selectedProduct.name,
        itemName: selectedItem.name,
        subItemName: selectedDefectiveItem.itemName,
        serialNumber: serialNumber,
        quantity: parseInt(quantity),
      };

      const response = await Api.post(
        "/line-worker/createServiceProcess",
        requestData
      );

      // Reset form
      setSelectedProduct("");
      setSelectedItem("");
      setSelectedDefectiveItem("");
      setSerialNumber("");
      setQuantity("");
      setItems([]);
      setDefectiveItems([]);

      alert("Service process request submitted successfully!");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to submit service process request"
      );
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  const isFormValid = () => {
    return (
      selectedProduct &&
      selectedItem &&
      selectedDefectiveItem &&
      serialNumber.trim() &&
      quantity &&
      parseInt(quantity) > 0
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">

        {/* Error Alert */}
        {error && (
          <div className="mb-6 md:mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-fadeIn">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 transition-all duration-300 hover:shadow-xl">
          {/* Selection Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
            {/* Product Selection */}
            <div className="dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  className={`w-full p-3 sm:p-4 border rounded-lg text-left transition-all duration-200 ${
                    isProductDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-gray-300 hover:border-gray-400"
                  } ${loading.products ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  onClick={() =>
                    setIsProductDropdownOpen(!isProductDropdownOpen)
                  }
                  disabled={loading.products}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`truncate ${selectedProduct ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {selectedProduct
                        ? selectedProduct.name
                        : loading.products
                          ? "Loading products..."
                          : "Select a product"}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        isProductDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isProductDropdownOpen && products.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto animate-fadeIn">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                          selectedProduct?.id === product.id
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsProductDropdownOpen(false);
                          fetchItemsByProductId(product.id);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{product.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Item Selection */}
            <div className="dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  className={`w-full p-3 sm:p-4 border rounded-lg text-left transition-all duration-200 ${
                    isItemDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-gray-300 hover:border-gray-400"
                  } ${!selectedProduct || loading.items ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  onClick={() =>
                    !loading.items && setIsItemDropdownOpen(!isItemDropdownOpen)
                  }
                  disabled={!selectedProduct || loading.items}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`truncate ${selectedItem ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {selectedItem
                        ? selectedItem.name
                        : loading.items
                          ? "Loading items..."
                          : selectedProduct
                            ? "Select an item"
                            : "Select product first"}
                    </span>
                    <svg
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        isItemDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {isItemDropdownOpen && items.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto animate-fadeIn">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                          selectedItem?.id === item.id
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedItem(item);
                          setIsItemDropdownOpen(false);
                          fetchDefectiveItems(item.name);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Defective Item Selection - REMOVED available stock display */}
            <div className="dropdown-container">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sub Item <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  className={`w-full p-3 sm:p-4 border rounded-lg text-left transition-all duration-200 ${
                    isDefectiveDropdownOpen
                      ? "border-blue-500 ring-2 ring-blue-100"
                      : "border-gray-300 hover:border-gray-400"
                  } ${!selectedItem || loading.defectiveItems ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                  onClick={() =>
                    !loading.defectiveItems &&
                    setIsDefectiveDropdownOpen(!isDefectiveDropdownOpen)
                  }
                  disabled={!selectedItem || loading.defectiveItems}
                >
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <span
                        className={
                          selectedDefectiveItem
                            ? "text-gray-900"
                            : "text-gray-500"
                        }
                      >
                        {selectedDefectiveItem
                          ? selectedDefectiveItem.name
                          : loading.defectiveItems
                            ? "Loading sub items..."
                            : selectedItem
                              ? "Select a sub item"
                              : "Select item first"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <svg
                        className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                          isDefectiveDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {isDefectiveDropdownOpen && defectiveItems.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto animate-fadeIn">
                    {defectiveItems.map((def) => (
                      <div
                        key={def.id}
                        className={`px-4 py-3 cursor-pointer transition-colors duration-150 ${
                          selectedDefectiveItem?.id === def.id
                            ? "bg-blue-50 text-blue-600"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedDefectiveItem(def);
                          setIsDefectiveDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <span className="truncate">{def.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {selectedItem &&
            defectiveItems.length === 0 &&
            !loading.defectiveItems && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <svg
                    className="h-5 w-5 text-yellow-500 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-yellow-700 text-sm">
                    No defective items found for "
                    <span className="font-medium">{selectedItem.name}</span>"
                  </p>
                </div>
              </div>
            )}

          {selectedDefectiveItem && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              {/* <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Details</h3> */}
              <div className="grid grid-cols-1 md:grid-cols-8 gap-4 md:gap-6">
                <div className="md:col-span-2">
                  <InputField
                    label="Serial Number"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Enter serial number"
                    required
                    fullWidth
                    containerClass="mb-4"
                  />
                </div>

                <div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*$/.test(value)) {
                            setQuantity(value);
                          }
                        }}
                        min="1"
                        className=" p-3 sm:p-4 border border-gray-300  
                        rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="Enter quantity"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 md:mt-8 flex justify-end">
                <Button
                  title={
                    loading.submit ? (
                      <span className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-dark"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Submit Request"
                    )
                  }
                  onClick={handleSubmit}
                  disabled={loading.submit || !isFormValid()}
                  className={`w-full md:w-auto px-8 py-3 rounded-lg font-medium text-base transition-all duration-200 ${
                    loading.submit || !isFormValid()
                      ? "bg-gray-400 cursor-not-allowed text-dark"
                      : "bg-yellow-400 transform hover:-translate-y-0.5"
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animations */}
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
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ServiceProcessRequest;
