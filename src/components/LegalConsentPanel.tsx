"use client";

import {useState} from "react";

import {GoldTitle} from "@/components/GoldTitle";
import {
  PANEL_STATUS_CLASS,
  PANEL_TITLE_STYLE,
  SETTINGS_LINK_BTN_CLASS,
} from "@/components/home-panel-styles";
import {useLanguage} from "@/language/LanguageProvider";
import {
  HOLY_CRUSH_PRIVACY_POLICY_URL,
  HOLY_CRUSH_TERMS_OF_USE_URL,
} from "@/settings/legal-urls";
import {playClick, playNoTouch} from "@/settings/click";
import {WoodPanel} from "./WoodPanel";

const LEGAL_PANEL_TITLE_CLASS =
  "font-display text-[clamp(0.95rem,3.8vw,1.2rem)] font-bold leading-tight text-[#ffd76a]";

type LegalConsentPanelProps = {
  isFirstAcceptance: boolean;
  onAccept: () => void;
  onOpenUrl: (url: string) => void;
};

export function LegalConsentPanel({isFirstAcceptance, onAccept, onOpenUrl}: LegalConsentPanelProps) {
  const {t} = useLanguage();
  const [checked, setChecked] = useState(false);

  const titleKey = isFirstAcceptance ? "legalWelcomeTitle" : "legalRevisionTitle";
  const messageKey = isFirstAcceptance ? "legalWelcomeMessage" : "legalRevisionMessage";

  return (
    <WoodPanel
      alt=""
      backdropClassName="bg-black/55"
      className="fixed inset-0 z-[110]"
      contentAlign="start"
      contentClassName="inset-[10%] flex min-w-0 flex-col overflow-x-hidden px-[5%] py-1"
      dismissible={false}
      onClose={() => {}}
    >
      <GoldTitle
        showRules={false}
        titleClassName={LEGAL_PANEL_TITLE_CLASS}
        titleStyle={PANEL_TITLE_STYLE}
      >
        {t(titleKey)}
      </GoldTitle>
      <p className={`${PANEL_STATUS_CLASS} mt-3`} style={PANEL_TITLE_STYLE}>
        {t(messageKey)}
      </p>

      <div className="mt-4 flex w-full flex-col gap-2">
        {HOLY_CRUSH_PRIVACY_POLICY_URL ? (
          <button
            className={SETTINGS_LINK_BTN_CLASS}
            type="button"
            onClick={() => onOpenUrl(HOLY_CRUSH_PRIVACY_POLICY_URL)}
          >
            {t("settingsPrivacyPolicy")}
          </button>
        ) : null}
        {HOLY_CRUSH_TERMS_OF_USE_URL ? (
          <button
            className={SETTINGS_LINK_BTN_CLASS}
            type="button"
            onClick={() => onOpenUrl(HOLY_CRUSH_TERMS_OF_USE_URL)}
          >
            {t("settingsTermsOfUse")}
          </button>
        ) : null}
      </div>

      <label className="mt-4 flex w-full cursor-pointer items-start gap-2 text-left">
        <input
          checked={checked}
          className="mt-1 h-4 w-4 shrink-0 accent-[#e7c27a]"
          type="checkbox"
          onChange={(event) => setChecked(event.target.checked)}
        />
        <span className="font-display text-[clamp(0.8rem,2.8vw,0.95rem)] font-bold leading-snug text-[#fff8dc]">
          {t("legalAcceptCheckbox")}
        </span>
      </label>

      <button
        className={`${SETTINGS_LINK_BTN_CLASS} ${checked ? "" : "cursor-not-allowed opacity-45"}`}
        disabled={!checked}
        type="button"
        onClick={() => {
          if (!checked) {
            playNoTouch();
            return;
          }
          playClick();
          onAccept();
        }}
      >
        {t("legalAcceptContinue")}
      </button>
    </WoodPanel>
  );
}
