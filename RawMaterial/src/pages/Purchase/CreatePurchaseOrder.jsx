// import React, { useState, useEffect, useRef } from "react";
// import Api from "../../auth/Api";
// import { useLocation } from "react-router-dom";
// import { removeStartingZero } from "../../utils/number/removeStartingZero";
// import { usePODraft } from "../../hooks/usePODraft";
// import AddRawMaterial from "../Purchase/AddRawMaterial";

// const CreatePurchaseOrder = () => {
//   const location = useLocation();
//   const [companies, setCompanies] = useState([]);
//   const [selectedCompany, setSelectedCompany] = useState("");
//   const [vendorsList, setVendorsList] = useState([]);
//   const [selectedVendor, setSelectedVendor] = useState("");
//   const [selectedGstType, setSelectedGstType] = useState("");
//   const [paymentTerms, setPaymentTerms] = useState("");
//   const [deliveryTerms, setDeliveryTerms] = useState("");
//   const [warranty, setWarranty] = useState("");
//   const [contactPerson, setContactPerson] = useState("");
//   const [cellNo, setCellNo] = useState("");
//   const [currency, setCurrency] = useState("INR");
//   const [exchangeRate, setExchangeRate] = useState("1.00");
//   const [gstRate, setGstRate] = useState("");
//   const [itemList, setItemList] = useState([]);
//   const [warehouseList, setWarehouseList] = useState([]);
//   const [selectedWarehouse, setSelectedWarehouse] = useState("");
//   const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
//   const [downloadLoading, setDownloadLoading] = useState(false);
//   const [cheapestPriceData, setCheapestPriceData] = useState({});
//   // 🔽 NEW: state for prePoId
//   const [selectedPrePo, setSelectedPrePo] = useState("");
//   const [itemDetails, setItemDetails] = useState([
//     {
//       id: 1,
//       selectedItem: "",
//       hsnCode: "",
//       modelNumber: "",
//       selectedUnit: "",
//       rate: "",
//       quantity: "",
//       gstRate: "",
//       amount: "",
//       taxableAmount: 0,
//       gstAmount: 0,
//       totalAmount: 0,
//       itemDetail: "",
//     },
//   ]);

//   const [otherCharges, setOtherCharges] = useState([
//     {
//       id: 1,
//       name: "",
//       amount: "",
//     },
//   ]);

//   const [loading, setLoading] = useState(false);
//   const [processingReorder, setProcessingReorder] = useState(false);
//   const [pendingReorderItems, setPendingReorderItems] = useState([]);
//   const [isItemListLoaded, setIsItemListLoaded] = useState(false);
//   const [skipCalculation, setSkipCalculation] = useState({});
//   const [showOtherCharges, setShowOtherCharges] = useState(false);
//   const [loadingItems, setLoadingItems] = useState({});
//   const [editableHsn, setEditableHsn] = useState({});
//   const [unitTypes, setUnitTypes] = useState([]);
//   const [openItemDropdown, setOpenItemDropdown] = useState(null);
//   const [searchQuery, setSearchQuery] = useState({});
//   const [draftRestoredAt, setDraftRestoredAt] = useState(null);
//   const { saveDraft, loadDraft, clearDraft } = usePODraft();
//   const dropdownRefs = useRef({});

//   // NEW: state for the "Add Item" modal
//   const [showAddItemModal, setShowAddItemModal] = useState(false);
//   const [addItemRowId, setAddItemRowId] = useState(null);
//   const [addItemDefaultName, setAddItemDefaultName] = useState("");

//   const currencyOptions = [
//     { value: "INR", label: "INR" },
//     { value: "USD", label: "USD" },
//     { value: "CNY", label: "CNY" },
//     { value: "EUR", label: "EUR" },
//     { value: "GBP", label: "GBP" },
//     { value: "AED", label: "AED" },
//   ];

//   const gstTypes = [
//     { value: "IGST_5", label: "IGST 5%" },
//     { value: "IGST_12", label: "IGST 12%" },
//     { value: "IGST_18", label: "IGST 18%" },
//     { value: "IGST_28", label: "IGST 28%" },
//     { value: "IGST_EXEMPTED", label: "IGST Exempted" },
//     { value: "LGST_5", label: "LGST 5%" },
//     { value: "LGST_12", label: "LGST 12%" },
//     { value: "LGST_18", label: "LGST 18%" },
//     { value: "LGST_28", label: "LGST 28%" },
//     { value: "LGST_EXEMPTED", label: "LGST Exempted" },
//     { value: "IGST_ITEMWISE", label: "IGST Itemwise" },
//     { value: "LGST_ITEMWISE", label: "LGST Itemwise" },
//   ];

//   const isItemWiseGST =
//     selectedGstType === "IGST_ITEMWISE" || selectedGstType === "LGST_ITEMWISE";

//   // Get currency symbol
//   const getCurrencySymbol = (curr) => {
//     const currency = currencyOptions.find((c) => c.value === curr);
//     return currency ? currency.label.match(/\((.*?)\)/)?.[1] || "" : "₹";
//   };

//   // FIX: Guard against undefined selectedGstType
//   const getFixedGSTRate = () => {
//     if (!selectedGstType) return 0;
//     if (selectedGstType.includes("EXEMPTED")) return 0;
//     const rateMatch = selectedGstType.match(/(\d+)/);
//     return rateMatch ? parseFloat(rateMatch[1]) : 0;
//   };

//   // Function to fetch cheapest price for an item using item name
//   const fetchCheapestPrice = async (itemName) => {
//     if (!itemName) return null;

//     try {
//       const response = await Api.get(`/common/item/price/cheapest?item=${encodeURIComponent(itemName)}`);

//       if (response.data.success && response.data.data) {
//         const priceData = response.data.data;
//         setCheapestPriceData((prev) => ({
//           ...prev,
//           [itemName]: priceData,
//         }));
//         return priceData;
//       }
//     } catch (error) {
//       console.error("Error fetching cheapest price:", error);
//       return null;
//     }
//   };

//   // Fetch units from API
//   const fetchUnits = async () => {
//     try {
//       const response = await Api.get("/common/unit/view");
//       if (response.data.success) {
//         const formattedUnits = response.data.data.map((unit) => ({
//           value: unit.name,
//           label: unit.name,
//           id: unit.id,
//         }));
//         setUnitTypes(formattedUnits);
//       }
//     } catch (error) {
//       console.error("Error fetching units:", error);
//     }
//   };

//   // Add custom units from API responses
//   useEffect(() => {
//     const customUnits = itemDetails
//       .map((item) => item.selectedUnit)
//       .filter(
//         (unit) =>
//           unit && unit.trim() && !unitTypes.some((u) => u.value === unit),
//       )
//       .filter((value, index, self) => self.indexOf(value) === index);

//     if (customUnits.length > 0) {
//       const newUnitTypes = [...unitTypes];
//       let addedUnits = false;

//       customUnits.forEach((unit) => {
//         if (!newUnitTypes.some((u) => u.value === unit)) {
//           newUnitTypes.push({ value: unit, label: unit });
//           addedUnits = true;
//         }
//       });

//       if (addedUnits) {
//         setUnitTypes(newUnitTypes);
//       }
//     }
//   }, [itemDetails, unitTypes]);

//   const checkUnitStatus = (item) => {
//     if (item.selectedItem && !item.selectedUnit) {
//       console.log(`Warning: Item ${item.selectedItem} has no unit set.`);
//     }
//   };

//   useEffect(() => {
//     itemDetails.forEach((item) => {
//       if (item.selectedItem) {
//         checkUnitStatus(item);
//       }
//     });
//   }, [itemDetails]);

//   const fetchWarehouses = async () => {
//     try {
//       const res = await Api.get(`/purchase/warehouses`);
//       const formatted = res?.data?.data?.map((w) => ({
//         label: w.warehouseName,
//         value: w._id,
//       }));
//       setWarehouseList(formatted);
//     } catch (err) {
//       alert("Error loading warehouses: ", err?.response?.data?.message);
//     }
//   };

//   const fetchCompanies = async () => {
//     setLoading(true);
//     try {
//       const response = await Api.get("/purchase/companies");
//       setCompanies(response?.data?.data || []);
//     } catch (error) {
//       alert("Error: " + (error?.response?.data?.message || error?.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchVendors = async () => {
//     setLoading(true);
//     try {
//       const response = await Api.get("/purchase/vendors");
//       setVendorsList(response?.data?.data || []);
//     } catch (error) {
//       alert("Error: " + (error?.response?.data?.message || error?.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchItemList = async () => {
//     setLoading(true);
//     try {
//       const response = await Api.get("/purchase/items");
//       setItemList(response?.data?.items || []);
//       setIsItemListLoaded(true);
//     } catch (error) {
//       alert("Error: " + (error?.response?.data?.message || error?.message));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//   if (location.state?.reorderData) {
//     const reorderData = location.state.reorderData;
//     console.log("From Pre Po: ", reorderData )
//     const fromPrePo = reorderData.fromPrePo || false;

//     // console.log("Received reorder data:", reorderData);

//     // setSelectedCompany(reorderData.companyId || ""); // (currently commented)
//     setSelectedVendor(reorderData.vendorId || "");
//     setSelectedPrePo(reorderData.prePoId || "");
//     setSelectedGstType(reorderData.gstType || "");
//     setCurrency(reorderData.currency || "INR");
//     setExchangeRate(reorderData.exchangeRate || "1.00");
//     setPaymentTerms(reorderData.paymentTerms || "");
//     setDeliveryTerms(reorderData.deliveryTerms || "");
//     setWarranty(reorderData.warranty || "");
//     setSelectedWarehouse(reorderData.warehouseId || "");

//     // 🔽 Conditionally set contact fields
//     if (!fromPrePo) {
//       setContactPerson(reorderData.contactPerson || "");
//       setCellNo(reorderData.cellNo || "");
//     } else {
//       // When coming from Pre-PO, force user to enter these manually
//       setContactPerson("");
//       setCellNo("");
//     }

//     if (reorderData.items && reorderData.items.length > 0) {
//       setPendingReorderItems(reorderData.items);
//     }

//     if (reorderData.otherCharges && reorderData.otherCharges.length > 0) {
//       const mappedCharges = reorderData.otherCharges.map((charge, index) => ({
//         id: index + 1,
//         name: charge.name || "",
//         amount: charge.amount || "",
//       }));
//       setOtherCharges(mappedCharges);
//       setShowOtherCharges(true);
//     }
//   }
// }, [location.state]);

//   // Process reorder items when itemList is loaded
//   useEffect(() => {
//     if (pendingReorderItems.length > 0 && isItemListLoaded) {
//       setProcessingReorder(true);

//       const mappedItems = pendingReorderItems.map((item, index) => {
//         let foundItem = null;

//         if (item.itemId || item.id) {
//           foundItem = itemList.find(
//             (i) => String(i.id) === String(item.itemId || item.id),
//           );
//         }

//         if (!foundItem && item.itemName) {
//           foundItem = itemList.find(
//             (i) =>
//               i.name.toLowerCase().includes(item.itemName.toLowerCase()) ||
//               (item.itemName &&
//                 i.name.toLowerCase() === item.itemName.toLowerCase()),
//           );
//         }

//         const rate = parseFloat(item.rate) || 0;
//         const quantity = parseFloat(item.quantity) || 1;
//         const total = rate * quantity;

//         let itemGstRate = 0;
//         if (isItemWiseGST) {
//           itemGstRate = parseFloat(item.gstRate) || 0;
//         } else {
//           itemGstRate = getFixedGSTRate();
//         }

//         const gstAmount = (total * itemGstRate) / 100;

//         return {
//           id: index + 1,
//           selectedItem: foundItem?.id || "",
//           hsnCode: foundItem?.hsnCode || item.hsnCode || "",
//           modelNumber: foundItem?.modelNumber || item.modelNumber || "",
//           selectedUnit: foundItem?.unit || item.unit || "",
//           rate: rate.toString(),
//           quantity: quantity.toString(),
//           gstRate: itemGstRate.toString(),
//           amount: total.toString(),
//           taxableAmount: total,
//           gstAmount: gstAmount,
//           totalAmount: total + gstAmount,
//           itemDetail: foundItem?.itemDetail || item.itemDetail || "",
//         };
//       });

//       setItemDetails(mappedItems);
//       setPendingReorderItems([]);

//       setTimeout(() => {
//         setProcessingReorder(false);
//         console.log("Reorder items processed:", mappedItems);
//       }, 500);
//     }
//   }, [isItemListLoaded, pendingReorderItems, selectedGstType, itemList]);

//   // Reset exchange rate when currency changes
//   useEffect(() => {
//     if (currency === "INR") {
//       setExchangeRate("1.00");
//     } else {
//       setExchangeRate("");
//     }
//   }, [currency]);

//   // Guard against undefined selectedGstType in this effect as well
//   useEffect(() => {
//     if (selectedGstType) {
//       setItemDetails(
//         itemDetails.map((item) => {
//           const calculatedAmounts = calculateItemAmounts(item);
//           return {
//             ...item,
//             taxableAmount: calculatedAmounts.taxableAmount,
//             gstAmount: calculatedAmounts.gstAmount,
//             totalAmount: calculatedAmounts.totalAmount,
//             gstRate: calculatedAmounts.gstRate,
//           };
//         }),
//       );
//     }
//   }, [selectedGstType]);

//   const addItemDetail = () => {
//     const newId = itemDetails.length + 1;
//     setItemDetails([
//       ...itemDetails,
//       {
//         id: newId,
//         selectedItem: "",
//         hsnCode: "",
//         modelNumber: "",
//         selectedUnit: "",
//         rate: "",
//         quantity: "",
//         gstRate: "",
//         amount: "",
//         taxableAmount: 0,
//         gstAmount: 0,
//         totalAmount: 0,
//         itemDetail: "",
//       },
//     ]);
//   };

//   const removeItemDetail = (id) => {
//     if (itemDetails.length > 1) {
//       setItemDetails(itemDetails.filter((item) => item.id !== id));
//       setLoadingItems((prev) => {
//         const updated = { ...prev };
//         delete updated[id];
//         return updated;
//       });
//       setEditableHsn((prev) => {
//         const updated = { ...prev };
//         delete updated[id];
//         return updated;
//       });
//     }
//   };

//   const addOtherCharge = () => {
//     const newId = otherCharges.length + 1;
//     setOtherCharges([
//       ...otherCharges,
//       {
//         id: newId,
//         name: "",
//         amount: "",
//       },
//     ]);
//   };

//   const removeOtherCharge = (id) => {
//     if (otherCharges.length > 1) {
//       setOtherCharges(otherCharges.filter((charge) => charge.id !== id));
//     }
//   };

//   const updateOtherCharge = (id, field, value) => {
//     setOtherCharges(
//       otherCharges.map((charge) => {
//         if (charge.id === id) {
//           return { ...charge, [field]: value };
//         }
//         return charge;
//       }),
//     );
//   };

//   const calculateMissingValue = (rate, quantity, amount) => {
//     const r = rate === "" ? 0 : parseFloat(rate) || 0;
//     const q = quantity === "" ? 0 : parseFloat(quantity) || 0;
//     const a = amount === "" ? 0 : parseFloat(amount) || 0;

//     const rateValid = rate !== "" && !isNaN(r) && r > 0;
//     const quantityValid = quantity !== "" && !isNaN(q) && q > 0;
//     const amountValid = amount !== "" && !isNaN(a) && a > 0;

//     const validCount = [rateValid, quantityValid, amountValid].filter(
//       Boolean,
//     ).length;

//     if (validCount === 2) {
//       if (rateValid && quantityValid && !amountValid) {
//         return { amount: r * q, rate: r, quantity: q };
//       } else if (rateValid && amountValid && !quantityValid) {
//         return { amount: a, rate: r, quantity: a / r };
//       } else if (quantityValid && amountValid && !rateValid) {
//         return { amount: a, rate: a / q, quantity: q };
//       }
//     }

//     if (validCount === 3) {
//       return { amount: r * q, rate: r, quantity: q };
//     }

//     return { amount: a, rate: r, quantity: q };
//   };

//   const calculateItemAmounts = (item) => {
//     const rate = item.rate || 0;
//     const quantity = item.quantity || 0;
//     const amount = item.amount || 0;

//     const calculated = calculateMissingValue(rate, quantity, amount);
//     const total = calculated.amount;

//     let gstRate = 0;

//     if (isItemWiseGST) {
//       gstRate = parseFloat(item.gstRate) || 0;
//     } else {
//       gstRate = getFixedGSTRate();
//     }

//     const taxableAmount = total;
//     const gstAmount = (taxableAmount * gstRate) / 100;
//     const finalTotalAmount = taxableAmount + gstAmount;

//     return {
//       amount: total,
//       rate: calculated.rate,
//       quantity: calculated.quantity,
//       taxableAmount,
//       gstAmount,
//       totalAmount: finalTotalAmount,
//       gstRate: gstRate.toString(),
//     };
//   };

//   const handleItemSelect = async (id, itemId) => {
//     console.log(`Item changed: ${itemId} for item ${id}`);

//     if (!itemId) {
//       setItemDetails(
//         itemDetails.map((item) => {
//           if (item.id === id) {
//             return {
//               ...item,
//               selectedItem: "",
//               hsnCode: "",
//               modelNumber: "",
//               selectedUnit: "",
//               rate: "",
//               itemDetail: "",
//             };
//           }
//           return item;
//         }),
//       );

//       setEditableHsn((prev) => ({ ...prev, [id]: false }));
//       setLoadingItems((prev) => ({ ...prev, [id]: false }));

//       const selectedItemData = itemList.find((item) => item.id === itemId);
//       if (selectedItemData) {
//         setCheapestPriceData((prev) => {
//           const updated = { ...prev };
//           delete updated[selectedItemData.name];
//           return updated;
//         });
//       }

//       return;
//     }

//     const selectedItemData = itemList.find((item) => item.id === itemId);
//     if (selectedItemData) {
//       setLoadingItems((prev) => ({ ...prev, [id]: true }));

//       try {
//         await fetchCheapestPrice(selectedItemData.name);

//         const hasHsnCode =
//           selectedItemData.hsnCode && selectedItemData.hsnCode.trim() !== "";

//         let initialRate = selectedItemData.rate || "";

//         let updatedItemDetails = itemDetails.map((item) => {
//           if (item.id === id) {
//             const updatedItem = {
//               ...item,
//               selectedItem: itemId,  
//               hsnCode: hasHsnCode ? selectedItemData.hsnCode : "",
//               modelNumber: selectedItemData.modelNumber || "",
//               selectedUnit: "",
//               rate: initialRate,
//               itemDetail: selectedItemData.itemDetail || "",
//             };

//             const calculatedAmounts = calculateItemAmounts(updatedItem);
//             return {
//               ...updatedItem,
//               rate: calculatedAmounts.rate.toString(),
//               quantity: calculatedAmounts.quantity.toString(),
//               amount: calculatedAmounts.amount.toString(),
//               taxableAmount: calculatedAmounts.taxableAmount,
//               gstAmount: calculatedAmounts.gstAmount,
//               totalAmount: calculatedAmounts.totalAmount,
//             };
//           }
//           return item;
//         });

//         setItemDetails(updatedItemDetails);

//         setEditableHsn((prev) => ({
//           ...prev,
//           [id]: !hasHsnCode,
//         }));

//         try {
//           const response = await Api.get(`/purchase/items/details/${itemId}`);

//           if (response.data.success) {
//             const detailedItem = response.data.item;
//             const apiHasHsnCode =
//               detailedItem.hsnCode && detailedItem.hsnCode.trim() !== "";

//             setItemDetails((prevItemDetails) =>
//               prevItemDetails.map((item) => {
//                 if (item.id === id) {
//                   const apiUnit = detailedItem.unit;
//                   let newUnit = "";

//                   if (
//                     apiUnit !== undefined &&
//                     apiUnit !== null &&
//                     apiUnit.toString().trim() !== ""
//                   ) {
//                     newUnit = apiUnit.toString().trim();
//                   }

//                   const apiDescription = detailedItem.description;
//                   let newDescription = "";

//                   if (
//                     apiDescription !== undefined &&
//                     apiDescription !== null &&
//                     apiDescription.toString().trim() !== ""
//                   ) {
//                     newDescription = apiDescription.toString().trim();
//                   }

//                   let newHsnCode = item.hsnCode;
//                   if (apiHasHsnCode) {
//                     newHsnCode = detailedItem.hsnCode.trim();
//                   }

//                   const updatedItem = {
//                     ...item,
//                     selectedUnit: newUnit,
//                     itemDetail: newDescription,
//                     hsnCode: newHsnCode,
//                   };

//                   setEditableHsn((prev) => ({
//                     ...prev,
//                     [id]: !apiHasHsnCode,
//                   }));

//                   const calculatedAmounts = calculateItemAmounts(updatedItem);

//                   return {
//                     ...updatedItem,
//                     rate: calculatedAmounts.rate.toString(),
//                     quantity: calculatedAmounts.quantity.toString(),
//                     amount: calculatedAmounts.amount.toString(),
//                     taxableAmount: calculatedAmounts.taxableAmount,
//                     gstAmount: calculatedAmounts.gstAmount,
//                     totalAmount: calculatedAmounts.totalAmount,
//                   };
//                 }
//                 return item;
//               }),
//             );
//           }
//         } catch (apiError) {
//           console.error("Error fetching item details:", apiError);
//         }
//       } catch (error) {
//         console.error("Error in handleItemSelect:", error);
//       } finally {
//         setLoadingItems((prev) => ({ ...prev, [id]: false }));
//       }
//     } else {
//       setItemDetails(
//         itemDetails.map((item) => {
//           if (item.id === id) {
//             return {
//               ...item,
//               selectedItem: itemId,
//               selectedUnit: "",
//               hsnCode: "",
//             };
//           }
//           return item;
//         }),
//       );

//       setEditableHsn((prev) => ({ ...prev, [id]: true }));
//       setLoadingItems((prev) => ({ ...prev, [id]: false }));
//     }
//   };

//   const toggleHsnEditMode = (itemId) => {
//     setEditableHsn((prev) => ({
//       ...prev,
//       [itemId]: !prev[itemId],
//     }));
//   };

//   const handleHsnCodeChange = (itemId, value) => {
//     setItemDetails(
//       itemDetails.map((item) => {
//         if (item.id === itemId) {
//           return { ...item, hsnCode: value };
//         }
//         return item;
//       }),
//     );
//   };

//   const updateItemDetail = (id, field, value) => {
//     if (
//       value === "" &&
//       (field === "rate" || field === "quantity" || field === "amount")
//     ) {
//       setSkipCalculation((prev) => ({ ...prev, [id]: true }));

//       setTimeout(() => {
//         setSkipCalculation((prev) => ({ ...prev, [id]: false }));
//       }, 100);
//     }

//     setItemDetails(
//       itemDetails.map((item) => {
//         if (item.id === id) {
//           const updatedItem = { ...item, [field]: value };

//           if (
//             skipCalculation[id] &&
//             (field === "rate" || field === "quantity" || field === "amount")
//           ) {
//             return updatedItem;
//           }

//           if (field === "rate") {
//             const newAmount = Number(value) * Number(updatedItem.quantity || 0);
//             return {
//               ...updatedItem,
//               rate: value,
//               amount: Number(newAmount.toFixed(3)),
//             };
//           }
//           if (field === "amount") {
//             const newRate = Number(value) / Number(updatedItem.quantity);
//             return {
//               ...updatedItem,
//               rate: Number(newRate.toFixed(3)),
//               amount: value,
//             };
//           }
//           if (field === "quantity") {
//             const newAmount = Number(value) * Number(updatedItem.rate);
//             const newValue = Number(removeStartingZero(value));
//             return {
//               ...updatedItem,
//               quantity: value,
//               amount: Number(newAmount.toFixed(3)),
//             };
//           }
//           if (isItemWiseGST && field === "gstRate") {
//             const calculatedAmounts = calculateItemAmounts(updatedItem);
//             return {
//               ...updatedItem,
//               gstRate: value,
//               taxableAmount: calculatedAmounts.taxableAmount,
//               gstAmount: calculatedAmounts.gstAmount,
//               totalAmount: calculatedAmounts.totalAmount,
//             };
//           }

//           return updatedItem;
//         }
//         return item;
//       }),
//     );
//   };

//   // Initialize search query for each item
//   useEffect(() => {
//     const initialSearchQueries = {};
//     itemDetails.forEach((item) => {
//       initialSearchQueries[item.id] = "";
//     });
//     setSearchQuery(initialSearchQueries);
//   }, [itemDetails]);

//   const getFilteredItems = (itemId) => {
//     const query = searchQuery[itemId] || "";
//     if (!query.trim()) return itemList;

//     return itemList.filter(
//       (item) =>
//         item.name.toLowerCase().includes(query.toLowerCase()) ||
//         (item.hsnCode &&
//           item.hsnCode.toLowerCase().includes(query.toLowerCase())) ||
//         (item.modelNumber &&
//           item.modelNumber.toLowerCase().includes(query.toLowerCase())),
//     );
//   };

//   const handleSearchChange = (itemId, value) => {
//     setSearchQuery((prev) => ({
//       ...prev,
//       [itemId]: value,
//     }));
//   };

//   const toggleItemDropdown = (itemId) => {
//     if (openItemDropdown === itemId) {
//       setOpenItemDropdown(null);
//       setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
//     } else {
//       setOpenItemDropdown(itemId);
//       if (!searchQuery[itemId]) {
//         setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
//       }
//     }
//   };

//   const handleItemSelectFromDropdown = async (itemId, selectedItemId) => {
//     await handleItemSelect(itemId, selectedItemId);
//     setOpenItemDropdown(null);
//     setSearchQuery((prev) => ({ ...prev, [itemId]: "" }));
//   };

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       let isOutside = true;
//       Object.values(dropdownRefs.current).forEach((ref) => {
//         if (ref && ref.contains(event.target)) {
//           isOutside = false;
//         }
//       });

//       if (isOutside) {
//         setOpenItemDropdown(null);
//         const clearedQueries = {};
//         itemDetails.forEach((item) => {
//           clearedQueries[item.id] = "";
//         });
//         setSearchQuery(clearedQueries);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [itemDetails]);

//   // Restore draft on mount (skipped in reorder / pre-po mode)
//   useEffect(() => {
//     if (location.state?.reorderData) return;
//     const draft = loadDraft();
//     if (!draft) return;

//     const hasMeaningfulData =
//       draft.selectedCompany ||
//       draft.selectedVendor ||
//       draft.selectedGstType ||
//       draft.selectedWarehouse ||
//       (draft.itemDetails && draft.itemDetails.some((i) => i.selectedItem));

//     if (!hasMeaningfulData) return;

//     if (draft.selectedCompany) setSelectedCompany(draft.selectedCompany);
//     if (draft.selectedVendor) setSelectedVendor(draft.selectedVendor);
//     if (draft.selectedGstType) setSelectedGstType(draft.selectedGstType);
//     if (draft.currency) setCurrency(draft.currency);
//     if (draft.exchangeRate) setExchangeRate(draft.exchangeRate);
//     if (draft.gstRate) setGstRate(draft.gstRate);
//     if (draft.selectedWarehouse) setSelectedWarehouse(draft.selectedWarehouse);
//     if (draft.paymentTerms) setPaymentTerms(draft.paymentTerms);
//     if (draft.deliveryTerms) setDeliveryTerms(draft.deliveryTerms);
//     if (draft.warranty) setWarranty(draft.warranty);
//     if (draft.contactPerson) setContactPerson(draft.contactPerson);
//     if (draft.cellNo) setCellNo(draft.cellNo);
//     if (draft.expectedDeliveryDate) setExpectedDeliveryDate(draft.expectedDeliveryDate);
//     if (draft.itemDetails) setItemDetails(draft.itemDetails);
//     if (draft.otherCharges) setOtherCharges(draft.otherCharges);
//     if (draft.showOtherCharges !== undefined) setShowOtherCharges(draft.showOtherCharges);
//     if (draft.selectedPrePo) setSelectedPrePo(draft.selectedPrePo);
//     if (draft.editableHsn) setEditableHsn(draft.editableHsn);

//     setDraftRestoredAt(draft.savedAt);
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // Auto-save draft whenever any form field changes
//   useEffect(() => {
//     if (location.state?.reorderData) return;
//     saveDraft({
//       selectedCompany,
//       selectedVendor,
//       selectedGstType,
//       currency,
//       exchangeRate,
//       gstRate,
//       selectedWarehouse,
//       paymentTerms,
//       deliveryTerms,
//       warranty,
//       contactPerson,
//       cellNo,
//       expectedDeliveryDate,
//       itemDetails,
//       otherCharges,
//       showOtherCharges,
//       selectedPrePo,
//       editableHsn,
//     });
//   }, [
//     selectedCompany,
//     selectedVendor,
//     selectedGstType,
//     currency,
//     exchangeRate,
//     gstRate,
//     selectedWarehouse,
//     paymentTerms,
//     deliveryTerms,
//     warranty,
//     contactPerson,
//     cellNo,
//     expectedDeliveryDate,
//     itemDetails,
//     otherCharges,
//     showOtherCharges,
//     selectedPrePo,
//     editableHsn,
//   ]); // eslint-disable-line react-hooks/exhaustive-deps

//   const getCheapestPriceDisplay = (itemId) => {
//     const selectedItemData = itemList.find((item) => item.id === itemId);
//     if (!selectedItemData) return null;

//     const priceData = cheapestPriceData[selectedItemData.name];
//     if (!priceData) return null;

//     return (
//       <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
//         <div className="flex items-start">
//           <div className="flex-shrink-0">
//             <div className="p-2 bg-green-100 rounded-full">
//               <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//               </svg>
//             </div>
//           </div>
//           <div className="ml-3 flex-1">
//             <p className="text-sm font-semibold text-green-800 mb-1">Cheapest Price</p>
//             <div className="grid grid-cols-2 gap-3 mt-2">
//               <div>
//                 <p className="text-xs text-green-600">Vendor</p>
//                 <p className="text-sm font-medium text-gray-800">{priceData.vendor}</p>
//               </div>
//               <div>
//                 <p className="text-xs text-green-600">Rate</p>
//                 <p className="text-sm font-bold text-green-700">
//                   {getCurrencySymbol(priceData.currency)} {parseFloat(priceData.rate).toFixed(3)}
//                   {priceData.currency !== "INR" && ` ${priceData.currency}`}
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // NEW: open the "Add Item" modal for a specific row, optionally pre-filling the
//   // name field with whatever the user had already typed into the search box.
//   const openAddItemModal = (rowId, defaultName = "") => {
//     setAddItemRowId(rowId);
//     setAddItemDefaultName(defaultName);
//     setShowAddItemModal(true);
//     setOpenItemDropdown(null);
//   };

//   // NEW: handle a newly created item coming back from the AddRawMaterial form.
//   // Populates the row with everything entered in the Add Item form (not just
//   // the name), falling back to the refreshed item list only for whatever the
//   // register didn't return.
//   const handleNewItemCreated = async (createdItem) => {
//     console.log("new item:", createdItem);
//     setShowAddItemModal(false);

//     try {
//       const response = await Api.get("/purchase/items");
//       const freshList = response?.data?.items || [];
//       setItemList(freshList);

//       let newItem = null;
//       // mysql
//       if (createdItem?.id) {
//         newItem = freshList.find((i) => String(i.id) === String(createdItem.id));
//       }

//       // mongo
//       if (createdItem?._id) {
//         newItem = freshList.find((i) => String(i._id) === String(createdItem._id));
//       }

//       if (!newItem && createdItem?.name) {
//         newItem = freshList.find(
//           (i) => i.name.toLowerCase() === createdItem.name.toLowerCase()
//         );
//       }

//       const rowId = addItemRowId;
//       if (rowId) {
//         // Prefer the values the user just typed into the Add Item form.
//         // Only fall back to the refreshed item-list record for anything missing.
//         let resolvedId;
//         if (createdItem?.id) {
//           resolvedId = newItem?.id ?? createdItem?.id ?? "";
//         }
//         if (createdItem?._id) {
//           resolvedId = newItem?._id ?? createdItem?._id ?? "";
//         }
//         const resolvedName = createdItem?.name || newItem?.name || "";
//         const resolvedHsn = (
//           createdItem?.hsnCode ?? newItem?.hsnCode ?? ""
//         ).toString();
//         const resolvedModel = (
//           createdItem?.modelNumber ?? newItem?.modelNumber ?? ""
//         ).toString();
//         const resolvedUnit = (
//           createdItem?.unit ?? newItem?.unit ?? ""
//         ).toString();
//         const resolvedRate = (
//           createdItem?.rate ?? newItem?.rate ?? ""
//         ).toString();
//         const resolvedDetail = (
//           createdItem?.itemDetail ??
//           createdItem?.description ??
//           newItem?.itemDetail ??
//           ""
//         ).toString();
//         const resolvedGstRate = (createdItem?.gstRate ?? "").toString();

//         setItemDetails((prev) =>
//           prev.map((item) => {
//             if (item.id !== rowId) return item;
//             const merged = {
//               ...item,
//               selectedItem: resolvedId,
//               hsnCode: resolvedHsn,
//               modelNumber: resolvedModel,
//               selectedUnit: resolvedUnit,
//               rate: resolvedRate,
//               itemDetail: resolvedDetail,
//               ...(isItemWiseGST ? { gstRate: resolvedGstRate } : {}),
//             };
//             const calculatedAmounts = calculateItemAmounts(merged);
//             return {
//               ...merged,
//               rate: calculatedAmounts.rate.toString(),
//               quantity: calculatedAmounts.quantity.toString(),
//               amount: calculatedAmounts.amount.toString(),
//               taxableAmount: calculatedAmounts.taxableAmount,
//               gstAmount: calculatedAmounts.gstAmount,
//               totalAmount: calculatedAmounts.totalAmount,
//             };
//           }),
//         );

//         setEditableHsn((prev) => ({
//           ...prev,
//           [rowId]: !resolvedHsn || resolvedHsn.trim() === "",
//         }));
//         setLoadingItems((prev) => ({ ...prev, [rowId]: false }));

//         if (resolvedName) {
//           fetchCheapestPrice(resolvedName);
//         }
//       }
//     } catch (err) {
//       console.error("Error refreshing item list after add:", err);
//       alert("Item was added, but refreshing its details failed. Please re-select it from the list.");
//     } finally {
//       setAddItemRowId(null);
//       setAddItemDefaultName("");
//     }
//   };

//   const itemTotals = itemDetails.reduce(
//     (acc, item) => {
//       return {
//         amount: acc.amount + (parseFloat(item.amount) || 0),
//         taxableAmount:
//           acc.taxableAmount + (parseFloat(item.taxableAmount) || 0),
//         gstAmount: acc.gstAmount + (parseFloat(item.gstAmount) || 0),
//         totalAmount: acc.totalAmount + (parseFloat(item.totalAmount) || 0),
//       };
//     },
//     { amount: 0, taxableAmount: 0, gstAmount: 0, totalAmount: 0 },
//   );

//   const otherChargesTotal = otherCharges.reduce((total, charge) => {
//     return total + (parseFloat(charge.amount) || 0);
//   }, 0);

//   const finalTotals = {
//     amount: itemTotals.amount,
//     taxableAmount: itemTotals.taxableAmount,
//     gstAmount: itemTotals.gstAmount,
//     otherCharges: otherChargesTotal,
//     totalAmount:
//       itemTotals.taxableAmount + itemTotals.gstAmount + otherChargesTotal,
//   };

//   const handleDownload = async (poId, poName) => {
//     if (!poId) return;
//     console.log("Downloading purchase order:", poName);

//     setDownloadLoading(true);
//     try {
//       const response = await Api.post(
//         `/purchase/purchase-orders/download/${poId}`,
//         {},
//         {
//           responseType: "blob",
//         },
//       );

//       const blob = new Blob([response.data], { type: "application/pdf" });
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;

//       const contentDisposition = response.headers["content-disposition"];
//       let fileName = `${poName}.pdf`;

//       if (contentDisposition) {
//         const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
//         if (fileNameMatch && fileNameMatch.length === 2) {
//           fileName = fileNameMatch[1];
//         }
//       }

//       link.setAttribute("download", fileName);
//       document.body.appendChild(link);
//       link.click();
//       link.parentNode.removeChild(link);
//       window.URL.revokeObjectURL(url);
//       setDownloadLoading(false);
//     } catch (error) {
//       console.error("Error downloading purchase order:", error);
//       alert(
//         "Error downloading purchase order: " +
//           (error?.response?.data?.message || error?.message),
//       );
//       setDownloadLoading(false);
//     }
//   };

//   const handleSubmit = async () => {
//     if (!selectedWarehouse) {
//       alert("Please select a warehouse");
//       return;
//     }
//     if (!expectedDeliveryDate) {
//       alert("Please select expected delivery date");
//       return;
//     }
//     if (!selectedVendor) {
//       alert("Please select a vendor");
//       return;
//     }
//     if (!selectedGstType) {
//       alert("Please select a GST type");
//       return;
//     }
//     if (
//       currency !== "INR" &&
//       (!exchangeRate || parseFloat(exchangeRate) <= 0)
//     ) {
//       alert("Please enter a valid exchange rate for non-INR currency");
//       return;
//     }

//     const itemsWithoutHsn = itemDetails.filter(
//       (item) => !item.hsnCode || item.hsnCode.trim() === "",
//     );

//     if (itemsWithoutHsn.length > 0) {
//       alert("Please enter HSN code for all items");
//       return;
//     }

//     const itemsWithoutUnit = itemDetails.filter(
//       (item) => !item.selectedUnit || item.selectedUnit.trim() === ""
//     );

//     if (itemsWithoutUnit.length > 0) {
//       alert("Please select a unit for all items");
//       return;
//     }

//     const invalidItems = itemDetails.filter(
//       (item) =>
//         !item.selectedItem || !item.hsnCode || !item.rate || !item.quantity || !item.selectedUnit
//     );

//     if (invalidItems.length > 0) {
//       alert("Please fill all required fields for all items (item, HSN, rate, quantity, unit)");
//       return;
//     }

//     try {
//       const purchaseOrderData = {
//         companyId: selectedCompany,
//         vendorId: selectedVendor,
//         gstType: selectedGstType,
//         currency: currency,
//         exchangeRate: exchangeRate,
//         paymentTerms,
//         deliveryTerms,
//         warranty,
//         contactPerson,
//         expectedDeliveryDate,
//         cellNo,
//         warehouseId: selectedWarehouse,
//         // 🔽 NEW: include prePoId if available
//         prePoId: selectedPrePo || undefined,
//         items: itemDetails.map((item) => {
//           const selectedItemData = itemList.find(
//             (i) => i.id === item.selectedItem,
//           );
//           const itemData = {
//             id: item.selectedItem,
//             name: selectedItemData?.name || "",
//             source: selectedItemData?.source || "",
//             hsnCode: item.hsnCode,
//             modelNumber: item.modelNumber,
//             itemDetail: item.itemDetail,
//             unit: item.selectedUnit,
//             quantity: item.quantity.toString(),
//             rate: item.rate.toString(),
//           };

//           if (isItemWiseGST) {
//             itemData.gstRate = item.gstRate.toString();
//           }

//           return itemData;
//         }),
//         otherCharges: otherCharges.map((charge) => ({
//           name: charge.name,
//           amount: charge.amount.toString(),
//         })),
//       };

//       const response = await Api.post(
//         "/purchase/purchase-orders/create",
//         purchaseOrderData,
//       );

//       if (response.data.success) {
//         const poId = response.data.data.id;
//         const poNumber = response.data.data.poNumber;
//           // ✅ CLEAR DRAFT FROM LOCAL STORAGE AFTER SUCCESS
//       clearDraft(); // This removes the draft from localStorage
//       setDraftRestoredAt(null); // Reset the restoration banner
//         alert("Purchase Order created successfully!");

//         const shouldDownload = window.confirm(
//           "Do you want to download the purchase order PDF?",
//         );
//         if (shouldDownload) {
//           await handleDownload(poId, poNumber);
//         }
//         handleReset();
//       } else {
//         alert("Error creating purchase order: " + response.data.message);
//       }
//     } catch (error) {
//       console.log("Error creating purchase order:", error);
//       alert(
//         "Error creating purchase order: " +
//           (error?.response?.data?.message || error?.message),
//       );
//     }
//   };

//   const handleReset = () => {
//     clearDraft();
//     setDraftRestoredAt(null);
//     setSelectedCompany("");
//     setSelectedVendor("");
//     setSelectedGstType("");
//     setGstRate("");
//     setCurrency("INR");
//     setExchangeRate("1.00");
//     setSelectedWarehouse("");
//     setPaymentTerms("");
//     setDeliveryTerms("");
//     setWarranty("");
//     setContactPerson("");
//     setCellNo("");
//     setSelectedPrePo(""); // 🔽 NEW
//     setItemDetails([
//       {
//         id: 1,
//         selectedItem: "",
//         hsnCode: "",
//         modelNumber: "",
//         selectedUnit: "",
//         rate: "",
//         quantity: "",
//         gstRate: "",
//         amount: "",
//         taxableAmount: 0,
//         gstAmount: 0,
//         totalAmount: 0,
//         itemDetail: "",
//       },
//     ]);
//     setOtherCharges([
//       {
//         id: 1,
//         name: "",
//         amount: "",
//       },
//     ]);
//     setPendingReorderItems([]);
//     setSkipCalculation({});
//     setShowOtherCharges(false);
//     setLoadingItems({});
//     setEditableHsn({});
//     setOpenItemDropdown(null);
//     setSearchQuery({});
//     setCheapestPriceData({});
//     setShowAddItemModal(false);
//     setAddItemRowId(null);
//     setAddItemDefaultName("");
//   };

//   useEffect(() => {
//     fetchCompanies();
//     fetchVendors();
//     fetchItemList();
//     fetchWarehouses();
//     fetchUnits();
//   }, []);

//   // 🔽 NEW: determine if we are coming from a Pre-PO
//   const fromPrePo = location.state?.reorderData?.fromPrePo || false;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
//       <div className="max-w-7xl mx-auto">
//         {(processingReorder || downloadLoading) && (
//           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//             <div className="bg-white p-6 rounded-xl shadow-lg">
//               <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//               <p className="text-gray-700">
//                 {processingReorder && "Loading reorder data..."}
//                 {downloadLoading && "Downloading Purchase Order..."}
//               </p>
//             </div>
//           </div>
//         )}

//         {draftRestoredAt && (
//           <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <div>
//                 <p className="font-medium text-amber-800">Draft Restored</p>
//                 <p className="text-sm text-amber-600">
//                   Your unsaved progress from {new Date(draftRestoredAt).toLocaleString()} has been restored.
//                 </p>
//               </div>
//             </div>
//             <button
//               type="button"
//               onClick={handleReset}
//               className="ml-4 text-sm font-medium text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
//             >
//               Discard Draft
//             </button>
//           </div>
//         )}

//         <div className="mb-8 text-center">
//           <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
//             {fromPrePo
//               ? "Purchase Order from Pre-PO"
//               : location.state?.reorderData
//               ? "ReOrder Purchase Order"
//               : "Create Purchase Order"}
//           </h1>
//           <p className="text-gray-600">
//             {fromPrePo
//               ? "Create a purchase order based on the approved Pre-PO request"
//               : location.state?.reorderData
//               ? "Review and modify the reorder details below"
//               : "Fill in the details below to create a new purchase order"}
//           </p>

//           {location.state?.reorderData && (
//             <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
//               <svg
//                 className="w-4 h-4 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
//                 />
//               </svg>
//               {fromPrePo ? "Pre-PO Based Order" : "Reorder Mode - All fields are editable"}
//             </div>
//           )}
//         </div>

//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
//             Basic Information
//           </h2>

//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Company *
//                 </label>
//                 <select
//                   value={selectedCompany}
//                   onChange={(e) => setSelectedCompany(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                 >
//                   <option value="">-- Select Company --</option>
//                   {companies.map((c) => (
//                     <option key={c.id} value={c.id}>
//                       {c.companyName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Vendor *
//                 </label>
//                 <select
//                   value={selectedVendor}
//                   onChange={(e) => setSelectedVendor(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                 >
//                   <option value="">-- Select Vendor --</option>
//                   {vendorsList.map((v) => (
//                     <option key={v.id} value={v.id}>
//                       {v.displayName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select GST Type *
//                 </label>
//                 <select
//                   value={selectedGstType}
//                   onChange={(e) => setSelectedGstType(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                 >
//                   <option value="">-- Select GST Type --</option>
//                   {gstTypes.map((gst) => (
//                     <option key={gst.value} value={gst.value}>
//                       {gst.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Currency *
//                 </label>
//                 <select
//                   value={currency}
//                   onChange={(e) => setCurrency(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                 >
//                   {currencyOptions.map((option) => (
//                     <option key={option.value} value={option.value}>
//                       {option.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Exchange Rate{" "}
//                   {currency !== "INR" && `(1 ${currency} = ? INR)`}
//                 </label>
//                 <input
//                   type="text"
//                   value={exchangeRate}
//                   onChange={(e) => setExchangeRate(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder={
//                     currency === "INR" ? "1.00 (Fixed)" : "Enter exchange rate"
//                   }
//                   step="0.01"
//                   min="0.01"
//                   disabled={currency === "INR"}
//                 />
//                 {currency === "INR" && (
//                   <p className="mt-1 text-sm text-gray-500">
//                     INR is base currency
//                   </p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Select Warehouse *
//                 </label>
//                 <select
//                   value={selectedWarehouse}
//                   onChange={(e) => setSelectedWarehouse(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                 >
//                   <option value="">-- Select Warehouse --</option>
//                   {warehouseList.map((warehouse) => (
//                     <option key={warehouse.value} value={warehouse.value}>
//                       {warehouse.label}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Payment Terms
//                 </label>
//                 <input
//                   type="text"
//                   value={paymentTerms}
//                   onChange={(e) => setPaymentTerms(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder="e.g., 60 Days Credit"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Delivery Terms
//                 </label>
//                 <input
//                   type="text"
//                   value={deliveryTerms}
//                   onChange={(e) => setDeliveryTerms(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder="e.g., Immediate"
//                 />
//               </div>
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Warranty
//                 </label>
//                 <input
//                   type="text"
//                   value={warranty}
//                   onChange={(e) => setWarranty(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder="Enter warranty details"
//                 />
//               </div>

//               <div className="mb-4">
//                 <label className="block text-gray-700 text-sm font-medium mb-2">
//                   Expected Delivery Date
//                 </label>
//                 <input
//                   type="date"
//                   value={expectedDeliveryDate}
//                   onChange={(e) => setExpectedDeliveryDate(e.target.value)}
//                   // min={new Date().toISOString().split("T")[0]}
//                   className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Contact Person
//                 </label>
//                 <input
//                   type="text"
//                   value={contactPerson}
//                   onChange={(e) => setContactPerson(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder="Enter contact person name"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Contact Number
//                 </label>
//                 <input
//                   type="text"
//                   value={cellNo}
//                   onChange={(e) => setCellNo(e.target.value)}
//                   className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                   placeholder="Enter contact number"
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ITEM SECTION */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           {selectedGstType && (
//             <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
//               <div className="flex items-center">
//                 <svg
//                   className="w-5 h-5 text-blue-600 mr-2"
//                   fill="currentColor"
//                   viewBox="0 0 20 20"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//                 <span className="font-medium text-blue-800">
//                   Selected GST Type:
//                 </span>
//                 <span className="ml-2 text-blue-700">
//                   {gstTypes.find((gst) => gst.value === selectedGstType)?.label}
//                   {!isItemWiseGST && (
//                     <span className="ml-2 font-medium">
//                       (Rate: {getFixedGSTRate()}%)
//                     </span>
//                   )}
//                   {isItemWiseGST && (
//                     <span className="ml-2 font-medium">
//                       (Itemwise GST - Enter rate for each item)
//                     </span>
//                   )}
//                 </span>
//               </div>
//             </div>
//           )}

//           <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//             <div className="flex items-center">
//               <svg
//                 className="w-5 h-5 text-yellow-600 mr-2"
//                 fill="currentColor"
//                 viewBox="0 0 20 20"
//               >
//                 <path
//                   fillRule="evenodd"
//                   d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               <span className="font-medium text-yellow-800">Currency:</span>
//               <span className="ml-2 text-yellow-700">
//                 All amounts are in {currency} ({getCurrencySymbol(currency)})
//                 {currency !== "INR" && exchangeRate && (
//                   <span className="ml-2">
//                     (Exchange Rate: 1 {currency} ={" "}
//                     {parseFloat(exchangeRate).toFixed(3)} INR)
//                   </span>
//                 )}
//               </span>
//             </div>
//           </div>

//           <div className="space-y-6">
//             {itemDetails.map((item, index) => (
//               <div
//                 key={item.id}
//                 className="border border-gray-200 rounded-xl overflow-hidden"
//               >
//                 <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
//                   <h3 className="text-lg font-semibold text-gray-800">
//                     Item {index + 1}
//                   </h3>
//                   {itemDetails.length > 1 && (
//                     <button
//                       type="button"
//                       className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
//                       onClick={() => removeItemDetail(item.id)}
//                     >
//                       Remove
//                     </button>
//                   )}
//                 </div>

//                 <div className="p-6">
//                   <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
//                     Item Details
//                   </h2>
//                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                     <div
//                       className="relative"
//                       ref={(el) => (dropdownRefs.current[item.id] = el)}
//                     >
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Select Item *
//                         {loadingItems[item.id] && (
//                           <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                             <svg
//                               className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                               ></circle>
//                               <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                               ></path>
//                             </svg>
//                             Loading...
//                           </span>
//                         )}
//                       </label>

//                       <button
//                         type="button"
//                         onClick={() => toggleItemDropdown(item.id)}
//                         disabled={loadingItems[item.id]}
//                         className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex justify-between items-center ${
//                           loadingItems[item.id] ? "opacity-50" : ""
//                         }`}
//                       >
//                         <span className="truncate">
//                           {item.selectedItem
//                             ? (() => {
//                                 const selected = itemList.find(
//                                   (i) => i.id === item.selectedItem,
//                                 );
//                                 return selected
//                                   ? selected.name
//                                   : "-- Choose Item --";
//                               })()
//                             : "-- Choose Item --"}
//                         </span>
//                         <svg
//                           className={`w-5 h-5 text-gray-400 transform transition-transform ${
//                             openItemDropdown === item.id ? "rotate-180" : ""
//                           }`}
//                           fill="none"
//                           stroke="currentColor"
//                           viewBox="0 0 24 24"
//                         >
//                           <path
//                             strokeLinecap="round"
//                             strokeLinejoin="round"
//                             strokeWidth={2}
//                             d="M19 9l-7 7-7-7"
//                           />
//                         </svg>
//                       </button>

//                       {openItemDropdown === item.id && (
//                         <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
//                           <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
//                             <div className="relative">
//                               <svg
//                                 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
//                                 fill="none"
//                                 stroke="currentColor"
//                                 viewBox="0 0 24 24"
//                               >
//                                 <path
//                                   strokeLinecap="round"
//                                   strokeLinejoin="round"
//                                   strokeWidth={2}
//                                   d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
//                                 />
//                               </svg>
//                               <input
//                                 type="text"
//                                 value={searchQuery[item.id] || ""}
//                                 onChange={(e) =>
//                                   handleSearchChange(item.id, e.target.value)
//                                 }
//                                 placeholder="Search items by name, HSN, or model..."
//                                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                                 autoFocus
//                               />
//                               {searchQuery[item.id] && (
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     handleSearchChange(item.id, "")
//                                   }
//                                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                                 >
//                                   <svg
//                                     className="w-5 h-5"
//                                     fill="none"
//                                     stroke="currentColor"
//                                     viewBox="0 0 24 24"
//                                   >
//                                     <path
//                                       strokeLinecap="round"
//                                       strokeLinejoin="round"
//                                       strokeWidth={2}
//                                       d="M6 18L18 6M6 6l12 12"
//                                     />
//                                   </svg>
//                                 </button>
//                               )}
//                             </div>
//                             <div className="mt-1 text-xs text-gray-500">
//                               Type to search items. Showing{" "}
//                               {getFilteredItems(item.id).length} of{" "}
//                               {itemList.length} items.
//                             </div>
//                             {/* NEW: Add Item button inside dropdown header */}
//                             <button
//                               type="button"
//                               onClick={() =>
//                                 openAddItemModal(item.id, searchQuery[item.id] || "")
//                               }
//                               className="mt-2 w-full flex items-center justify-center px-3 py-2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-100"
//                             >
//                               + Add New Item
//                             </button>
//                           </div>

//                           <div className="overflow-y-auto max-h-64">
//                             {getFilteredItems(item.id).length > 0 ? (
//                               getFilteredItems(item.id).map((itemOption) => (
//                                 <button
//                                   key={itemOption.id}
//                                   type="button"
//                                   onClick={() =>
//                                     handleItemSelectFromDropdown(
//                                       item.id,
//                                       itemOption.id,
//                                     )
//                                   }
//                                   className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0 ${
//                                     item.selectedItem === itemOption.id
//                                       ? "bg-blue-50"
//                                       : ""
//                                   }`}
//                                 >
//                                   <div className="font-medium text-gray-900">
//                                     {itemOption.name + " - "}
//                                     {itemOption.source === "mongo"
//                                       ? "Installation Material"
//                                       : "Raw Material"}
//                                   </div>
//                                   <div className="flex flex-wrap gap-2 mt-1">
//                                     {itemOption.hsnCode && (
//                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
//                                         HSN: {itemOption.hsnCode}
//                                       </span>
//                                     )}
//                                     {itemOption.modelNumber && (
//                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
//                                         Model: {itemOption.modelNumber}
//                                       </span>
//                                     )}
//                                     {itemOption.rate && (
//                                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
//                                         {getCurrencySymbol(currency)}
//                                         {parseFloat(itemOption.rate).toFixed(3)}
//                                       </span>
//                                     )}
//                                   </div>
//                                   {itemOption.itemDetail && (
//                                     <div className="mt-1 text-xs text-gray-500 truncate">
//                                       {itemOption.itemDetail}
//                                     </div>
//                                   )}
//                                 </button>
//                               ))
//                             ) : (
//                               <div className="px-4 py-8 text-center">
//                                 <svg
//                                   className="w-12 h-12 text-gray-300 mx-auto mb-3"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={1.5}
//                                     d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                                   />
//                                 </svg>
//                                 <p className="text-gray-500">
//                                   No items found for "{searchQuery[item.id]}"
//                                 </p>
//                                 <p className="text-sm text-gray-400 mt-1">
//                                   Try different search terms
//                                 </p>
//                                 {/* NEW: Add button in empty state with search term */}
//                                 <button
//                                   type="button"
//                                   onClick={() =>
//                                     openAddItemModal(item.id, searchQuery[item.id] || "")
//                                   }
//                                   className="mt-3 px-4 py-2 bg-yellow-400 text-dark rounded-lg font-medium"
//                                 >
//                                   + Add "{searchQuery[item.id] || "New Item"}" as New Item
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       )}

//                       {!item.selectedItem &&
//                         location.state?.reorderData?.items?.[index] && (
//                           <p className="mt-1 text-sm text-gray-500">
//                             Original:{" "}
//                             {location.state.reorderData.items[index].itemName}
//                           </p>
//                         )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Select Unit
//                         {loadingItems[item.id] && (
//                           <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                             <svg
//                               className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
//                               xmlns="http://www.w3.org/2000/svg"
//                               fill="none"
//                               viewBox="0 0 24 24"
//                             >
//                               <circle
//                                 className="opacity-25"
//                                 cx="12"
//                                 cy="12"
//                                 r="10"
//                                 stroke="currentColor"
//                                 strokeWidth="4"
//                               ></circle>
//                               <path
//                                 className="opacity-75"
//                                 fill="currentColor"
//                                 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                               ></path>
//                             </svg>
//                             Loading...
//                           </span>
//                         )}
//                       </label>
//                       <select
//                         value={item.selectedUnit}
//                         onChange={(e) =>
//                           updateItemDetail(
//                             item.id,
//                             "selectedUnit",
//                             e.target.value,
//                           )
//                         }
//                         disabled={loadingItems[item.id]}
//                         className={`w-full px-4 py-2.5 border ${
//                           item.selectedItem && !item.selectedUnit
//                             ? "border-orange-300"
//                             : "border-gray-300"
//                         } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
//                           loadingItems[item.id] ? "opacity-50" : ""
//                         }`}
//                       >
//                         <option value="">-- Choose Unit --</option>
//                         {unitTypes.length === 0 ? (
//                           <option value="" disabled>
//                             Loading units...
//                           </option>
//                         ) : (
//                           unitTypes.map((u) => (
//                             <option key={u.value} value={u.value}>
//                               {u.label}
//                             </option>
//                           ))
//                         )}
//                       </select>
//                       {item.selectedUnit ? (
//                         <p className="mt-1 text-xs text-green-600">
//                           Current unit: {item.selectedUnit}
//                         </p>
//                       ) : item.selectedItem && !loadingItems[item.id] ? (
//                         <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
//                           <p className="text-xs text-orange-600 flex items-center">
//                             <svg
//                               className="w-4 h-4 mr-1"
//                               fill="none"
//                               stroke="currentColor"
//                               viewBox="0 0 24 24"
//                             >
//                               <path
//                                 strokeLinecap="round"
//                                 strokeLinejoin="round"
//                                 strokeWidth={2}
//                                 d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
//                               />
//                             </svg>
//                             No unit available for this item. Please select a
//                             unit manually.
//                           </p>
//                         </div>
//                       ) : null}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         HSN Code *
//                       </label>

//                       {!editableHsn[item.id] &&
//                       item.hsnCode &&
//                       item.hsnCode.trim() !== "" ? (
//                         <div className="relative">
//                           <div className="w-full px-4 py-2.5 border border-green-300 bg-green-50 rounded-lg text-gray-700 font-medium flex items-center justify-between">
//                             <div className="flex items-center">
//                               <span className="font-semibold">
//                                 {item.hsnCode}
//                               </span>
//                               <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
//                                 <svg
//                                   className="w-3 h-3 mr-1"
//                                   fill="currentColor"
//                                   viewBox="0 0 20 20"
//                                 >
//                                   <path
//                                     fillRule="evenodd"
//                                     d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                                     clipRule="evenodd"
//                                   />
//                                 </svg>
//                                 From Item
//                               </span>
//                             </div>
//                             <button
//                               type="button"
//                               onClick={() => toggleHsnEditMode(item.id)}
//                               className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
//                             >
//                               Edit
//                             </button>
//                           </div>
//                           <p className="mt-1 text-xs text-green-600">
//                             HSN code loaded from item data
//                           </p>
//                         </div>
//                       ) : (
//                         <div className="relative">
//                           <input
//                             type="text"
//                             value={item.hsnCode}
//                             onChange={(e) =>
//                               handleHsnCodeChange(item.id, e.target.value)
//                             }
//                             className={`w-full px-4 py-2.5 border ${
//                               !item.hsnCode
//                                 ? "border-orange-300"
//                                 : "border-gray-300"
//                             } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
//                             placeholder="Enter HSN code"
//                             required
//                           />

//                           {editableHsn[item.id] &&
//                           item.hsnCode &&
//                           item.hsnCode.trim() !== "" ? (
//                             <p className="mt-1 text-xs text-blue-600">
//                               Enter HSN code for this item
//                             </p>
//                           ) : editableHsn[item.id] &&
//                             (!item.hsnCode || item.hsnCode.trim() === "") ? (
//                             <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded">
//                               <p className="text-xs text-orange-600 flex items-center">
//                                 <svg
//                                   className="w-4 h-4 mr-1"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
//                                   />
//                                 </svg>
//                                 This item doesn't have HSN code. Please enter
//                                 one.
//                               </p>
//                             </div>
//                           ) : null}

//                           {editableHsn[item.id] &&
//                             item.hsnCode &&
//                             item.hsnCode.trim() !== "" && (
//                               <div className="absolute right-2 top-2">
//                                 <button
//                                   type="button"
//                                   onClick={() => toggleHsnEditMode(item.id)}
//                                   className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
//                                 >
//                                   Save
//                                 </button>
//                               </div>
//                             )}
//                         </div>
//                       )}
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Model Number
//                       </label>
//                       <input
//                         type="text"
//                         value={item.modelNumber}
//                         onChange={(e) =>
//                           updateItemDetail(
//                             item.id,
//                             "modelNumber",
//                             e.target.value,
//                           )
//                         }
//                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                         placeholder="Enter model number"
//                       />

//                       {item.selectedItem && getCheapestPriceDisplay(item.selectedItem)}
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Quantity
//                       </label>
//                       <input
//                         type="text"
//                         value={item.quantity}
//                         onChange={(e) => {
//                           const value = e.target.value;
//                           if (/^\d*\.?\d*$/.test(value)) {
//                             updateItemDetail(item.id, "quantity", value);
//                           }
//                         }}
//                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                         placeholder="0"
//                         inputMode="numeric"
//                         pattern="[0-9]*"
//                       />
//                       <p className="mt-1 text-xs text-gray-500">
//                         Enter quantity in {item.selectedUnit || "unit"}
//                       </p>
//                     </div>
//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Rate
//                       </label>
//                       <input
//                         type="text"
//                         value={item.rate}
//                         onChange={(e) => {
//                           const value = e.target.value;
//                           if (/^\d*\.?\d*$/.test(value)) {
//                             updateItemDetail(item.id, "rate", value);
//                           }
//                         }}
//                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                         placeholder="0"
//                         inputMode="numeric"
//                         pattern="[0-9]*"
//                         disabled={!item.quantity.toString().length >= 1}
//                       />
//                       <p className="mt-1 text-xs text-gray-500">
//                         Enter rate per unit
//                       </p>
//                     </div>

//                     <div>
//                       <label className="block text-sm font-medium text-gray-700 mb-2">
//                         Total Amount
//                       </label>
//                       <input
//                         type="text"
//                         value={item.amount}
//                         onChange={(e) => {
//                           const value = e.target.value;
//                           if (/^\d*\.?\d*$/.test(value)) {
//                             updateItemDetail(item.id, "amount", value);
//                           }
//                         }}
//                         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                         placeholder="0"
//                         inputMode="numeric"
//                         pattern="[0-9]*"
//                         disabled={!item.quantity.toString().length >= 1}
//                       />
//                       <p className="mt-1 text-xs text-gray-500">
//                         Total without GST
//                       </p>
//                     </div>
//                   </div>

//                   {isItemWiseGST && (
//                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             GST Rate (%) *
//                           </label>
//                           <input
//                             type="text"
//                             value={item.gstRate}
//                             onChange={(e) =>
//                               updateItemDetail(
//                                 item.id,
//                                 "gstRate",
//                                 e.target.value,
//                               )
//                             }
//                             className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                             placeholder="0.00"
//                             step="0.01"
//                             min="0"
//                             max="100"
//                           />
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             Taxable Amount 
//                           </label>
//                           <div className="px-4 py-2.5 border border-gray-300 bg-gray-50 rounded-lg text-gray-700 font-medium">
//                             {item.taxableAmount.toFixed(3)}
//                           </div>
//                         </div>

//                         <div>
//                           <label className="block text-sm font-medium text-gray-700 mb-2">
//                             GST Amount
//                           </label>
//                           <div className="px-4 py-2.5 border border-gray-300 bg-gray-50 rounded-lg text-gray-700 font-medium">
//                             {item.gstAmount.toFixed(3)}
//                           </div>
//                         </div>
//                       </div>

//                       {item.gstRate && (
//                         <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
//                           <svg
//                             className="w-4 h-4 mr-1.5"
//                             fill="currentColor"
//                             viewBox="0 0 20 20"
//                           >
//                             <path
//                               fillRule="evenodd"
//                               d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                               clipRule="evenodd"
//                             />
//                           </svg>
//                           Item GST Rate: {item.gstRate}%
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div className="mt-6">
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Item Description
//                       {loadingItems[item.id] && (
//                         <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
//                           <svg
//                             className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500"
//                             xmlns="http://www.w3.org/2000/svg"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                           >
//                             <circle
//                               className="opacity-25"
//                               cx="12"
//                               cy="12"
//                               r="10"
//                               stroke="currentColor"
//                               strokeWidth="4"
//                             ></circle>
//                             <path
//                               className="opacity-75"
//                               fill="currentColor"
//                               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                             ></path>
//                           </svg>
//                           Loading...
//                         </span>
//                       )}
//                     </label>
//                     <textarea
//                       value={item.itemDetail}
//                       onChange={(e) =>
//                         updateItemDetail(item.id, "itemDetail", e.target.value)
//                       }
//                       disabled={loadingItems[item.id]}
//                       className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
//                         loadingItems[item.id] ? "opacity-50" : ""
//                       }`}
//                       placeholder="Enter item specifications, description, and other details..."
//                       rows="3"
//                     />
//                     {loadingItems[item.id] && (
//                       <p className="mt-1 text-xs text-blue-600">
//                         Item description will be auto-filled from database if
//                         available
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-200">
//             <button
//               type="button"
//               className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg transition-colors duration-200 font-medium flex items-center"
//               onClick={addItemDetail}
//             >
//               <svg
//                 className="w-5 h-5 mr-2"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M12 4v16m8-8H4"
//                 />
//               </svg>
//               Add Item
//             </button>
//           </div>
//         </div>

//         {/* OTHER CHARGES SECTION - Collapsible */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-200">
//             <div className="flex items-center space-x-4">
//               <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">
//                 Other Charges
//               </h2>
//               <button
//                 type="button"
//                 className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center"
//                 onClick={() => setShowOtherCharges(!showOtherCharges)}
//               >
//                 <svg
//                   className={`w-5 h-5 mr-2 transform transition-transform ${
//                     showOtherCharges ? "rotate-180" : ""
//                   }`}
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M19 9l-7 7-7-7"
//                   />
//                 </svg>
//                 {showOtherCharges ? "Hide Charges" : "Show Charges"}
//               </button>
//             </div>

//             {showOtherCharges && (
//               <button
//                 type="button"
//                 className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium flex items-center"
//                 onClick={addOtherCharge}
//               >
//                 <svg
//                   className="w-5 h-5 mr-2"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 4v16m8-8H4"
//                   />
//                 </svg>
//                 Add Charge
//               </button>
//             )}
//           </div>

//           {showOtherCharges && (
//             <div className="space-y-6">
//               {otherCharges.map((charge, index) => (
//                 <div
//                   key={charge.id}
//                   className="border border-gray-200 rounded-xl overflow-hidden"
//                 >
//                   <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
//                     <h3 className="text-lg font-semibold text-gray-800">
//                       Charge {index + 1}
//                     </h3>
//                     {otherCharges.length > 1 && (
//                       <button
//                         type="button"
//                         className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
//                         onClick={() => removeOtherCharge(charge.id)}
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>

//                   <div className="p-6">
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Charge Name
//                         </label>
//                         <input
//                           type="text"
//                           value={charge.name}
//                           onChange={(e) =>
//                             updateOtherCharge(charge.id, "name", e.target.value)
//                           }
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                           placeholder="e.g., Freight, Loading, Packaging, etc."
//                         />
//                       </div>

//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Amount
//                         </label>
//                         <input
//                           type="text"
//                           value={charge.amount}
//                           onChange={(e) =>
//                             updateOtherCharge(
//                               charge.id,
//                               "amount",
//                               e.target.value,
//                             )
//                           }
//                           className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
//                           placeholder="0.00"
//                           step="0.01"
//                           min="0"
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {!showOtherCharges && (
//             <div className="text-center py-8">
//               <svg
//                 className="w-16 h-16 text-gray-300 mx-auto mb-4"
//                 fill="none"
//                 stroke="currentColor"
//                 viewBox="0 0 24 24"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={1.5}
//                   d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//                 />
//               </svg>
//               <p className="text-gray-500 mb-4">No charges added yet</p>
//               <button
//                 type="button"
//                 className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium flex items-center mx-auto"
//                 onClick={() => {
//                   setShowOtherCharges(true);
//                   addOtherCharge();
//                 }}
//               >
//                 <svg
//                   className="w-5 h-5 mr-2"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 4v16m8-8H4"
//                   />
//                 </svg>
//                 Add Charge
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Submit Buttons */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4">
//             <button
//               type="button"
//               className="px-6 py-3 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               onClick={handleSubmit}
//               disabled={
//                 !selectedCompany ||
//                 !selectedVendor ||
//                 !selectedGstType ||
//                 (currency !== "INR" &&
//                   (!exchangeRate || parseFloat(exchangeRate) <= 0))
//               }
//             >
//               {fromPrePo
//                 ? "Create PO from Pre-PO"
//                 : location.state?.reorderData
//                 ? "Create ReOrder"
//                 : "Create Purchase Order"}
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Add Item Modal */}
//       {showAddItemModal && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
//           onClick={(e) => {
//             // close when clicking the backdrop (not the modal content itself)
//             if (e.target === e.currentTarget) {
//               setShowAddItemModal(false);
//             }
//           }}
//         >
//           <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
//             <button
//               type="button"
//               onClick={() => setShowAddItemModal(false)}
//               className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100"
//               aria-label="Close"
//             >
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//               </svg>
//             </button>
//             <AddRawMaterial
//               onSuccess={handleNewItemCreated}
//               closeModal={() => setShowAddItemModal(false)}
//               defaultName={addItemDefaultName} // if your AddRawMaterial accepts this prop (optional)
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CreatePurchaseOrder;

// CreatePurchaseOrder.jsx

import React, { useState, useEffect, useRef } from "react";
import Api from "../../auth/Api";
import { useLocation } from "react-router-dom";
import { removeStartingZero } from "../../utils/number/removeStartingZero";
import { usePODraft } from "../../hooks/usePODraft";
import AddRawMaterial from "../Purchase/AddRawMaterial";
import ExcelPurchaseOrderUpload from "./ExcelPurchaseOrderUpload";

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

        return {
          id: index + 1,
          selectedItem: foundItem?.id || "",
          hsnCode: foundItem?.hsnCode || item.hsnCode || "",
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

    const rateValid = rate !== "" && !isNaN(r) && r > 0;
    const quantityValid = quantity !== "" && !isNaN(q) && q > 0;
    const amountValid = amount !== "" && !isNaN(a) && a > 0;

    const validCount = [rateValid, quantityValid, amountValid].filter(
      Boolean,
    ).length;

    if (validCount === 2) {
      if (rateValid && quantityValid && !amountValid) {
        return { amount: r * q, rate: r, quantity: q };
      } else if (rateValid && amountValid && !quantityValid) {
        return { amount: a, rate: r, quantity: a / r };
      } else if (quantityValid && amountValid && !rateValid) {
        return { amount: a, rate: a / q, quantity: q };
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

        const hasHsnCode =
          selectedItemData.hsnCode && selectedItemData.hsnCode?.trim() !== "";

        let initialRate = selectedItemData.rate || "";

        let updatedItemDetails = itemDetails.map((item) => {
          if (item.id === id) {
            const updatedItem = {
              ...item,
              selectedItem: itemId,
              hsnCode: hasHsnCode ? selectedItemData.hsnCode : "",
              modelNumber: selectedItemData.modelNumber || "",
              selectedUnit: "",
              rate: initialRate,
              itemDetail: selectedItemData.itemDetail || "",
            };

            const calculatedAmounts = calculateItemAmounts(updatedItem);
            return {
              ...updatedItem,
              rate: calculatedAmounts.rate.toString(),
              quantity: calculatedAmounts.quantity.toString(),
              amount: calculatedAmounts.amount.toString(),
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
            const apiHasHsnCode =
              detailedItem.hsnCode && detailedItem.hsnCode?.trim() !== "";

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
                    newHsnCode = detailedItem.hsnCode?.trim();
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
                    rate: calculatedAmounts.rate.toString(),
                    quantity: calculatedAmounts.quantity.toString(),
                    amount: calculatedAmounts.amount.toString(),
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
              rate: value,
              amount: Number(newAmount.toFixed(3)),
            };
          }
          if (field === "amount") {
            const newRate = Number(value) / Number(updatedItem.quantity);
            return {
              ...updatedItem,
              rate: Number(newRate.toFixed(3)),
              amount: value,
            };
          }
          if (field === "quantity") {
            const newAmount = Number(value) * Number(updatedItem.rate);
            const newValue = Number(removeStartingZero(value));
            return {
              ...updatedItem,
              quantity: value,
              amount: Number(newAmount.toFixed(3)),
            };
          }
          if (isItemWiseGST && field === "gstRate") {
            const calculatedAmounts = calculateItemAmounts(updatedItem);
            return {
              ...updatedItem,
              gstRate: value,
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
          item.hsnCode.toLowerCase().includes(query.toLowerCase())) ||
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
      <div className="mt-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="p-2 bg-green-100 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-semibold text-green-800 mb-1">Cheapest Price</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <p className="text-xs text-green-600">Vendor</p>
                <p className="text-sm font-medium text-gray-800">{priceData.vendor}</p>
              </div>
              <div>
                <p className="text-xs text-green-600">Rate</p>
                <p className="text-sm font-bold text-green-700">
                  {getCurrencySymbol(priceData.currency)} {parseFloat(priceData.rate).toFixed(3)}
                  {priceData.currency !== "INR" && ` ${priceData.currency}`}
                </p>
              </div>
            </div>
          </div>
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
        const resolvedHsn = (
          createdItem?.hsnCode ?? newItem?.hsnCode ?? ""
        ).toString();
        const resolvedModel = (
          createdItem?.modelNumber ?? newItem?.modelNumber ?? ""
        ).toString();
        const resolvedUnit = (
          createdItem?.unit ?? newItem?.unit ?? ""
        ).toString();
        const resolvedRate = (
          createdItem?.rate ?? newItem?.rate ?? ""
        ).toString();
        const resolvedDetail = (
          createdItem?.itemDetail ??
          createdItem?.description ??
          newItem?.itemDetail ??
          ""
        ).toString();
        const resolvedGstRate = (createdItem?.gstRate ?? "").toString();

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
              rate: calculatedAmounts.rate.toString(),
              quantity: calculatedAmounts.quantity.toString(),
              amount: calculatedAmounts.amount.toString(),
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

  // Handle auto-fill from Excel
  const handleAutoFillFromExcel = (data) => {
    console.log('Auto-filling from Excel:', data);

    // Fill header information
    if (data.companyId) {
      setSelectedCompany(data.companyId);
    }
    if (data.vendorId) {
      setSelectedVendor(data.vendorId);
    }
    if (data.gstType) {
      setSelectedGstType(data.gstType);
    }
    if (data.currency) {
      setCurrency(data.currency);
    }
    if (data.exchangeRate) {
      setExchangeRate(data.exchangeRate);
    }
    if (data.warehouseId) {
      setSelectedWarehouse(data.warehouseId);
    }
    if (data.expectedDeliveryDate) {
      setExpectedDeliveryDate(data.expectedDeliveryDate);
    }
    if (data.paymentTerms) {
      setPaymentTerms(data.paymentTerms);
    }
    if (data.deliveryTerms) {
      setDeliveryTerms(data.deliveryTerms);
    }
    if (data.warranty) {
      setWarranty(data.warranty);
    }
    if (data.contactPerson) {
      setContactPerson(data.contactPerson);
    }
    if (data.cellNo) {
      setCellNo(data.cellNo);
    }

    // Fill items (multiple items from Excel)
    if (data.items && data.items.length > 0) {
      const newItemDetails = data.items.map((item, index) => {
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const amount = quantity * rate;

        const newItem = {
          id: index + 1,
          selectedItem: item.id || '',
          hsnCode: item.hsnCode || '',
          modelNumber: item.modelNumber || '',
          selectedUnit: item.unit || '',
          rate: item.rate || '',
          quantity: item.quantity || '',
          gstRate: item.gstRate || '',
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

    alert(`✅ Successfully auto-filled ${data.items?.length || 0} item(s) from Excel!`);
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

  // Calculate totals
  const itemTotals = itemDetails.reduce(
    (acc, item) => {
      return {
        amount: acc.amount + (parseFloat(item.amount) || 0),
        taxableAmount:
          acc.taxableAmount + (parseFloat(item.taxableAmount) || 0),
        gstAmount: acc.gstAmount + (parseFloat(item.gstAmount) || 0),
        totalAmount: acc.totalAmount + (parseFloat(item.totalAmount) || 0),
      };
    },
    { amount: 0, taxableAmount: 0, gstAmount: 0, totalAmount: 0 },
  );

  const otherChargesTotal = otherCharges.reduce((total, charge) => {
    return total + (parseFloat(charge.amount) || 0);
  }, 0);

  const finalTotals = {
    amount: itemTotals.amount,
    taxableAmount: itemTotals.taxableAmount,
    gstAmount: itemTotals.gstAmount,
    otherCharges: otherChargesTotal,
    totalAmount:
      itemTotals.taxableAmount + itemTotals.gstAmount + otherChargesTotal,
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
 console.log("Item List: ", itemDetails)
    const itemsWithoutHsn = itemDetails.filter(
      (item) => !item.hsnCode || item.hsnCode?.trim() === "",
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

    const invalidItems = itemDetails.filter(
      (item) =>
        !item.selectedItem || !item.hsnCode || !item.rate || !item.quantity || !item.selectedUnit
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
        cellNo,
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
            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
          };

          if (isItemWiseGST) {
            itemData.gstRate = item.gstRate.toString();
          }

          return itemData;
        }),
        otherCharges: otherCharges.map((charge) => ({
          name: charge.name,
          amount: charge.amount.toString(),
        })),
      };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {(processingReorder || downloadLoading) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700">
                {processingReorder && "Loading reorder data..."}
                {downloadLoading && "Downloading Purchase Order..."}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
                {fromPrePo
                  ? "Purchase Order from Pre-PO"
                  : location.state?.reorderData
                  ? "ReOrder Purchase Order"
                  : "Create Purchase Order"}
              </h1>
              <p className="text-gray-600 mt-1">
                {fromPrePo
                  ? "Create a purchase order based on the approved Pre-PO request"
                  : location.state?.reorderData
                  ? "Review and modify the reorder details below"
                  : "Fill in the details below to create a new purchase order"}
              </p>
            </div>
            
            {/* Excel Upload Button */}
            <button
              onClick={() => setShowExcelUpload(true)}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm whitespace-nowrap"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Upload Excel
            </button>
          </div>

          {location.state?.reorderData && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {fromPrePo ? "Pre-PO Based Order" : "Reorder Mode - All fields are editable"}
            </div>
          )}
        </div>

        {/* Draft Restored Banner */}
        {draftRestoredAt && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-amber-800">Draft Restored</p>
                <p className="text-sm text-amber-600">
                  Your unsaved progress from {new Date(draftRestoredAt).toLocaleString()} has been restored.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="ml-4 text-sm font-medium text-amber-700 hover:text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
            >
              Discard Draft
            </button>
          </div>
        )}

        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 pb-3 border-b border-gray-200">
            Basic Information
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company *
                </label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vendor *
                </label>
                <select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">-- Select Vendor --</option>
                  {vendorsList.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select GST Type *
                </label>
                <select
                  value={selectedGstType}
                  onChange={(e) => setSelectedGstType(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">-- Select GST Type --</option>
                  {gstTypes.map((gst) => (
                    <option key={gst.value} value={gst.value}>
                      {gst.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency *
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  {currencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exchange Rate {currency !== "INR" && `(1 ${currency} = ? INR)`}
                </label>
                <input
                  type="text"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder={currency === "INR" ? "1.00 (Fixed)" : "Enter exchange rate"}
                  step="0.01"
                  min="0.01"
                  disabled={currency === "INR"}
                />
                {currency === "INR" && (
                  <p className="mt-1 text-sm text-gray-500">INR is base currency</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Warehouse *
                </label>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => setSelectedWarehouse(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouseList.map((warehouse) => (
                    <option key={warehouse.value} value={warehouse.value}>
                      {warehouse.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="e.g., 60 Days Credit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Terms
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="e.g., Immediate"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty
                </label>
                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter warranty details"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Delivery Date *
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={cellNo}
                  onChange={(e) => setCellNo(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                  placeholder="Enter contact number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          {selectedGstType && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-blue-800">Selected GST Type:</span>
                <span className="ml-2 text-blue-700">
                  {gstTypes.find((gst) => gst.value === selectedGstType)?.label}
                  {!isItemWiseGST && (
                    <span className="ml-2 font-medium">(Rate: {getFixedGSTRate()}%)</span>
                  )}
                  {isItemWiseGST && (
                    <span className="ml-2 font-medium">(Itemwise GST - Enter rate for each item)</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-yellow-800">Currency:</span>
              <span className="ml-2 text-yellow-700">
                All amounts are in {currency} ({getCurrencySymbol(currency)})
                {currency !== "INR" && exchangeRate && (
                  <span className="ml-2">
                    (Exchange Rate: 1 {currency} = {parseFloat(exchangeRate).toFixed(3)} INR)
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="space-y-6">
            {itemDetails.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Item {index + 1}</h3>
                  {itemDetails.length > 1 && (
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                      onClick={() => removeItemDetail(item.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Item Details</h2>
                  
                  {/* Item selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="relative" ref={(el) => (dropdownRefs.current[item.id] = el)}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Item *
                        {loadingItems[item.id] && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </span>
                        )}
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleItemDropdown(item.id)}
                        disabled={loadingItems[item.id]}
                        className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 flex justify-between items-center ${
                          loadingItems[item.id] ? "opacity-50" : ""
                        }`}
                      >
                        <span className="truncate">
                          {item.selectedItem
                            ? (() => {
                                const selected = itemList.find((i) => i.id === item.selectedItem);
                                return selected ? selected.name : "-- Choose Item --";
                              })()
                            : "-- Choose Item --"}
                        </span>
                        <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${openItemDropdown === item.id ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openItemDropdown === item.id && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                          <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                            <div className="relative">
                              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <input
                                type="text"
                                value={searchQuery[item.id] || ""}
                                onChange={(e) => handleSearchChange(item.id, e.target.value)}
                                placeholder="Search items by name, HSN, or model..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => openAddItemModal(item.id, searchQuery[item.id] || "")}
                              className="mt-2 w-full flex items-center justify-center px-3 py-2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm font-medium rounded-lg hover:bg-yellow-100"
                            >
                              + Add New Item
                            </button>
                          </div>

                          <div className="overflow-y-auto max-h-64">
                            {getFilteredItems(item.id).length > 0 ? (
                              getFilteredItems(item.id).map((itemOption) => (
                                <button
                                  key={itemOption.id}
                                  type="button"
                                  onClick={() => handleItemSelectFromDropdown(item.id, itemOption.id)}
                                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-100 focus:outline-none border-b border-gray-100 last:border-b-0 ${
                                    item.selectedItem === itemOption.id ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <div className="font-medium text-gray-900">
                                    {itemOption.name + " - "}
                                    {itemOption.source === "mongo" ? "Installation Material" : "Raw Material"}
                                  </div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {itemOption.hsnCode && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        HSN: {itemOption.hsnCode}
                                      </span>
                                    )}
                                    {itemOption.modelNumber && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        Model: {itemOption.modelNumber}
                                      </span>
                                    )}
                                    {itemOption.rate && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                        {getCurrencySymbol(currency)}
                                        {parseFloat(itemOption.rate).toFixed(3)}
                                      </span>
                                    )}
                                  </div>
                                  {itemOption.itemDetail && (
                                    <div className="mt-1 text-xs text-gray-500 truncate">
                                      {itemOption.itemDetail}
                                    </div>
                                  )}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-8 text-center">
                                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-gray-500">No items found for "{searchQuery[item.id]}"</p>
                                <button
                                  type="button"
                                  onClick={() => openAddItemModal(item.id, searchQuery[item.id] || "")}
                                  className="mt-3 px-4 py-2 bg-yellow-400 text-dark rounded-lg font-medium"
                                >
                                  + Add "{searchQuery[item.id] || "New Item"}" as New Item
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Unit
                        {loadingItems[item.id] && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading...
                          </span>
                        )}
                      </label>
                      <select
                        value={item.selectedUnit}
                        onChange={(e) => updateItemDetail(item.id, "selectedUnit", e.target.value)}
                        disabled={loadingItems[item.id]}
                        className={`w-full px-4 py-2.5 border ${
                          item.selectedItem && !item.selectedUnit ? "border-orange-300" : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 ${
                          loadingItems[item.id] ? "opacity-50" : ""
                        }`}
                      >
                        <option value="">-- Choose Unit --</option>
                        {unitTypes.length === 0 ? (
                          <option value="" disabled>Loading units...</option>
                        ) : (
                          unitTypes.map((u) => (
                            <option key={u.value} value={u.value}>{u.label}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {/* HSN and Model */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">HSN Code *</label>
                      {/* {!editableHsn[item.id] && item.hsnCode && item?.hsnCode?.trim() !== "" ? ( */}
                      {!editableHsn[item.id] && String(item?.hsnCode ?? "").trim() !== "" ? (
                        <div className="relative">
                          <div className="w-full px-4 py-2.5 border border-green-300 bg-green-50 rounded-lg text-gray-700 font-medium flex items-center justify-between">
                            <div className="flex items-center">
                              <span className="font-semibold">{item.hsnCode}</span>
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                From Item
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleHsnEditMode(item.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium px-2 py-1 rounded hover:bg-blue-50"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) => handleHsnCodeChange(item.id, e.target.value)}
                            className={`w-full px-4 py-2.5 border ${
                              !item.hsnCode ? "border-orange-300" : "border-gray-300"
                            } rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                            placeholder="Enter HSN code"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Model Number</label>
                      <input
                        type="text"
                        value={item.modelNumber}
                        onChange={(e) => updateItemDetail(item.id, "modelNumber", e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="Enter model number"
                      />
                      {item.selectedItem && getCheapestPriceDisplay(item.selectedItem)}
                    </div>
                  </div>

                  {/* Quantity, Rate, Amount */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            updateItemDetail(item.id, "quantity", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rate</label>
                      <input
                        type="text"
                        value={item.rate}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            updateItemDetail(item.id, "rate", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                      <input
                        type="text"
                        value={item.amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (/^\d*\.?\d*$/.test(value)) {
                            updateItemDetail(item.id, "amount", value);
                          }
                        }}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        placeholder="0"
                        inputMode="numeric"
                      />
                    </div>
                  </div>

                  {/* GST for Itemwise */}
                  {isItemWiseGST && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GST Rate (%) *</label>
                          <input
                            type="text"
                            value={item.gstRate}
                            onChange={(e) => updateItemDetail(item.id, "gstRate", e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Taxable Amount</label>
                          <div className="px-4 py-2.5 border border-gray-300 bg-gray-50 rounded-lg text-gray-700 font-medium">
                            {item.taxableAmount.toFixed(3)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">GST Amount</label>
                          <div className="px-4 py-2.5 border border-gray-300 bg-gray-50 rounded-lg text-gray-700 font-medium">
                            {item.gstAmount.toFixed(3)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Item Description */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Description</label>
                    <textarea
                      value={item.itemDetail}
                      onChange={(e) => updateItemDetail(item.id, "itemDetail", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                      placeholder="Enter item specifications, description, and other details..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-200">
            <button
              type="button"
              className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg transition-colors duration-200 font-medium flex items-center"
              onClick={addItemDetail}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>
          </div>
        </div>

        {/* Other Charges */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-3 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">Other Charges</h2>
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center"
                onClick={() => setShowOtherCharges(!showOtherCharges)}
              >
                <svg className={`w-5 h-5 mr-2 transform transition-transform ${showOtherCharges ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showOtherCharges ? "Hide Charges" : "Show Charges"}
              </button>
            </div>

            {showOtherCharges && (
              <button
                type="button"
                className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium flex items-center"
                onClick={addOtherCharge}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Charge
              </button>
            )}
          </div>

          {showOtherCharges && (
            <div className="space-y-6">
              {otherCharges.map((charge, index) => (
                <div key={charge.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">Charge {index + 1}</h3>
                    {otherCharges.length > 1 && (
                      <button
                        type="button"
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                        onClick={() => removeOtherCharge(charge.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Charge Name</label>
                        <input
                          type="text"
                          value={charge.name}
                          onChange={(e) => updateOtherCharge(charge.id, "name", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          placeholder="e.g., Freight, Loading, Packaging, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                          type="text"
                          value={charge.amount}
                          onChange={(e) => updateOtherCharge(charge.id, "amount", e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!showOtherCharges && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 mb-4">No charges added yet</p>
              <button
                type="button"
                className="px-4 py-2.5 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium flex items-center mx-auto"
                onClick={() => {
                  setShowOtherCharges(true);
                  addOtherCharge();
                }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Charge
              </button>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              className="px-6 py-3 bg-yellow-400 text-dark rounded-lg hover:bg-yellow-400 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={
                !selectedCompany ||
                !selectedVendor ||
                !selectedGstType ||
                (currency !== "INR" && (!exchangeRate || parseFloat(exchangeRate) <= 0))
              }
            >
              {fromPrePo
                ? "Create PO from Pre-PO"
                : location.state?.reorderData
                ? "Create ReOrder"
                : "Create Purchase Order"}
            </button>
          </div>
        </div>

        {/* Excel Upload Modal */}
        {showExcelUpload && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
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
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddItemModal(false);
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
              <button
                type="button"
                onClick={() => setShowAddItemModal(false)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
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