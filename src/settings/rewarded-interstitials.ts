import {Capacitor, type PluginListenerHandle} from "@capacitor/core";

import {
  awaitAndroidUmpLaunchComplete,
  ensureAdMobInitializedWhenAllowed,
  getAdsConsentEpoch,
  getLatestConsentInfo,
  isPrivacyOrConsentFlowActive,
} from "@/settings/admob-consent";
import type {ShopAdId} from "@/settings/shop-ads";

/** App ID AdMob Android. È nel manifest, non è un ad unit. */
export const ADMOB_ANDROID_APP_ID = "ca-app-pub-3272330038248533~6499218838";

/**
 * Demo ufficiale Google per il rewarded interstitial su Android.
 * https://developers.google.com/admob/android/test-ads
 */
export const ANDROID_REWARDED_INTERSTITIAL_TEST_AD_UNIT_ID =
  "ca-app-pub-3940256099942544/5354046379";

export const REWARDED_INTERSTITIAL_FORMAT = "rewarded-interstitial" as const;

/**
 * Unico interruttore degli ID reali.
 * Resta false finché UMP, consenso, premi e prove su dispositivo non sono chiusi.
 */
export const USE_PRODUCTION_REWARDED_INTERSTITIALS = false;

export type RewardedInterstitialSlot = "extraLife" | "bonusItems";

type Placement = {
  slot: RewardedInterstitialSlot;
  productionAdUnitId: string;
};

export const REWARDED_INTERSTITIAL_PLACEMENTS = {
  extraLife: {
    slot: "extraLife",
    productionAdUnitId: "",
  },
  bonusItems: {
    slot: "bonusItems",
    productionAdUnitId: "",
  },
} as const satisfies Record<RewardedInterstitialSlot, Placement>;

/** ID da usare ora. Con la produzione spenta, o se l'ID reale è vuoto, è il demo Android. */
export const rewardedInterstitialAdUnitId = (slot: RewardedInterstitialSlot): string => {
  if (USE_PRODUCTION_REWARDED_INTERSTITIALS) {
    const productionAdUnitId = REWARDED_INTERSTITIAL_PLACEMENTS[slot].productionAdUnitId;

    if (productionAdUnitId) return productionAdUnitId;
  }

  return ANDROID_REWARDED_INTERSTITIAL_TEST_AD_UNIT_ID;
};

/** Vita extra per l'energia. Oggetti bonus per le armi. Le mosse finite restano fuori. */
export const rewardedInterstitialSlotForShopAd = (
  adId: ShopAdId,
): RewardedInterstitialSlot | null => {
  if (adId === "moves") return null;
  if (adId === "energy") return "extraLife";

  return "bonusItems";
};

/**
 * Forma della richiesta a prepareRewardInterstitialAd.
 * isTesting resta false: l'ad unit è già quello demo, e il plugin con
 * isTesting su un dispositivo di test rimanderebbe l'adId passato.
 */
export const rewardedInterstitialRequest = (slot: RewardedInterstitialSlot) => ({
  format: REWARDED_INTERSTITIAL_FORMAT,
  slot,
  adId: rewardedInterstitialAdUnitId(slot),
  isTesting: false as const,
});

/** Vero solo nell'app Android. In SSR e nel browser resta falso, senza chiamate native. */
export const canRequestRewardedInterstitial = (): boolean => {
  if (typeof window === "undefined") return false;

  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
};

export type RewardedInterstitialUiHooks = {
  /** true mentre si carica / si attende l’apertura dell’annuncio (non durante la visione). */
  onAdLoading?: (loading: boolean) => void;
};

let showingRewardedInterstitial = false;

const releaseListeners = (handles: PluginListenerHandle[]) => {
  handles.splice(0).forEach((handle) => {
    void handle.remove();
  });
};

const canProceedWithAdFlow = (epochStart: number): boolean =>
  !isPrivacyOrConsentFlowActive() &&
  getAdsConsentEpoch() === epochStart &&
  Boolean(getLatestConsentInfo()?.canRequestAds);

const setLoading = (hooks: RewardedInterstitialUiHooks | undefined, loading: boolean) => {
  hooks?.onAdLoading?.(loading);
};

/**
 * Carica e mostra il rewarded interstitial solo dopo una richiesta esplicita.
 * true solo se il premio è confermato e l’annuncio è stato chiuso (Dismissed).
 */
export const showRewardedInterstitial = async (
  slot: RewardedInterstitialSlot,
  hooks?: RewardedInterstitialUiHooks,
): Promise<boolean> => {
  if (!canRequestRewardedInterstitial() || showingRewardedInterstitial) return false;

  const epochStart = getAdsConsentEpoch();

  showingRewardedInterstitial = true;
  setLoading(hooks, true);

  const handles: PluginListenerHandle[] = [];
  let released = false;

  const stop = () => {
    if (released) return;

    released = true;
    showingRewardedInterstitial = false;
    setLoading(hooks, false);
    releaseListeners(handles);
  };

  try {
    await awaitAndroidUmpLaunchComplete();

    if (!canProceedWithAdFlow(epochStart)) {
      stop();

      return false;
    }

    const initialized = await ensureAdMobInitializedWhenAllowed();

    if (!initialized || !canProceedWithAdFlow(epochStart)) {
      stop();

      return false;
    }

    const {AdMob, RewardInterstitialAdPluginEvents} = await import("@capacitor-community/admob");

    if (!canProceedWithAdFlow(epochStart)) {
      stop();

      return false;
    }

    const request = rewardedInterstitialRequest(slot);
    let loaded;

    try {
      loaded = await AdMob.prepareRewardInterstitialAd({
        adId: request.adId,
        isTesting: request.isTesting,
      });
    } catch {
      stop();

      return false;
    }

    if (!canProceedWithAdFlow(epochStart)) {
      stop();

      return false;
    }

    return await new Promise<boolean>((resolve) => {
      let settled = false;
      let rewarded = false;

      const finish = (value: boolean) => {
        if (settled) return;

        settled = true;
        stop();
        resolve(value);
      };

      void (async () => {
        try {
          handles.push(
            await AdMob.addListener(RewardInterstitialAdPluginEvents.Rewarded, () => {
              rewarded = true;
            }),
            await AdMob.addListener(RewardInterstitialAdPluginEvents.Showed, () => {
              setLoading(hooks, false);
            }),
            await AdMob.addListener(RewardInterstitialAdPluginEvents.Dismissed, () => {
              if (!canProceedWithAdFlow(epochStart)) {
                finish(false);

                return;
              }

              finish(rewarded);
            }),
            await AdMob.addListener(RewardInterstitialAdPluginEvents.FailedToShow, () => {
              finish(false);
            }),
            await AdMob.addListener(RewardInterstitialAdPluginEvents.FailedToLoad, () => {
              finish(false);
            }),
          );

          const adKey = loaded.adUnitId || request.adId;

          void AdMob.showRewardInterstitialAd({adId: adKey}).catch(() => {
            if (!settled) finish(false);
          });
        } catch {
          finish(false);
        }
      })();
    });
  } catch {
    stop();

    return false;
  }
};