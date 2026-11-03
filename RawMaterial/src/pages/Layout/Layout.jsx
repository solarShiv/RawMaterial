import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import SideMenubar from "../../components/SidebarMenu/SideMenubar";
import { getPageTitle, getInitials } from "../../components/SidebarMenu/menuConfig";
import { useUser } from "../../Context/UserContext";

const COLLAPSE_KEY = "sidebarCollapsed";

const Layout = () => {
  const { user } = useUser();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        // ignore storage errors
      }
      return !prev;
    });
  };

  const title = getPageTitle(pathname);
  const roleLabel = user?.role === "Admin" ? "Super Admin" : user?.role;

  return (
    <div className="min-h-screen w-full bg-ink-50">
      <SideMenubar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div
        className={`min-w-0 min-h-screen flex flex-col transition-[margin] duration-300 ${
          collapsed ? "lg:ml-[76px]" : "lg:ml-64"
        }`}
      >
        {/* Top bar */}
        <header className="h-16 shrink-0 sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 bg-white/90 backdrop-blur border-b border-ink-200">
          <button
            className="lg:hidden h-10 w-10 rounded-lg flex items-center justify-center bg-ink-950 text-brand-400"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <FaBars />
          </button>

          <div className="flex items-center gap-3 min-w-0">
            <span className="hidden sm:block h-6 w-1.5 rounded-full bg-brand-400" />
            <h1 className="text-lg font-bold text-ink-950 truncate">{title}</h1>
          </div>

          {user && (
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:block text-right leading-tight">
                <div className="text-sm font-semibold text-ink-900">{user.name || user.email}</div>
                <div className="text-xs text-ink-500 capitalize">{roleLabel}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-ink-950 text-brand-400 font-bold text-sm flex items-center justify-center">
                {getInitials(user.name || user.email)}
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
