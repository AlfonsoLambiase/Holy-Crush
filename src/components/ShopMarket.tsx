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
import {playClick, playNoTouch} from "@/settings/click";
import {refillHeart} from "@/settings/heart";

const PANEL_TITLE_STYLE: React.CSSProperties = {
  textShadow: "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)",
  WebkitTextStroke: "2px #2a160ccc",
  paintOrder: "stroke fill",
};

const SHOP_ITEMS = [
  {src: "/mode_0/stage_ui/logo_stage_fill.png", title: "shopEnergy", body: "shopEnergyBody"},
  {src: "/mode_0/stage_common/super.png", title: "shopCross", body: "shopCrossBody", booster: "super"},
  {src: "/mode_0/stage_common/mega.png", title: "shopStar", body: "shopStarBody", booster: "mega"},
] as const;

export function ShopMarket() {
  const {t} = useLanguage();
  const [stock, setStock] = useState(() => ({
    super: getBoosterCount("super"),
    mega: getBoosterCount("mega"),
  }));

  const buy = (booster?: BoosterId) => {
    if (!booster) {
      refillHeart();

      return;
    }

    addBooster(booster);
    setStock({super: getBoosterCount("super"), mega: getBoosterCount("mega")});
  };

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto">
      <p
        className="shrink-0 font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
        style={PANEL_TITLE_STYLE}
      >
        {t("shop")}
      </p>
      <div className="mt-2 flex min-h-0 flex-1 flex-col justify-evenly gap-2">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-2 rounded-xl border border-[#e7c27a] bg-[#2a160c]/80 px-1.5 py-1.5"
          >
            <span className="relative h-11 w-11 shrink-0">
              <Image
                alt={t(item.title)}
                className="h-11 w-11 object-contain"
                height={96}
                src={item.src}
                width={96}
              />
              {"booster" in item && stock[item.booster] > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#2a160c] bg-[#ffd76a] px-0.5 font-accent text-[0.65rem] font-bold text-white">
                  {stock[item.booster]}
                </span>
              ) : null}
            </span>
            <div className="min-w-0 flex-1 text-left">
              <p className="font-display text-sm font-bold leading-tight text-[#ffd76a]">{t(item.title)}</p>
              <p className="mt-0.5 font-display text-[0.68rem] leading-snug text-[#fff8dc]">{t(item.body)}</p>
              <button
                className="mt-1.5 rounded-xl border-2 border-[#a67c22] bg-[#3d2614] px-2 py-1.5 font-accent text-[0.62rem] font-bold leading-tight text-[#fff8dc]"
                type="button"
                onClick={() => {
                  if ("booster" in item && isBoosterFull(item.booster)) {
                    playNoTouch();

                    return;
                  }

                  playClick();
                  buy("booster" in item ? item.booster : undefined);
                }}
              >
                {t("watchAd")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
