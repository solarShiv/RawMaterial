import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";
import {
  BuildingOffice2Icon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CurrencyDollarIcon,
  GlobeAmericasIcon,
  DocumentTextIcon,
  BanknotesIcon,
  UserCircleIcon,
  DocumentArrowUpIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import SearchableSelect from "../../components/dropdown/SearchableSelect";
import { VENDOR_AUTHORIZATION_STATUSES, AUTH_STATUS_SWATCH } from "../../utils/vendorAuthStatus";
import { compressDocument, ONE_MB } from "../../utils/compressDocument";

const VENDOR_BUY_ITEM_CATEGORIES = ["Long", "Flat"];
const VENDOR_CATEGORIES = ["Manufacture", "Trader"];


// Business documents: existing file URL from the API, and the upload field name.
const BUSINESS_DOCS = [
  { key: "bgDocument", urlField: "bg_document", formField: "bgDocumentFile", label: "BG Document/PDC/Undertaking", required: false },
  { key: "balanceSheet", urlField: "balance_sheet", formField: "balanceSheetFile", label: "Balance Sheet" },
];
const MAX_RAW_DOC_BYTES = 25 * 1024 * 1024; // accept up to 25 MB, then compress to 1 MB
const EMPTY_BUSINESS_DOCS = { bgDocument: null, balanceSheet: null };

const UpdateVendor = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [companyDetails, setCompanyDetails] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditable, setIsEditable] = useState(false);

  // Document upload states
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [pancardFile, setPancardFile] = useState(null);
  const [aadhaarFileName, setAadhaarFileName] = useState("");
  const [pancardFileName, setPancardFileName] = useState("");

  // Refs for file inputs
  const aadhaarFileRef = useRef(null);
  const pancardFileRef = useRef(null);

  // BG document / balance sheet uploads, compressed to <= 1 MB in the browser
  const [businessDocs, setBusinessDocs] = useState(EMPTY_BUSINESS_DOCS);
  const [businessDocCompressing, setBusinessDocCompressing] = useState({ bgDocument: false, balanceSheet: false });
  const businessDocJobRef = useRef({ bgDocument: 0, balanceSheet: 0 });
  const isCompressingDocs = Object.values(businessDocCompressing).some(Boolean);

  const resetBusinessDocs = () => {
    businessDocJobRef.current.bgDocument++;
    businessDocJobRef.current.balanceSheet++;
    setBusinessDocs(EMPTY_BUSINESS_DOCS);
    setBusinessDocCompressing({ bgDocument: false, balanceSheet: false });
  };

  const handleBusinessDocSelect = async (e, key, label) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;

    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validImageTypes.includes(file.type) && file.type !== "application/pdf") {
      alert(`${label}: Only JPG, PNG, GIF, WEBP images or PDF files are allowed`);
      return;
    }
    if (file.size > MAX_RAW_DOC_BYTES) {
      alert(`${label}: File is too large (max 25 MB before compression)`);
      return;
    }

    const jobId = ++businessDocJobRef.current[key];
    setBusinessDocs((prev) => ({ ...prev, [key]: null }));
    setBusinessDocCompressing((prev) => ({ ...prev, [key]: true }));
    try {
      const compressed = await compressDocument(file, ONE_MB);
      if (jobId !== businessDocJobRef.current[key]) return;
      setBusinessDocs((prev) => ({ ...prev, [key]: compressed }));
    } catch (err) {
      if (jobId !== businessDocJobRef.current[key]) return;
      alert(`${label}: ${err?.message || "Could not compress file to 1 MB. Please upload a smaller file."}`);
    } finally {
      if (jobId === businessDocJobRef.current[key]) {
        setBusinessDocCompressing((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  const removeBusinessDoc = (key) => {
    businessDocJobRef.current[key]++; // cancel any in-flight compression result
    setBusinessDocs((prev) => ({ ...prev, [key]: null }));
    setBusinessDocCompressing((prev) => ({ ...prev, [key]: false }));
  };

  const setDetailField = (name, value) =>
    setCompanyDetails((prev) => ({ ...prev, [name]: value }));

  const fieldCls = `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
    !isEditable ? "bg-ink-50 text-ink-500 border-ink-300" : "bg-white text-ink-900 border-brand-400"
  }`;

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await Api.get("/purchase/vendors");
        setCompanies(response?.data?.data || []);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleCompanyChange = async (companyId) => {
    setSelectedCompany(companyId);
    setIsEditable(false);
    setAadhaarFile(null);
    setPancardFile(null);
    setAadhaarFileName("");
    setPancardFileName("");
    resetBusinessDocs();

    if (!companyId) {
      setCompanyDetails(null);
      return;
    }

    setDetailsLoading(true);

    try {
      const response = await Api.get(`/purchase/vendors/${companyId}`);
      setCompanyDetails(response?.data?.data);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setCompanyDetails({
      ...companyDetails,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("File size should be less than 5MB");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Only PDF, JPEG, PNG files are allowed");
      return;
    }

    if (type === "aadhaar") {
      setAadhaarFile(file);
      setAadhaarFileName(file.name);
    } else if (type === "pancard") {
      setPancardFile(file);
      setPancardFileName(file.name);
    }
  };

  const removeFile = (type) => {
    if (type === "aadhaar") {
      setAadhaarFile(null);
      setAadhaarFileName("");
      if (aadhaarFileRef.current) aadhaarFileRef.current.value = "";
    } else if (type === "pancard") {
      setPancardFile(null);
      setPancardFileName("");
      if (pancardFileRef.current) pancardFileRef.current.value = "";
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedCompany || !companyDetails) {
      alert("Please select a vendor first.");
      return;
    }

    if (isCompressingDocs) {
      alert("Please wait, documents are still being compressed.");
      return;
    }

    // Compulsory business documents: an already uploaded file or a new one is needed
    const missingDoc = BUSINESS_DOCS.find(
      (d) => d.required && !companyDetails?.[d.urlField] && !businessDocs[d.key]
    );
    if (missingDoc) {
      alert(`Please upload ${missingDoc.label}. It is required.`);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("name", companyDetails.name || "");
      formData.append("gstNumber", companyDetails.gstNumber || "");
      formData.append("address", companyDetails.address || "");
      formData.append("city", companyDetails.city || "");
      formData.append("state", companyDetails.state || "");
      formData.append(
        "pincode",
        companyDetails.pincode || companyDetails.zipCode || "",
      );
      formData.append("contactNumber", companyDetails.contactNumber || "");
      formData.append("contactPerson", companyDetails.contactPerson || "");
      formData.append("email", companyDetails.email || "");
      formData.append("country", companyDetails.country || "");
      formData.append("currency", companyDetails.currency || "");
      formData.append("exchangeRate", companyDetails.exchangeRate || "");
      formData.append("alternateNumber", companyDetails.alternateNumber || "");
      formData.append("referenceBy", companyDetails.referenceBy || "");

      // Classification
      formData.append("category", companyDetails.category || "");
      formData.append("buy_item_category", companyDetails.buy_item_category || "");
      formData.append("authorization_status", companyDetails.authorization_status || "White");

      // KYC numbers
      formData.append("vendorAadhaar", companyDetails.vendorAadhaar || "");
      formData.append("vendorPanCard", companyDetails.vendorPanCard || "");

      // Bank details
      formData.append("bankName", companyDetails.bankName || "");
      formData.append("accountHolder", companyDetails.accountHolder || "");
      formData.append("accountNumber", companyDetails.accountNumber || "");
      formData.append("ifscCode", companyDetails.ifscCode || "");

      // Status (convert boolean to string if needed)
      formData.append(
        "isActive",
        companyDetails.isActive?.toString() || "true",
      );

      // Append files if they exist
      if (aadhaarFile) {
        formData.append("aadhaarFile", aadhaarFile);
      }
      if (pancardFile) {
        formData.append("pancardFile", pancardFile);
      }
      BUSINESS_DOCS.forEach(({ key, formField }) => {
        if (businessDocs[key]) formData.append(formField, businessDocs[key]);
      });

      // Log FormData contents for debugging (optional)
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      // Make the PUT request with FormData
      const response = await Api.put(
        `/purchase/vendors/${selectedCompany}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Update response:", response.data);

      // Refresh vendor details
      const updatedResponse = await Api.get(
        `/purchase/vendors/${selectedCompany}`,
      );
      setCompanyDetails(updatedResponse?.data?.data);

      // Reset file states
      setAadhaarFile(null);
      setPancardFile(null);
      setAadhaarFileName("");
      setPancardFileName("");
      resetBusinessDocs();

      // Clear file input refs
      if (aadhaarFileRef.current) aadhaarFileRef.current.value = "";
      if (pancardFileRef.current) pancardFileRef.current.value = "";

      alert("Vendor Updated Successfully!");
      setIsEditable(false);
    } catch (error) {
      console.error("Error updating vendor:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unknown error occurred";
      alert(`Error updating vendor: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Refresh original data to cancel changes
    if (selectedCompany) {
      Api.get(`/purchase/vendors/${selectedCompany}`)
        .then((response) => {
          setCompanyDetails(response?.data?.data);
        })
        .catch((error) => {
          console.error("Error fetching vendor details:", error);
        });
    }

    setIsEditable(false);
    setAadhaarFile(null);
    setPancardFile(null);
    setAadhaarFileName("");
    setPancardFileName("");
    resetBusinessDocs();

    // Clear file input refs
    if (aadhaarFileRef.current) aadhaarFileRef.current.value = "";
    if (pancardFileRef.current) pancardFileRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 text-brand-700 animate-spin mx-auto mb-4" />
          <p className="text-ink-600 text-lg">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-ink-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white shadow-card rounded-lg p-6 md:p-8">
          <div className="mb-8">
            <div className="mb-4">
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Select Vendor <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={companies.map((c) => ({
                  id: c.id,
                  name: c.displayName || c.name || "",
                }))}
                value={selectedCompany}
                onChange={handleCompanyChange}
                disabled={uploading}
                placeholder="-- Select Vendor --"
                searchPlaceholder="Search vendor…"
                wrapText
              />
            </div>
          </div>

          {detailsLoading && (
            <div className="text-center py-12">
              <ArrowPathIcon className="h-10 w-10 text-brand-700 animate-spin mx-auto mb-4" />
              <p className="text-ink-600">Loading vendor details...</p>
            </div>
          )}

          {companyDetails && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-ink-200 pb-4">
                <h2 className="text-xl font-semibold text-ink-900 flex items-center gap-2">
                  <BuildingOffice2Icon className="h-6 w-6 text-brand-700" />
                  Vendor Information
                </h2>
                <div className="flex items-center gap-3">
                  {!isEditable ? (
                    <button
                      onClick={() => setIsEditable(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-400 text-dark rounded-lg transition-colors"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                      Edit Details
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XMarkIcon className="h-5 w-5" />
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdateSubmit}
                        disabled={uploading || isCompressingDocs}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          uploading
                            ? "bg-brand-400 cursor-not-allowed"
                            : "bg-brand-400 hover:bg-brand-400"
                        } text-dark disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {uploading ? (
                          <>
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-5 w-5" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Basic Information */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={companyDetails?.name || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Reference By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="referenceBy"
                      value={companyDetails?.referenceBy || ""}
                      placeholder="NA"
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      name="gstNumber"
                      value={companyDetails?.gstNumber || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Currency
                    </label>
                    <input
                      name="currency"
                      value={companyDetails?.currency || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <CurrencyDollarIcon className="h-4 w-4" />
                      Exchange Rate
                    </label>
                    <input
                      type="text"
                      name="exchangeRate"
                      value={companyDetails?.exchangeRate || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      placeholder="Enter exchange rate"
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <GlobeAmericasIcon className="h-4 w-4" />
                      Country
                    </label>
                    <input
                      name="country"
                      value={companyDetails?.country || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Vendor Classification */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <TagIcon className="h-5 w-5" />
                  Vendor Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Vendor Category
                    </label>
                    <select
                      name="category"
                      value={companyDetails?.category || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={fieldCls}
                    >
                      <option value="">Select category</option>
                      {VENDOR_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Buy Item Category
                    </label>
                    <select
                      name="buy_item_category"
                      value={companyDetails?.buy_item_category || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={fieldCls}
                    >
                      <option value="">Select buy item category</option>
                      {VENDOR_BUY_ITEM_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Authorization Status
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Authorization status"
                      className="grid grid-cols-4 gap-1 rounded-lg border border-ink-300 bg-ink-50 p-1"
                    >
                      {VENDOR_AUTHORIZATION_STATUSES.map((s) => {
                        const active = (companyDetails?.authorization_status || "White") === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!isEditable}
                            onClick={() => setDetailField("authorization_status", s)}
                            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-1 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                              active
                                ? "bg-brand-400 text-ink-950 shadow-card ring-1 ring-brand-500"
                                : "text-ink-600 enabled:hover:bg-ink-100 enabled:hover:text-ink-950"
                            }`}
                          >
                            <span className={`h-3 w-3 shrink-0 rounded-full border ${AUTH_STATUS_SWATCH[s]}`} />
                            <span className="truncate">{s}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Vendor Status
                    </label>
                    <select
                      name="isActive"
                      value={companyDetails?.isActive === false || companyDetails?.isActive === "false" ? "false" : "true"}
                      onChange={(e) => setDetailField("isActive", e.target.value === "true")}
                      disabled={!isEditable}
                      className={fieldCls}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <MapPinIcon className="h-5 w-5" />
                  Address Details
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Complete Address
                  </label>
                  <textarea
                    name="address"
                    value={companyDetails?.address || ""}
                    onChange={handleInputChange}
                    disabled={!isEditable}
                    rows="3"
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors resize-none ${
                      !isEditable
                        ? "bg-ink-50 text-ink-500"
                        : "bg-white text-ink-900"
                    } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      City
                    </label>
                    <input
                      name="city"
                      value={companyDetails?.city || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      State
                    </label>
                    <input
                      name="state"
                      value={companyDetails?.state || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Pincode / ZIP Code
                    </label>
                    <input
                      name="pincode"
                      value={
                        companyDetails?.pincode || companyDetails?.zipCode || ""
                      }
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <PhoneIcon className="h-5 w-5" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <UserCircleIcon className="h-4 w-4" />
                      Contact Person
                    </label>
                    <input
                      name="contactPerson"
                      value={companyDetails?.contactPerson || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      Contact Number
                    </label>
                    <input
                      name="contactNumber"
                      value={companyDetails?.contactNumber || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4" />
                      Alternate Number
                    </label>
                    <input
                      name="alternateNumber"
                      value={companyDetails?.alternateNumber || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                      <EnvelopeIcon className="h-4 w-4" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={companyDetails?.email || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>
                </div>
              </div>

              {/* KYC Documents */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5" />
                  KYC Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Section */}
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Aadhaar Number
                    </label>
                    <input
                      name="vendorAadhaar"
                      value={companyDetails?.vendorAadhaar || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />

                    {companyDetails?.aadhaarUrl ? (
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={companyDetails.aadhaarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-ink-950"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Aadhaar Document
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-500 mt-2">
                        No Aadhaar document uploaded
                      </p>
                    )}

                    {isEditable && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          Upload Aadhaar Document
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={aadhaarFileRef}
                            onChange={(e) => handleFileChange(e, "aadhaar")}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id="aadhaar-upload"
                          />
                          <label
                            htmlFor="aadhaar-upload"
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-brand-50 text-ink-950 rounded-lg border border-brand-300 hover:bg-brand-100 transition-colors"
                          >
                            <DocumentArrowUpIcon className="h-5 w-5" />
                            Choose File
                          </label>
                          {aadhaarFileName && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ink-700 truncate max-w-xs">
                                {aadhaarFileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile("aadhaar")}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                          PDF, JPG, PNG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* PAN Card Section */}
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      PAN Card Number
                    </label>
                    <input
                      name="vendorPanCard"
                      value={companyDetails?.vendorPanCard || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />

                    {companyDetails?.pancardUrl ? (
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={companyDetails.pancardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-ink-950"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View PAN Card Document
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-500 mt-2">
                        No PAN Card document uploaded
                      </p>
                    )}

                    {isEditable && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          Upload PAN Card Document
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={pancardFileRef}
                            onChange={(e) => handleFileChange(e, "pancard")}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            id="pancard-upload"
                          />
                          <label
                            htmlFor="pancard-upload"
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-brand-50 text-ink-950 rounded-lg border border-brand-300 hover:bg-brand-100 transition-colors"
                          >
                            <DocumentArrowUpIcon className="h-5 w-5" />
                            Choose File
                          </label>
                          {pancardFileName && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-ink-700 truncate max-w-xs">
                                {pancardFileName}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFile("pancard")}
                                className="text-red-600 hover:text-red-800"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                          PDF, JPG, PNG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Business Documents */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  Business Documents
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {BUSINESS_DOCS.map(({ key, urlField, label, required }) => {
                    const url = companyDetails?.[urlField];
                    const newFile = businessDocs[key];
                    const compressing = businessDocCompressing[key];
                    const inputId = `${key}-upload`;
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-ink-700 mb-2">
                          {label}
                          {required && <span className="ml-0.5 text-red-500">*</span>}
                        </label>
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-brand-700 hover:text-ink-950"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View {label}
                          </a>
                        ) : (
                          <p className="text-sm text-ink-500">No {label} uploaded</p>
                        )}

                        {isEditable && (
                          <div className="mt-4">
                            <label className="block text-sm font-medium text-ink-700 mb-2">
                              {url ? `Replace ${label}` : `Upload ${label}`}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="file"
                                onChange={(e) => handleBusinessDocSelect(e, key, label)}
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                                className="hidden"
                                id={inputId}
                              />
                              <label
                                htmlFor={inputId}
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-brand-50 text-ink-950 rounded-lg border border-brand-300 hover:bg-brand-100 transition-colors"
                              >
                                <DocumentArrowUpIcon className="h-5 w-5" />
                                Choose File
                              </label>
                              {compressing && (
                                <span className="flex items-center gap-1 text-sm text-ink-600">
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                  Compressing…
                                </span>
                              )}
                              {newFile && !compressing && (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-ink-700 truncate max-w-xs">
                                    {newFile.name}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeBusinessDoc(key)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-ink-500 mt-1">
                              Image or PDF, compressed to 1 MB automatically
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bank Account Information */}
              <div className="border-b border-ink-200 pb-8">
                <h3 className="text-lg font-medium text-ink-900 mb-6 flex items-center gap-2">
                  <BanknotesIcon className="h-5 w-5" />
                  Bank Account Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Bank Name
                    </label>
                    <input
                      name="bankName"
                      value={companyDetails?.bankName || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Account Holder Name
                    </label>
                    <input
                      name="accountHolder"
                      value={companyDetails?.accountHolder || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      Account Number
                    </label>
                    <input
                      name="accountNumber"
                      value={companyDetails?.accountNumber || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      name="ifscCode"
                      value={companyDetails?.ifscCode || ""}
                      onChange={handleInputChange}
                      disabled={!isEditable}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-brand-400/40 focus:border-brand-500 outline-none transition-colors ${
                        !isEditable
                          ? "bg-ink-50 text-ink-500"
                          : "bg-white text-ink-900"
                      } ${isEditable ? "border-brand-400" : "border-ink-300"}`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Bar */}
              <div className="mt-6 p-4 bg-ink-50 rounded-lg border border-ink-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-3 w-3 rounded-full ${isEditable ? "bg-brand-500 animate-pulse" : "bg-ink-400"}`}
                    ></div>
                    <span className="text-sm font-medium">
                      {isEditable
                        ? "Editing Mode - All fields are editable"
                        : "View Mode - Click Edit to make changes"}
                    </span>
                  </div>
                  <div className="text-sm text-ink-500">
                    Last updated: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Vendor Selected Message */}
          {!companyDetails && !detailsLoading && (
            <div className="text-center py-12">
              <BuildingOffice2Icon className="h-16 w-16 text-ink-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-ink-900 mb-2">
                No Vendor Selected
              </h3>
              <p className="text-ink-600">
                Please select a vendor from the dropdown above to view and edit
                details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateVendor;
