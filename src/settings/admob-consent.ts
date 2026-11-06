import {Capacitor} from "@capacitor/core";

import {
  HOLY_CRUSH_PRIVACY_POLICY_URL,
  HOLY_CRUSH_TERMS_OF_USE_URL,
} from "@/settings/legal-urls";

/** True quando almeno un URL legale è configurato (pulsanti nelle Impostazioni). */
export const hasConfiguredLegalUrls = (): boolean =>
  Boolean(HOLY_CRUSH_PRIVACY_POLICY_URL.trim()) || Boolean(HOLY_CRUSH_TERMS_OF_USE_URL.trim());

const isAndroidNative = (): boolean =>
  typeof window !== "undefined" && Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

const parseTestDeviceIds = (): string[] => {
  const raw = process.env.NEXT_PUBLIC_HOLY_CRUSH_UMP_TEST_DEVICE_IDS?.trim();

  if (!raw) return [];

  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
};

const isUmpDebugEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG === "true";

/** Abilita reset consenso UMP dall'UI (solo con env; strumento di test). */
export const isUmpResetConsentButtonEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_HOLY_CRUSH_UMP_ENABLE_RESET === "true";

/**
 * Log su console (Logcat tag Chromium/WebView: vedi filtro "HolyCrush UMP") dopo ogni aggiornamento stato.
 * Solo build con questa env; disattiva in produzione.
 */
const isUmpConsentLogEnabled = (): boolean =>
  process.env.NEXT_PUBLIC_HOLY_CRUSH_UMP_LOG_CONSENT === "true";

const logUmpConsent = (context: string, info: AdmobConsentInfo | null): void => {
  if (!isAndroidNative() || !isUmpConsentLogEnabled()) return;

  // eslint-disable-next-line no-console -- solo con NEXT_PUBLIC_HOLY_CRUSH_UMP_LOG_CONSENT
  console.info(`[HolyCrush UMP] ${context} ${JSON.stringify(info)}`);
};

type UmpRequestDiagnostics = {
  /** `NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG === "true"` */
  umpDebugEnvActive: boolean;
  /** Geografia passata in `requestConsentInfo` (`undefined` = nessuna opzione debug, SDK usa posizione reale). */
  debugGeographyPassedToRequest:
    | "none_not_set"
    | "US_REGULATED_STATE"
    | "EEA"
    | "OTHER"
    | "NOT_EEA_deprecated";
  /** true se `testDeviceIdentifiers` è presente e non vuoto (conteggio senza valori). */
  testDeviceIdsConfigured: boolean;
  testDeviceIdCount: number;
};

const logUmpRequestDiagnostics = (
  phase: string,
  options: import("@capacitor-community/admob").AdmobConsentRequestOptions | undefined,
  diag: UmpRequestDiagnostics,
): void => {
  if (!isAndroidNative() || !isUmpConsentLogEnabled()) return;

  const payload = {
    phase,
    ...diag,
    debugGeographyEnumNumeric: options?.debugGeography,
  };

  // eslint-disable-next-line no-console -- solo con NEXT_PUBLIC_HOLY_CRUSH_UMP_LOG_CONSENT
  console.info(`[HolyCrush UMP] diagnostics ${JSON.stringify(payload)}`);
};

type AdmobModule = typeof import("@capacitor-community/admob");
type AdmobConsentInfo = import("@capacitor-community/admob").AdmobConsentInfo;

/**
 * Con debug UMP attivo, sceglie la geografia simulata (solo dispositivi di test in AdMob).
 * `NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG_GEOGRAPHY=US` → `AdmobConsentDebugGeography.US` (valore SDK 3 = UMP *regulated US state*).
 * Vedi `node_modules/@capacitor-community/admob/dist/esm/consent/consent-debug-geography.enum.d.ts`.
 */
const resolveDebugGeography = async (): Promise<
  import("@capacitor-community/admob").AdmobConsentDebugGeography | undefined
> => {
  if (!isUmpDebugEnabled()) return undefined;

  const {AdmobConsentDebugGeography} = await import("@capacitor-community/admob");
  const raw = process.env.NEXT_PUBLIC_HOLY_CRUSH_UMP_DEBUG_GEOGRAPHY?.trim().toUpperCase() ?? "EEA";

  switch (raw) {
    case "EEA":
      return AdmobConsentDebugGeography.EEA;
    case "US":
      return AdmobConsentDebugGeography.US;
    case "OTHER":
      return AdmobConsentDebugGeography.OTHER;
    case "DISABLED":
    case "OFF":
      return undefined;
    default:
      return AdmobConsentDebugGeography.EEA;
  }
};

const buildConsentRequestOptions = async (): Promise<{
  options: import("@capacitor-community/admob").AdmobConsentRequestOptions | undefined;
  diagnostics: UmpRequestDiagnostics;
}> => {
  const umpDebugEnvActive = isUmpDebugEnabled();
  const ids = parseTestDeviceIds();
  const debugGeo = await resolveDebugGeography();
  const {AdmobConsentDebugGeography} = await import("@capacitor-community/admob");

  if (debugGeo === undefined) {
    return {
      options: undefined,
      diagnostics: {
        umpDebugEnvActive,
        debugGeographyPassedToRequest: "none_not_set",
        testDeviceIdsConfigured: ids.length > 0,
        testDeviceIdCount: ids.length,
      },
    };
  }

  const opts: import("@capacitor-community/admob").AdmobConsentRequestOptions = {
    debugGeography: debugGeo,
  };

  if (ids.length > 0) opts.testDeviceIdentifiers = ids;

  let debugGeographyPassedToRequest: UmpRequestDiagnostics["debugGeographyPassedToRequest"];

  switch (debugGeo) {
    case AdmobConsentDebugGeography.US:
      debugGeographyPassedToRequest = "US_REGULATED_STATE";
      break;
    case AdmobConsentDebugGeography.EEA:
      debugGeographyPassedToRequest = "EEA";
      break;
    case AdmobConsentDebugGeography.OTHER:
      debugGeographyPassedToRequest = "OTHER";
      break;
    case AdmobConsentDebugGeography.NOT_EEA:
      debugGeographyPassedToRequest = "NOT_EEA_deprecated";
      break;
    default:
      debugGeographyPassedToRequest = "none_not_set";
  }

  return {
    options: opts,
    diagnostics: {
      umpDebugEnvActive,
      debugGeographyPassedToRequest,
      testDeviceIdsConfigured: ids.length > 0,
      testDeviceIdCount: ids.length,
    },
  };
};

let consentModulePromise: Promise<AdmobModule> | null = null;

const loadAdmob = (): Promise<AdmobModule> => {
  consentModulePromise ??= import("@capacitor-community/admob");

  return consentModulePromise;
};

let launchConsentPromise: Promise<void> | null = null;

/** Ultimo stato UMP dall'API (unica fonte per canRequestAds). */
let latestConsentInfo: AdmobConsentInfo | null = null;

const consentSubscribers = new Set<() => void>();

let consentStateVersion = 0;

export const getConsentStateVersion = (): number => consentStateVersion;

export const subscribeConsentUi = (listener: () => void): (() => void) => {
  consentSubscribers.add(listener);

  return () => consentSubscribers.delete(listener);
};

const notifyConsentUi = () => {
  consentStateVersion += 1;
  consentSubscribers.forEach((listener) => listener());
};

let adsConsentEpoch = 0;

let adMobInitialized = false;
let adMobInitPromise: Promise<void> | null = null;

let privacyFlowDepth = 0;

const bumpAdsEpoch = (): number => {
  adsConsentEpoch += 1;

  return adsConsentEpoch;
};

export const getAdsConsentEpoch = (): number => adsConsentEpoch;

export const isPrivacyOrConsentFlowActive = (): boolean => privacyFlowDepth > 0;

export const getLatestConsentInfo = (): AdmobConsentInfo | null => latestConsentInfo;

const canRequestAdsFromLatest = (): boolean => Boolean(latestConsentInfo?.canRequestAds);

/** Se il consenso non consente più annunci, si azzera lo stato di init per rispettare il nuovo stato al prossimo tentativo. */
const syncAdMobInitWithConsent = () => {
  if (!canRequestAdsFromLatest()) {
    adMobInitialized = false;
    adMobInitPromise = null;
  }
};

const runLaunchConsentLocked = async (): Promise<void> => {
  if (!isAndroidNative()) return;

  const {AdMob, AdmobConsentStatus} = await loadAdmob();
  const {options, diagnostics} = await buildConsentRequestOptions();

  logUmpRequestDiagnostics("before requestConsentInfo (launch/foreground)", options, diagnostics);

  try {
    let info = await AdMob.requestConsentInfo(options);

    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      info = await AdMob.showConsentForm();
    }

    latestConsentInfo = info;
    logUmpConsent("after launch/foreground + optional consent form", info);
  } catch {
    latestConsentInfo = null;
    logUmpConsent("after launch/foreground (error)", null);
  }

  syncAdMobInitWithConsent();
  notifyConsentUi();
};

/**
 * Prima sessione: avvia UMP una sola volta (Promise condivisa).
 */
export const requestAndroidUmpOnLaunch = (): Promise<void> => {
  if (!isAndroidNative()) return Promise.resolve();

  launchConsentPromise ??= runLaunchConsentLocked();

  return launchConsentPromise;
};

/**
 * Ogni volta che l'app torna in foreground: nuovo `requestConsentInfo()` (stato aggiornato dopo cambio messaggi EU/USA).
 */
export const requestAndroidUmpOnAppForeground = (): Promise<void> => {
  if (!isAndroidNative()) return Promise.resolve();

  launchConsentPromise = runLaunchConsentLocked();

  return launchConsentPromise;
};

export const awaitAndroidUmpLaunchComplete = (): Promise<void> => {
  if (!isAndroidNative()) return Promise.resolve();

  return launchConsentPromise ?? requestAndroidUmpOnLaunch();
};

export const ensureAdMobInitializedWhenAllowed = async (): Promise<boolean> => {
  if (!isAndroidNative()) return false;

  await awaitAndroidUmpLaunchComplete();

  if (!canRequestAdsFromLatest()) return false;

  if (adMobInitialized) return true;

  adMobInitPromise ??= (async () => {
    const {AdMob} = await loadAdmob();
    await AdMob.initialize();
    adMobInitialized = true;
  })();

  try {
    await adMobInitPromise;

    return true;
  } catch {
    adMobInitPromise = null;

    return false;
  }
};

export const refreshConsentInfo = async (): Promise<void> => {
  if (!isAndroidNative()) return;

  const {AdMob} = await loadAdmob();
  const {options, diagnostics} = await buildConsentRequestOptions();

  logUmpRequestDiagnostics("before requestConsentInfo (refresh)", options, diagnostics);

  try {
    latestConsentInfo = await AdMob.requestConsentInfo(options);
    logUmpConsent("after refreshConsentInfo", latestConsentInfo);
  } catch {
    latestConsentInfo = null;
    logUmpConsent("after refreshConsentInfo (error)", null);
  }

  syncAdMobInitWithConsent();
  notifyConsentUi();
};

const runWithPrivacyGate = async <T>(work: () => Promise<T>): Promise<T> => {
  privacyFlowDepth += 1;
  bumpAdsEpoch();

  try {
    return await work();
  } finally {
    privacyFlowDepth -= 1;
    bumpAdsEpoch();
  }
};

/** Form Opzioni privacy: durante l'apertura nessun annuncio; al termine stato aggiornato. */
export const openPrivacyOptionsFormFlow = async (): Promise<void> => {
  if (!isAndroidNative()) return;

  await runWithPrivacyGate(async () => {
    const {AdMob} = await loadAdmob();

    try {
      await AdMob.showPrivacyOptionsForm();
    } catch {
      /* refresh sotto */
    }

    await refreshConsentInfo();
  });
};

/** Solo test manuale: reset UMP + nuovo avvio flusso. */
export const resetUmpConsentForTesting = async (): Promise<void> => {
  if (!isAndroidNative() || !isUmpResetConsentButtonEnabled()) return;

  await runWithPrivacyGate(async () => {
    const {AdMob} = await loadAdmob();
    await AdMob.resetConsentInfo();
    latestConsentInfo = null;
    adMobInitialized = false;
    adMobInitPromise = null;
    launchConsentPromise = null;
    await runLaunchConsentLocked();
  });
};

/**
 * Messaggi EU e USA: AdMob imposta `privacyOptionsRequirementStatus === REQUIRED` quando serve il punto "Opzioni privacy",
 * anche se `status` non è REQUIRED (es. consenso già ottenuto).
 */
export const shouldShowPrivacyOptionsEntry = (): boolean =>
  latestConsentInfo?.privacyOptionsRequirementStatus === "REQUIRED";
