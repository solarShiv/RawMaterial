import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Search } from "lucide-react";

// Searchable multi-select whose menu is fixed-positioned so a scroll area can't clip it.
// options: [{ id, name, hint?, disabled? }]
const ContainerMultiSelect = ({ options, value = [], onChange, loading, invalid = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const handleScroll = (e) => {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  const toggleMenu = () => {
    if (open) {
      setOpen(false);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const openUp = window.innerHeight - rect.bottom < 300;
    setPos({
      left: Math.min(rect.left, window.innerWidth - 256),
      width: Math.max(rect.width, 240),
      ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
    setSearch("");
    setOpen(true);
  };

  const toggleOption = (id) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selected = options.filter((o) => value.includes(o.id));
  const term = search.trim().toLowerCase();
  const visibleOptions = term
    ? options.filter((o) => o.name.toLowerCase().includes(term))
    : options;

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={toggleMenu}
        className={`input flex min-h-[38px] items-center justify-between gap-2 text-left ${
          invalid ? "!border-red-500" : ""
        }`}
      >
        {selected.length === 0 ? (
          <span className="text-ink-400">Select containers</span>
        ) : (
          <span className="flex min-w-0 flex-wrap gap-1">
            {selected.slice(0, 2).map((c) => (
              <span key={c.id} className="max-w-[110px] truncate rounded bg-brand-300 px-1.5 py-0.5 text-xs font-semibold text-ink-950">
                {c.name}
              </span>
            ))}
            {selected.length > 2 && (
              <span className="rounded bg-ink-200 px-1.5 py-0.5 text-xs font-semibold text-ink-900">
                +{selected.length - 2}
              </span>
            )}
          </span>
        )}
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && pos && (
        <div
          ref={menuRef}
          className="fixed z-50 overflow-hidden rounded-lg border border-ink-300 bg-white shadow-pop animate-slideDown"
          style={pos}
        >
          <div className="border-b border-ink-200 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search containers…"
                className="input h-8 py-1 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-3 text-sm text-ink-500">Loading containers…</div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-ink-500">
                {options.length === 0 ? "No containers found" : "No matching containers"}
              </div>
            ) : (
              visibleOptions.map((c) => (
                <label
                  key={c.id}
                  className={`flex items-center gap-2 px-3 py-2 text-sm ${
                    c.disabled ? "cursor-not-allowed text-ink-400" : "cursor-pointer hover:bg-brand-50"
                  } ${value.includes(c.id) ? "font-semibold text-ink-950" : "text-ink-800"}`}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(c.id)}
                    onChange={() => toggleOption(c.id)}
                    disabled={c.disabled}
                    className="h-4 w-4 accent-brand-500"
                  />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {c.hint && <span className="shrink-0 text-xs font-normal text-ink-500">{c.hint}</span>}
                </label>
              ))
            )}
          </div>
          {value.length > 0 && (
            <div className="flex items-center justify-between border-t border-ink-200 px-3 py-2 text-xs">
              <span className="font-medium text-ink-600">{value.length} selected</span>
              <button type="button" onClick={() => onChange([])} className="font-semibold text-red-600 hover:text-red-700">
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ContainerMultiSelect;
