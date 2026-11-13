import {App} from "@capacitor/app";
import {Capacitor} from "@capacitor/core";

export const HOLY_CRUSH_VERSION_CONFIG_URL =
  "https://mastrolonardogames.com/games/holy-crush/config/version.json";

const LEGAL_VERSION_STORAGE_KEY = "holy-crush-legal-version";

export type VersionPlatformInfo = {
  latest_version?: string;
  store_url?: string;
  rating_url?: string;
};

export type VersionConfigJson = {
  game?: string;
  ios?: VersionPlatformInfo;
  android?: VersionPlatformInfo;
  legal?: {version?: string};
};

export type AppVersionCheckResult = {
  updateRequired: boolean;
  storeUrl: string | null;
  legalAcceptanceRequired: boolean;
  remoteLegalVersion: string | null;
  /** true se l'utente non ha mai accettato una legal.version (prima apertura). */
  isFirstLegalAcceptance: boolean;
};

const parseVersionParts = (raw: string): number[] | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(".").map((segment) => {
    const n = Number.parseInt(segment, 10);
    return Number.isFinite(n) ? n : Number.NaN;
  });

  if (parts.some((n) => Number.isNaN(n))) return null;

  return parts;
};

export const compareVersionStrings = (remote: string, local: string): number => {
  const remoteParts = parseVersionParts(remote);
  const localParts = parseVersionParts(local);

  if (!remoteParts || !localParts) return 0;

  const length = Math.max(remoteParts.length, localParts.length);

  for (let i = 0; i < length; i += 1) {
    const r = remoteParts[i] ?? 0;
    const l = localParts[i] ?? 0;
    if (r > l) return 1;
    if (r < l) return -1;
  }

  return 0;
};

export const isRemoteVersionNewer = (remote: string, local: string): boolean =>
  compareVersionStrings(remote, local) > 0;

export const getStoredLegalVersion = (): string => {
  if (typeof localStorage === "undefined") return "";

  return localStorage.getItem(LEGAL_VERSION_STORAGE_KEY)?.trim() ?? "";
};

export const setStoredLegalVersion = (version: string): void => {
  if (typeof localStorage === "undefined") return;

  localStorage.setItem(LEGAL_VERSION_STORAGE_KEY, version.trim());
};

const platformConfig = (config: VersionConfigJson): VersionPlatformInfo | null => {
  const platform = Capacitor.getPlatform();
  if (platform === "android") return config.android ?? null;
  if (platform === "ios") return config.ios ?? null;
  return null;
};

export async function fetchVersionConfig(): Promise<VersionConfigJson | null> {
  try {
    const response = await fetch(HOLY_CRUSH_VERSION_CONFIG_URL, {cache: "no-store"});
    if (!response.ok) return null;

    return (await response.json()) as VersionConfigJson;
  } catch {
    return null;
  }
}

export async function getNativeAppVersion(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;

  try {
    const {version} = await App.getInfo();
    return version?.trim() || null;
  } catch {
    return null;
  }
}

export async function runAppVersionCheck(): Promise<AppVersionCheckResult> {
  const empty: AppVersionCheckResult = {
    updateRequired: false,
    storeUrl: null,
    legalAcceptanceRequired: false,
    remoteLegalVersion: null,
    isFirstLegalAcceptance: false,
  };

  if (!Capacitor.isNativePlatform()) return empty;

  const config = await fetchVersionConfig();
  if (!config) return empty;

  const platform = platformConfig(config);
  const localVersion = await getNativeAppVersion();

  let updateRequired = false;
  let storeUrl: string | null = null;

  const remoteVersion = platform?.latest_version?.trim() ?? "";

  if (remoteVersion && localVersion && isRemoteVersionNewer(remoteVersion, localVersion)) {
    const url = platform?.store_url?.trim() ?? "";
    if (url) {
      updateRequired = true;
      storeUrl = url;
    }
  }

  const remoteLegal = config.legal?.version?.trim() ?? "";
  const localLegal = getStoredLegalVersion();
  const legalAcceptanceRequired = Boolean(remoteLegal && remoteLegal !== localLegal);
  const isFirstLegalAcceptance = legalAcceptanceRequired && !localLegal;

  return {
    updateRequired,
    storeUrl,
    legalAcceptanceRequired,
    remoteLegalVersion: legalAcceptanceRequired ? remoteLegal : null,
    isFirstLegalAcceptance,
  };
}
