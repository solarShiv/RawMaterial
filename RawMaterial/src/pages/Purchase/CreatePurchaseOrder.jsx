import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";
import { useLocation } from "react-router-dom";
import { usePODraft } from "../../hooks/usePODraft";
import AddRawMaterial from "../Purchase/AddRawMaterial";
import ExcelPurchaseOrderUpload from "./ExcelPurchaseOrderUpload";
import {
  ChevronDown,
  FileSpreadsheet,
  History,
  Loader2,
  PackageSearch,
  Pencil,
  Percent,
  Plus,
  Search,
  Send,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";

// Never show NaN / Infinity in numeric inputs - show an empty field instead
const cleanNum = (v) => {
  const str = v === null || v === undefined ? "" : String(v);
  return /^(NaN|-?Infinity)$/.test(str) ? "" : str;
};

// Layout helpers (module scope so inputs keep focus between renders)
const SectionHeader = ({ step, title, subtitle, children }) => (
  <div className="flex flex-col gap-3 border-b border-ink-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-950 text-sm font-bold text-brand-400">
        {step}
      </span>
      <div>
        <h2 className="text-base font-semibold text-ink-950">{title}</h2>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Field = ({ label, required, hint, children, className = "" }) => (
  <div className={className}>
    <label className="label">
      {label}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
  </div>
);

const Spinner = () => (
  <span className="ml-2 inline-flex items-center gap-1 rounded bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
    <Loader2 className="h-3 w-3 animate-spin" /> Loading...
  </span>
);

const CreatePurchaseOrder = () => {
  const location = useLocation();
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [vendorsList, setVendorsList] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedGstType, setSelectedGstType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [warranty, setWarranty] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [cellNo, setCellNo] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [exchangeRate, setExchangeRate] = useState("1.00");
  const [gstRate, setGstRate] = useState("");
  const [itemList, setItemList] = useState([]);
  const [warehouseList, setWarehouseList] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [cheapestPriceData, setCheapestPriceData] = useState({});
  const [selectedPrePo, setSelectedPrePo] = useState("");
  const [itemDetails, setItemDetails] = useState([
    {
      id: 1,
      selectedItem: "",
      hsnCode: "",
      modelNumber: "",
      selectedUnit: "",
      rate: "",
      quantity: "",
      gstRate: "",
      amount: "",
      taxableAmount: 0,
      gstAmount: 0,
      totalAmount: 0,
      itemDetail: "",
    },
  ]);

  const [otherCharges, setOtherCharges] = useState([
    {
      id: 1,
      name: "",
      amount: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [processingReorder, setProcessingReorder] = useState(false);
  const [pendingReorderItems, setPendingReorderItems] = useState([]);
  const [isItemListLoaded, setIsItemListLoaded] = useState(false);
  const [skipCalculation, setSkipCalculation] = useState({});
  const [showOtherCharges, setShowOtherCharges] = useState(false);
  const [loadingItems, setLoadingItems] = useState({});
  const [editableHsn, setEditableHsn] = useState({});
  const [unitTypes, setUnitTypes] = useState([]);
  const [openItemDropdown, setOpenItemDropdown] = useState(null);
  const [searchQuery, setSearchQuery] = useState({});
  const [draftRestoredAt, setDraftRestoredAt] = useState(null);
  const { saveDraft, loadDraft, clearDraft } = usePODraft();
  const dropdownRefs = useRef({});

  // Excel Upload States
  const [showExcelUpload, setShowExcelUpload] = useState(false);

  // Add Item Modal States
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemRowId, setAddItemRowId] = useState(null);
  const [addItemDefaultName, setAddItemDefaultName] = useState("");

  const currencyOptions = [
    { value: "INR", label: "INR" },
    { value: "USD", label: "USD" },
    { value: "CNY", label: "CNY" },
    { value: "EUR", label: "EUR" },
    { value: "GBP", label: "GBP" },
    { value: "AED", label: "AED" },
  ];

  const gstTypes = [
    { value: "IGST_5", label: "IGST 5%" },
    { value: "IGST_12", label: "IGST 12%" },
    { value: "IGST_18", label: "IGST 18%" },
    { value: "IGST_28", label: "IGST 28%" },
    { value: "IGST_EXEMPTED", label: "IGST Exempted" },
    { value: "LGST_5", label: "LGST 5%" },
    { value: "LGST_12", label: "LGST 12%" },
    { value: "LGST_18", label: "LGST 18%" },
    { value: "LGST_28", label: "LGST 28%" },
    { value: "LGST_EXEMPTED", label: "LGST Exempted" },
    { value: "IGST_ITEMWISE", label: "IGST Itemwise" },
    { value: "LGST_ITEMWISE", label: "LGST Itemwise" },
  ];

  const isItemWiseGST =
    selectedGstType === "IGST_ITEMWISE" || selectedGstType === "LGST_ITEMWISE";

  // Get currency symbol
  const getCurrencySymbol = (curr) => {
    const currency = currencyOptions.find((c) => c.value === curr);
    return currency ? currency.label.match(/\((.*?)\)/)?.[1] || "" : "₹";
  };

  const getFixedGSTRate = () => {
    if (!selectedGstType) return 0;
    if (selectedGstType.includes("EXEMPTED")) return 0;
    const rateMatch = selectedGstType.match(/(\d+)/);
    return rateMatch ? parseFloat(rateMatch[1]) : 0;
  };

  // Helper: treat "" / null / undefined / whitespace as empty, but allow 0
  const isEmptyValue = (v) =>
    v === "" || v === null || v === undefined || String(v).trim() === "";

  // Helper: safely convert any value to a string (never throws)
  const toStr = (v) => (v === null || v === undefined ? "" : String(v));

  // Fetch cheapest price
  const fetchCheapestPrice = async (itemName) => {
    if (!itemName) return null;
    try {
      const response = await Api.get(`/common/item/price/cheapest?item=${encodeURIComponent(itemName)}`);
      if (response.data.success && response.data.data) {
        const priceData = response.data.data;
        setCheapestPriceData((prev) => ({
          ...prev,
          [itemName]: priceData,
        }));
        return priceData;
      }
    } catch (error) {
      console.error("Error fetching cheapest price:", error);
      return null;
    }
  };

  // Fetch units
  const fetchUnits = async () => {
    try {
      const response = await Api.get("/common/unit/view");
      if (response.data.success) {
        const formattedUnits = response.data.data.map((unit) => ({
          value: unit.name,
          label: unit.name,
          id: unit.id,
        }));
        setUnitTypes(formattedUnits);
      }
    } catch (error) {
      console.error("Error fetching units:", error);
    }
  };

  // Add custom units from API responses
  useEffect(() => {
    const customUnits = itemDetails
      .map((item) => item.selectedUnit)
      .filter(
        (unit) =>
          unit && unit.trim() && !unitTypes.some((u) => u.value === unit),
      )
      .filter((value, index, self) => self.indexOf(value) === index);

    if (customUnits.length > 0) {
      const newUnitTypes = [...unitTypes];
      let addedUnits = false;

      customUnits.forEach((unit) => {
        if (!newUnitTypes.some((u) => u.value === unit)) {
          newUnitTypes.push({ value: unit, label: unit });
          addedUnits = true;
        }
      });

      if (addedUnits) {
        setUnitTypes(newUnitTypes);
      }
    }
  }, [itemDetails, unitTypes]);

  const checkUnitStatus = (item) => {
    if (item.selectedItem && !item.selectedUnit) {
      console.log(`Warning: Item ${item.selectedItem} has no unit set.`);
    }
  };

  useEffect(() => {
    itemDetails.forEach((item) => {
      if (item.selectedItem) {
        checkUnitStatus(item);
      }
    });
  }, [itemDetails]);

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const res = await Api.get(`/purchase/warehouses`);
      const formatted = res?.data?.data?.map((w) => ({
        label: w.warehouseName,
        value: w._id,
      }));
      setWarehouseList(formatted);
    } catch (err) {
      alert("Error loading warehouses: ", err?.response?.data?.message);
    }
  };

  // Fetch companies
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/companies");
      setCompanies(response?.data?.data || []);
    } catch (error) {
      alert("Error: " + (error?.response?.data?.message || error?.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/vendors");
      setVendorsList(response?.data?.data || []);
    } catch (error) {
      alert("Error: " + (error?.response?.data?.message || error?.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch item list
  const fetchItemList = async () => {
    setLoading(true);
    try {
      const response = await Api.get("/purchase/items");
      setItemList(response?.data?.items || []);
      setIsItemListLoaded(true);
    } catch (error) {
      alert("Error: " + (error?.response?.data?.message || error?.message));
    } finally {
      setLoading(false);
    }
  };

  // Process reorder data
  useEffect(() => {
    if (location.state?.reorderData) {
      const reorderData = location.state.reorderData;
      console.log("From Pre Po: ", reorderData);
      const fromPrePo = reorderData.fromPrePo || false;

      setSelectedVendor(reorderData.vendorId || "");
      setSelectedPrePo(reorderData.prePoId || "");
      setSelectedGstType(reorderData.gstType || "");
      setCurrency(reorderData.currency || "INR");
      setExchangeRate(reorderData.exchangeRate || "1.00");
      setPaymentTerms(reorderData.paymentTerms || "");
      setDeliveryTerms(reorderData.deliveryTerms || "");
      setWarranty(reorderData.warranty || "");
      setSelectedWarehouse(reorderData.warehouseId || "");

      if (!fromPrePo) {
        setContactPerson(reorderData.contactPerson || "");
        setCellNo(reorderData.cellNo || "");
      } else {
        setContactPerson("");
        setCellNo("");
      }

      if (reorderData.items && reorderData.items.length > 0) {
        setPendingReorderItems(reorderData.items);
      }

      if (reorderData.otherCharges && reorderData.otherCharges.length > 0) {
        const mappedCharges = reorderData.otherCharges.map((charge, index) => ({
          id: index + 1,
          name: charge.name || "",
          amount: charge.amount || "",
        }));
        setOtherCharges(mappedCharges);
        setShowOtherCharges(true);
      }
    }
  }, [location.state]);

  // Process reorder items when itemList is loaded
  useEffect(() => {
    if (pendingReorderItems.length > 0 && isItemListLoaded) {
      setProcessingReorder(true);

      const mappedItems = pendingReorderItems.map((item, index) => {
        let foundItem = null;

        if (item.itemId || item.id) {
          foundItem = itemList.find(
            (i) => String(i.id) === String(item.itemId || item.id),
          );
        }

        if (!foundItem && item.itemName) {
          foundItem = itemList.find(
            (i) =>
              i.name.toLowerCase().includes(item.itemName.toLowerCase()) ||
              (item.itemName &&
                i.name.toLowerCase() === item.itemName.toLowerCase()),
          );
        }

        const rate = parseFloat(item.rate) || 0;
        const quantity = parseFloat(item.quantity) || 1;
        const total = rate * quantity;

        let itemGstRate = 0;
        if (isItemWiseGST) {
          itemGstRate = parseFloat(item.gstRate) || 0;
        } else {
          itemGstRate = getFixedGSTRate();
        }

        const gstAmount = (total * itemGstRate) / 100;

        // Ensure hsnCode is a string
        const hsnCode =
          foundItem?.hsnCode !== undefined && foundItem?.hsnCode !== null
            ? String(foundItem.hsnCode)
            : item.hsnCode
            ? String(item.hsnCode)
            : "";

        return {
          id: index + 1,
          selectedItem: foundItem?.id || "",
          hsnCode: hsnCode,
          modelNumber: foundItem?.modelNumber || item.modelNumber || "",
          selectedUnit: foundItem?.unit || item.unit || "",
          rate: rate.toString(),
          quantity: quantity.toString(),
          gstRate: itemGstRate.toString(),
          amount: total.toString(),
          taxableAmount: total,
          gstAmount: gstAmount,
          totalAmount: total + gstAmount,
          itemDetail: foundItem?.itemDetail || item.itemDetail || "",
        };
      });

      setItemDetails(mappedItems);
      setPendingReorderItems([]);

      setTimeout(() => {
        setProcessingReorder(false);
        console.log("Reorder items processed:", mappedItems);
      }, 500);
    }
  }, [isItemListLoaded, pendingReorderItems, selectedGstType, itemList]);

  // Reset exchange rate when currency changes
  useEffect(() => {
    if (currency === "INR") {
      setExchangeRate("1.00");
    } else {
      setExchangeRate("");
    }
  }, [currency]);

  // Guard against undefined selectedGstType
  useEffect(() => {
    if (selectedGstType) {
      setItemDetails(
        itemDetails.map((item) => {
          const calculatedAmounts = calculateItemAmounts(item);
          return {
            ...item,
            taxableAmount: calculatedAmounts.taxableAmount,
            gstAmount: calculatedAmounts.gstAmount,
            totalAmount: calculatedAmounts.totalAmount,
            gstRate: calculatedAmounts.gstRate,
          };
        }),
      );
    }
  }, [selectedGstType]);

  // Add item detail
  const addItemDetail = () => {
    const newId = itemDetails.length + 1;
    setItemDetails([
      ...itemDetails,
      {
        id: newId,
        selectedItem: "",
        hsnCode: "",
        modelNumber: "",
        selectedUnit: "",
        rate: "",
        quantity: "",
        gstRate: "",
        amount: "",
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        itemDetail: "",
      },
    ]);
  };

  // Remove item detail
  const removeItemDetail = (id) => {
    if (itemDetails.length > 1) {
      setItemDetails(itemDetails.filter((item) => item.id !== id));
      setLoadingItems((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      setEditableHsn((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }
  };

  // Add other charge
  const addOtherCharge = () => {
    const newId = otherCharges.length + 1;
    setOtherCharges([
      ...otherCharges,
      {
        id: newId,
        name: "",
        amount: "",
      },
    ]);
  };

  // Remove other charge
  const removeOtherCharge = (id) => {
    if (otherCharges.length > 1) {
      setOtherCharges(otherCharges.filter((charge) => charge.id !== id));
    } else {
      setOtherCharges([{ id: 1, name: "", amount: "" }]);
      setShowOtherCharges(false);
    }
  };

  // Update other charge
  const updateOtherCharge = (id, field, value) => {
    setOtherCharges(
      otherCharges.map((charge) => {
        if (charge.id === id) {
          return { ...charge, [field]: value };
        }
        return charge;
      }),
    );
  };

  // Calculate missing value
  const calculateMissingValue = (rate, quantity, amount) => {
    const r = rate === "" ? 0 : parseFloat(rate) || 0;
    const q = quantity === "" ? 0 : parseFloat(quantity) || 0;
    const a = amount === "" ? 0 : parseFloat(amount) || 0;

    // Allow 0 as a valid rate/amount value
    const rateValid = rate !== "" && !isNaN(r) && r >= 0;
    const quantityValid = quantity !== "" && !isNaN(q) && q > 0;
    const amountValid = amount !== "" && !isNaN(a) && a >= 0;

    const validCount = [rateValid, quantityValid, amountValid].filter(
      Boolean,
    ).length;

    if (validCount === 2) {
      if (rateValid && quantityValid && !amountValid) {
        return { amount: r * q, rate: r, quantity: q };
      } else if (rateValid && amountValid && !quantityValid) {
        return { amount: a, rate: r, quantity: r > 0 ? a / r : q };
      } else if (quantityValid && amountValid && !rateValid) {
        return { amount: a, rate: q > 0 ? a / q : r, quantity: q };
      }
    }

    if (validCount === 3) {
      return { amount: r * q, rate: r, quantity: q };
    }

    return { amount: a, rate: r, quantity: q };
  };

  // Calculate item amounts
  const calculateItemAmounts = (item) => {
    const rate = item.rate || 0;
    const quantity = item.quantity || 0;
    const amount = item.amount || 0;

    const calculated = calculateMissingValue(rate, quantity, amount);
    const total = calculated.amount;

    let gstRate = 0;

    if (isItemWiseGST) {
      gstRate = parseFloat(item.gstRate) || 0;
    } else {
      gstRate = getFixedGSTRate();
    }

    const taxableAmount = total;
    const gstAmount = (taxableAmount * gstRate) / 100;
    const finalTotalAmount = taxableAmount + gstAmount;

    return {
      amount: total,
      rate: calculated.rate,
      quantity: calculated.quantity,
      taxableAmount,
      gstAmount,
      totalAmount: finalTotalAmount,
      gstRate: gstRate.toString(),
    };
  };

  // Handle item select
  const handleItemSelect = async (id, itemId) => {
    console.log(`Item changed: ${itemId} for item ${id}`);

    if (!itemId) {
      setItemDetails(
        itemDetails.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              selectedItem: "",
              hsnCode: "",
              modelNumber: "",
              selectedUnit: "",
              rate: "",
              itemDetail: "",
            };
          }
          return item;
        }),
      );

      setEditableHsn((prev) => ({ ...prev, [id]: false }));
      setLoadingItems((prev) => ({ ...prev, [id]: false }));

      const selectedItemData = itemList.find((item) => item.id === itemId);
      if (selectedItemData) {
        setCheapestPriceData((prev) => {
          const updated = { ...prev };
          delete updated[selectedItemData.name];
          return updated;
        });
      }

      return;
    }

    const selectedItemData = itemList.find((item) => item.id === itemId);
    if (selectedItemData) {
      setLoadingItems((prev) => ({ ...prev, [id]: true }));

      try {
        await fetchCheapestPrice(selectedItemData.name);

        // Ensure hsnCode is a string
        const hsnCode =
          selectedItemData.hsnCode !== undefined && selectedItemData.hsnCode !== null
            ? String(selectedItemData.hsnCode)
            : "";
        const hasHsnCode = hsnCode.trim() !== "";

        // Preserve rate 0 from item master
        let initialRate =
          selectedItemData.rate !== undefined && selectedItemData.rate !== null
            ? String(selectedItemData.rate)
            : "";

        let updatedItemDetails = itemDetails.map((item) => {
          if (item.id === id) {
            const updatedItem = {
              ...item,
              selectedItem: itemId,
              hsnCode: hasHsnCode ? hsnCode : "",
              modelNumber: selectedItemData.modelNumber || "",
              selectedUnit: "",
              rate: initialRate,
              itemDetail: selectedItemData.itemDetail || "",
            };

            const calculatedAmounts = calculateItemAmounts(updatedItem);
            return {
              ...updatedItem,
              rate: toStr(calculatedAmounts.rate),
              quantity: toStr(calculatedAmounts.quantity),
              amount: toStr(calculatedAmounts.amount),
              taxableAmount: calculatedAmounts.taxableAmount,
              gstAmount: calculatedAmounts.gstAmount,
              totalAmount: calculatedAmounts.totalAmount,
            };
          }
          return item;
        });

        setItemDetails(updatedItemDetails);

        setEditableHsn((prev) => ({
          ...prev,
          [id]: !hasHsnCode,
        }));

        try {
          const response = await Api.get(`/purchase/items/details/${itemId}`);

          if (response.data.success) {
            const detailedItem = response.data.item;
            const apiHsn =
              detailedItem.hsnCode !== undefined && detailedItem.hsnCode !== null
                ? String(detailedItem.hsnCode)
                : "";
            const apiHasHsnCode = apiHsn.trim() !== "";

            setItemDetails((prevItemDetails) =>
              prevItemDetails.map((item) => {
                if (item.id === id) {
                  const apiUnit = detailedItem.unit;
                  let newUnit = "";

                  if (
                    apiUnit !== undefined &&
                    apiUnit !== null &&
                    apiUnit.toString().trim() !== ""
                  ) {
                    newUnit = apiUnit.toString().trim();
                  }

                  const apiDescription = detailedItem.description;
                  let newDescription = "";

                  if (
                    apiDescription !== undefined &&
                    apiDescription !== null &&
                    apiDescription.toString().trim() !== ""
                  ) {
                    newDescription = apiDescription.toString().trim();
                  }

                  let newHsnCode = item.hsnCode;
                  if (apiHasHsnCode) {
                    newHsnCode = apiHsn.trim();
                  }

                  const updatedItem = {
                    ...item,
                    selectedUnit: newUnit,
                    itemDetail: newDescription,
                    hsnCode: newHsnCode,
                  };

                  setEditableHsn((prev) => ({
                    ...prev,
                    [id]: !apiHasHsnCode,
                  }));

                  const calculatedAmounts = calculateItemAmounts(updatedItem);

                  return {
                    ...updatedItem,
                    rate: toStr(calculatedAmounts.rate),
                    quantity: toStr(calculatedAmounts.quantity),
                    amount: toStr(calculatedAmounts.amount),
                    taxableAmount: calculatedAmounts.taxableAmount,
                    gstAmount: calculatedAmounts.gstAmount,
                    totalAmount: calculatedAmounts.totalAmount,
                  };
                }
                return item;
              }),
            );
          }
        } catch (apiError) {
          console.error("Error fetching item details:", apiError);
        }
      } catch (error) {
        console.error("Error in handleItemSelect:", error);
      } finally {
        setLoadingItems((prev) => ({ ...prev, [id]: false }));
      }
    } else {
      setItemDetails(
        itemDetails.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              selectedItem: itemId,
              selectedUnit: "",
              hsnCode: "",
            };
          }
          return item;
        }),
      );

      setEditableHsn((prev) => ({ ...prev, [id]: true }));
      setLoadingItems((prev) => ({ ...prev, [id]: false }));
    }
  };

  // Toggle HSN edit mode
  const toggleHsnEditMode = (itemId) => {
    setEditableHsn((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Handle HSN code change
  const handleHsnCodeChange = (itemId, value) => {
    setItemDetails(
      itemDetails.map((item) => {
        if (item.id === itemId) {
          return { ...item, hsnCode: value };
        }
        return item;
      }),
    );
  };

  // Update item detail
  const updateItemDetail = (id, field, value) => {
    if (
      value === "" &&
      (field === "rate" || field === "quantity" || field === "amount")
    ) {
      setSkipCalculation((prev) => ({ ...prev, [id]: true }));

      setTimeout(() => {
        setSkipCalculation((prev) => ({ ...prev, [id]: false }));
      }, 100);
    }

    setItemDetails(
      itemDetails.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };

          if (
            skipCalculation[id] &&
            (field === "rate" || field === "quantity" || field === "amount")
          ) {
            return updatedItem;
          }

          if (field === "rate") {
            const newAmount = Number(value) * Number(updatedItem.quantity || 0);
            return {
              ...updatedItem,
              rate: toStr(value),
              amount: toStr(Number(newAmount.toFixed(3))),
            };
          }
          if (field === "amount") {
            const qty = Number(updatedItem.quantity);
            const newRate = qty > 0 ? Number(value) / qty : Number(updatedItem.rate) || 0;
            return {
              ...updatedItem,
              rate: toStr(Number(newRate.toFixed(3))),
              amount: toStr(value),
            };
          }
          if (field === "quantity") {
            const newAmount = Number(value) * Number(updatedItem.rate);
            return {
              ...updatedItem,
              quantity: toStr(value),
              amount: toStr(Number(newAmount.toFixed(3))),
            };
          }
          if (isItemWiseGST && field === "gstRate") {
            const calculatedAmounts = calculateItemAmounts(updatedItem);
            return {
              ...updatedItem,
              gstRate: toStr(value),
              taxableAmount: calculatedAmounts.taxableAmount,
              gstAmount: calculatedAmounts.gstAmount,
              totalAmount: calculatedAmounts.totalAmount,
            };
          }

          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Initialize search query for each item
  useEffect(() => {
    const initialSearchQueries = {};
    itemDetails.forEach((item) => {
      initialSearchQueries[item.id] = "";
    });
    setSearchQuery(initialSearchQueries);
  }, [itemDetails]);

  const getFilteredItems = (itemId) => {
    const query = searchQuery[itemId] || "";
    if (!query.trim()) return itemList;

    return itemList.filter(
      (item) =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.hsnCode &&
          String(item.hsnCode).toLowerCase().includes(query.toLowerCase())) ||
        (item.modelNumber &&
          item.modelNumber.toLowerCase().includes(query.toLowerCase())),
    );
  };

  const handleSearchChange = (itemId, value) => {
    setSearchQuery((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const toggleItemDropdown = (itemId) => {
    if (openItemDropdown === itemId) {
      setOpenItemDropdown(null);
      setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
    } else {
      setOpenItemDropdown(itemId);
      if (!searchQuery[itemId]) {
        setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
      }
    }
  };

  const handleItemSelectFromDropdown = async (itemId, selectedItemId) => {
    await handleItemSelect(itemId, selectedItemId);
    setOpenItemDropdown(null);
    setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      let isOutside = true;
      Object.values(dropdownRefs.current).forEach((ref) => {
        if (ref && ref.contains(event.target)) {
          isOutside = false;
        }
      });

      if (isOutside) {
        setOpenItemDropdown(null);
        const clearedQueries = {};
        itemDetails.forEach((item) => {
          clearedQueries[item.id] = "";
        });
        setSearchQuery(clearedQueries);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [itemDetails]);

  // Restore draft on mount (skipped in reorder / pre-po mode)
  useEffect(() => {
    if (location.state?.reorderData) return;
    const draft = loadDraft();
    if (!draft) return;

    const hasMeaningfulData =
      draft.selectedCompany ||
      draft.selectedVendor ||
      draft.selectedGstType ||
      draft.selectedWarehouse ||
      (draft.itemDetails && draft.itemDetails.some((i) => i.selectedItem));

    if (!hasMeaningfulData) return;

    if (draft.selectedCompany) setSelectedCompany(draft.selectedCompany);
    if (draft.selectedVendor) setSelectedVendor(draft.selectedVendor);
    if (draft.selectedGstType) setSelectedGstType(draft.selectedGstType);
    if (draft.currency) setCurrency(draft.currency);
    if (draft.exchangeRate) setExchangeRate(draft.exchangeRate);
    if (draft.gstRate) setGstRate(draft.gstRate);
    if (draft.selectedWarehouse) setSelectedWarehouse(draft.selectedWarehouse);
    if (draft.paymentTerms) setPaymentTerms(draft.paymentTerms);
    if (draft.deliveryTerms) setDeliveryTerms(draft.deliveryTerms);
    if (draft.warranty) setWarranty(draft.warranty);
    if (draft.contactPerson) setContactPerson(draft.contactPerson);
    if (draft.cellNo) setCellNo(draft.cellNo);
    if (draft.expectedDeliveryDate) setExpectedDeliveryDate(draft.expectedDeliveryDate);
    if (draft.itemDetails) setItemDetails(draft.itemDetails);
    if (draft.otherCharges) setOtherCharges(draft.otherCharges);
    if (draft.showOtherCharges !== undefined) setShowOtherCharges(draft.showOtherCharges);
    if (draft.selectedPrePo) setSelectedPrePo(draft.selectedPrePo);
    if (draft.editableHsn) setEditableHsn(draft.editableHsn);

    setDraftRestoredAt(draft.savedAt);
  }, []);

  // Auto-save draft whenever any form field changes
  useEffect(() => {
    if (location.state?.reorderData) return;
    saveDraft({
      selectedCompany,
      selectedVendor,
      selectedGstType,
      currency,
      exchangeRate,
      gstRate,
      selectedWarehouse,
      paymentTerms,
      deliveryTerms,
      warranty,
      contactPerson,
      cellNo,
      expectedDeliveryDate,
      itemDetails,
      otherCharges,
      showOtherCharges,
      selectedPrePo,
      editableHsn,
    });
  }, [
    selectedCompany,
    selectedVendor,
    selectedGstType,
    currency,
    exchangeRate,
    gstRate,
    selectedWarehouse,
    paymentTerms,
    deliveryTerms,
    warranty,
    contactPerson,
    cellNo,
    expectedDeliveryDate,
    itemDetails,
    otherCharges,
    showOtherCharges,
    selectedPrePo,
    editableHsn,
  ]);

  const getCheapestPriceDisplay = (itemId) => {
    const selectedItemData = itemList.find((item) => item.id === itemId);
    if (!selectedItemData) return null;

    const priceData = cheapestPriceData[selectedItemData.name];
    if (!priceData) return null;

    return (
      <div className="flex items-center gap-3 rounded-lg border border-brand-300 bg-brand-50 px-3 py-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-400 text-ink-950">
          <TrendingDown className="h-4 w-4" />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">Cheapest Price</p>
            <p className="text-sm font-medium text-ink-900 break-words">{priceData.vendor}</p>
          </div>
          <p className="text-base font-bold tabular-nums text-ink-950">
            {getCurrencySymbol(priceData.currency)} {parseFloat(priceData.rate).toFixed(3)}
            {priceData.currency !== "INR" && ` ${priceData.currency}`}
          </p>
        </div>
      </div>
    );
  };

  // Open add item modal
  const openAddItemModal = (rowId, defaultName = "") => {
    setAddItemRowId(rowId);
    setAddItemDefaultName(defaultName);
    setShowAddItemModal(true);
    setOpenItemDropdown(null);
  };

  // Handle new item created
  const handleNewItemCreated = async (createdItem) => {
    console.log("new item:", createdItem);
    setShowAddItemModal(false);

    try {
      const response = await Api.get("/purchase/items");
      const freshList = response?.data?.items || [];
      setItemList(freshList);

      let newItem = null;
      if (createdItem?.id) {
        newItem = freshList.find((i) => String(i.id) === String(createdItem.id));
      }

      if (createdItem?._id) {
        newItem = freshList.find((i) => String(i._id) === String(createdItem._id));
      }

      if (!newItem && createdItem?.name) {
        newItem = freshList.find(
          (i) => i.name.toLowerCase() === createdItem.name.toLowerCase()
        );
      }

      const rowId = addItemRowId;
      if (rowId) {
        let resolvedId;
        if (createdItem?.id) {
          resolvedId = newItem?.id ?? createdItem?.id ?? "";
        }
        if (createdItem?._id) {
          resolvedId = newItem?._id ?? createdItem?._id ?? "";
        }
        const resolvedName = createdItem?.name || newItem?.name || "";
        const resolvedHsn = toStr(createdItem?.hsnCode ?? newItem?.hsnCode ?? "");
        const resolvedModel = toStr(createdItem?.modelNumber ?? newItem?.modelNumber ?? "");
        const resolvedUnit = toStr(createdItem?.unit ?? newItem?.unit ?? "");
        const resolvedRate = toStr(createdItem?.rate ?? newItem?.rate ?? "");
        const resolvedDetail = toStr(
          createdItem?.itemDetail ??
          createdItem?.description ??
          newItem?.itemDetail ??
          ""
        );
        const resolvedGstRate = toStr(createdItem?.gstRate ?? "");

        setItemDetails((prev) =>
          prev.map((item) => {
            if (item.id !== rowId) return item;
            const merged = {
              ...item,
              selectedItem: resolvedId,
              hsnCode: resolvedHsn,
              modelNumber: resolvedModel,
              selectedUnit: resolvedUnit,
              rate: resolvedRate,
              itemDetail: resolvedDetail,
              ...(isItemWiseGST ? { gstRate: resolvedGstRate } : {}),
            };
            const calculatedAmounts = calculateItemAmounts(merged);
            return {
              ...merged,
              rate: toStr(calculatedAmounts.rate),
              quantity: toStr(calculatedAmounts.quantity),
              amount: toStr(calculatedAmounts.amount),
              taxableAmount: calculatedAmounts.taxableAmount,
              gstAmount: calculatedAmounts.gstAmount,
              totalAmount: calculatedAmounts.totalAmount,
            };
          }),
        );

        setEditableHsn((prev) => ({
          ...prev,
          [rowId]: !resolvedHsn || resolvedHsn.trim() === "",
        }));
        setLoadingItems((prev) => ({ ...prev, [rowId]: false }));

        if (resolvedName) {
          fetchCheapestPrice(resolvedName);
        }
      }
    } catch (err) {
      console.error("Error refreshing item list after add:", err);
      alert("Item was added, but refreshing its details failed. Please re-select it from the list.");
    } finally {
      setAddItemRowId(null);
      setAddItemDefaultName("");
    }
  };

  const handleAutoFillFromExcel = (data) => {
    console.log('Auto-filling from Excel:', data);

    // Fill header information
    if (data.companyId) setSelectedCompany(data.companyId);
    if (data.vendorId) setSelectedVendor(data.vendorId);
    if (data.gstType) setSelectedGstType(data.gstType);
    if (data.currency) setCurrency(data.currency);
    if (data.exchangeRate) setExchangeRate(data.exchangeRate);
    if (data.warehouseId) setSelectedWarehouse(data.warehouseId);
    if (data.expectedDeliveryDate) setExpectedDeliveryDate(data.expectedDeliveryDate);
    if (data.paymentTerms) setPaymentTerms(data.paymentTerms);
    if (data.deliveryTerms) setDeliveryTerms(data.deliveryTerms);
    if (data.warranty) setWarranty(data.warranty);
    if (data.contactPerson) setContactPerson(data.contactPerson);
    if (data.cellNo) setCellNo(data.cellNo);

    // Fill Other Charges
    if (data.otherCharges && data.otherCharges.length > 0) {
      const mappedCharges = data.otherCharges.map((charge, index) => ({
        id: index + 1,
        name: charge.name || '',
        amount: toStr(charge.amount ?? ''),
      }));
      setOtherCharges(mappedCharges);
      setShowOtherCharges(true);
    } else {
      setOtherCharges([{ id: 1, name: '', amount: '' }]);
      setShowOtherCharges(false);
    }

    // Fill items
    if (data.items && data.items.length > 0) {
      const newItemDetails = data.items.map((item, index) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = quantity * rate;

        const hsnCode = item.hsnCode ? String(item.hsnCode) : '';

        const newItem = {
          id: index + 1,
          selectedItem: item.id || '',
          hsnCode: hsnCode,
          modelNumber: item.modelNumber || '',
          selectedUnit: item.unit || '',
          rate: toStr(item.rate ?? ''),
          quantity: toStr(item.quantity ?? ''),
          gstRate: toStr(item.gstRate ?? ''),
          amount: amount.toString(),
          taxableAmount: 0,
          gstAmount: 0,
          totalAmount: 0,
          itemDetail: item.itemDetail || '',
        };

        const calculatedAmounts = calculateItemAmounts(newItem);
        newItem.taxableAmount = calculatedAmounts.taxableAmount;
        newItem.gstAmount = calculatedAmounts.gstAmount;
        newItem.totalAmount = calculatedAmounts.totalAmount;

        return newItem;
      });

      setItemDetails(newItemDetails);
    }

    alert(`✅ Successfully auto-filled ${data.items?.length || 0} item(s) and ${data.otherCharges?.length || 0} other charge(s) from Excel!`);
  };

  // Handle Excel upload success
  const handleExcelUploadSuccess = (result) => {
    console.log('Excel upload results:', result);
    setShowExcelUpload(false);

    if (result.successful > 0) {
      alert(`✅ Successfully created ${result.successful} purchase orders!`);
    }
    if (result.failed > 0) {
      alert(`⚠️ ${result.failed} orders failed. Check the error details.`);
    }

    clearDraft();
    setDraftRestoredAt(null);
    handleReset();
  };

  // Handle download
  const handleDownload = async (poId, poName) => {
    if (!poId) return;
    console.log("Downloading purchase order:", poName);

    setDownloadLoading(true);
    try {
      const response = await Api.post(
        `/purchase/purchase-orders/download/${poId}`,
        {},
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = `${poName}.pdf`;

      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      setDownloadLoading(false);
    } catch (error) {
      console.error("Error downloading purchase order:", error);
      alert(
        "Error downloading purchase order: " +
          (error?.response?.data?.message || error?.message),
      );
      setDownloadLoading(false);
    }
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedWarehouse) {
      alert("Please select a warehouse");
      return;
    }
    if (!expectedDeliveryDate) {
      alert("Please select expected delivery date");
      return;
    }
    if (!selectedVendor) {
      alert("Please select a vendor");
      return;
    }
    if (!selectedGstType) {
      alert("Please select a GST type");
      return;
    }
    if (
      currency !== "INR" &&
      (!exchangeRate || parseFloat(exchangeRate) <= 0)
    ) {
      alert("Please enter a valid exchange rate for non-INR currency");
      return;
    }
    console.log("Item List: ", itemDetails);

    // --- FIX: Safely check HSN codes, allow "0" as a valid HSN ---
    const itemsWithoutHsn = itemDetails.filter(
      (item) =>
        item.hsnCode === null ||
        item.hsnCode === undefined ||
        String(item.hsnCode).trim() === "",
    );

    if (itemsWithoutHsn.length > 0) {
      alert("Please enter HSN code for all items");
      return;
    }

    const itemsWithoutUnit = itemDetails.filter(
      (item) => !item.selectedUnit || item.selectedUnit.trim() === ""
    );

    if (itemsWithoutUnit.length > 0) {
      alert("Please select a unit for all items");
      return;
    }

    // --- FIX: Allow rate = 0 while still requiring the field to be filled ---
    const invalidItems = itemDetails.filter(
      (item) =>
        isEmptyValue(item.selectedItem) ||
        isEmptyValue(item.hsnCode) ||
        isEmptyValue(item.rate) ||
        isEmptyValue(item.quantity) ||
        isEmptyValue(item.selectedUnit)
    );

    if (invalidItems.length > 0) {
      alert("Please fill all required fields for all items (item, HSN, rate, quantity, unit)");
      return;
    }

    try {
      const purchaseOrderData = {
        companyId: selectedCompany,
        vendorId: selectedVendor,
        gstType: selectedGstType,
        currency: currency,
        exchangeRate: exchangeRate,
        paymentTerms,
        deliveryTerms,
        warranty,
        contactPerson,
        expectedDeliveryDate,
        cellNo: String(cellNo),
        warehouseId: selectedWarehouse,
        prePoId: selectedPrePo || undefined,
        items: itemDetails.map((item) => {
          const selectedItemData = itemList.find(
            (i) => i.id === item.selectedItem,
          );
          const itemData = {
            id: item.selectedItem,
            name: selectedItemData?.name || "",
            source: selectedItemData?.source || "",
            hsnCode: item.hsnCode,
            modelNumber: item.modelNumber,
            itemDetail: item.itemDetail,
            unit: item.selectedUnit,
            // ✅ FORCE QUANTITY TO STRING FORMAT
            quantity: String(item.quantity ?? ""),
            // ✅ FORCE RATE TO STRING FORMAT (matching screenshot request)
            rate: String(item.rate ?? ""),
          };

          if (isItemWiseGST) {
            // ✅ FORCE GST RATE TO STRING FORMAT
            itemData.gstRate = String(item.gstRate ?? "");
          }

          return itemData;
        }),
        otherCharges: otherCharges.map((charge) => ({
          name: charge.name,
          amount: String(charge.amount ?? ""),
        })),
      };

      console.log("🚀 SENDING PAYLOAD TO BACKEND:", JSON.stringify(purchaseOrderData, null, 2));

      const response = await Api.post(
        "/purchase/purchase-orders/create",
        purchaseOrderData,
      );

      if (response.data.success) {
        const poId = response.data.data.id;
        const poNumber = response.data.data.poNumber;

        // Clear draft after successful creation
        clearDraft();
        setDraftRestoredAt(null);

        alert("Purchase Order created successfully!");

        const shouldDownload = window.confirm(
          "Do you want to download the purchase order PDF?",
        );
        if (shouldDownload) {
          await handleDownload(poId, poNumber);
        }
        handleReset();
      } else {
        alert("Error creating purchase order: " + response.data.message);
      }
    } catch (error) {
      console.log("Error creating purchase order:", error);
      alert(
        "Error creating purchase order: " +
          (error?.response?.data?.message || error?.message),
      );
    }
  };

  // Handle reset
  const handleReset = () => {
    clearDraft();
    setDraftRestoredAt(null);
    setSelectedCompany("");
    setSelectedVendor("");
    setSelectedGstType("");
    setGstRate("");
    setCurrency("INR");
    setExchangeRate("1.00");
    setSelectedWarehouse("");
    setPaymentTerms("");
    setDeliveryTerms("");
    setWarranty("");
    setContactPerson("");
    setCellNo("");
    setSelectedPrePo("");
    setItemDetails([
      {
        id: 1,
        selectedItem: "",
        hsnCode: "",
        modelNumber: "",
        selectedUnit: "",
        rate: "",
        quantity: "",
        gstRate: "",
        amount: "",
        taxableAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        itemDetail: "",
      },
    ]);
    setOtherCharges([
      {
        id: 1,
        name: "",
        amount: "",
      },
    ]);
    setPendingReorderItems([]);
    setSkipCalculation({});
    setShowOtherCharges(false);
    setLoadingItems({});
    setEditableHsn({});
    setOpenItemDropdown(null);
    setSearchQuery({});
    setCheapestPriceData({});
    setShowAddItemModal(false);
    setAddItemRowId(null);
    setAddItemDefaultName("");
  };

  // Fetch data on mount
  useEffect(() => {
    fetchCompanies();
    fetchVendors();
    fetchItemList();
    fetchWarehouses();
    fetchUnits();
  }, []);

  const fromPrePo = location.state?.reorderData?.fromPrePo || false;

  const sym = getCurrencySymbol(currency);
  const money = (n) =>
    `${sym} ${Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const submitDisabled =
    !selectedCompany ||
    !selectedVendor ||
    !selectedGstType ||
    (currency !== "INR" && (!exchangeRate || parseFloat(exchangeRate) <= 0));

  const submitLabel = fromPrePo
    ? "Create PO from Pre-PO"
    : location.state?.reorderData
    ? "Create ReOrder"
    : "Create Purchase Order";

  const numericChange = (id, field) => (e) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) updateItemDetail(id, field, value);
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        {(processingReorder || downloadLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-5 shadow-pop">
              <Loader2 className="h-6 w-6 animate-spin text-ink-900" />
              <p className="font-medium text-ink-800">
                {processingReorder && "Loading reorder data..."}
                {downloadLoading && "Downloading Purchase Order..."}
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button onClick={() => setShowExcelUpload(true)} className="btn-outline shrink-0">
            <FileSpreadsheet className="h-4 w-4" />
            Upload Excel
          </button>
        </div>

        {/* Draft Restored Banner */}
        {draftRestoredAt && (
          <div className="flex flex-col gap-3 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 shrink-0 text-brand-700" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Draft restored</p>
                <p className="text-xs text-ink-600">
                  Your unsaved progress from {new Date(draftRestoredAt).toLocaleString()} has been restored.
                </p>
              </div>
            </div>
            <button type="button" onClick={handleReset} className="btn-outline py-1.5 text-xs">
              Discard Draft
            </button>
          </div>
        )}

        <div>
          <div className="min-w-0 space-y-5">
            {/* 1. Basic Information */}
            <section className="card">
              <SectionHeader step="1" title="Basic Information" subtitle="Company, vendor, tax and delivery terms">
                {loading && <Spinner />}
              </SectionHeader>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Company" required>
                  <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="input">
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Vendor" required>
                  <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="input">
                    <option value="">Select vendor</option>
                    {vendorsList.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.displayName}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="GST Type" required>
                  <select value={selectedGstType} onChange={(e) => setSelectedGstType(e.target.value)} className="input">
                    <option value="">Select GST type</option>
                    {gstTypes.map((gst) => (
                      <option key={gst.value} value={gst.value}>
                        {gst.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Currency" required>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input">
                    {currencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label={`Exchange Rate${currency !== "INR" ? ` (1 ${currency} = ? INR)` : ""}`}
                  hint={currency === "INR" ? "INR is the base currency" : undefined}
                >
                  <input
                    type="text"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    className="input"
                    placeholder={currency === "INR" ? "1.00 (Fixed)" : "Enter exchange rate"}
                    disabled={currency === "INR"}
                  />
                </Field>

                <Field label="Warehouse" required>
                  <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="input">
                    <option value="">Select warehouse</option>
                    {warehouseList.map((warehouse) => (
                      <option key={warehouse.value} value={warehouse.value}>
                        {warehouse.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Expected Delivery Date" required>
                  <input
                    type="date"
                    value={expectedDeliveryDate}
                    onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                    className="input"
                  />
                </Field>

                <Field label="Payment Terms">
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="input"
                    placeholder="e.g., 60 Days Credit"
                  />
                </Field>

                <Field label="Delivery Terms">
                  <input
                    type="text"
                    value={deliveryTerms}
                    onChange={(e) => setDeliveryTerms(e.target.value)}
                    className="input"
                    placeholder="e.g., Immediate"
                  />
                </Field>

                <Field label="Warranty">
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    className="input"
                    placeholder="Enter warranty details"
                  />
                </Field>

                <Field label="Contact Person">
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="input"
                    placeholder="Contact person name"
                  />
                </Field>

                <Field label="Contact Number">
                  <input
                    type="text"
                    value={cellNo}
                    onChange={(e) => setCellNo(e.target.value)}
                    className="input"
                    placeholder="Contact number"
                  />
                </Field>
              </div>
            </section>

            {/* 2. Items */}
            <section className="card">
              <SectionHeader
                step="2"
                title={`Items (${itemDetails.length})`}
                subtitle={`All amounts in ${currency} (${sym})${
                  currency !== "INR" && exchangeRate
                    ? ` · 1 ${currency} = ${parseFloat(exchangeRate).toFixed(3)} INR`
                    : ""
                }`}
              >
                {selectedGstType && (
                  <span className="badge-gray self-start sm:self-auto">
                    <Percent className="h-3 w-3" />
                    {gstTypes.find((gst) => gst.value === selectedGstType)?.label}
                    {isItemWiseGST ? " · enter rate per item" : ` · ${getFixedGSTRate()}%`}
                  </span>
                )}
              </SectionHeader>

              <div className="space-y-4 p-5">
                {itemDetails.map((item, index) => {
                  const selected = item.selectedItem ? itemList.find((i) => i.id === item.selectedItem) : null;
                  return (
                    <div key={item.id} className="rounded-xl border border-ink-200">
                      {/* Item header */}
                      <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-ink-200 bg-ink-50 px-4 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-400 text-xs font-bold text-ink-950">
                            {index + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-ink-900">
                            {selected ? selected.name : "New item"}
                          </span>
                          {Number(item.amount) > 0 && (
                            <span className="hidden sm:inline text-xs font-semibold text-ink-500 tabular-nums">
                              · {money(item.amount)}
                            </span>
                          )}
                        </div>
                        {itemDetails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemDetail(item.id)}
                            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                            title="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-6">
                        {/* Item picker */}
                        <div className="relative sm:col-span-2 lg:col-span-4" ref={(el) => (dropdownRefs.current[item.id] = el)}>
                          <label className="label">
                            Item<span className="ml-0.5 text-red-500">*</span>
                            {loadingItems[item.id] && <Spinner />}
                          </label>
                          <button
                            type="button"
                            onClick={() => toggleItemDropdown(item.id)}
                            disabled={loadingItems[item.id]}
                            className="input flex items-center justify-between text-left"
                          >
                            <span className={`truncate ${selected ? "text-ink-900" : "text-ink-400"}`}>
                              {selected ? selected.name : "Search and choose an item"}
                            </span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${
                                openItemDropdown === item.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {openItemDropdown === item.id && (
                            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-ink-200 bg-white shadow-pop animate-slideDown">
                              <div className="space-y-2 border-b border-ink-100 p-2">
                                <div className="relative">
                                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                                  <input
                                    type="text"
                                    value={searchQuery[item.id] || ""}
                                    onChange={(e) => handleSearchChange(item.id, e.target.value)}
                                    placeholder="Search by name, HSN, or model..."
                                    className="input pl-9"
                                    autoFocus
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openAddItemModal(item.id, searchQuery[item.id] || "")}
                                  className="btn w-full border border-dashed border-ink-300 bg-ink-50 py-1.5 text-xs text-ink-800 hover:bg-brand-50"
                                >
                                  <Plus className="h-3.5 w-3.5" /> Add New Item
                                </button>
                              </div>

                              <div className="max-h-72 overflow-y-auto">
                                {getFilteredItems(item.id).length > 0 ? (
                                  getFilteredItems(item.id).map((itemOption) => (
                                    <button
                                      key={itemOption.id}
                                      type="button"
                                      onClick={() => handleItemSelectFromDropdown(item.id, itemOption.id)}
                                      className={`w-full border-b border-ink-100 px-3 py-2.5 text-left last:border-b-0 hover:bg-brand-50 focus:bg-brand-50 focus:outline-none ${
                                        item.selectedItem === itemOption.id ? "bg-brand-50" : ""
                                      }`}
                                    >
                                      <div className="flex items-start justify-between gap-2">
                                        <span className="text-sm font-medium text-ink-900 break-words">{itemOption.name}</span>
                                        <span className="shrink-0 text-[11px] text-ink-500">
                                          {itemOption.source === "mongo" ? "Installation" : "Raw Material"}
                                        </span>
                                      </div>
                                      <div className="mt-1 flex flex-wrap gap-1.5">
                                        {itemOption.hsnCode && <span className="badge-gray">HSN {String(itemOption.hsnCode)}</span>}
                                        {itemOption.modelNumber && <span className="badge-gray">Model {itemOption.modelNumber}</span>}
                                        {itemOption.rate && (
                                          <span className="badge-yellow">
                                            {sym}
                                            {parseFloat(itemOption.rate).toFixed(3)}
                                          </span>
                                        )}
                                      </div>
                                      {itemOption.itemDetail && (
                                        <div className="mt-1 truncate text-xs text-ink-500">{itemOption.itemDetail}</div>
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="px-4 py-8 text-center">
                                    <PackageSearch className="mx-auto mb-2 h-8 w-8 text-ink-300" />
                                    <p className="text-sm text-ink-500">No items found for "{searchQuery[item.id]}"</p>
                                    <button
                                      type="button"
                                      onClick={() => openAddItemModal(item.id, searchQuery[item.id] || "")}
                                      className="btn-primary mt-3 py-1.5 text-xs"
                                    >
                                      <Plus className="h-3.5 w-3.5" /> Add "{searchQuery[item.id] || "New Item"}"
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="lg:col-span-2">
                          <label className="label">
                            Unit
                            {loadingItems[item.id] && <Spinner />}
                          </label>
                          <select
                            value={item.selectedUnit}
                            onChange={(e) => updateItemDetail(item.id, "selectedUnit", e.target.value)}
                            disabled={loadingItems[item.id]}
                            className={`input ${item.selectedItem && !item.selectedUnit ? "border-brand-500 ring-2 ring-brand-400/30" : ""}`}
                          >
                            <option value="">Choose unit</option>
                            {unitTypes.length === 0 ? (
                              <option value="" disabled>
                                Loading units...
                              </option>
                            ) : (
                              unitTypes.map((u) => (
                                <option key={u.value} value={u.value}>
                                  {u.label}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* HSN */}
                        <div className="lg:col-span-3">
                          <label className="label">
                            HSN Code<span className="ml-0.5 text-red-500">*</span>
                          </label>
                          {!editableHsn[item.id] && String(item?.hsnCode ?? "").trim() !== "" ? (
                            <div className="flex h-[38px] items-center justify-between rounded-lg border border-ink-200 bg-ink-50 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-ink-900">{String(item.hsnCode)}</span>
                                <span className="badge-gray">From Item</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleHsnEditMode(item.id)}
                                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-200"
                              >
                                <Pencil className="h-3 w-3" /> Edit
                              </button>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={item.hsnCode}
                              onChange={(e) => handleHsnCodeChange(item.id, e.target.value)}
                              className={`input ${!String(item.hsnCode).trim() ? "border-brand-500 ring-2 ring-brand-400/30" : ""}`}
                              placeholder="Enter HSN code"
                              required
                            />
                          )}
                        </div>

                        <Field label="Model Number" className="lg:col-span-3">
                          <input
                            type="text"
                            value={item.modelNumber}
                            onChange={(e) => updateItemDetail(item.id, "modelNumber", e.target.value)}
                            className="input"
                            placeholder="Enter model number"
                          />
                        </Field>

                        {item.selectedItem && getCheapestPriceDisplay(item.selectedItem) && (
                          <div className="sm:col-span-2 lg:col-span-6">{getCheapestPriceDisplay(item.selectedItem)}</div>
                        )}

                        {/* Qty / Rate / Amount */}
                        <Field label="Quantity" required className="lg:col-span-2">
                          <input
                            type="text"
                            value={cleanNum(item.quantity)}
                            onChange={numericChange(item.id, "quantity")}
                            className="input text-right tabular-nums"
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </Field>
                        <Field label="Rate" required className="lg:col-span-2">
                          <input
                            type="text"
                            value={cleanNum(item.rate)}
                            onChange={numericChange(item.id, "rate")}
                            className="input text-right tabular-nums"
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </Field>
                        <Field label="Total Amount" required className="sm:col-span-2 lg:col-span-2">
                          <input
                            type="text"
                            value={cleanNum(item.amount)}
                            onChange={numericChange(item.id, "amount")}
                            className="input text-right font-semibold tabular-nums"
                            placeholder="0"
                            inputMode="decimal"
                          />
                        </Field>

                        {/* GST rate for Itemwise */}
                        {isItemWiseGST && (
                          <Field label="GST Rate (%)" required className="lg:col-span-2">
                            <input
                              type="text"
                              value={item.gstRate}
                              onChange={(e) => updateItemDetail(item.id, "gstRate", e.target.value)}
                              className="input text-right tabular-nums"
                              placeholder="0.00"
                            />
                          </Field>
                        )}

                        <Field label="Item Description" className="sm:col-span-2 lg:col-span-6">
                          <textarea
                            value={item.itemDetail}
                            onChange={(e) => updateItemDetail(item.id, "itemDetail", e.target.value)}
                            className="input resize-y"
                            placeholder="Specifications, description and other details..."
                            rows="2"
                          />
                        </Field>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={addItemDetail}
                  className="btn w-full border-2 border-dashed border-ink-300 bg-white py-3 text-ink-700 hover:border-brand-400 hover:bg-brand-50"
                >
                  <Plus className="h-4 w-4" /> Add Item
                </button>
              </div>
            </section>

            {/* 3. Other Charges */}
            <section className="card">
              <SectionHeader step="3" title="Other Charges" subtitle="Freight, loading, packaging and more">
                <button
                  type="button"
                  onClick={() => {
                    if (!showOtherCharges) {
                      setShowOtherCharges(true);
                      if (otherCharges.length === 0) addOtherCharge();
                    } else {
                      addOtherCharge();
                    }
                  }}
                  className="btn-dark py-1.5 text-xs self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Charge
                </button>
              </SectionHeader>

              {showOtherCharges && otherCharges.length > 0 ? (
                <div className="space-y-3 p-5">
                  {otherCharges.map((charge, index) => (
                    <div key={charge.id} className="grid items-end gap-3 rounded-lg border border-ink-200 p-3 sm:grid-cols-[32px_minmax(0,1fr)_200px_auto]">
                      <span className="hidden sm:flex h-[38px] items-center justify-center text-sm font-semibold text-ink-400">
                        {index + 1}
                      </span>
                      <Field label="Charge Name">
                        <input
                          type="text"
                          value={charge.name}
                          onChange={(e) => updateOtherCharge(charge.id, "name", e.target.value)}
                          className="input"
                          placeholder="e.g., Freight"
                        />
                      </Field>
                      <Field label="Amount">
                        <input
                          type="text"
                          value={charge.amount}
                          onChange={(e) => updateOtherCharge(charge.id, "amount", e.target.value)}
                          className="input text-right tabular-nums"
                          placeholder="0.00"
                        />
                      </Field>
                      <button
                        type="button"
                        onClick={() => removeOtherCharge(charge.id)}
                        className="flex h-[38px] items-center justify-center gap-1 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                        title="Remove charge"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sm:hidden">Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-6 text-center text-sm text-ink-500">
                  No other charges added. Click <span className="font-semibold text-ink-800">Add Charge</span> to include freight, loading, etc.
                </div>
              )}
            </section>

            {/* Submit */}
            <div className="card flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-500">
                {submitDisabled
                  ? `Select company, vendor and GST type${currency !== "INR" ? ", and enter an exchange rate" : ""} to continue.`
                  : "Review the details above, then create the purchase order."}
              </p>
              <button type="button" onClick={handleSubmit} disabled={submitDisabled} className="btn-primary h-11 shrink-0 px-6">
                <Send className="h-4 w-4" />
                {submitLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Excel Upload Modal */}
        {showExcelUpload && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowExcelUpload(false);
              }
            }}
          >
            <ExcelPurchaseOrderUpload
              onSuccess={handleExcelUploadSuccess}
              onClose={() => setShowExcelUpload(false)}
              vendorList={vendorsList}
              companyList={companies}
              warehouseList={warehouseList}
              itemList={itemList}
              onAutoFill={handleAutoFillFromExcel}
            />
          </div>
        )}

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddItemModal(false);
              }
            }}
          >
            <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-pop">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100 hover:text-ink-900"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <AddRawMaterial
                onSuccess={handleNewItemCreated}
                closeModal={() => setShowAddItemModal(false)}
                defaultName={addItemDefaultName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePurchaseOrder;
