"use client";

import {App} from "@capacitor/app";
import {Capacitor} from "@capacitor/core";
import {useEffect, useState} from "react";

import {GameExitPopupPanel} from "@/components/GameExitPopupPanel";
import {HomeImageButton} from "@/components/HomeImageButton";
import {LegalConsentPanel} from "@/components/LegalConsentPanel";
import {useLanguage} from "@/language/LanguageProvider";
import {
  runAppVersionCheck,
  setStoredLegalVersion,
} from "@/settings/app-version-config";
import {playClick} from "@/settings/click";

const LEGAL_PANEL_DELAY_FIRST_MS = 400;
const LEGAL_PANEL_DELAY_REVISION_MS = 1500;

const START_FLOAT = {duration: "4.8s", delay: "0s", x: "2px", y: "-4px"} as const;

const PREVIEW_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.orbitagames.holycrush";

type DevVersionPreview = "update" | "legal-welcome" | "legal-revision" | null;

/** Solo `npm run dev`: `?preview=update`, `?preview=legal-welcome`, `?preview=legal-revision`. */
const readDevVersionPreview = (): DevVersionPreview => {
  if (process.env.NODE_ENV !== "development") return null;
  if (typeof window === "undefined") return null;

  const value = new URLSearchParams(window.location.search).get("preview")?.trim().toLowerCase();
  if (value === "update" || value === "app-update") return "update";
  if (value === "legal-welcome" || value === "legal") return "legal-welcome";
  if (value === "legal-revision") return "legal-revision";

  return null;
};

type AppVersionGateProps = {
  homeUiActive: boolean;
};

export function AppVersionGate({homeUiActive}: AppVersionGateProps) {
  const {t} = useLanguage();
  const [devPreview, setDevPreview] = useState<DevVersionPreview>(null);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [pendingLegalVersion, setPendingLegalVersion] = useState<string | null>(null);
  const [isFirstLegalAcceptance, setIsFirstLegalAcceptance] = useState(true);
  const [showLegalPanel, setShowLegalPanel] = useState(false);
  const [legalPanelKey, setLegalPanelKey] = useState(0);

  useEffect(() => {
    const preview = readDevVersionPreview();
    if (preview === "update") {
      setDevPreview("update");
      setStoreUrl(PREVIEW_STORE_URL);
      return;
    }

    if (preview === "legal-welcome") {
      setDevPreview("legal-welcome");
      setPendingLegalVersion("dev-preview");
      setIsFirstLegalAcceptance(true);
      setShowLegalPanel(true);
      setLegalPanelKey((k) => k + 1);
      return;
    }

    if (preview === "legal-revision") {
      setDevPreview("legal-revision");
      setPendingLegalVersion("dev-preview");
      setIsFirstLegalAcceptance(false);
      setShowLegalPanel(true);
      setLegalPanelKey((k) => k + 1);
      return;
    }

    setDevPreview(null);
  }, []);

  const scheduleLegalPanel = (first: boolean, cancelled: () => boolean) => {
    const delay = first ? LEGAL_PANEL_DELAY_FIRST_MS : LEGAL_PANEL_DELAY_REVISION_MS;
    return window.setTimeout(() => {
      if (!cancelled()) setShowLegalPanel(true);
    }, delay);
  };

  useEffect(() => {
    if (devPreview) return;
    if (!Capacitor.isNativePlatform()) return;

    let legalDelayTimer: number | null = null;
    let cancelled = false;
    const isCancelled = () => cancelled;

    const applyCheck = async () => {
      const result = await runAppVersionCheck();
      if (cancelled) return;

      if (result.updateRequired && result.storeUrl) {
        setStoreUrl(result.storeUrl);
        setPendingLegalVersion(null);
        setShowLegalPanel(false);
        if (legalDelayTimer !== null) {
          window.clearTimeout(legalDelayTimer);
          legalDelayTimer = null;
        }
        return;
      }

      setStoreUrl(null);

      if (!homeUiActive) {
        setPendingLegalVersion(result.remoteLegalVersion);
        setShowLegalPanel(false);
        return;
      }

      if (result.legalAcceptanceRequired && result.remoteLegalVersion) {
        setPendingLegalVersion(result.remoteLegalVersion);
        setIsFirstLegalAcceptance(result.isFirstLegalAcceptance);
        setShowLegalPanel(false);
        setLegalPanelKey((k) => k + 1);
        if (legalDelayTimer !== null) window.clearTimeout(legalDelayTimer);
        legalDelayTimer = scheduleLegalPanel(result.isFirstLegalAcceptance, isCancelled);
      } else {
        setPendingLegalVersion(null);
        setShowLegalPanel(false);
      }
    };

    void applyCheck();

    let listener: {remove: () => Promise<void>} | null = null;

    void App.addListener("appStateChange", ({isActive}) => {
      if (isActive) void applyCheck();
    }).then((handle) => {
      listener = handle;
    });

    return () => {
      cancelled = true;
      if (legalDelayTimer !== null) window.clearTimeout(legalDelayTimer);
      void listener?.remove();
    };
  }, [devPreview, homeUiActive]);

  useEffect(() => {
    if (storeUrl || !homeUiActive || !pendingLegalVersion) return;

    const delay = isFirstLegalAcceptance ? LEGAL_PANEL_DELAY_FIRST_MS : LEGAL_PANEL_DELAY_REVISION_MS;
    const timer = window.setTimeout(() => setShowLegalPanel(true), delay);
    return () => window.clearTimeout(timer);
  }, [homeUiActive, isFirstLegalAcceptance, pendingLegalVersion, storeUrl]);

  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    playClick();
  };

  const acceptLegal = () => {
    if (!pendingLegalVersion) return;
    setStoredLegalVersion(pendingLegalVersion);
    setShowLegalPanel(false);
    setPendingLegalVersion(null);
  };

  const showInBrowser = devPreview !== null;

  if (!Capacitor.isNativePlatform() && !showInBrowser) return null;

  const showLegal =
    showLegalPanel &&
    pendingLegalVersion &&
    (homeUiActive || devPreview === "legal-welcome" || devPreview === "legal-revision");

  return (
    <>
      {storeUrl ? (
        <GameExitPopupPanel body={t("appUpdateBody")} title={t("appUpdateTitle")}>
          <HomeImageButton
            alt={t("appUpdateButton")}
            className="relative z-0 mt-1 w-[min(58vw,12.5rem)]"
            float={START_FLOAT}
            floatAnimation={false}
            height={181}
            src="/images/ui_home/start.png"
            width={479}
            onClick={() => window.open(storeUrl, "_blank", "noopener,noreferrer")}
          >
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center font-display font-bold tracking-wide text-[#fde8a0] group-active:text-[#e8d090]"
              style={{
                fontSize: "clamp(0.72rem, 3.4vw, 1.05rem)",
                WebkitTextStroke: "2px #9a6318",
                paintOrder: "stroke fill",
              }}
            >
              {t("appUpdateButton")}
            </span>
          </HomeImageButton>
        </GameExitPopupPanel>
      ) : null}

      {showLegal ? (
        <LegalConsentPanel
          key={legalPanelKey}
          isFirstAcceptance={isFirstLegalAcceptance}
          onAccept={acceptLegal}
          onOpenUrl={openExternal}
        />
      ) : null}
    </>
  );
}
