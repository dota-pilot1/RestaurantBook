import { api } from "@/shared/api/axios";
import type { SiteSetting } from "../model/types";

export type UpdateSiteSettingBody = {
  heroImageUrl: string | null;
  heroImageUrls: string[];
  introTitle?: string;
  introSubtitle?: string;
  headerNavVisible: boolean;
};

export type UpdateKioskHeaderNavBody = {
  password: string;
  headerNavVisible: boolean;
};

export const siteSettingApi = {
  get: () => api.get<SiteSetting>("/api/site-settings").then((r) => r.data),
  update: (body: UpdateSiteSettingBody) =>
    api.put<SiteSetting>("/api/site-settings", body).then((r) => r.data),
  updateKioskHeaderNav: (body: UpdateKioskHeaderNavBody) =>
    api.patch<SiteSetting>("/api/site-settings/kiosk/header-nav", body).then((r) => r.data),
};
