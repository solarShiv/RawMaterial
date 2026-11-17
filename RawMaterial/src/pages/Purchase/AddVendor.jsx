import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Api from "../../auth/Api";
import {
  BuildingOffice2Icon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  UserIcon,
  PaperClipIcon,
  XMarkIcon,
  PhotoIcon,
  DocumentIcon,
} from "@heroicons/react/24/outline";
import {
  BuildingOffice2Icon as BuildingOffice2Solid,
  CheckCircleIcon as CheckCircleSolid,
  DocumentIcon as DocumentIconSolid,
  PhotoIcon as PhotoIconSolid,
} from "@heroicons/react/24/solid";
import Button from "../../components/Button/Button";

const AddVendor = () => {
  const [companyData, setCompanyData] = useState({
    name: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    country: "",
    contactPerson: "",
    contactNumber: "",
    alternateNumber: "",
    email: "",
    currency: "",
    zipCode: "",
    vendorAadhaar: "",
    vendorPanCard: "",
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    ifscCode: "",
    referenceBy: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [detectingState, setDetectingState] = useState(false);
  const [countries, setCountries] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCurrency, setLoadingCurrency] = useState(false);

  // File states
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [panCardFile, setPanCardFile] = useState(null);
  const [uploadingFiles] = useState({
    aadhaar: false,
    pancard: false
  });
  const [fileErrors, setFileErrors] = useState({
    aadhaar: "",
    pancard: ""
  });

  const dropdownRef = useRef(null);
  const currencyDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const currencySearchInputRef = useRef(null);
  const pincodeTimeoutRef = useRef(null);
  const aadhaarFileInputRef = useRef(null);
  const panCardFileInputRef = useRef(null);

  // Track if city/state was auto-filled from pincode
  const [autoFilledFields, setAutoFilledFields] = useState({
    city: false,
    state: false
  });

  // Track last valid pincode to avoid refetching same data
  const [lastFetchedPincode, setLastFetchedPincode] = useState("");

  // Fetch countries and currencies on component mount – NO fallbacks
  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setError(""); // clear previous errors
      try {
        const response = await Api.get(`/common/countries`);
        if (response.data?.success) {
          setCountries(response.data.countries || []);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error(
          "Error fetching countries: ",
          error?.response?.data?.message || error?.message
        );
        setError("Failed to load countries. Please refresh the page.");
        setCountries([]); // keep empty – no fallback
      } finally {
        setLoadingCountries(false);
      }
    };

    const fetchAllCurrencies = async () => {
      setLoadingCurrency(true);
      try {
        const response = await Api.get(`/common/currencies`);
        if (response.data?.success) {
          setCurrencies(response.data.currencies || []);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error(
          "Error fetching currencies: ",
          error?.response?.data?.message || error?.message
        );
        setError("Failed to load currencies. Please refresh the page.");
        setCurrencies([]);
      } finally {
        setLoadingCurrency(false);
      }
    };

    fetchCountries();
    fetchAllCurrencies();
  }, []);

  // Fetch default currency when country changes – no hardcoded map
  useEffect(() => {
    const fetchCurrency = async () => {
      if (companyData.country) {
        setLoadingCurrency(true);
        try {
          const response = await Api.get(
            `/common/currency/${encodeURIComponent(companyData.country)}`
          );
          if (response.data?.success && response.data.currency) {
            setCompanyData((prev) => ({
              ...prev,
              currency: response.data.currency,
            }));
          } else {
            // If API doesn't return a currency, clear it – user must select manually
            setCompanyData((prev) => ({ ...prev, currency: "" }));
          }
        } catch (error) {
          console.error(
            "Error fetching currency: ",
            error?.response?.data?.message || error?.message
          );
          setCompanyData((prev) => ({ ...prev, currency: "" }));
        } finally {
          setLoadingCurrency(false);
        }
      }
    };

    fetchCurrency();
  }, [companyData.country]);

  // Function to fetch pincode details (only for India)
  const fetchPincodeDetails = useCallback(async (pincode) => {
    // Don't fetch if we already fetched this pincode
    if (pincode === lastFetchedPincode) return;

    setDetectingState(true);
    try {
      const response = await Api.get(`/common/address/pincode/${pincode}`);
      if (response.data?.success) {
        const { city, state } = response.data.data;

        setCompanyData(prev => {
          // Create new object to avoid mutating state
          const newData = { ...prev };

          // Only update city if it's currently empty OR was auto-filled previously
          if (autoFilledFields.city || prev.city === "") {
            newData.city = city;
          }

          // Only update state if it's currently empty OR was auto-filled previously
          if (autoFilledFields.state || prev.state === "") {
            newData.state = state;
          }

          return newData;
        });

        // Mark as auto-filled if we updated them
        setAutoFilledFields({
          city: autoFilledFields.city || companyData.city === "",
          state: autoFilledFields.state || companyData.state === ""
        });

        // Store this pincode as last fetched
        setLastFetchedPincode(pincode);
      }
    } catch (error) {
      console.error(
        "Error fetching pincode details: ",
        error?.response?.data?.message || error?.message
      );
      // Reset last fetched pincode on error
      setLastFetchedPincode("");
    } finally {
      setDetectingState(false);
    }
  }, [autoFilledFields, companyData.city, companyData.state, lastFetchedPincode]);

  // Handle zipCode/pincode change with debouncing (only for India)
  useEffect(() => {
    // Clear any existing timeout
    if (pincodeTimeoutRef.current) {
      clearTimeout(pincodeTimeoutRef.current);
    }

    // Only fetch if it's India and zipCode is exactly 6 digits
    if (
      companyData.zipCode.length === 6 &&
      companyData.country.toLowerCase() === "india" &&
      companyData.zipCode !== lastFetchedPincode
    ) {
      // Set a new timeout
      pincodeTimeoutRef.current = setTimeout(() => {
        fetchPincodeDetails(companyData.zipCode);
      }, 800); // 800ms debounce
    } else if (companyData.zipCode.length !== 6 && companyData.country.toLowerCase() === "india") {
      // Reset auto-filled status if pincode is not 6 digits for India
      setAutoFilledFields({
        city: false,
        state: false
      });
      setLastFetchedPincode("");
    }

    // Cleanup function
    return () => {
      if (pincodeTimeoutRef.current) {
        clearTimeout(pincodeTimeoutRef.current);
      }
    };
  }, [companyData.zipCode, companyData.country, fetchPincodeDetails, lastFetchedPincode]);

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return countries;
    return countries.filter((country) =>
      country.toLowerCase().includes(countrySearch.toLowerCase())
    );
  }, [countries, countrySearch]);

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return currencies;
    return currencies.filter((currency) =>
      currency.toLowerCase().includes(currencySearch.toLowerCase())
    );
  }, [currencies, currencySearch]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCountryDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCountryDropdown]);

  useEffect(() => {
    if (showCurrencyDropdown && currencySearchInputRef.current) {
      currencySearchInputRef.current.focus();
    }
  }, [showCurrencyDropdown]);

  // Handle click outside for both dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close country dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }

      // Close currency dropdown
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
        setCurrencySearch("");
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        if (showCountryDropdown) {
          setShowCountryDropdown(false);
          setCountrySearch("");
        }
        if (showCurrencyDropdown) {
          setShowCurrencyDropdown(false);
          setCurrencySearch("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showCountryDropdown, showCurrencyDropdown]);

  const formatGSTNumber = (value) => {
    const cleaned = value ? value.toUpperCase().replace(/[^0-9A-Z]/g, "") : "";
    return cleaned.slice(0, 15);
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    return cleaned.slice(0, 20);
  };

  const formatEmail = (value) => {
    return value.replace(/\s/g, "");
  };

  // File validation
  const validateFile = (file) => {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const validPdfType = 'application/pdf';
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!file) {
      return "File is required";
    }

    if (file.size > maxSize) {
      return "File size must be less than 5MB";
    }

    if (!validImageTypes.includes(file.type) && file.type !== validPdfType) {
      return "Only JPG, PNG, GIF, WEBP images or PDF files are allowed";
    }

    return "";
  };

  const validateForm = () => {
    const errors = {};

    if (!companyData.name.trim()) errors.name = "vendor name is required";

    if (!companyData.contactPerson.trim()) {
      errors.contactPerson = "Contact person name is required";
    }

    if (
      companyData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)
    ) {
      errors.email = "Invalid email format";
    }

    if (!companyData.address.trim()) errors.address = "Address is required";
    if (!companyData.city.trim()) errors.city = "City is required";
    if (!companyData.state.trim()) errors.state = "State is required";
    if (!companyData.referenceBy.trim()) errors.referenceBy = "referenceBy required";
    if (!companyData.country.trim()) errors.country = "Country is required";
    if (!companyData.currency.trim()) errors.currency = "Currency is required";

    // Validate zipCode based on country
    if (companyData.country.toLowerCase() === "india") {
      // For India, validate as 6-digit pincode if provided
      if (companyData.zipCode && companyData.zipCode.length !== 6) {
        errors.zipCode = "Pincode must be 6 digits for India";
      }
    } else if (companyData.zipCode) {
      // For other countries, just ensure it's not empty if provided
      if (!companyData.zipCode.trim()) {
        errors.zipCode = "Postal code is required if entered";
      }
    }

    // Validate contact number
    if (!companyData.contactNumber.trim()) {
      errors.contactNumber = "Contact number is required";
    } else if (!/^\d{10,15}$/.test(companyData.contactNumber)) {
      errors.contactNumber = "Contact number must be 10-15 digits";
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    if (name === "gstNumber") {
      processedValue = formatGSTNumber(value);
    } else if (name === "contactNumber" || name === "alternateNumber") {
      processedValue = formatPhoneNumber(value);
    } else if (name === "zipCode") {
      // For India, restrict to 6 digits only
      if (companyData.country.toLowerCase() === "india") {
        processedValue = value.replace(/[^0-9]/g, "").slice(0, 6);
      } else {
        // For other countries, allow alphanumeric and spaces
        processedValue = value ? value.toUpperCase().slice(0, 20) : "";
      }
      // Reset last fetched pincode when user starts typing new pincode (India only)
      if (processedValue !== lastFetchedPincode && companyData.country.toLowerCase() === "india") {
        setLastFetchedPincode("");
      }
    } else if (name === "email") {
      processedValue = formatEmail(value);
    } else if (name === "contactPerson") {
      processedValue = value.replace(/[^a-zA-Z\s.'-]/g, "");
    } else if (name === "referenceBy") {
      processedValue = value.replace(/[^a-zA-Z\s.'-]/g, "");
    } else if (name === "vendorAadhaar") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 12);
    } else if (name === "vendorPanCard") {
      processedValue = value ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10) : "";
    } else if (name === "accountNumber") {
      processedValue = value.replace(/[^0-9]/g, "").slice(0, 18);
    } else if (name === "ifscCode") {
      processedValue = value ? value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11) : "";
    }

    setCompanyData((prevState) => ({
      ...prevState,
      [name]: processedValue,
    }));

    // When user manually edits city or state, mark them as manually edited
    if (name === "city" || name === "state") {
      setAutoFilledFields(prev => ({
        ...prev,
        [name]: false
      }));
      // Reset last fetched pincode since user is overriding (India only)
      if (companyData.country.toLowerCase() === "india") {
        setLastFetchedPincode("");
      }
    }

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear file errors when corresponding field is cleared
    if (name === "vendorAadhaar" && !processedValue) {
      setFileErrors(prev => ({ ...prev, aadhaar: "" }));
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.aadhaarFile;
        return newErrors;
      });
    }
    if (name === "vendorPanCard" && !processedValue) {
      setFileErrors(prev => ({ ...prev, pancard: "" }));
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.panCardFile;
        return newErrors;
      });
    }
  };

  // Handle file selection
  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setFileErrors(prev => ({ ...prev, [type]: error }));
      return;
    }

    if (type === "aadhaar") {
      setAadhaarFile(file);
      setFileErrors(prev => ({ ...prev, aadhaar: "" }));
    } else if (type === "pancard") {
      setPanCardFile(file);
      setFileErrors(prev => ({ ...prev, pancard: "" }));
    }

    // Clear any field errors for this file
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (type === "aadhaar") delete newErrors.aadhaarFile;
      if (type === "pancard") delete newErrors.panCardFile;
      return newErrors;
    });
  };

  // Remove file
  const handleRemoveFile = (type) => {
    if (type === "aadhaar") {
      setAadhaarFile(null);
      if (aadhaarFileInputRef.current) {
        aadhaarFileInputRef.current.value = "";
      }
      // Clear file error
      setFileErrors(prev => ({ ...prev, aadhaar: "" }));
      // Clear field error
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.aadhaarFile;
        return newErrors;
      });
    } else if (type === "pancard") {
      setPanCardFile(null);
      if (panCardFileInputRef.current) {
        panCardFileInputRef.current.value = "";
      }
      // Clear file error
      setFileErrors(prev => ({ ...prev, pancard: "" }));
      // Clear field error
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.panCardFile;
        return newErrors;
      });
    }
  };

  // Get file icon based on type
  const getFileIcon = (file) => {
    if (!file) return null;

    if (file.type === 'application/pdf') {
      return <DocumentIcon className="h-5 w-5 text-red-500" />;
    } else if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-5 w-5 text-brand-700" />;
    }
    return <DocumentIcon className="h-5 w-5 text-ink-500" />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCountrySelect = (country) => {
    setCompanyData((prevState) => ({
      ...prevState,
      country: country,
      // Clear zipCode when country changes to avoid confusion
      zipCode: "",
    }));
    setShowCountryDropdown(false);
    setCountrySearch("");

    // Reset auto-filled fields when country changes
    setAutoFilledFields({
      city: false,
      state: false
    });
    setLastFetchedPincode("");
  };

  const handleCountryDropdownToggle = () => {
    const newState = !showCountryDropdown;
    setShowCountryDropdown(newState);
    setCountrySearch("");
  };

  const handleCurrencySelect = (currency) => {
    setCompanyData((prevState) => ({
      ...prevState,
      currency: currency,
    }));
    setShowCurrencyDropdown(false);
    setCurrencySearch("");
  };

  const handleCurrencyDropdownToggle = () => {
    const newState = !showCurrencyDropdown;
    setShowCurrencyDropdown(newState);
    setCurrencySearch("");
  };

  // Handle zipCode/pincode blur - trigger immediate fetch (India only)
  const handleZipCodeBlur = () => {
    if (
      companyData.zipCode.length === 6 &&
      companyData.country.toLowerCase() === "india" &&
      companyData.zipCode !== lastFetchedPincode
    ) {
      fetchPincodeDetails(companyData.zipCode);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors in the form");
      return;
    }

    // Validate files only if corresponding numbers are provided
    if (companyData.vendorAadhaar && !aadhaarFile) {
      setFieldErrors(prev => ({ ...prev, aadhaarFile: "Aadhaar document is required when Aadhaar number is provided" }));
      setError("Please upload Aadhaar document");
      return;
    }

    if (companyData.vendorPanCard && !panCardFile) {
      setFieldErrors(prev => ({ ...prev, panCardFile: "PAN card document is required when PAN number is provided" }));
      setError("Please upload PAN card document");
      return;
    }

    setFieldErrors({});
    setLoading(true);
    setMessage("");
    setError("");

    try {
      // Create FormData to send files and form data together
      const formData = new FormData();

      // Add all form fields to FormData
      Object.keys(companyData).forEach(key => {
        if (companyData[key] && companyData[key].trim() !== "") {
          formData.append(key, companyData[key].trim());
        }
      });

      // Add files if they exist
      if (aadhaarFile) {
        formData.append('aadhaarFile', aadhaarFile);
      }

      if (panCardFile) {
        formData.append('pancardFile', panCardFile);
      }

      // Log FormData contents for debugging
      console.log("FormData contents:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      // Send all data including files in one API call
      const response = await Api.post("/purchase/vendors", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200 || response.status === 201) {
        setMessage("Vendor added successfully!");
        alert(response?.data?.message || "Vendor added successfully!");
        clearForm();
      }
    } catch (err) {
      console.error("Error adding vendor:", err);

      // More detailed error handling
      if (err.response) {
        console.error("Response error:", err.response.data);
        console.error("Response status:", err.response.status);

        let errorMessage = err.response.data?.message ||
          err.response.data?.error ||
          `Failed to add vendor. Server responded with: ${err.response.status}`;

        // Handle validation errors from server
        if (err.response.data?.errors) {
          const serverErrors = err.response.data.errors;
          const fieldErrorObj = {};

          Object.keys(serverErrors).forEach(key => {
            fieldErrorObj[key] = serverErrors[key];
          });

          setFieldErrors(fieldErrorObj);
          errorMessage = "Please fix the errors in the form";
        }

        setError(errorMessage);
      } else if (err.request) {
        setError("No response from server. Please check your network connection.");
      } else {
        setError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      companyData.name.trim() &&
      companyData.contactPerson.trim() &&
      companyData.address.trim() &&
      companyData.city.trim() &&
      companyData.state.trim() &&
      companyData.country.trim() &&
      companyData.currency.trim() &&
      companyData.contactNumber.trim() &&
      /^\d{10,15}$/.test(companyData.contactNumber)
    );
  };

  const clearForm = () => {
    setCompanyData({
      name: "",
      gstNumber: "",
      address: "",
      city: "",
      state: "",
      country: "",
      contactPerson: "",
      contactNumber: "",
      alternateNumber: "",
      email: "",
      currency: "",
      zipCode: "",
      vendorAadhaar: "",
      vendorPanCard: "",
      bankName: "",
      accountHolder: "",
      accountNumber: "",
      ifscCode: "",
      referenceBy: "",
    });
    setAadhaarFile(null);
    setPanCardFile(null);
    setFieldErrors({});
    setFileErrors({ aadhaar: "", pancard: "" });
    setError("");
    setMessage("");
    setCountrySearch("");
    setCurrencySearch("");
    setShowCountryDropdown(false);
    setShowCurrencyDropdown(false);
    setAutoFilledFields({
      city: false,
      state: false
    });
    setLastFetchedPincode("");

    // Clear file inputs
    if (aadhaarFileInputRef.current) {
      aadhaarFileInputRef.current.value = "";
    }
    if (panCardFileInputRef.current) {
      panCardFileInputRef.current.value = "";
    }
  };

  // Get field label and placeholder based on country
  const getZipCodeFieldInfo = () => {
    const isIndia = companyData.country.toLowerCase() === "india";

    return {
      label: isIndia ? "Pincode" : "Postal/Zip Code",
      placeholder: isIndia ? "Enter 6-digit pincode" : "Enter postal/zip code",
      maxLength: isIndia ? 6 : 20,
      validationText: isIndia ? (
        companyData.zipCode.length === 6 ? (
          <p className="text-green-600 text-xs mt-0.5 flex items-center">
            <CheckCircleIcon className="h-3 w-3 mr-0.5" />
            Valid pincode format
          </p>
        ) : companyData.zipCode.length > 0 ? (
          <p className="text-red-600 text-xs mt-0.5 flex items-center">
            <XCircleIcon className="h-3 w-3 mr-0.5" />
            Pincode must be 6 digits
          </p>
        ) : null
      ) : null
    };
  };

  const zipCodeFieldInfo = getZipCodeFieldInfo();

  return (
    <div className="min-h-[60vh] bg-ink-50 py-4 px-3 sm:py-6 sm:px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Success Message */}
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <CheckCircleSolid className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <strong className="font-medium text-green-800">Success!</strong>
              <p className="text-green-700 text-sm mt-0.5">{message}</p>
            </div>
            <button
              onClick={() => setMessage("")}
              className="text-green-500 hover:text-green-700 ml-2"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <strong className="font-medium text-red-800">Error!</strong>
              <p className="text-red-700 text-sm mt-0.5">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-500 hover:text-red-700 ml-2"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white border border-ink-200 rounded-lg">
          {/* Form Header */}
          <div className="border-b border-ink-200 px-4 py-3 sm:px-6 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-ink-700" />
                <h2 className="text-base sm:text-lg font-medium text-ink-900">
                  Vendor Registration Form
                </h2>
              </div>
              <div className="text-ink-500 text-xs sm:text-sm">
                <InformationCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                All fields marked with * are required
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Basic Information Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-brand-100 rounded-lg flex items-center justify-center mr-2">
                    <BuildingOffice2Icon className="h-4 w-4 text-brand-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">
                      Basic Information
                    </h3>
                    <p className="text-ink-500 text-xs">
                      Primary details about the vendor
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="name"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <BuildingOffice2Icon className="h-3 w-3 mr-1 text-ink-400" />
                        Vendor Name{" "}
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={companyData.name}
                        onChange={handleChange}
                        required
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.name
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter vendor legal name"
                      />
                      <BuildingOffice2Icon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.name && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.name}
                      </span>
                    )}
                  </div>

                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="referenceBy"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <BuildingOffice2Icon className="h-3 w-3 mr-1 text-ink-400" />
                        Reference By{" "}
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="referenceBy"
                        name="referenceBy"
                        value={companyData.referenceBy}
                        onChange={handleChange}
                        required
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.referenceBy
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter reference By"
                      />
                      <BuildingOffice2Icon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.referenceBy && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.referenceBy}
                      </span>
                    )}
                  </div>

                  {/* GST Number */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="gstNumber"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1 text-ink-400" />
                        GST Number <span className="text-red-500 ml-0.5"></span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="gstNumber"
                        name="gstNumber"
                        value={companyData.gstNumber}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.gstNumber
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="15-character GST number"
                        maxLength="15"
                      />
                      <DocumentTextIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.gstNumber && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.gstNumber}
                      </span>
                    )}
                  </div>

                  {/* Country Dropdown */}
                  <div className="sm:col-span-1 relative" ref={dropdownRef}>
                    <label className="block text-xs sm:text-sm font-medium text-ink-700 mb-1">
                      <span className="flex items-center">
                        <GlobeAltIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Country <span className="text-red-500 ml-0.5">*</span>
                        {loadingCountries && (
                          <ArrowPathIcon className="h-3 w-3 ml-1 animate-spin text-brand-700" />
                        )}
                      </span>
                    </label>
                    <div className="relative">
                      <div
                        className={`w-full px-3 py-2 border rounded-lg bg-white cursor-pointer flex justify-between items-center transition-colors text-sm ${
                          showCountryDropdown
                            ? "border-brand-500 ring-1 ring-brand-400/40"
                            : fieldErrors.country
                              ? "border-red-300 bg-red-50"
                              : "border-ink-300 hover:border-ink-400"
                        } ${
                          loadingCountries
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() =>
                          !loadingCountries && handleCountryDropdownToggle()
                        }
                        tabIndex={loadingCountries ? -1 : 0}
                        role="button"
                        aria-expanded={showCountryDropdown}
                        aria-haspopup="listbox"
                        aria-disabled={loadingCountries}
                      >
                        <span className="truncate flex items-center">
                          <GlobeAltIcon className="h-4 w-4 text-ink-400 mr-1.5" />
                          {companyData.country ||
                            (loadingCountries
                              ? "Loading countries..."
                              : "Select a country")}
                        </span>
                        <span className="text-ink-400 ml-1 text-xs">
                          {loadingCountries ? (
                            <ArrowPathIcon className="h-3 w-3 animate-spin" />
                          ) : showCountryDropdown ? (
                            "▲"
                          ) : (
                            "▼"
                          )}
                        </span>
                      </div>
                      {fieldErrors.country && (
                        <span className="text-red-600 text-xs mt-0.5 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-0.5" />
                          {fieldErrors.country}
                        </span>
                      )}

                      {showCountryDropdown && !loadingCountries && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-ink-300 rounded-lg shadow-sm overflow-hidden">
                          <div className="p-2 border-b border-ink-200 bg-ink-50">
                            <div className="relative">
                              <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearch}
                                onChange={(e) =>
                                  setCountrySearch(e.target.value)
                                }
                                className="w-full pl-8 pr-3 py-1.5 border border-ink-300 rounded focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none text-sm"
                              />
                              <MagnifyingGlassIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCountries.length > 0 ? (
                              filteredCountries.map((country) => (
                                <div
                                  key={country}
                                  className={`px-3 py-2 cursor-pointer transition-colors flex items-center text-sm ${
                                    companyData.country === country
                                      ? "bg-brand-50 text-ink-950 font-medium border-l-2 border-brand-500"
                                      : "text-ink-700 hover:bg-ink-50"
                                  }`}
                                  onClick={() => handleCountrySelect(country)}
                                  role="option"
                                  aria-selected={
                                    companyData.country === country
                                  }
                                >
                                  {companyData.country === country && (
                                    <CheckCircleIcon className="h-4 w-4 text-brand-700 mr-2" />
                                  )}
                                  <span
                                    className={
                                      companyData.country === country
                                        ? "ml-0"
                                        : ""
                                    }
                                  >
                                    {country}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-ink-500 text-center text-sm">
                                No countries found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Currency Dropdown */}
                  <div className="md:col-span-1 relative" ref={currencyDropdownRef}>
                    <label className="block text-xs sm:text-sm font-medium text-ink-700 mb-1">
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Currency <span className="text-red-500 ml-0.5">*</span>
                        {loadingCurrency && (
                          <ArrowPathIcon className="h-3 w-3 ml-1 animate-spin text-brand-700" />
                        )}
                      </span>
                    </label>
                    <div className="relative">
                      <div
                        className={`w-full px-3 py-2 border rounded-lg bg-white cursor-pointer flex justify-between items-center transition-colors text-sm ${
                          showCurrencyDropdown
                            ? "border-brand-500 ring-1 ring-brand-400/40"
                            : fieldErrors.currency
                              ? "border-red-300 bg-red-50"
                              : "border-ink-300 hover:border-ink-400"
                        } ${
                          loadingCurrency
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() =>
                          !loadingCurrency && handleCurrencyDropdownToggle()
                        }
                        tabIndex={loadingCurrency ? -1 : 0}
                        role="button"
                        aria-expanded={showCurrencyDropdown}
                        aria-haspopup="listbox"
                        aria-disabled={loadingCurrency}
                      >
                        <span className="truncate flex items-center">
                          <CurrencyDollarIcon className="h-4 w-4 text-ink-400 mr-1.5" />
                          {companyData.currency ||
                            (loadingCurrency
                              ? "Loading currency..."
                              : "Select currency")}
                        </span>
                        <span className="text-ink-400 ml-1 text-xs">
                          {loadingCurrency ? (
                            <ArrowPathIcon className="h-3 w-3 animate-spin" />
                          ) : showCurrencyDropdown ? (
                            "▲"
                          ) : (
                            "▼"
                          )}
                        </span>
                      </div>
                      {fieldErrors.currency && (
                        <span className="text-red-600 text-xs mt-0.5 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-0.5" />
                          {fieldErrors.currency}
                        </span>
                      )}

                      {showCurrencyDropdown && !loadingCurrency && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-ink-300 rounded-lg shadow-sm overflow-hidden">
                          <div className="p-2 border-b border-ink-200 bg-ink-50">
                            <div className="relative">
                              <input
                                ref={currencySearchInputRef}
                                type="text"
                                placeholder="Search currencies..."
                                value={currencySearch}
                                onChange={(e) =>
                                  setCurrencySearch(e.target.value)
                                }
                                className="w-full pl-8 pr-3 py-1.5 border border-ink-300 rounded focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none text-sm"
                              />
                              <MagnifyingGlassIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                            </div>
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredCurrencies.length > 0 ? (
                              filteredCurrencies.map((currency) => (
                                <div
                                  key={currency}
                                  className={`px-3 py-2 cursor-pointer transition-colors flex items-center text-sm ${
                                    companyData.currency === currency
                                      ? "bg-brand-50 text-ink-950 font-medium border-l-2 border-brand-500"
                                      : "text-ink-700 hover:bg-ink-50"
                                  }`}
                                  onClick={() => handleCurrencySelect(currency)}
                                  role="option"
                                  aria-selected={
                                    companyData.currency === currency
                                  }
                                >
                                  {companyData.currency === currency && (
                                    <CheckCircleIcon className="h-4 w-4 text-brand-700 mr-2" />
                                  )}
                                  <span
                                    className={
                                      companyData.currency === currency
                                        ? "ml-0"
                                        : ""
                                    }
                                  >
                                    {currency}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-ink-500 text-center text-sm">
                                No currencies found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {companyData.country && !loadingCurrency && (
                      <p className="text-xs text-ink-500 mt-1">
                        Default currency for {companyData.country}. Click to select different currency.
                      </p>
                    )}
                    {loadingCurrency && (
                      <p className="text-xs text-brand-700 mt-1">
                        Fetching currency...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address Details Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2">
                    <MapPinIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">
                      Address Details
                    </h3>
                    <p className="text-ink-500 text-xs">
                      Business location information
                    </p>
                  </div>
                </div>

                {/* Address Textarea */}
                <div className="mb-4">
                  <label
                    htmlFor="address"
                    className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                  >
                    <span className="flex items-center">
                      <MapPinIcon className="h-3 w-3 mr-1 text-ink-400" />
                      Complete Address{" "}
                      <span className="text-red-500 ml-0.5">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <textarea
                      id="address"
                      name="address"
                      value={companyData.address}
                      onChange={handleChange}
                      rows="3"
                      required
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors resize-none text-sm ${
                        fieldErrors.address
                          ? "border-red-300 bg-red-50"
                          : "border-ink-300 hover:border-ink-400"
                      }`}
                      placeholder="Enter complete street address with landmark"
                    />
                    <MapPinIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-2.5" />
                  </div>
                  {fieldErrors.address && (
                    <span className="text-red-600 text-xs mt-0.5 flex items-center">
                      <XCircleIcon className="h-3 w-3 mr-0.5" />
                      {fieldErrors.address}
                    </span>
                  )}
                </div>

                {/* Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* City */}
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="city"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      City <span className="text-red-500">*</span>
                      {autoFilledFields.city && (
                        <span className="ml-1 text-xs text-green-600">
                          (Auto-filled)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={companyData.city}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                        fieldErrors.city
                          ? "border-red-300 bg-red-50"
                          : "border-ink-300 hover:border-ink-400"
                      } ${autoFilledFields.city ? 'bg-green-50' : ''}`}
                      placeholder="Enter city"
                    />
                    {fieldErrors.city && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.city}
                      </span>
                    )}
                  </div>

                  {/* State */}
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="state"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      State <span className="text-red-500">*</span>
                      {autoFilledFields.state && (
                        <span className="ml-1 text-xs text-green-600">
                          (Auto-filled)
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={companyData.state}
                      onChange={handleChange}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                        fieldErrors.state
                          ? "border-red-300 bg-red-50"
                          : "border-ink-300 hover:border-ink-400"
                      } ${autoFilledFields.state ? 'bg-green-50' : ''}`}
                      placeholder="Enter state"
                    />
                    {fieldErrors.state && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.state}
                      </span>
                    )}
                  </div>

                  {/* ZipCode/Pincode Field (Single Field) */}
                  <div className="sm:col-span-1">
                    <label
                      htmlFor="zipCode"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center justify-between">
                        {zipCodeFieldInfo.label} <span className="text-red-500"></span>
                        {detectingState && companyData.country.toLowerCase() === "india" && (
                          <span className="text-xs text-brand-700 flex items-center">
                            <ArrowPathIcon className="h-3 w-3 mr-0.5 animate-spin" />
                            Detecting...
                          </span>
                        )}
                      </span>
                      {companyData.country.toLowerCase() === "india" && (
                        <span className="text-xs text-ink-500 block mt-0.5">
                          Enter 6-digit Indian pincode for auto-fill
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={companyData.zipCode}
                      onChange={handleChange}
                      onBlur={handleZipCodeBlur}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                        fieldErrors.zipCode
                          ? "border-red-300 bg-red-50"
                          : "border-ink-300 hover:border-ink-400"
                      }`}
                      placeholder={zipCodeFieldInfo.placeholder}
                      maxLength={zipCodeFieldInfo.maxLength}
                    />
                    {fieldErrors.zipCode && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.zipCode}
                      </span>
                    )}
                    {zipCodeFieldInfo.validationText}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-2">
                    <PhoneIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">
                      Contact Information
                    </h3>
                    <p className="text-ink-500 text-xs">
                      Primary contact details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Contact Person Name */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="contactPerson"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Contact Person Name{" "}
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="contactPerson"
                        name="contactPerson"
                        value={companyData.contactPerson}
                        onChange={handleChange}
                        required
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.contactPerson
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="John Smith"
                      />
                      <UserIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.contactPerson && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.contactPerson}
                      </span>
                    )}
                  </div>

                  {/* Contact Number */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="contactNumber"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Contact Number{" "}
                        <span className="text-red-500 ml-0.5">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="contactNumber"
                        name="contactNumber"
                        value={companyData.contactNumber}
                        onChange={handleChange}
                        required
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.contactNumber
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter contact number"
                        maxLength="15"
                      />
                      <PhoneIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.contactNumber && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.contactNumber}
                      </span>
                    )}
                    {companyData.contactNumber.length >= 10 && !fieldErrors.contactNumber && (
                      <p className="text-green-600 text-xs mt-0.5 flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                        Valid contact number
                      </p>
                    )}
                  </div>

                  {/* Alternate Number */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="alternateNumber"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Alternate Number
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        id="alternateNumber"
                        name="alternateNumber"
                        value={companyData.alternateNumber}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.alternateNumber
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter alternate number"
                        maxLength="15"
                      />
                      <PhoneIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.alternateNumber && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.alternateNumber}
                      </span>
                    )}
                  </div>

                  {/* Email Address */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="email"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <EnvelopeIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Email Address
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={companyData.email}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.email
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="vendor@example.com"
                      />
                      <EnvelopeIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.email && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.email}
                      </span>
                    )}
                    {!fieldErrors.email &&
                      companyData.email.includes("@") &&
                      companyData.email.includes(".") && (
                        <p className="text-green-600 text-xs mt-0.5 flex items-center">
                          <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                          Valid email format
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Bank Account Information Section */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-2">
                    <CurrencyDollarIcon className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-ink-900">
                      Bank Account Information
                    </h3>
                    <p className="text-ink-500 text-xs">
                      Bank details and ID documents
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Vendor Aadhaar */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="vendorAadhaar"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Vendor Aadhaar
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="vendorAadhaar"
                        name="vendorAadhaar"
                        value={companyData.vendorAadhaar || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.vendorAadhaar
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter 12-digit Aadhaar"
                        maxLength="12"
                      />
                      <UserIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.vendorAadhaar && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.vendorAadhaar}
                      </span>
                    )}
                    {companyData.vendorAadhaar.length === 12 && !fieldErrors.vendorAadhaar && (
                      <p className="text-green-600 text-xs mt-0.5 flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                        Valid Aadhaar format
                      </p>
                    )}
                  </div>

                  {/* Aadhaar Document Upload */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-ink-700 mb-1">
                      <span className="flex items-center">
                        <PaperClipIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Aadhaar Document{" "}
                        {companyData.vendorAadhaar && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                        {uploadingFiles.aadhaar && (
                          <ArrowPathIcon className="h-3 w-3 ml-1 animate-spin text-brand-700" />
                        )}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        ref={aadhaarFileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                        onChange={(e) => handleFileSelect(e, "aadhaar")}
                        className="hidden"
                        id="aadhaarFile"
                      />
                      <label
                        htmlFor="aadhaarFile"
                        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-center transition-colors text-sm ${
                          fieldErrors.aadhaarFile || fileErrors.aadhaar
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400 bg-white"
                        } ${uploadingFiles.aadhaar ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <PaperClipIcon className="h-4 w-4 text-ink-400 mr-2" />
                        <span className="text-ink-600">
                          {uploadingFiles.aadhaar
                            ? "Uploading..."
                            : aadhaarFile
                              ? "Change file"
                              : "Upload Aadhaar"}
                        </span>
                      </label>
                      {(fieldErrors.aadhaarFile || fileErrors.aadhaar) && (
                        <span className="text-red-600 text-xs mt-0.5 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-0.5" />
                          {fieldErrors.aadhaarFile || fileErrors.aadhaar}
                        </span>
                      )}
                    </div>

                    {/* Selected Aadhaar File Preview */}
                    {aadhaarFile && (
                      <div className="mt-2 p-2 bg-ink-50 border border-ink-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          {getFileIcon(aadhaarFile)}
                          <div className="ml-2">
                            <p className="text-xs font-medium text-ink-700 truncate max-w-[180px]">
                              {aadhaarFile.name}
                            </p>
                            <p className="text-xs text-ink-500">
                              {formatFileSize(aadhaarFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile("aadhaar")}
                          className="text-red-500 hover:text-red-700 ml-2"
                          disabled={uploadingFiles.aadhaar}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Vendor PanCard */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="vendorPanCard"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Vendor PanCard
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="vendorPanCard"
                        name="vendorPanCard"
                        value={companyData.vendorPanCard || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.vendorPanCard
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter PAN number (e.g., ABCDE1234F)"
                        maxLength="10"
                      />
                      <DocumentTextIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.vendorPanCard && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.vendorPanCard}
                      </span>
                    )}
                    {companyData.vendorPanCard.length === 10 && !fieldErrors.vendorPanCard && (
                      <p className="text-green-600 text-xs mt-0.5 flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                        Valid PAN format
                      </p>
                    )}
                  </div>

                  {/* PAN Card Document Upload */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-ink-700 mb-1">
                      <span className="flex items-center">
                        <PaperClipIcon className="h-3 w-3 mr-1 text-ink-400" />
                        PAN Card Document{" "}
                        {companyData.vendorPanCard && (
                          <span className="text-red-500 ml-0.5">*</span>
                        )}
                        {uploadingFiles.pancard && (
                          <ArrowPathIcon className="h-3 w-3 ml-1 animate-spin text-brand-700" />
                        )}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        ref={panCardFileInputRef}
                        type="file"
                        accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                        onChange={(e) => handleFileSelect(e, "pancard")}
                        className="hidden"
                        id="panCardFile"
                      />
                      <label
                        htmlFor="panCardFile"
                        className={`w-full px-3 py-2 border rounded-lg cursor-pointer flex items-center justify-center transition-colors text-sm ${
                          fieldErrors.panCardFile || fileErrors.pancard
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400 bg-white"
                        } ${uploadingFiles.pancard ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <PaperClipIcon className="h-4 w-4 text-ink-400 mr-2" />
                        <span className="text-ink-600">
                          {uploadingFiles.pancard
                            ? "Uploading..."
                            : panCardFile
                              ? "Change file"
                              : "Upload PAN Card"}
                        </span>
                      </label>
                      {(fieldErrors.panCardFile || fileErrors.pancard) && (
                        <span className="text-red-600 text-xs mt-0.5 flex items-center">
                          <XCircleIcon className="h-3 w-3 mr-0.5" />
                          {fieldErrors.panCardFile || fileErrors.pancard}
                        </span>
                      )}
                    </div>

                    {/* Selected PAN Card File Preview */}
                    {panCardFile && (
                      <div className="mt-2 p-2 bg-ink-50 border border-ink-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center">
                          {getFileIcon(panCardFile)}
                          <div className="ml-2">
                            <p className="text-xs font-medium text-ink-700 truncate max-w-[180px]">
                              {panCardFile.name}
                            </p>
                            <p className="text-xs text-ink-500">
                              {formatFileSize(panCardFile.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile("pancard")}
                          className="text-red-500 hover:text-red-700 ml-2"
                          disabled={uploadingFiles.pancard}
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bank Name */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="bankName"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <BuildingOffice2Icon className="h-3 w-3 mr-1 text-ink-400" />
                        Bank Name
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="bankName"
                        name="bankName"
                        value={companyData.bankName || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.bankName
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter bank name"
                      />
                      <BuildingOffice2Icon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.bankName && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.bankName}
                      </span>
                    )}
                  </div>

                  {/* Account Holder Name */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="accountHolder"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <UserIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Account Holder Name
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="accountHolder"
                        name="accountHolder"
                        value={companyData.accountHolder || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.accountHolder
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter account holder name"
                      />
                      <UserIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.accountHolder && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.accountHolder}
                      </span>
                    )}
                  </div>

                  {/* Account Number */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="accountNumber"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1 text-ink-400" />
                        Account Number
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="accountNumber"
                        name="accountNumber"
                        value={companyData.accountNumber || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.accountNumber
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter account number"
                        maxLength="18"
                      />
                      <DocumentTextIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.accountNumber && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.accountNumber}
                      </span>
                    )}
                    {companyData.accountNumber.length >= 9 && !fieldErrors.accountNumber && (
                      <p className="text-green-600 text-xs mt-0.5 flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                        Valid account number format
                      </p>
                    )}
                  </div>

                  {/* IFSC Code */}
                  <div className="md:col-span-2 lg:col-span-1">
                    <label
                      htmlFor="ifscCode"
                      className="block text-xs sm:text-sm font-medium text-ink-700 mb-1"
                    >
                      <span className="flex items-center">
                        <DocumentTextIcon className="h-3 w-3 mr-1 text-ink-400" />
                        IFSC Code
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="ifscCode"
                        name="ifscCode"
                        value={companyData.ifscCode || ""}
                        onChange={handleChange}
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors text-sm ${
                          fieldErrors.ifscCode
                            ? "border-red-300 bg-red-50"
                            : "border-ink-300 hover:border-ink-400"
                        }`}
                        placeholder="Enter IFSC code (e.g., SBIN0001234)"
                        maxLength="11"
                      />
                      <DocumentTextIcon className="h-4 w-4 text-ink-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    </div>
                    {fieldErrors.ifscCode && (
                      <span className="text-red-600 text-xs mt-0.5 flex items-center">
                        <XCircleIcon className="h-3 w-3 mr-0.5" />
                        {fieldErrors.ifscCode}
                      </span>
                    )}
                    {companyData.ifscCode.length === 11 && !fieldErrors.ifscCode && (
                      <p className="text-green-600 text-xs mt-0.5 flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-0.5" />
                        Valid IFSC format
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-ink-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
                  <div className="text-xs text-ink-500 flex items-center w-full md:w-auto">
                    <InformationCircleIcon className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span>
                      {isFormValid() ? (
                        <span className="text-green-600 font-medium">
                          All required fields are filled
                        </span>
                      ) : (
                        <span>
                          Please fill all required fields marked with *
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full bg-brand-400 text-dark sm:w-auto">
                    <Button
                      type="submit"
                      title={loading ? "Adding Vendor..." : "Add Vendor"}
                      disabled={loading || !isFormValid() || loadingCountries || loadingCurrency}
                      variant="primary"
                      className="px-4 py-2 rounded-lg font-medium flex items-center justify-center text-sm"
                      onClick={null}
                    >
                      {loading && (
                        <ArrowPathIcon className="animate-spin h-4 w-4 mr-1.5" />
                      )}
                      {!loading && (
                        <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                      )}
                      <span>
                        {loadingCountries || loadingCurrency
                          ? "Loading data..."
                          : loading
                          ? "Adding..."
                          : "Add Vendor"}
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddVendor;