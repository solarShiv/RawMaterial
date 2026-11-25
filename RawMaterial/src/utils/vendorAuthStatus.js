// Vendor authorization status: allowed values and the colour used to show each one.
export const VENDOR_AUTHORIZATION_STATUSES = ["White", "Gray", "Red", "Black"];

// Round colour dot for each status
export const AUTH_STATUS_SWATCH = {
  White: "bg-white border-ink-400",
  Gray: "bg-ink-400 border-ink-500",
  Red: "bg-red-500 border-red-600",
  Black: "bg-ink-950 border-ink-950",
};

// Small text badge for each status
export const AUTH_STATUS_BADGE = {
  White: "bg-white text-ink-700 border-ink-300",
  Gray: "bg-ink-200 text-ink-800 border-ink-300",
  Red: "bg-red-100 text-red-700 border-red-200",
  Black: "bg-ink-950 text-white border-ink-950",
};

// Normalise whatever the API sends ("white", " Red ", null) to a known status, or null
export const normalizeAuthStatus = (status) => {
  const value = String(status ?? "").trim().toLowerCase();
  return VENDOR_AUTHORIZATION_STATUSES.find((s) => s.toLowerCase() === value) || null;
};
