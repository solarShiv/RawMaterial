import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

// Searchable single-select whose menu is fixed-positioned so a scroll area can't clip it.
// options: [{ id, name, hint? }]
const SearchableSelect = ({
  options,
  value,
  onChange,
  loading,
  disabled = false,
  invalid = false,
  placeholder = "Select an option",
  searchPlaceholder = "Search…",
}) => {
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

  const selectOption = (id) => {
    onChange(id);
    setOpen(false);
  };

  const selected = options.find((o) => String(o.id) === String(value));
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
        disabled={disabled}
        className={`input flex min-h-[38px] items-center justify-between gap-2 text-left disabled:opacity-60 ${
          invalid ? "!border-red-500" : ""
        }`}
      >
        {selected ? (
          <span className="min-w-0 truncate text-ink-950">{selected.name}</span>
        ) : (
          <span className="text-ink-400">{loading ? "Loading…" : placeholder}</span>
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
                onKeyDown={(e) => {
                  if (e.key === "Escape") setOpen(false);
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (visibleOptions.length > 0) selectOption(visibleOptions[0].id);
                  }
                }}
                placeholder={searchPlaceholder}
                className="input h-8 py-1 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {loading ? (
              <div className="px-3 py-3 text-sm text-ink-500">Loading…</div>
            ) : visibleOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-ink-500">
                {options.length === 0 ? "No options found" : "No matching results"}
              </div>
            ) : (
              visibleOptions.map((o) => {
                const isSelected = String(o.id) === String(value);
                return (
                  <button
                    type="button"
                    key={o.id}
                    onClick={() => selectOption(o.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 ${
                      isSelected ? "font-semibold text-ink-950" : "text-ink-800"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{o.name}</span>
                    {o.hint && <span className="shrink-0 text-xs font-normal text-ink-500">{o.hint}</span>}
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-600" />}
                  </button>
                );
              })
            )}
          </div>
          <div className="border-t border-ink-200 px-3 py-1.5 text-xs text-ink-500">
            {visibleOptions.length} of {options.length}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchableSelect;
