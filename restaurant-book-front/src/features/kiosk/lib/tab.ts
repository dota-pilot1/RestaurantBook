import type { KioskTab } from "../model/types";

export const isActiveKioskTab = (activeTab: KioskTab, tab: KioskTab) => {
  if (activeTab.type !== tab.type) return false;
  if (tab.type === "MENU") {
    return activeTab.type === "MENU" && activeTab.categoryId === tab.categoryId;
  }
  return true;
};

export const getKioskTabKey = (tab: KioskTab) =>
  tab.type === "MENU" ? `MENU:${tab.categoryId}` : tab.type;
