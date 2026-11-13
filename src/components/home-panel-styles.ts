import type {CSSProperties} from "react";

export const PANEL_TEXT_GLOW =
  "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)";

export const PANEL_OUTLINE: CSSProperties = {
  WebkitTextStroke: "2px #2a160ccc",
  paintOrder: "stroke fill",
};

export const PANEL_TITLE_STYLE: CSSProperties = {
  textShadow: PANEL_TEXT_GLOW,
  ...PANEL_OUTLINE,
};

export const PANEL_SECTION_TITLE_CLASS =
  "font-display text-xl font-bold text-[#ffd76a] max-[380px]:text-lg sm:text-2xl md:text-3xl";

export const PANEL_STATUS_CLASS =
  "text-center font-display text-[clamp(0.95rem,3.2vw,1.15rem)] font-bold leading-snug text-[#fff8dc]";

export const SETTINGS_LINK_BTN_CLASS =
  "mt-2 w-full max-w-sm shrink-0 rounded-lg border border-[#a67c22] bg-[#3d2614] px-3 py-2.5 font-display text-[clamp(0.85rem,3vw,1rem)] font-bold text-[#fff8dc] shadow-[0_0_8px_rgba(255,214,120,0.25)] transition-opacity disabled:opacity-50";
