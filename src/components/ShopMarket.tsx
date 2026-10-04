"use client";

import Image from "next/image";
import {useState} from "react";

import {useLanguage} from "@/language/LanguageProvider";
import {
  addBooster,
  getBoosterCount,
  isBoosterFull,
  type BoosterId,
} from "@/settings/boosters";
import {playClick} from "@/settings/click";
import {isHeartEmpty, refillHeart} from "@/settings/heart";

const PANEL_TEXT_GLOW =
  "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)";

const PANEL_TITLE_STYLE: React.CSSProperties = {
  textShadow: PANEL_TEXT_GLOW,
  WebkitTextStroke: "2px #2a160ccc",
  paintOrder: "stroke fill",
};

const PANEL_SECTION_TITLE_CLASS = "font-display text-2xl font-bold text-[#ffd76a] sm:text-3xl";

const SHOP_ROW_CLASS =
  "flex min-h-[4.75rem] items-center gap-3 rounded-2xl border-2 border-[#a67c22] bg-[#2a160c]/28 px-3.5 py-3.5 shadow-[0_0_8px_rgba(231,194,122,0.28)] sm:min-h-[5.25rem] sm:gap-4 sm:px-4 sm:py-4";

const SHOP_COUNT_CLASS =
  "flex-1 text-center font-display text-3xl font-bold text-[#fff8dc] sm:text-4xl";

const SHOP_AD_BTN_CLASS =
  "flex min-h-[3.35rem] min-w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-[#a67c22] bg-[#3d2614] px-2 py-1.5 font-display text-[0.68rem] font-bold leading-[1.05] text-[#fff8dc] shadow-[0_0_10px_rgba(255,214,120,0.35)] transition-transform duration-100 active:scale-95 sm:min-h-[3.6rem] sm:min-w-[4.75rem] sm:text-xs";

const SHOP_AD_BTN_LOCKED_CLASS = "pointer-events-none opacity-45 saturate-[0.72]";

const SHOP_ITEMS = [
  {id: "energy", src: "/mode_0/stage_ui/logo_stage_fill.png", labelKey: "shopEnergy"},
  {id: "super", src: "/mode_0/stage_common/super.png", labelKey: "shopCross", booster: "super" as BoosterId},
  {id: "mega", src: "/mode_0/stage_common/mega.png", labelKey: "shopStar", booster: "mega" as BoosterId},
] as const;

function WatchAdLabel({label}: {label: string}) {
  const words = label.split(/\s+/).filter(Boolean);

  return (
    <>
      {words.map((word) => (
        <span key={word}>{word}</span>
      ))}
    </>
  );
}

export function ShopMarket() {
  const {t} = useLanguage();
  const watchAdLabel = t("watchAd");
  const [counts, setCounts] = useState(() => ({
    super: getBoosterCount("super"),
    mega: getBoosterCount("mega"),
  }));
  const [energyEmpty, setEnergyEmpty] = useState(isHeartEmpty);

  const refreshCounts = () => {
    setCounts({
      super: getBoosterCount("super"),
      mega: getBoosterCount("mega"),
    });
    setEnergyEmpty(isHeartEmpty());
  };

  const handleWatchAd = (item: (typeof SHOP_ITEMS)[number]) => {
    if ("booster" in item) {
      if (isBoosterFull(item.booster)) return;

      playClick();
      addBooster(item.booster);
      refreshCounts();

      return;
    }

    if (!isHeartEmpty()) return;

    playClick();
    refillHeart();
    refreshCounts();
  };

  return (
    <div className="flex min-h-0 w-full max-w-sm flex-1 flex-col items-center self-stretch">
      <p className={`shrink-0 ${PANEL_SECTION_TITLE_CLASS}`} style={PANEL_TITLE_STYLE}>
        {t("shop")}
      </p>

      <div
        className="mt-4 flex min-h-0 w-full max-w-sm flex-1 touch-pan-y flex-col gap-2.5 overflow-y-auto overscroll-y-contain sm:gap-3 [-webkit-overflow-scrolling:touch]"
        data-shop-scroll
      >
        {SHOP_ITEMS.map((item) => {
          const isEnergy = item.id === "energy";
          const energyAdLocked = isEnergy && !energyEmpty;
          const boosterAdLocked =
            "booster" in item && isBoosterFull(item.booster);
          const adLocked = energyAdLocked || boosterAdLocked;

          return (
            <div key={item.id} aria-label={t(item.labelKey)} className={SHOP_ROW_CLASS}>
              <Image
                alt=""
                className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
                draggable={false}
                height={96}
                src={item.src}
                width={96}
              />

              {isEnergy ? (
                <div aria-hidden className="flex-1" />
              ) : (
                <p className={SHOP_COUNT_CLASS} style={PANEL_TITLE_STYLE}>
                  {counts[item.booster]}
                </p>
              )}

              <button
                aria-disabled={adLocked}
                aria-label={watchAdLabel}
                className={`${SHOP_AD_BTN_CLASS} ${adLocked ? SHOP_AD_BTN_LOCKED_CLASS : ""}`}
                type="button"
                onClick={() => handleWatchAd(item)}
              >
                <WatchAdLabel label={watchAdLabel} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
