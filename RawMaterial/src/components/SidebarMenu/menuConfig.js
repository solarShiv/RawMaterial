import {
  MdAddShoppingCart,
  MdHistory,
  MdInventory2,
  MdPendingActions,
  MdBuildCircle,
  MdFactCheck,
  MdOutbox,
  MdAssignmentReturn,
  MdMoveToInbox,
  MdManageHistory,
  MdPersonAdd,
  MdReceiptLong,
  MdDashboard,
  MdCompareArrows,
  MdTrackChanges,
  MdDescription,
  MdPriceCheck,
  MdTaskAlt,
  MdRequestQuote,
  MdContactPage,
  MdWarehouse,
  MdPayments,
  MdStorefront,
  MdLocalShipping,
  MdNoteAdd,
  MdShoppingCart,
  MdAccountBalanceWallet,
  MdInventory,
  MdCategory,
  MdBusiness,
  MdGroups,
  MdAllInbox,
} from "react-icons/md";

// Static role arrays
const LINE_WORKER_ROLES = [
  "SFG Work",
  "Assemble",
  "Disassemble",
  "Stamping",
  "Winding",
  "Winding Connection",
];
const PENDING_LINE_WORKER_ROLES = [
  "SFG Work",
  "Assemble",
  "Disassemble",
  "Stamping",
  "Testing",
  "Winding",
  "Winding Connection",
];
export const CHANGE_PASSWORD_ROLES = ["Purchase", "Verification", "Admin", "Accounts"];

// -------- Flat menu items (standalone links) --------
export const flatMenuItems = [
  { path: "Item-Request", label: "Item Request", icon: MdAddShoppingCart, roles: LINE_WORKER_ROLES },
  { path: "Item-Request-history", label: "Item Request History", icon: MdHistory, roles: LINE_WORKER_ROLES },
  { path: "user-Stock", label: "User Stock Data", icon: MdInventory2, roles: LINE_WORKER_ROLES },
  { path: "pending-process", label: "Pending Process", icon: MdPendingActions, roles: PENDING_LINE_WORKER_ROLES },
  { path: "service-process-request", label: "Service Process Request", icon: MdBuildCircle, roles: ["SFG Work", "Disassemble"] },
  { path: "store-keeper", label: "Approval Request", icon: MdFactCheck, roles: ["Store"] },
  { path: "single-out", label: "Raw Material Out", icon: MdOutbox, roles: ["Store"] },
  { path: "return-material", label: "Return Material to Store", icon: MdAssignmentReturn, roles: ["Store"] },
  { path: "po-stock-receiving", label: "PO Stock Receiving", icon: MdMoveToInbox, roles: ["Store"] },
  { path: "add-container", label: "Add Container", icon: MdAllInbox, roles: ["Store"] },
  { path: "item-wise-container", label: "Item Wise Container", icon: MdInventory, roles: ["Store"] },
  { path: "user-stock-data", label: "User Stock History", icon: MdManageHistory, roles: ["Store", "Production"] },
  { path: "register-employee", label: "Register Employee", icon: MdPersonAdd, roles: ["Production"] },
  { path: "direct-item-issue-history", label: "Direct Item Issue History", icon: MdReceiptLong, roles: ["Store", "Production"] },
  { path: "purchase-dashboard", label: "Purchase Dashboard", icon: MdDashboard, roles: ["Purchase", "Admin"] },
  { path: "price-comparision", label: "Price Comparision", icon: MdCompareArrows, roles: ["Purchase", "Admin"] },
  { path: "store-tracking", label: "Service Tracking", icon: MdTrackChanges, roles: ["Store", "Production", "Admin"] },
  { path: "po-invoice", label: "PO Invoice", icon: MdDescription, roles: ["Verification", "Admin", "Accounts"] },
  { path: "admin-dashboard", label: "Payment Approval", icon: MdPriceCheck, roles: ["Superadmin", "Admin"] },
  { path: "approval-po-invoice", label: "PO Approval Invoice", icon: MdTaskAlt, roles: ["Admin"] },
  { path: "payment-request-details", label: "Payment Request Details", icon: MdRequestQuote, roles: ["Verification", "Accounts"] },
  { path: "account-details", label: "Vendor Details", icon: MdContactPage, roles: ["Accounts"] },
  { path: "add-warehouse", label: "Add Warehouse", icon: MdWarehouse, roles: ["Purchase"] },
  { path: "po-payment-details", label: "PO Payment Details", icon: MdPayments, roles: ["Purchase", "Admin"] },
  { path: "vendor-all-details", label: "Vendor Order History", icon: MdStorefront, roles: ["Admin", "Production"] },
  { path: "po-order-details", label: "PO Received Details", icon: MdLocalShipping, roles: ["Purchase", "Production", "Admin"] },
  { path: "pre-po", label: "Pre Po", icon: MdNoteAdd, roles: ["PrePurchase", "Production"] },
];

// -------- Nested menus (dropdowns) --------
// Sub-items may carry their own `roles` array to further restrict visibility
export const nestedMenus = [
  {
    key: "purchase",
    label: "Purchase",
    icon: MdShoppingCart,
    roles: ["Purchase", "PrePurchase", "Production"],
    items: [
      { path: "create-purchase-order", label: "Create Purchase Order", roles: ["Purchase"] },
      { path: "show-purchase-orders", label: "Show Purchase Orders", roles: ["Purchase"] },
      { path: "invoice-po", label: "Invoice PO Document", roles: ["Purchase"] },
      { path: "pre-po-request-history", label: "Pre Po Request History", roles: ["Purchase", "PrePurchase", "Production"] },
    ],
  },
  {
    key: "Payment",
    label: "Payment",
    icon: MdAccountBalanceWallet,
    roles: ["Purchase"],
    items: [{ path: "payment-pending", label: "Payment Pending" }],
  },
  {
    key: "createStock",
    label: "Stock",
    icon: MdInventory,
    roles: ["Purchase", "Admin", "Production", "Store"],
    items: [
      { path: "raw-material-stock", label: "Raw Material Stock", roles: ["Store", "Purchase", "Production", "Admin"] },
      { path: "installation-stock", label: "Installation Stock Data", roles: ["Purchase", "Admin", "Production", "Store"] },
      { path: "Installation", label: "Installation Shortage", roles: ["Purchase", "Admin", "Production"] },
    ],
  },
  {
    key: "Item",
    label: "Item",
    icon: MdCategory,
    roles: ["Purchase", "Production"],
    items: [
      { path: "add-raw-material", label: "Add Raw Material" },
      { path: "item-details", label: "Item Detail" },
      { path: "add-unit", label: "Add Unit" },
    ],
  },
  {
    key: "company",
    label: "Company",
    icon: MdBusiness,
    roles: ["Purchase"],
    items: [
      { path: "add-company", label: "Add Company" },
      { path: "update-company", label: "Update Company" },
      { path: "active-deactivate-company", label: "All Company" },
    ],
  },
  {
    key: "vendor",
    label: "Vendor",
    icon: MdGroups,
    roles: ["Purchase", "Production"],
    items: [
      { path: "add-vendor", label: "Add Vendor" },
      { path: "update-vendor", label: "Update Vendor" },
      { path: "active-deactivate-vendor", label: "All Vendor" },
    ],
  },
];

// Resolve a human-readable title for the current route
export const getPageTitle = (pathname) => {
  const first = pathname.split("/").filter(Boolean)[0] ?? "";
  if (!first) return "Dashboard";
  if (first === "change-password") return "Change Password";
  const flat = flatMenuItems.find((i) => i.path === first);
  if (flat) return flat.label;
  for (const menu of nestedMenus) {
    const sub = menu.items.find((i) => i.path === first);
    if (sub) return sub.label;
  }
  return first.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const getInitials = (name = "") =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "U";
