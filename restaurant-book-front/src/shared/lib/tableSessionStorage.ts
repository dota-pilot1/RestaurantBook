"use client";

const TABLE_NAME_KEY = "restaurantBook.tableName";
const TABLE_SESSION_CHANGED_EVENT = "restaurantBook:tableSessionChanged";

export const tableSessionStorage = {
  getTableName() {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(TABLE_NAME_KEY) ?? "";
  },

  setTableName(tableName: string) {
    if (typeof window === "undefined") return;

    const nextTableName = tableName.trim();
    if (nextTableName) {
      window.localStorage.setItem(TABLE_NAME_KEY, nextTableName);
    } else {
      window.localStorage.removeItem(TABLE_NAME_KEY);
    }

    window.dispatchEvent(new Event(TABLE_SESSION_CHANGED_EVENT));
  },

  subscribe(listener: () => void) {
    if (typeof window === "undefined") return () => {};

    const handleStorage = (event: StorageEvent) => {
      if (event.key === TABLE_NAME_KEY) listener();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(TABLE_SESSION_CHANGED_EVENT, listener);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(TABLE_SESSION_CHANGED_EVENT, listener);
    };
  },
};
