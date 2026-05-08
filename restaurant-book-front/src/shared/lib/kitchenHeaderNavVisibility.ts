const KITCHEN_STORAGE_KEY = "restaurantbook:kitchen-header-nav-visible";
const STAFF_STORAGE_KEY = "restaurantbook:staff-header-nav-visible";
const KITCHEN_CHANGE_EVENT = "restaurantbook:kitchen-header-nav-visible-change";
const STAFF_CHANGE_EVENT = "restaurantbook:staff-header-nav-visible-change";

export function getKitchenHeaderNavVisible() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KITCHEN_STORAGE_KEY) !== "false";
}

export function setKitchenHeaderNavVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KITCHEN_STORAGE_KEY, String(visible));
  window.dispatchEvent(new Event(KITCHEN_CHANGE_EVENT));
}

export function subscribeKitchenHeaderNavVisibility(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => listener();
  window.addEventListener(KITCHEN_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(KITCHEN_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

export function getStaffHeaderNavVisible() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STAFF_STORAGE_KEY) !== "false";
}

export function setStaffHeaderNavVisible(visible: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_STORAGE_KEY, String(visible));
  window.dispatchEvent(new Event(STAFF_CHANGE_EVENT));
}

export function subscribeStaffHeaderNavVisibility(listener: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleChange = () => listener();
  window.addEventListener(STAFF_CHANGE_EVENT, handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener(STAFF_CHANGE_EVENT, handleChange);
    window.removeEventListener("storage", handleChange);
  };
}
