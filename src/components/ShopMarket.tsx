"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { MdLiveTv } from "react-icons/md";

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
    ads: 1,
    src: "/images/ui_game/logo_stage_fill.png",
    titleKey: "shopEnergy",
    bodyKey: "shopEnergyBody",
  },
  {
    id: "super",
    ads: 1,
    src: "/images/game_common/power-up/super.png",
    titleKey: "shopCross",
    bodyKey: "shopCrossBody",
    booster: "super" as BoosterId,
  },
  {
    id: "mega",
    ads: 1,
    src: "/images/game_common/power-up/mega.png",
    titleKey: "shopStar",
    bodyKey: "shopStarBody",
    booster: "mega" as BoosterId,
  },
  {
    id: "ultra",
    ads: 2,
    src: "/images/game_common/power-up/ultra.png",
    titleKey: "shopScythe",
    bodyKey: "shopScytheBody",
    booster: "ultra" as BoosterId,
  },
  {
    id: "maxi",
    ads: 3,
    src: "/images/game_common/power-up/maxi.png",
    titleKey: "shopMaxi",
    bodyKey: "shopMaxiBody",
    booster: "maxi" as BoosterId,
  },
] as const;

const CLOCK_TURN = 2 * Math.PI * 9;
const CLOCK_FILL_MS = 480;
//* Resta pieno un attimo prima di svuotarsi per il prossimo giro.
const CLOCK_HOLD_MS = 260;

function AdClock({ ratio, disabled }: { ratio: number; disabled: boolean }) {
  const turn = disabled ? 0 : Math.min(1, Math.max(0, ratio)) * CLOCK_TURN;

  return (
    <svg aria-hidden className="absolute inset-0" viewBox="0 0 36 36">
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

const CARD_LABEL_CLASS =
  "font-display text-[0.68rem] font-bold leading-tight @sm:text-[0.8rem]";

function AdPhrase({ ads, text }: { ads: number; text: string }) {
  const split = text.indexOf(" ");
  const head = split < 0 ? text : text.slice(0, split);
  const tail = split < 0 ? "" : text.slice(split + 1);

  return (
    <p
      className={`whitespace-nowrap text-left text-[#f3e6c8] max-[329px]:text-center ${CARD_LABEL_CLASS}`}
    >
      <span className="text-[#ffd76a]">{ads}</span> {head}
      {tail ? (
        <>
          <br />
          {tail}
        </>
      ) : null}
    </p>
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

    if (watchShopAd(adId, item.ads)) {
      if ("booster" in item) addBooster(item.booster);
      else refillHeart();
      playCompletion(adId);
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

    watchingRef.current = true;
    setWatching(true);

    void showRewardedInterstitial(slot).then((earned) => {
      watchingRef.current = false;
      setWatching(false);

      if (earned) grantWatchedAd(item);
    });
  };

  return (
    <div
      className="shop-market @container flex min-h-0 w-full max-w-full flex-1 flex-col items-stretch"
      data-shop-scroll
    >
      <GoldTitle
        className="shrink-0"
        titleClassName={PANEL_SECTION_TITLE_CLASS}
        titleStyle={PANEL_TITLE_STYLE}
      >
        {t("shop")}
      </GoldTitle>

      <FadeScroll className="mt-2 flex-1">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] gap-y-1.5 pb-1 max-[329px]:flex max-[329px]:flex-col">
          {SHOP_ITEMS.map((item) => {
            const count =
              "booster" in item ? counts[item.booster] : energyEmpty ? 0 : 1;
            const adId: ShopAdId = "booster" in item ? item.booster : "energy";
            const filling = Boolean(completing[adId]);
            const adLocked =
              !filling &&
              ("booster" in item ? count >= BOOSTER_MAX : count > 0);
            const fill = filling ? 1 : adProgress[adId] / item.ads;

            return (
              <div
                key={item.id}
                className="col-span-4 grid min-w-0 grid-cols-subgrid items-start gap-x-1.5 rounded-2xl border border-[#3d2614]/50 bg-[#5c3a14]/90 px-1.5 py-2 text-left max-[329px]:flex max-[329px]:flex-col max-[329px]:items-center max-[329px]:gap-y-2 @sm:gap-x-2 @sm:px-2"
              >
                <div className="contents max-[329px]:flex max-[329px]:w-full max-[329px]:min-w-0 max-[329px]:items-start max-[329px]:gap-x-1.5">
                  <Image
                    alt=""
                    className="mt-0.5 h-9 w-9 shrink-0 self-center object-contain @sm:h-11 @sm:w-11"
                    draggable={false}
                    height={88}
                    src={item.src}
                    width={88}
                  />

                  <div className="min-w-0 max-[329px]:flex-1">
                    <p
                      className={`uppercase text-[#fff8dc] ${CARD_LABEL_CLASS}`}
                    >
                      {t(item.titleKey)}
                    </p>
                    <p className="mt-0.5 font-accent text-[0.58rem] leading-snug text-[#f3e6c8] @sm:text-[0.68rem]">
                      {t(item.bodyKey)}
                    </p>
                  </div>
                </div>

                <button
                  aria-label={t("watchAd")}
                  className={`relative mt-0.5 grid h-9 w-9 shrink-0 place-items-center self-center overflow-hidden rounded-full transition-transform duration-100 ${
                    adLocked
                      ? "cursor-default text-[#e8e2dc] opacity-70"
                      : "text-white active:scale-95"
                  }`}
                  disabled={adLocked || filling || watching}
                  type="button"
                  onClick={() => handleWatchAd(item)}
                >
                  <AdClock
                    key={clockKeys[adId] ?? 0}
                    disabled={adLocked}
                    ratio={fill}
                  />
                  <MdLiveTv aria-hidden className="relative h-5 w-5" />
                </button>
                <div className="flex flex-col items-center gap-1 max-[329px]:text-center">
                  <AdPhrase
                    ads={item.ads}
                    text={
                      item.ads === 1 ? t("shopAdNeeded") : t("shopAdsNeeded")
                    }
                  />
                  <span className="inline-flex items-center gap-0.5 rounded-full border border-[#e0c36a] bg-[#fff8e6] px-2 py-0.5 font-display text-[0.72rem] font-bold leading-none text-[#c4922a] @sm:text-sm">
                    <svg
                      aria-hidden
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5 fill-[#e0b44a]"
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
