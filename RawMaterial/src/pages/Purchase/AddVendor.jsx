import React, { useState, useEffect, useRef, useCallback } from "react";
import Api from "../../auth/Api";
import {
  Building2,
  MapPin,
  Phone,
  Landmark,
  Paperclip,
  CheckCircle2,
  Circle,
  XCircle,
  X,
  Loader2,
  Upload,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import SearchableSelect from "../../components/dropdown/SearchableSelect";
import { VENDOR_AUTHORIZATION_STATUSES, AUTH_STATUS_SWATCH } from "../../utils/vendorAuthStatus";
import { compressDocument, ONE_MB } from "../../utils/compressDocument";

const VENDOR_BUY_ITEM_CATEGORIES = ["Long", "Flat"];
const VENDOR_CATEGORIES = ["Manufacture", "Trader"];

// Business documents: compressed in the browser to <= 1 MB each before upload.
const BUSINESS_DOCS = [
  { key: "bgDocument", formField: "bgDocumentFile", label: "BG Document/PDC/Undertaking", required: false },
  { key: "balanceSheet", formField: "balanceSheetFile", label: "Balance Sheet" },
];
const MAX_RAW_DOC_BYTES = 25 * 1024 * 1024; // accept up to 25 MB, then compress to 1 MB


const formatFileSize = (bytes) => {
  if (!bytes) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const inputCls = (hasError, extra = "") => `input ${hasError ? "input-error" : ""} ${extra}`;

// Layout helpers (module scope so inputs keep focus between renders)
const SectionCard = ({ step, icon: Icon, title, subtitle, cols = "sm:grid-cols-2 lg:grid-cols-3", children }) => (
  <section className="card">
    <div className="flex items-center gap-3 border-b border-ink-200 px-4 py-3 sm:px-5 sm:py-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-sm font-bold text-brand-400">
        {step}
      </span>
      <div className="min-w-0">
        <h2 className="flex items-center gap-1.5 text-base font-semibold text-ink-950">
          <Icon className="h-4 w-4 shrink-0 text-ink-500" />
          {title}
        </h2>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
    <div className={`grid grid-cols-1 gap-4 p-4 sm:p-5 ${cols}`}>{children}</div>
  </section>
);

const Field = ({ label, htmlFor, required, error, success, hint, extra, className = "", children }) => (
  <div className={`min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className="label flex items-center justify-between gap-2">
      <span>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {extra}
    </label>
    {children}
    {error ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <XCircle className="h-3.5 w-3.5 shrink-0" />
        {error}
      </p>
    ) : success ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
        {success}
      </p>
    ) : hint ? (
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    ) : null}
  </div>
);

const FilePicker = ({ id, file, busy, busyText = "Compressing...", hasError, placeholder, onSelect, onRemove, inputRef }) => (
  <>
    <input
      ref={inputRef}
      id={id}
      type="file"
      accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
      className="hidden"
      onChange={onSelect}
      disabled={busy}
    />
    {file ? (
      <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-3 py-2">
        {file.type === "application/pdf" ? (
          <FileText className="h-5 w-5 shrink-0 text-red-500" />
        ) : (
          <ImageIcon className="h-5 w-5 shrink-0 text-brand-700" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink-900" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-ink-500">{formatFileSize(file.size)}</p>
        </div>
        <label htmlFor={id} className="btn-ghost btn-sm cursor-pointer">
          Change
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-red-600 hover:bg-red-100"
          aria-label="Remove file"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <label
        htmlFor={id}
        className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-medium transition-colors ${
          hasError
            ? "border-red-400 bg-red-50 text-red-700"
            : "border-ink-300 bg-ink-50 text-ink-700 hover:border-brand-500 hover:bg-brand-50"
        } ${busy ? "cursor-wait opacity-60" : "cursor-pointer"}`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? busyText : placeholder}
      </label>
    )}
  </>
);


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
    authorization_status: "White",
    buy_item_category: "",
    category: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
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

  const pincodeTimeoutRef = useRef(null);
  const aadhaarFileInputRef = useRef(null);
  const panCardFileInputRef = useRef(null);

  // Business documents (BG document, balance sheet) – compressed to <= 1 MB
  const [businessDocs, setBusinessDocs] = useState({ bgDocument: null, balanceSheet: null });
  const [businessDocCompressing, setBusinessDocCompressing] = useState({ bgDocument: false, balanceSheet: false });
  const [businessDocErrors, setBusinessDocErrors] = useState({ bgDocument: "", balanceSheet: "" });
  const businessDocJobRef = useRef({ bgDocument: 0, balanceSheet: 0 });
  const isCompressingDocs = Object.values(businessDocCompressing).some(Boolean);

  // Show any problem as a browser alert, and keep the red banner on the page.
  const showError = (msg, { banner = true } = {}) => {
    if (!msg) return;
    if (banner) setError(msg);
    window.alert(msg);
  };

  const setBusinessDocError = (key, msg) => {
    setBusinessDocErrors((prev) => ({ ...prev, [key]: msg }));
    const label = BUSINESS_DOCS.find((d) => d.key === key)?.label || "Document";
    showError(`${label}: ${msg}`, { banner: false });
  };

  const handleBusinessDocSelect = async (e, key) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validImageTypes.includes(file.type) && file.type !== "application/pdf") {
      setBusinessDocError(key, "Only JPG, PNG, GIF, WEBP images or PDF files are allowed");
      return;
    }
    if (file.size > MAX_RAW_DOC_BYTES) {
      setBusinessDocError(key, "File is too large (max 25 MB before compression)");
      return;
    }

    const jobId = ++businessDocJobRef.current[key];
    setBusinessDocErrors((prev) => ({ ...prev, [key]: "" }));
    setBusinessDocs((prev) => ({ ...prev, [key]: null }));
    setBusinessDocCompressing((prev) => ({ ...prev, [key]: true }));
    try {
      const compressed = await compressDocument(file, ONE_MB);
      if (jobId !== businessDocJobRef.current[key]) return;
      setBusinessDocs((prev) => ({ ...prev, [key]: compressed }));
    } catch (err) {
      if (jobId !== businessDocJobRef.current[key]) return;
      setBusinessDocError(key, err?.message || "Could not compress file to 1 MB. Please upload a smaller file.");
    } finally {
      if (jobId === businessDocJobRef.current[key]) {
        setBusinessDocCompressing((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  const handleRemoveBusinessDoc = (key) => {
    businessDocJobRef.current[key]++; // cancel any in-flight compression result
    setBusinessDocs((prev) => ({ ...prev, [key]: null }));
    setBusinessDocCompressing((prev) => ({ ...prev, [key]: false }));
    setBusinessDocErrors((prev) => ({ ...prev, [key]: "" }));
  };

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
        showError("Failed to load countries. Please refresh the page.");
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
        showError("Failed to load currencies. Please refresh the page.");
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

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
      showError(`${type === "aadhaar" ? "Aadhaar" : "PAN card"} document: ${error}`, { banner: false });
      e.target.value = "";
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

  const handleCountrySelect = (country) => {
    setCompanyData((prevState) => ({
      ...prevState,
      country: country,
      // Clear zipCode when country changes to avoid confusion
      zipCode: "",
    }));

    // Reset auto-filled fields when country changes
    setAutoFilledFields({
      city: false,
      state: false
    });
    setLastFetchedPincode("");
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
      window.alert(
        "Please fix the following:\n\n" +
          Object.values(errors).map((m) => `• ${m}`).join("\n")
      );
      return;
    }

    // Validate files only if corresponding numbers are provided
    if (companyData.vendorAadhaar && !aadhaarFile) {
      setFieldErrors(prev => ({ ...prev, aadhaarFile: "Aadhaar document is required when Aadhaar number is provided" }));
      showError("Please upload Aadhaar document");
      return;
    }

    if (companyData.vendorPanCard && !panCardFile) {
      setFieldErrors(prev => ({ ...prev, panCardFile: "PAN card document is required when PAN number is provided" }));
      showError("Please upload PAN card document");
      return;
    }

    if (isCompressingDocs) {
      showError("Please wait, documents are still being compressed");
      return;
    }

    // Compulsory business documents (those marked required)
    const missingDoc = BUSINESS_DOCS.find((d) => d.required && !businessDocs[d.key]);
    if (missingDoc) {
      setBusinessDocErrors((prev) => ({ ...prev, [missingDoc.key]: `${missingDoc.label} is required` }));
      showError(`Please upload ${missingDoc.label}`);
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

      BUSINESS_DOCS.forEach(({ key, formField }) => {
        if (businessDocs[key]) formData.append(formField, businessDocs[key]);
      });

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

          const details = Object.values(serverErrors)
            .map((v) => (typeof v === "string" ? v : v?.msg || v?.message || JSON.stringify(v)))
            .filter(Boolean);
          if (details.length) {
            setError(errorMessage);
            window.alert(`${errorMessage}:\n\n${details.map((m) => `• ${m}`).join("\n")}`);
            return;
          }
        }

        showError(errorMessage);
      } else if (err.request) {
        showError("No response from server. Please check your network connection.");
      } else {
        showError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
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
      authorization_status: "White",
      buy_item_category: "",
      category: "",
    });
    BUSINESS_DOCS.forEach(({ key }) => handleRemoveBusinessDoc(key));
    setAadhaarFile(null);
    setPanCardFile(null);
    setFieldErrors({});
    setFileErrors({ aadhaar: "", pancard: "" });
    setError("");
    setMessage("");
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

  const isIndia = companyData.country.toLowerCase() === "india";
  const zipLabel = isIndia ? "Pincode" : "Postal / Zip Code";

  // Required fields shown in the summary checklist; the submit button needs all of them.
  const requiredChecks = [
    { label: "Vendor name", done: !!companyData.name.trim() },
    { label: "Reference by", done: !!companyData.referenceBy.trim() },
    { label: "Country", done: !!companyData.country.trim() },
    { label: "Currency", done: !!companyData.currency.trim() },
    { label: "Address", done: !!companyData.address.trim() },
    { label: "City", done: !!companyData.city.trim() },
    { label: "State", done: !!companyData.state.trim() },
    { label: "Contact person", done: !!companyData.contactPerson.trim() },
    { label: "Contact number (10–15 digits)", done: /^\d{10,15}$/.test(companyData.contactNumber) },
    ...BUSINESS_DOCS.filter((d) => d.required).map((d) => ({ label: d.label, done: !!businessDocs[d.key] })),
  ];
  const doneCount = requiredChecks.filter((c) => c.done).length;
  const allRequiredDone = doneCount === requiredChecks.length;
  const submitDisabled = loading || !allRequiredDone || loadingCountries || loadingCurrency || isCompressingDocs;

  const setField = (name, value) => {
    setCompanyData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Page header */}
        <div>
          <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">Add Vendor</h1>
          <p className="text-sm text-ink-500">
            Register a new vendor. Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>

        {/* Alerts */}
        {message && (
          <div className="flex items-start gap-2 rounded-xl border border-green-300 bg-green-50 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
            <p className="flex-1 text-sm text-green-800">{message}</p>
            <button type="button" onClick={() => setMessage("")} className="text-green-700 hover:text-green-900" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <p className="flex-1 text-sm text-red-800">{error}</p>
            <button type="button" onClick={() => setError("")} className="text-red-700 hover:text-red-900" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start"
        >
          <div className="min-w-0 space-y-5">
            {/* 1. Vendor details */}
            <SectionCard step="1" icon={Building2} title="Vendor Details" subtitle="Identity and classification">
              <Field label="Vendor Name" htmlFor="name" required error={fieldErrors.name}>
                <input
                  id="name"
                  name="name"
                  value={companyData.name}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.name)}
                  placeholder="Vendor legal name"
                />
              </Field>

              <Field label="Reference By" htmlFor="referenceBy" required error={fieldErrors.referenceBy}>
                <input
                  id="referenceBy"
                  name="referenceBy"
                  value={companyData.referenceBy}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.referenceBy)}
                  placeholder="Who referred this vendor"
                />
              </Field>

              <Field
                label="GST Number"
                htmlFor="gstNumber"
                error={fieldErrors.gstNumber}
                success={companyData.gstNumber.length === 15 ? "15 characters" : ""}
              >
                <input
                  id="gstNumber"
                  name="gstNumber"
                  value={companyData.gstNumber}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.gstNumber, "uppercase")}
                  placeholder="15-character GSTIN"
                  maxLength={15}
                />
              </Field>

              <Field label="Vendor Category" htmlFor="category" error={fieldErrors.category}>
                <select
                  id="category"
                  name="category"
                  value={companyData.category}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.category)}
                >
                  <option value="">Select category</option>
                  {VENDOR_CATEGORIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Buy Item Category" htmlFor="buy_item_category" error={fieldErrors.buy_item_category}>
                <select
                  id="buy_item_category"
                  name="buy_item_category"
                  value={companyData.buy_item_category}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.buy_item_category)}
                >
                  <option value="">Select buy item category</option>
                  {VENDOR_BUY_ITEM_CATEGORIES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Authorization Status" error={fieldErrors.authorization_status}>
                <div role="radiogroup" aria-label="Authorization status" className="grid grid-cols-4 gap-1 rounded-lg border border-ink-300 bg-ink-50 p-1">
                  {VENDOR_AUTHORIZATION_STATUSES.map((s) => {
                    const active = companyData.authorization_status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setField("authorization_status", s)}
                        className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold transition ${
                          active ? "bg-brand-400 text-ink-950 shadow-card ring-1 ring-brand-500" : "text-ink-600 hover:bg-ink-100 hover:text-ink-950"
                        }`}
                      >
                        <span className={`h-3 w-3 shrink-0 rounded-full border ${AUTH_STATUS_SWATCH[s]}`} />
                        <span className="truncate">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </Field>
            </SectionCard>

            {/* 2. Address */}
            <SectionCard step="2" icon={MapPin} title="Address" subtitle="Business location and currency">
              <Field
                label="Country"
                required
                error={fieldErrors.country}
                extra={loadingCountries && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-500" />}
              >
                <SearchableSelect
                  options={countries.map((c) => ({ id: c, name: c }))}
                  value={companyData.country}
                  onChange={(c) => {
                    handleCountrySelect(c);
                    if (fieldErrors.country) setFieldErrors((prev) => ({ ...prev, country: "" }));
                  }}
                  loading={loadingCountries}
                  invalid={!!fieldErrors.country}
                  placeholder="Select country"
                  searchPlaceholder="Search country…"
                />
              </Field>

              <Field
                label="Currency"
                required
                error={fieldErrors.currency}
                hint={companyData.country && !loadingCurrency ? `Default for ${companyData.country}; change if needed` : ""}
                extra={loadingCurrency && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-500" />}
              >
                <SearchableSelect
                  options={currencies.map((c) => ({ id: c, name: c }))}
                  value={companyData.currency}
                  onChange={(c) => setField("currency", c)}
                  loading={loadingCurrency}
                  invalid={!!fieldErrors.currency}
                  placeholder="Select currency"
                  searchPlaceholder="Search currency…"
                />
              </Field>

              <Field
                label={zipLabel}
                htmlFor="zipCode"
                error={
                  fieldErrors.zipCode ||
                  (isIndia && companyData.zipCode.length > 0 && companyData.zipCode.length < 6 ? "Pincode must be 6 digits" : "")
                }
                success={isIndia && companyData.zipCode.length === 6 ? "Valid pincode" : ""}
                hint={isIndia ? "6-digit pincode auto-fills city and state" : ""}
                extra={
                  detectingState &&
                  isIndia && (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
                      <Loader2 className="h-3 w-3 animate-spin" /> Detecting…
                    </span>
                  )
                }
              >
                <input
                  id="zipCode"
                  name="zipCode"
                  value={companyData.zipCode}
                  onChange={handleChange}
                  onBlur={handleZipCodeBlur}
                  className={inputCls(fieldErrors.zipCode)}
                  placeholder={isIndia ? "6-digit pincode" : "Postal / zip code"}
                  maxLength={isIndia ? 6 : 20}
                  inputMode={isIndia ? "numeric" : "text"}
                />
              </Field>

              <Field
                label="Complete Address"
                htmlFor="address"
                required
                error={fieldErrors.address}
                className="sm:col-span-2 lg:col-span-3"
              >
                <textarea
                  id="address"
                  name="address"
                  value={companyData.address}
                  onChange={handleChange}
                  rows={2}
                  className={inputCls(fieldErrors.address, "resize-none")}
                  placeholder="Street address with landmark"
                />
              </Field>

              <Field
                label="City"
                htmlFor="city"
                required
                error={fieldErrors.city}
                extra={autoFilledFields.city && <span className="badge-green">Auto-filled</span>}
              >
                <input
                  id="city"
                  name="city"
                  value={companyData.city}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.city, autoFilledFields.city ? "bg-green-50" : "")}
                  placeholder="City"
                />
              </Field>

              <Field
                label="State"
                htmlFor="state"
                required
                error={fieldErrors.state}
                extra={autoFilledFields.state && <span className="badge-green">Auto-filled</span>}
              >
                <input
                  id="state"
                  name="state"
                  value={companyData.state}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.state, autoFilledFields.state ? "bg-green-50" : "")}
                  placeholder="State"
                />
              </Field>
            </SectionCard>

            {/* 3. Contact */}
            <SectionCard step="3" icon={Phone} title="Contact" subtitle="Primary contact details" cols="sm:grid-cols-2">
              <Field label="Contact Person" htmlFor="contactPerson" required error={fieldErrors.contactPerson}>
                <input
                  id="contactPerson"
                  name="contactPerson"
                  value={companyData.contactPerson}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.contactPerson)}
                  placeholder="Full name"
                />
              </Field>

              <Field
                label="Contact Number"
                htmlFor="contactNumber"
                required
                error={fieldErrors.contactNumber}
                success={/^\d{10,15}$/.test(companyData.contactNumber) ? "Valid contact number" : ""}
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  id="contactNumber"
                  name="contactNumber"
                  value={companyData.contactNumber}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.contactNumber)}
                  placeholder="10–15 digits"
                  maxLength={15}
                />
              </Field>

              <Field label="Alternate Number" htmlFor="alternateNumber" error={fieldErrors.alternateNumber}>
                <input
                  type="tel"
                  inputMode="numeric"
                  id="alternateNumber"
                  name="alternateNumber"
                  value={companyData.alternateNumber}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.alternateNumber)}
                  placeholder="Optional"
                  maxLength={15}
                />
              </Field>

              <Field
                label="Email"
                htmlFor="email"
                error={fieldErrors.email}
                success={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email) ? "Valid email" : ""}
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={companyData.email}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.email)}
                  placeholder="vendor@example.com"
                />
              </Field>
            </SectionCard>

            {/* 4. KYC & bank */}
            <SectionCard step="4" icon={Landmark} title="KYC & Bank" subtitle="ID documents and bank account" cols="sm:grid-cols-2">
              <Field
                label="Aadhaar Number"
                htmlFor="vendorAadhaar"
                error={fieldErrors.vendorAadhaar}
                success={companyData.vendorAadhaar.length === 12 ? "Valid Aadhaar format" : ""}
              >
                <input
                  id="vendorAadhaar"
                  name="vendorAadhaar"
                  inputMode="numeric"
                  value={companyData.vendorAadhaar}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.vendorAadhaar)}
                  placeholder="12-digit Aadhaar"
                  maxLength={12}
                />
              </Field>

              <Field
                label="Aadhaar Document"
                required={!!companyData.vendorAadhaar}
                error={fieldErrors.aadhaarFile || fileErrors.aadhaar}
                hint="Image or PDF, max 5 MB"
              >
                <FilePicker
                  id="aadhaarFile"
                  inputRef={aadhaarFileInputRef}
                  file={aadhaarFile}
                  busy={uploadingFiles.aadhaar}
                  busyText="Uploading..."
                  hasError={!!(fieldErrors.aadhaarFile || fileErrors.aadhaar)}
                  placeholder="Upload Aadhaar"
                  onSelect={(e) => handleFileSelect(e, "aadhaar")}
                  onRemove={() => handleRemoveFile("aadhaar")}
                />
              </Field>

              <Field
                label="PAN Number"
                htmlFor="vendorPanCard"
                error={fieldErrors.vendorPanCard}
                success={companyData.vendorPanCard.length === 10 ? "Valid PAN format" : ""}
              >
                <input
                  id="vendorPanCard"
                  name="vendorPanCard"
                  value={companyData.vendorPanCard}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.vendorPanCard)}
                  placeholder="e.g. ABCDE1234F"
                  maxLength={10}
                />
              </Field>

              <Field
                label="PAN Document"
                required={!!companyData.vendorPanCard}
                error={fieldErrors.panCardFile || fileErrors.pancard}
                hint="Image or PDF, max 5 MB"
              >
                <FilePicker
                  id="panCardFile"
                  inputRef={panCardFileInputRef}
                  file={panCardFile}
                  busy={uploadingFiles.pancard}
                  busyText="Uploading..."
                  hasError={!!(fieldErrors.panCardFile || fileErrors.pancard)}
                  placeholder="Upload PAN card"
                  onSelect={(e) => handleFileSelect(e, "pancard")}
                  onRemove={() => handleRemoveFile("pancard")}
                />
              </Field>

              <Field label="Bank Name" htmlFor="bankName" error={fieldErrors.bankName}>
                <input
                  id="bankName"
                  name="bankName"
                  value={companyData.bankName}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.bankName)}
                  placeholder="Bank name"
                />
              </Field>

              <Field label="Account Holder Name" htmlFor="accountHolder" error={fieldErrors.accountHolder}>
                <input
                  id="accountHolder"
                  name="accountHolder"
                  value={companyData.accountHolder}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.accountHolder)}
                  placeholder="As per bank records"
                />
              </Field>

              <Field
                label="Account Number"
                htmlFor="accountNumber"
                error={fieldErrors.accountNumber}
                success={companyData.accountNumber.length >= 9 ? "Valid account number format" : ""}
              >
                <input
                  id="accountNumber"
                  name="accountNumber"
                  inputMode="numeric"
                  value={companyData.accountNumber}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.accountNumber)}
                  placeholder="Account number"
                  maxLength={18}
                />
              </Field>

              <Field
                label="IFSC Code"
                htmlFor="ifscCode"
                error={fieldErrors.ifscCode}
                success={companyData.ifscCode.length === 11 ? "Valid IFSC format" : ""}
              >
                <input
                  id="ifscCode"
                  name="ifscCode"
                  value={companyData.ifscCode}
                  onChange={handleChange}
                  className={inputCls(fieldErrors.ifscCode)}
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                />
              </Field>
            </SectionCard>

            {/* 5. Business documents */}
            <SectionCard
              step="5"
              icon={Paperclip}
              title="Business Documents"
              subtitle="Image or PDF, compressed to 1 MB automatically"
              cols="sm:grid-cols-2"
            >
              {BUSINESS_DOCS.map(({ key, label, required }) => (
                <Field key={key} label={label} required={required} error={businessDocErrors[key]}>
                  <FilePicker
                    id={`${key}File`}
                    file={businessDocs[key]}
                    busy={businessDocCompressing[key]}
                    hasError={!!businessDocErrors[key]}
                    placeholder={`Upload ${label}`}
                    onSelect={(e) => handleBusinessDocSelect(e, key)}
                    onRemove={() => handleRemoveBusinessDoc(key)}
                  />
                </Field>
              ))}
            </SectionCard>
          </div>

          {/* Summary + actions */}
          <aside className="lg:sticky lg:top-4">
            <div className="card">
              <div className="border-b border-ink-200 px-4 py-3 sm:px-5">
                <h2 className="text-base font-semibold text-ink-950">Summary</h2>
                <p className="truncate text-xs text-ink-500" title={companyData.name}>
                  {companyData.name.trim() || "New vendor"}
                </p>
              </div>

              <div className="space-y-4 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink-600">
                    <ShieldCheck className="h-4 w-4" /> Authorization
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-ink-950">
                    <span className={`h-3 w-3 rounded-full border ${AUTH_STATUS_SWATCH[companyData.authorization_status]}`} />
                    {companyData.authorization_status}
                  </span>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-ink-600">
                    <span>Required fields</span>
                    <span className="tabular-nums">
                      {doneCount}/{requiredChecks.length}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-200">
                    <div
                      className={`h-full rounded-full transition-[width] duration-300 ${allRequiredDone ? "bg-green-500" : "bg-brand-500"}`}
                      style={{ width: `${(doneCount / requiredChecks.length) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1">
                    {requiredChecks.map((c) => (
                      <li key={c.label} className={`flex items-center gap-2 text-xs ${c.done ? "text-ink-900" : "text-ink-500"}`}>
                        {c.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 text-ink-300" />
                        )}
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-ink-200 px-4 py-4 sm:px-5">
                <button type="submit" disabled={submitDisabled} className="btn-primary w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {loadingCountries || loadingCurrency
                    ? "Loading data..."
                    : isCompressingDocs
                    ? "Compressing documents..."
                    : loading
                    ? "Adding vendor..."
                    : "Add Vendor"}
                </button>
                <button type="button" onClick={clearForm} disabled={loading} className="btn-outline w-full">
                  <RotateCcw className="h-4 w-4" />
                  Reset form
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
};

export default AddVendor;
