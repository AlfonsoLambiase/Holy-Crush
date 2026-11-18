"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { MdLiveTv } from "react-icons/md";

import { AdLoadingOverlay } from "@/components/AdLoadingOverlay";
import { FadeScroll } from "@/components/FadeScroll";
import { GoldTitle } from "@/components/GoldTitle";
import { useLanguage } from "@/language/LanguageProvider";
import {
  addBooster,
  BOOSTER_MAX,
  getBoosterCount,
  isBoosterFull,
  type BoosterId,
} from "@/settings/boosters";
import { playClick } from "@/settings/click";
import { isHeartEmpty, refillHeart } from "@/settings/heart";
import {
  canRequestRewardedInterstitial,
  rewardedInterstitialSlotForShopAd,
  showRewardedInterstitial,
} from "@/settings/rewarded-interstitials";
import {
  getShopAdProgress,
  SHOP_AD_COST,
  watchShopAd,
  type ShopAdId,
} from "@/settings/shop-ads";

const PANEL_TEXT_GLOW =
  "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)";

const PANEL_TITLE_STYLE: React.CSSProperties = {
  textShadow: PANEL_TEXT_GLOW,
  WebkitTextStroke: "2px #2a160ccc",
  paintOrder: "stroke fill",
};

const PANEL_SECTION_TITLE_CLASS =
  "font-display font-bold text-[#ffd76a] text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-[2.75rem]";

const SHOP_ITEMS = [
  {
    id: "energy",
    src: "/images/ui_game/logo_stage_fill.png",
    titleKey: "shopEnergy",
    bodyKey: "shopEnergyBody",
  },
  {
    id: "super",
    src: "/images/game_common/power-up/super.png",
    titleKey: "shopCross",
    bodyKey: "shopCrossBody",
    booster: "super" as BoosterId,
  },
  {
    id: "mega",
    src: "/images/game_common/power-up/mega.png",
    titleKey: "shopStar",
    bodyKey: "shopStarBody",
    booster: "mega" as BoosterId,
  },
  {
    id: "ultra",
    src: "/images/game_common/power-up/ultra.png",
    titleKey: "shopScythe",
    bodyKey: "shopScytheBody",
    booster: "ultra" as BoosterId,
  },
  {
    id: "maxi",
    src: "/images/game_common/power-up/maxi.png",
    titleKey: "shopMaxi",
    bodyKey: "shopMaxiBody",
    booster: "maxi" as BoosterId,
  },
] as const;

const shopAdsNeeded = (adId: ShopAdId) => SHOP_AD_COST[adId];

const CLOCK_TURN = 2 * Math.PI * 9;
const CLOCK_FILL_MS = 480;
//* Resta pieno un attimo prima di svuotarsi per il prossimo giro.
const CLOCK_HOLD_MS = 260;

function AdClock({ ratio, disabled }: { ratio: number; disabled: boolean }) {
  const turn = disabled ? 0 : Math.min(1, Math.max(0, ratio)) * CLOCK_TURN;

  return (
    <svg aria-hidden className="absolute inset-0 block h-full w-full" viewBox="0 0 36 36">
      <circle cx="18" cy="18" fill={disabled ? "#8a8079" : "#1a0f08"} r="18" />
      <circle
        cx="18"
        cy="18"
        fill="none"
        r="9"
        stroke="#5c3a14"
        strokeWidth="18"
        style={{
          strokeDasharray: `${turn} ${CLOCK_TURN}`,
          transition: `stroke-dasharray ${CLOCK_FILL_MS}ms ease-out`,
        }}
        transform="rotate(-90 18 18)"
      />
      <circle
        cx="18"
        cy="18"
        fill="none"
        r="17.2"
        stroke={disabled ? "#c9c0b8" : "#e0c36a"}
        strokeOpacity={disabled ? "0.7" : "0.55"}
        strokeWidth="0.8"
      />
    </svg>
  );
}

export function ShopMarket() {
  const { t } = useLanguage();
  const [counts, setCounts] = useState(() => ({
    super: getBoosterCount("super"),
    mega: getBoosterCount("mega"),
    maxi: getBoosterCount("maxi"),
    ultra: getBoosterCount("ultra"),
  }));
  const [energyEmpty, setEnergyEmpty] = useState(isHeartEmpty);
  const [adProgress, setAdProgress] = useState(getShopAdProgress);
  const [completing, setCompleting] = useState<
    Partial<Record<ShopAdId, boolean>>
  >({});
  const [clockKeys, setClockKeys] = useState<Partial<Record<ShopAdId, number>>>(
    {}
  );
  const watchingRef = useRef(false);
  const [watching, setWatching] = useState(false);
  const [adNotice, setAdNotice] = useState<string | null>(null);
  const [badgePulse, setBadgePulse] = useState<Partial<Record<string, number>>>({});

  //* Il remount col key azzera il cerchio senza animarlo all'indietro.
  const playCompletion = (adId: ShopAdId) => {
    setCompleting((prev) => ({ ...prev, [adId]: true }));
    window.setTimeout(() => {
      setCompleting((prev) => ({ ...prev, [adId]: false }));
      setClockKeys((prev) => ({ ...prev, [adId]: (prev[adId] ?? 0) + 1 }));
    }, CLOCK_FILL_MS + CLOCK_HOLD_MS);
  };

  const refreshCounts = () => {
    setCounts({
      super: getBoosterCount("super"),
      mega: getBoosterCount("mega"),
      maxi: getBoosterCount("maxi"),
      ultra: getBoosterCount("ultra"),
    });
    setEnergyEmpty(isHeartEmpty());
    setAdProgress(getShopAdProgress());
  };

  const grantWatchedAd = (item: (typeof SHOP_ITEMS)[number]) => {
    const adId: ShopAdId = "booster" in item ? item.booster : "energy";
    const adsNeeded = shopAdsNeeded(adId);

    if (watchShopAd(adId, adsNeeded)) {
      if ("booster" in item) addBooster(item.booster);
      else refillHeart();
      playCompletion(adId);
      setBadgePulse((prev) => ({ ...prev, [item.id]: (prev[item.id] ?? 0) + 1 }));
    }

    refreshCounts();
  };

  const handleWatchAd = (item: (typeof SHOP_ITEMS)[number]) => {
    const adId: ShopAdId = "booster" in item ? item.booster : "energy";
    const locked =
      "booster" in item ? isBoosterFull(item.booster) : !isHeartEmpty();

    if (locked || completing[adId] || watchingRef.current) return;

    playClick();

    const slot = rewardedInterstitialSlotForShopAd(adId);

    if (!slot || !canRequestRewardedInterstitial()) {
      grantWatchedAd(item);

      return;
    }

    setAdNotice(null);

    void showRewardedInterstitial(slot, {
      onAdLoading: (loading) => {
        watchingRef.current = loading;
        setWatching(loading);
      },
    }).then((earned) => {
      watchingRef.current = false;
      setWatching(false);

      if (earned) {
        grantWatchedAd(item);

        return;
      }

      setAdNotice(t("adUnavailable"));
      window.setTimeout(() => setAdNotice(null), 2000);
    });
  };

  return (
    <div
      className="shop-market @container relative flex min-h-0 w-full max-w-full flex-1 flex-col items-stretch"
      data-shop-scroll
    >
      {watching ? <AdLoadingOverlay className="fixed inset-0 z-[80]" /> : null}
      {adNotice ? (
        <p
          className="absolute inset-x-2 top-1/2 z-40 -translate-y-1/2 rounded-lg border border-[#a67c22] bg-[#3d2614]/95 px-3 py-2 text-center font-display text-[clamp(0.8rem,3vw,0.95rem)] font-bold text-[#fff8dc] shadow-lg"
          role="alert"
        >
          {adNotice}
        </p>
      ) : null}
      <GoldTitle
        className="shrink-0"
        titleClassName={PANEL_SECTION_TITLE_CLASS}
        titleStyle={PANEL_TITLE_STYLE}
      >
        {t("shop")}
      </GoldTitle>

      <FadeScroll className="mt-[2cqi] min-h-0 flex-1">
        <div className="@container flex w-full min-w-0 flex-col gap-[1.6cqi] pb-[1cqi]">
          {SHOP_ITEMS.map((item) => {
            const count =
              "booster" in item ? counts[item.booster] : energyEmpty ? 0 : 1;
            const adId: ShopAdId = "booster" in item ? item.booster : "energy";
            const adsNeeded = shopAdsNeeded(adId);
            const filling = Boolean(completing[adId]);
            const adLocked =
              !filling &&
              ("booster" in item ? count >= BOOSTER_MAX : count > 0);
            const fill = filling ? 1 : adProgress[adId] / adsNeeded;
            const pulse = badgePulse[item.id] ?? 0;

            return (
              <div
                key={item.id}
                className="grid w-full min-w-0 items-center rounded-[3cqi] border border-[#3d2614]/50 bg-[#5c3a14]/90 text-left [grid-template-columns:15cqi_minmax(0,1fr)_13cqi_18cqi] gap-x-[1.6cqi] px-[1.8cqi] py-[1.7cqi]"
              >
                <Image
                  alt=""
                  className="aspect-square w-full object-contain"
                  draggable={false}
                  height={128}
                  src={item.src}
                  width={128}
                />

                <div className="min-w-0">
                  <p className="font-display text-[length:min(0.95rem,3.2cqi)] font-bold uppercase leading-tight text-[#fff8dc]">
                    {t(item.titleKey)}
                  </p>
                  <p className="mt-[0.4cqi] font-accent text-[length:min(0.72rem,2.35cqi)] leading-snug text-[#f3e6c8]">
                    {t(item.bodyKey)}
                  </p>
                </div>

                <button
                  aria-label={t("watchAd")}
                  className={`relative grid size-[13cqi] shrink-0 place-items-center self-center overflow-hidden rounded-full p-0 transition-transform duration-100 disabled:opacity-100 ${
                    adLocked
                      ? "cursor-default text-[#e8e2dc]"
                      : "text-white active:scale-95"
                  }`}
                  disabled={adLocked || filling || watching}
                  type="button"
                  onClick={() => handleWatchAd(item)}
                >
                  <span
                    className={`absolute inset-0 grid place-items-center ${
                      adLocked ? "origin-center scale-[0.92]" : ""
                    }`}
                  >
                    <AdClock
                      key={clockKeys[adId] ?? 0}
                      disabled={adLocked}
                      ratio={fill}
                    />
                    <MdLiveTv aria-hidden className="relative z-[1] h-[55%] w-[55%]" />
                  </span>
                </button>

                <div className="flex min-w-0 items-center justify-center">
                  <span
                    key={pulse}
                    className={`inline-flex max-w-full items-center gap-[0.3cqi] rounded-full border border-[#e0c36a] bg-[#fff8e6] px-[1cqi] py-[0.35cqi] font-display text-[length:min(0.8rem,2.5cqi)] font-bold leading-none text-[#c4922a] ${
                      pulse > 0 ? "shop-count-zoom" : ""
                    }`}
                  >
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-[2.4cqi] w-[2.4cqi] fill-[#e0b44a]"
                    >
                      <path d="m12 2 2.7 6.5L22 9.2l-5 4.4 1.5 6.9L12 17.3 5.5 20.5 7 13.6 2 9.2l7.3-.7L12 2z" />
                    </svg>
                    <span className="translate-y-[0.08em]">x{count}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </FadeScroll>
    </div>
  );
}
