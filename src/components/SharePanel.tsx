"use client";

import {useState} from "react";

import {useLanguage} from "@/language/LanguageProvider";
import {playClick, playNoTouch} from "@/settings/click";
import {resolveGameShareUrl} from "@/settings/share-link";

const PANEL_TEXT_GLOW =
  "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)";

const PANEL_OUTLINE: React.CSSProperties = {
  WebkitTextStroke: "2px #2a160ccc",
  paintOrder: "stroke fill",
};

const PANEL_TITLE_STYLE: React.CSSProperties = {
  textShadow: PANEL_TEXT_GLOW,
  ...PANEL_OUTLINE,
};

const PANEL_SECTION_TITLE_CLASS =
  "font-display text-xl font-bold text-[#ffd76a] max-[380px]:text-lg sm:text-2xl md:text-3xl";

const SHARE_ICON_CLASS =
  "flex h-[min(14vw,4rem)] w-[min(14vw,4rem)] items-center justify-center rounded-full border-2 border-[#a67c22] bg-[#3d2614] text-[#fff8dc] shadow-[0_0_10px_rgba(255,214,120,0.35)] transition-transform duration-100 active:scale-95";

function WhatsAppIcon() {
  return (
    <svg aria-hidden className="h-[52%] w-[52%]" viewBox="0 0 24 24">
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="currentColor"
      />
      <path
        d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.993-1.414A9.958 9.958 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.182a8.16 8.16 0 01-4.162-1.137l-.298-.178-2.966.84.84-2.891-.194-.312A8.182 8.182 0 1112 20.182z"
        fill="currentColor"
      />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg aria-hidden className="h-[52%] w-[52%]" viewBox="0 0 24 24">
      <path
        d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"
        fill="currentColor"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden className="h-[50%] w-[50%]" viewBox="0 0 24 24" fill="none">
      <rect height="13" rx="2" stroke="currentColor" strokeWidth="2" width="13" x="8" y="3" />
      <path
        d="M5 8H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-1"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function ShareMoreIcon() {
  return (
    <svg aria-hidden className="h-[50%] w-[50%]" viewBox="0 0 24 24" fill="none">
      <circle cx="18" cy="5" fill="currentColor" r="2.5" />
      <circle cx="6" cy="12" fill="currentColor" r="2.5" />
      <circle cx="18" cy="19" fill="currentColor" r="2.5" />
      <path d="M8.2 11.1l7.1-3.8M8.2 12.9l7.1 3.8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function SharePanel() {
  const {t} = useLanguage();
  const [copied, setCopied] = useState(false);

  const shareUrl = resolveGameShareUrl();
  const shareText = t("shareInvite");

  const openWindow = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareWhatsApp = () => {
    if (!shareUrl) {
      playNoTouch();

      return;
    }

    playClick();
    const query = new URLSearchParams({
      text: `${shareText} ${shareUrl}`.trim(),
    });

    openWindow(`https://wa.me/?${query.toString()}`);
  };

  const shareTelegram = () => {
    if (!shareUrl) {
      playNoTouch();

      return;
    }

    playClick();
    const query = new URLSearchParams({
      url: shareUrl,
      text: shareText,
    });

    openWindow(`https://t.me/share/url?${query.toString()}`);
  };

  const shareNative = async () => {
    if (!shareUrl || !navigator.share) {
      playNoTouch();

      return;
    }

    playClick();

    try {
      await navigator.share({title: "Holy Crush", text: shareText, url: shareUrl});
    } catch {
      /* utente ha annullato */
    }
  };

  const copyLink = async () => {
    if (!shareUrl) {
      playNoTouch();

      return;
    }

    playClick();

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      playNoTouch();
    }
  };

  return (
    <div className="flex w-full flex-col items-center">
      <p className={PANEL_SECTION_TITLE_CLASS} style={PANEL_TITLE_STYLE}>
        {t("share")}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3 max-[700px]:mt-3 sm:mt-6 sm:gap-5">
        <button
          aria-label={t("shareWhatsApp")}
          className={SHARE_ICON_CLASS}
          type="button"
          onClick={shareWhatsApp}
        >
          <WhatsAppIcon />
        </button>
        <button
          aria-label={t("shareTelegram")}
          className={SHARE_ICON_CLASS}
          type="button"
          onClick={shareTelegram}
        >
          <TelegramIcon />
        </button>
        <button
          aria-label={t("shareMore")}
          className={SHARE_ICON_CLASS}
          type="button"
          onClick={() => void shareNative()}
        >
          <ShareMoreIcon />
        </button>
        <button
          aria-label={t("shareCopyLink")}
          className={SHARE_ICON_CLASS}
          type="button"
          onClick={() => void copyLink()}
        >
          <CopyIcon />
        </button>
      </div>

      <p
        className={`mt-5 min-h-[1.25rem] font-display text-sm font-bold sm:text-base ${
          copied ? "text-[#ffd76a]" : "text-[#fff8dc]"
        }`}
        style={PANEL_TITLE_STYLE}
      >
        {copied ? t("shareLinkCopied") : t("shareCopyHint")}
      </p>
    </div>
  );
}
