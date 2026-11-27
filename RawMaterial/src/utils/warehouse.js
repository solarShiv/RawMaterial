// Warehouse of the logged-in user (saved at login); null when none is assigned
export const getUserWarehouseId = () => {
  const candidates = [localStorage.getItem("warehouseId"), sessionStorage.getItem("warehouseId")];

  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      candidates.push(user?.warehouseId, user?.warehouse?.id, user?.warehouse?._id);
    } catch {
      // ignore malformed user data
    }
  }

  for (const value of candidates) {
    const id = String(value ?? "").trim();
    if (id && id !== "null" && id !== "undefined") return id;
  }
  return null;
};

// Containers belong to one warehouse, so the list call must say which one
export const containerListUrl = (warehouseId) =>
  `/common/container?warehouseId=${encodeURIComponent(warehouseId)}`;

// Some APIs return a generic `message` and put the useful text in `error`
export const apiErrorText = (err, fallback = "Something went wrong") =>
  err?.response?.data?.error || err?.response?.data?.message || err?.message || fallback;
