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

/** Layout compatto quando il pannello è stretto (<581px), non il viewport (tablet ok). */
const PANEL_SECTION_TITLE_CLASS =
  "font-display font-bold text-[#ffd76a] text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-[2.75rem]";

const SHOP_ROW_CLASS =
  "box-border flex w-full max-w-full min-w-0 flex-col gap-2 rounded-xl border-2 border-[#a67c22] bg-[#2a160c]/28 px-2.5 py-2.5 shadow-[0_0_8px_rgba(231,194,122,0.28)] @max-[580px]:text-[0.95rem] @min-[581px]:min-h-0 @min-[581px]:flex-row @min-[581px]:items-center @min-[581px]:gap-3 @min-[581px]:rounded-2xl @min-[581px]:px-3.5 @min-[581px]:py-3.5 md:gap-3.5 md:px-4 md:py-4 lg:gap-4 lg:px-5 lg:py-4";

const SHOP_ROW_HEAD_CLASS =
  "flex w-full min-w-0 items-center justify-center gap-3 @min-[581px]:contents";

const SHOP_ICON_CLASS =
  "h-11 w-11 shrink-0 object-contain @min-[581px]:h-14 @min-[581px]:w-14 md:h-[4.35rem] md:w-[4.35rem] lg:h-[4.85rem] lg:w-[4.85rem]";

const SHOP_COUNT_CLASS =
  "font-display text-2xl font-bold text-[#fff8dc] @min-[581px]:flex-1 @min-[581px]:text-center @min-[581px]:text-3xl md:text-4xl lg:text-[2.75rem]";

const SHOP_AD_BTN_CLASS =
  "box-border flex min-h-[2.85rem] w-full max-w-full shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#a67c22] bg-[#3d2614] px-2 py-1 font-display text-[0.62rem] font-bold leading-[1.08] text-[#fff8dc] shadow-[0_0_10px_rgba(255,214,120,0.35)] transition-transform duration-100 active:scale-95 @min-[581px]:min-h-[3.35rem] @min-[581px]:w-auto @min-[581px]:max-w-[45%] @min-[581px]:min-w-[4.25rem] @min-[581px]:rounded-2xl @min-[581px]:py-1.5 @min-[581px]:text-[0.68rem] md:min-h-[3.9rem] md:min-w-[5.5rem] md:px-3 md:py-2 md:text-sm lg:min-h-[4.25rem] lg:min-w-[6rem] lg:text-base";

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
    <div className="@container shop-market flex w-full max-w-full flex-col items-center self-stretch origin-top @max-[580px]:scale-[0.94] md:scale-100">
      <p
        className={`mb-0 shrink-0 md:mb-1 lg:mb-1.5 ${PANEL_SECTION_TITLE_CLASS}`}
        style={PANEL_TITLE_STYLE}
      >
        {t("shop")}
      </p>

      <div
        className="mt-3 flex w-full max-w-full flex-col gap-2 pb-1 @min-[581px]:mt-4 @min-[581px]:gap-2.5 md:mt-5 md:gap-3.5 lg:gap-4"
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
              <div className={SHOP_ROW_HEAD_CLASS}>
                <Image
                  alt=""
                  className={SHOP_ICON_CLASS}
                  draggable={false}
                  height={96}
                  src={item.src}
                  width={96}
                />

                {!isEnergy ? (
                  <p className={SHOP_COUNT_CLASS} style={PANEL_TITLE_STYLE}>
                    {counts[item.booster]}
                  </p>
                ) : (
                  <div aria-hidden className="hidden @min-[581px]:block @min-[581px]:flex-1" />
                )}
              </div>

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
