import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useUser } from "../../Context/UserContext";
import {
  FaChevronDown,
  FaSignOutAlt,
  FaTimes,
  FaKey,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";
import {
  flatMenuItems,
  nestedMenus,
  CHANGE_PASSWORD_ROLES,
  getInitials,
} from "./menuConfig";

const linkClass = (isActive, collapsed) =>
  `group flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
    collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
  } ${
    isActive
      ? "bg-ink-950 text-white shadow-sm"
      : "text-ink-700 hover:bg-ink-100 hover:text-ink-950"
  }`;

const SideMenubar = ({ collapsed = false, mobileOpen = false, onToggleCollapse, onCloseMobile }) => {
  const { user, logout } = useUser();
  const { pathname } = useLocation();
  const [openMenus, setOpenMenus] = useState({});

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  // Auto-expand the group that contains the active route
  useEffect(() => {
    const current = pathname.split("/").filter(Boolean)[0];
    const parent = nestedMenus.find((m) => m.items.some((i) => i.path === current));
    if (parent) setOpenMenus((prev) => ({ ...prev, [parent.key]: true }));
  }, [pathname]);

  if (!user) {
    return <div className="w-64 bg-white text-ink-700 h-screen p-4">Loading...</div>;
  }

  const toggleMenu = (key) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  // Visibility helpers
  const hasRole = (roles) => roles.some((role) => user.role === role);
  const isSubItemVisible = (subItem) => (subItem.roles ? subItem.roles.includes(user.role) : true);

  const visibleFlat = flatMenuItems.filter((item) => hasRole(item.roles));
  const visibleNested = nestedMenus
    .filter((menu) => hasRole(menu.roles))
    .map((menu) => ({ ...menu, items: menu.items.filter(isSubItemVisible) }))
    .filter((menu) => menu.items.length > 0);

  const renderFlatItem = (item) => {
    const Icon = item.icon;
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) => linkClass(isActive, collapsed)}
          onClick={onCloseMobile}
        >
          <Icon className="text-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </NavLink>
      </li>
    );
  };

  const renderNestedMenu = (menu) => {
    const Icon = menu.icon;
    const isOpen = !!openMenus[menu.key];
    const hasActiveChild = menu.items.some((i) => pathname.split("/")[1] === i.path);

    return (
      <li key={menu.key}>
        <button
          type="button"
          title={collapsed ? menu.label : undefined}
          onClick={() => (collapsed ? onToggleCollapse?.() : toggleMenu(menu.key))}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
            collapsed ? "justify-center px-0 py-2" : "px-3 py-2"
          } ${
            hasActiveChild
              ? "bg-ink-100 text-ink-950 font-semibold"
              : "text-ink-700 hover:bg-ink-100 hover:text-ink-950"
          }`}
        >
          <Icon className="text-[18px] shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left truncate">{menu.label}</span>
              <FaChevronDown
                className={`text-xs transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              />
            </>
          )}
        </button>
        {isOpen && !collapsed && (
          <ul className="mt-0.5 mb-1 ml-5 pl-3 border-l border-ink-200 space-y-0.5 animate-slideDown">
            {menu.items.map((subItem) => (
              <li key={subItem.path}>
                <NavLink
                  to={subItem.path}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                      isActive
                        ? "bg-ink-950 text-white font-semibold"
                        : "text-ink-600 hover:text-ink-950 hover:bg-ink-100"
                    }`
                  }
                  onClick={onCloseMobile}
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

  const roleLabel = user?.role === "Admin" ? "Super Admin" : user?.role;

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-ink-950/60 backdrop-blur-sm z-40"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 h-screen shrink-0 flex flex-col
          bg-white text-ink-950 border-r border-ink-200
          transition-all duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[76px] w-72" : "w-72 lg:w-64"}`}
      >
        {/* Brand */}
        <div className={`h-16 shrink-0 flex items-center gap-3 bg-brand-400 text-ink-950 ${collapsed ? "justify-center px-2" : "px-5"}`}>
          <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src="/Galo.png" alt="Galo" className="h-7 w-7 object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight flex-1 min-w-0">
              <div className="font-bold tracking-tight text-ink-950">
                Galo <span className="text-ink-700">Energy</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-ink-700">Raw Material</div>
            </div>
          )}
          <button
            className="lg:hidden text-ink-700 hover:text-ink-950 p-1"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* Menu */}
        <nav className={`flex-1 overflow-y-auto sidebar-scroll bg-white py-3 px-3`}>
          {visibleFlat.length > 0 && (
            <>
              {!collapsed && <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Menu</p>}
              <ul className="space-y-0.5">{visibleFlat.map(renderFlatItem)}</ul>
            </>
          )}
          {visibleNested.length > 0 && (
            <>
              {!collapsed ? (
                <p className="px-3 mt-4 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">Modules</p>
              ) : (
                <div className="my-3 border-t border-ink-200" />
              )}
              <ul className="space-y-0.5">{visibleNested.map(renderNestedMenu)}</ul>
            </>
          )}
        </nav>

        {/* Footer: user, password, logout */}
        <div className="border-t border-ink-200 bg-white p-2.5 space-y-1">
          {CHANGE_PASSWORD_ROLES.includes(user.role) && (
            <NavLink
              to="change-password"
              title={collapsed ? "Change Password" : undefined}
              className={({ isActive }) => linkClass(isActive, collapsed)}
              onClick={onCloseMobile}
            >
              <FaKey className="text-[18px] shrink-0" />
              {!collapsed && <span>Change Password</span>}
            </NavLink>
          )}

          <div className={`flex items-center gap-3 rounded-xl bg-ink-100 p-2 ${collapsed ? "flex-col" : ""}`}>
            <div className="h-9 w-9 rounded-full bg-ink-950 text-white font-bold text-sm flex items-center justify-center shrink-0">
              {getInitials(user.name || user.email)}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{user.name || user.email}</div>
                <div className="text-xs text-ink-500 capitalize truncate">{roleLabel}</div>
              </div>
            )}
            <button
              onClick={logout}
              title="Logout"
              aria-label="Logout"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-600 hover:text-white hover:bg-red-500 transition-colors"
            >
              <FaSignOutAlt />
            </button>
          </div>

          {/* Collapse toggle (desktop only) */}
          <button
            className="hidden lg:flex w-full items-center justify-center gap-2 py-1.5 text-xs text-ink-500 hover:text-ink-950 transition-colors"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <FaAngleDoubleRight /> : <><FaAngleDoubleLeft /> Collapse</>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default SideMenubar;
