import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import { PiWarehouseBold } from "react-icons/pi";
import { SiUnity } from "react-icons/si";
import {
  FaWarehouse,
  FaPlus,
  FaCogs,
  FaClipboardList,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaFileInvoice,
  FaBox, // added for Create Stock
} from "react-icons/fa";
import { MdOutlinePayment } from "react-icons/md";
import { IoStorefrontSharp } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";

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
const CHANGE_PASSWORD_ROLES = ["Purchase", "Verification", "Admin", "Accounts"];

const SideMenubar = () => {
  const { user, logout } = useUser();
  const [openMenus, setOpenMenus] = useState({
    company: false,
    vendor: false,
    purchase: false,
    Item: false,
    Payment: false,
    createStock: false,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  if (!user) {
    return (
      <div className="w-64 bg-gray-800 text-white h-screen p-4">Loading...</div>
    );
  }

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // -------- Flat menu items (standalone links) --------
  const flatMenuItems = [
    {
      path: "Item-Request",
      label: "Item Request",
      icon: FaWarehouse,
      roles: LINE_WORKER_ROLES,
    },
    {
      path: "Item-Request-history",
      label: "Item Request History",
      icon: FaWarehouse,
      roles: LINE_WORKER_ROLES,
    },
    {
      path: "user-Stock",
      label: "User Stock Data",
      icon: FaWarehouse,
      roles: LINE_WORKER_ROLES,
    },
    {
      path: "pending-process",
      label: "Pending Process",
      icon: FaWarehouse,
      roles: PENDING_LINE_WORKER_ROLES,
    },
    {
      path: "service-process-request",
      label: "Service Process Request",
      icon: FaCogs,
      roles: ["SFG Work", "Disassemble"],
    },
    {
      path: "store-keeper",
      label: "Approval Request",
      icon: FaClipboardList,
      roles: ["Store"],
    },
    {
      path: "single-out",
      label: "Raw Material Out",
      icon: FaClipboardList,
      roles: ["Store"],
    },
    {
      path: "return-material",
      label: "Return Material to Store",
      icon: FaClipboardList,
      roles: ["Store"],
    },
    {
      path: "po-stock-receiving",
      label: "PO Stock Receiving",
      icon: FaPlus,
      roles: ["Store"],
    },
    {
      path: "user-stock-data",
      label: "User Stock History",
      icon: IoStorefrontSharp,
      roles: ["Store", "Production"],
    },

        {
      path: "register-employee",
      label: "Register Employee",
      icon: IoStorefrontSharp,
      roles: ["Production"],
    },
    {
      path: "direct-item-issue-history",
      label: "Direct Item Issue History",
      icon: IoStorefrontSharp,
      roles: ["Store", "Production"],
    },
    {
      path: "purchase-dashboard",
      label: "Purchase Dashboard",
      icon: MdDashboard,
      roles: ["Purchase", "Admin"],
    },

    {
      path: "price-comparision",
      label: "Price Comparision",
      icon: MdDashboard,
      roles: ["Purchase", "Admin"],
    },
    {
      path: "store-tracking",
      label: "Service Tracking",
      icon: IoStorefrontSharp,
      roles: ["Store", "Production", "Admin"],
    },
    {
      path: "po-invoice",
      label: "PO Invoice",
      icon: FaFileInvoice,
      roles: ["Verification", "Admin", "Accounts"],
    },
    {
      path: "admin-dashboard",
      label: "Payment Approval",
      icon: MdOutlinePayment,
      roles: ["Superadmin", "Admin"],
    },
    {
      path: "approval-po-invoice",
      label: "PO Approval Invoice",
      icon: FaFileInvoice,
      roles: ["Admin"],
    },
    {
      path: "payment-request-details",
      label: "Payment Request Details",
      icon: IoStorefrontSharp,
      roles: ["Verification", "Accounts"],
    },
    {
      path: "account-details",
      label: "Vendor Details",
      icon: IoStorefrontSharp,
      roles: ["Accounts"],
    },
    // The following three are now moved to the "Create Stock" dropdown
    // {
    //   path: "raw-material-stock",
    //   label: "Raw Material Stock",
    //   icon: IoStorefrontSharp,
    //   roles: ["Store", "Purchase", "Production", "Admin"],
    // },
    // {
    //   path: "installation-stock",
    //   label: "Installation Stock Data",
    //   icon: FaCogs,
    //   roles: ["Purchase", "Admin", "Production", "Store"],
    // },
    // {
    //   path: "Installation",
    //   label: "Installation Shortage",
    //   icon: FaCogs,
    //   roles: ["Purchase", "Admin", "Production"],
    // },
    {
      path: "add-warehouse",
      label: "Add Warehouse",
      icon: PiWarehouseBold,
      roles: ["Purchase"],
    },
    // "add-unit" is now inside the "Item" nested menu
    {
      path: "po-payment-details",
      label: "PO Payment Details",
      icon: MdOutlinePayment,
      roles: ["Purchase", "Admin"],
    },
    {
      path: "vendor-all-details",
      label: "Vendor Order History",
      icon: IoStorefrontSharp,
      roles: ["Admin", "Production"],
    },
    {
      path: "po-order-details",
      label: "PO Received Details",
      icon: MdOutlinePayment,
      roles: ["Purchase", "Production", "Admin"],
    },
    {
      path: "stock-update",
      label: "Raw Material Stock Add",
      icon: MdOutlinePayment,
      roles: ["Store"],
    },
    {
      path: "pre-po",
      label: "Pre Po",
      icon: FaClipboardList,
      roles: ["PrePurchase", "Production"],
    },
    // "pre-po-request-history" is now inside the "Purchase" nested menu
  ];

  // -------- Nested menus (dropdowns) --------
  const nestedMenus = [

    {
      key: "purchase",
      label: "Purchase",
      icon: FaBuilding,
      roles: ["Purchase", "PrePurchase", "Production"], // visible to both
      items: [
        // Each sub‑item now has a `roles` array to control visibility
        { path: "create-purchase-order", label: "Create Purchase Order", roles: ["Purchase"] },
        { path: "show-purchase-orders", label: "Show Purchase Orders", roles: ["Purchase"] },
        { path: "invoice-po", label: "Invoice PO Document", roles: ["Purchase"] },
        { path: "pre-po-request-history", label: "Pre Po Request History", roles: ["Purchase", "PrePurchase", "Production"] },
      ],
    },

     {
      key: "Payment",
      label: "Payment",
      icon: MdOutlinePayment,
      roles: ["Purchase"],
      items: [{ path: "payment-pending", label: "Payment Pending" }],
    },

    {
      key: "createStock",
      label: "Stock",
      icon: FaBox,
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
      icon: FaBuilding,
      roles: ["Purchase", "Production"],
      items: [
        { path: "add-raw-material", label: "Add Raw Material" },
        { path: "item-details", label: "Item Detail" },
        { path: "add-unit", label: "Add Unit" }, // moved here
      ],
    },
    {
      key: "company",
      label: "Company",
      icon: FaBuilding,
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
      icon: FaBuilding,
      roles: ["Purchase", "Production"],
      items: [
        { path: "add-vendor", label: "Add Vendor" },
        { path: "update-vendor", label: "Update Vendor" },
        { path: "active-deactivate-vendor", label: "All Vendor" },
      ],
    },
    
   
    
  ];

  // Visibility helpers
  const isFlatItemVisible = (item) => {
    return item.roles.some((role) => user.role === role);
  };

  const isNestedMenuVisible = (menu) => {
    return menu.roles.some((role) => user.role === role);
  };

  // Check if a sub‑item is visible for the current user
  const isSubItemVisible = (subItem) => {
    if (subItem.roles) {
      return subItem.roles.includes(user.role);
    }
    return true;
  };

  // Render helpers
  const renderFlatItem = (item) => {
    if (!isFlatItemVisible(item)) return null;
    const Icon = item.icon;
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          className={({ isActive }) =>
            `flex items-center px-5 py-3 text-gray-700 hover:text-black hover:bg-yellow-100 
             border-l-4 border-transparent transition-all gap-3 ${
               isActive ? "bg-yellow-300 text-black border-yellow-600" : ""
             } ${isCollapsed ? "justify-center px-2" : ""}`
          }
          onClick={closeMobileMenu}
        >
          <Icon className="text-lg" />
          {!isCollapsed && <span>{item.label}</span>}
        </NavLink>
      </li>
    );
  };

  const renderNestedMenu = (menu) => {
    if (!isNestedMenuVisible(menu)) return null;
    const Icon = menu.icon;
    const isOpen = openMenus[menu.key];

    const visibleItems = menu.items.filter(isSubItemVisible);
    if (visibleItems.length === 0) return null;

    return (
      <li key={menu.key} className="border-b border-gray-300">
        <div
          className={`flex items-center justify-between px-5 py-3 cursor-pointer 
            text-gray-700 hover:text-black hover:bg-yellow-100 border-l-4 border-transparent transition-all
            ${isCollapsed ? "justify-center px-2" : ""}`}
          onClick={() => toggleMenu(menu.key)}
        >
          <span className="flex items-center gap-3 text-sm font-medium">
            <Icon className="text-lg" />
            {!isCollapsed && <span>{menu.label}</span>}
          </span>
          {!isCollapsed && (
            <span className="text-gray-600 transition-transform">
              {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </span>
          )}
        </div>
        {isOpen && !isCollapsed && (
          <ul className="bg-yellow-50">
            {visibleItems.map((subItem) => (
              <li key={subItem.path}>
                <NavLink
                  to={subItem.path}
                  className={({ isActive }) =>
                    `block py-2 px-5 pl-14 text-gray-700 hover:text-black hover:bg-yellow-100 border-l-4 
                     border-transparent transition-all relative text-sm ${
                       isActive ? "bg-yellow-300 text-black border-yellow-600" : ""
                     }`
                  }
                  onClick={closeMobileMenu}
                >
                  {subItem.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-yellow-400 text-black p-2 rounded-md shadow-lg"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`text-white h-screen fixed left-0 top-0 overflow-y-auto flex flex-col 
          bg-gradient-to-b from-[#F9EA76] to-[#FFF9DD] z-40
          transition-all duration-300 ease-in-out
          ${
            mobileMenuOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
          ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* User profile & close button for mobile */}
        <div className="bg-gray-700 border-b border-gray-600 p-4 flex items-center justify-between">
          <div
            className={`flex items-center ${isCollapsed ? "justify-center w-full" : ""}`}
          >
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
              <FaUser className="text-white text-xl" />
            </div>
            {!isCollapsed && (
              <div className="ml-3 flex-1">
                <div className="font-semibold text-white text-base truncate">
                  {user.name || user.email}
                </div>
                <div className="text-gray-300 text-sm capitalize truncate">
                  {user?.role === "Admin" ? "Super Admin" : user?.role}
                </div>
              </div>
            )}
          </div>
          <button
            className="lg:hidden text-gray-300 hover:text-white"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          className="hidden lg:flex items-center justify-center w-full py-2 text-gray-700 hover:bg-yellow-100 transition-colors"
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <FaChevronDown className="text-lg" />
          ) : (
            <FaChevronUp className="text-lg" />
          )}
        </button>

        {/* Menu items */}
        <ul className="flex-1 py-2 overflow-y-auto">
          {flatMenuItems.map(renderFlatItem)}
          {nestedMenus.map(renderNestedMenu)}
        </ul>

        {/* Logout and Change Password */}
        <div className="p-4 border-t border-gray-400 mt-auto">
          {CHANGE_PASSWORD_ROLES.includes(user.role) && (
            <NavLink
              to="change-password"
              className={({ isActive }) =>
                `flex items-center px-5 py-3 text-gray-700 hover:text-black hover:bg-yellow-100 
                 border-l-4 border-transparent transition-all gap-3 ${
                   isActive ? "bg-yellow-300 text-black border-yellow-600" : ""
                 } ${isCollapsed ? "justify-center px-2" : ""}`
              }
              onClick={closeMobileMenu}
            >
              <FaCogs className="text-lg" />
              {!isCollapsed && <span>Change Password</span>}
            </NavLink>
          )}
          <button
            className={`w-full bg-red-500 text-white border-none py-2 px-4 rounded 
              flex items-center justify-center gap-2 text-sm hover:bg-red-600 transition-colors
              ${isCollapsed ? "px-0" : ""}`}
            onClick={logout}
          >
            <FaSignOutAlt className="text-lg" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default SideMenubar;