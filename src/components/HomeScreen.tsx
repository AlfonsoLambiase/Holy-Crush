"use client";

import Image from "next/image";
import {useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore} from "react";

import {
  CLOUD_CURTAIN_HOLD_MS,
  CloudCurtainTransition,
  type CloudCurtainPhase,
} from "./CloudCurtainTransition";

import {LANGUAGE_LABELS, LANGUAGES} from "@/language";
import {GoldTitle} from "@/components/GoldTitle";
import {useLanguage} from "@/language/LanguageProvider";
import {playClick, playNoTouch} from "@/settings/click";
import {useGoogleAuth} from "@/settings/google-auth";
import {isEffectsEnabled, setEffectsEnabled} from "@/settings/effects";
import {type GameModeId, getGameMode, setGameMode} from "@/settings/game-mode";
import {isMusicEnabled, setMusicEnabled} from "@/settings/music";
import {getStageIndex, prepareEnterWorld} from "@/settings/progress";
import {playStageTrack, playTrack, stopTrack} from "@/settings/soundtrack";

import {HomeDriftingClouds} from "./HomeDriftingClouds";
import {HomeLightFall} from "./HomeLightFall";
import {SharePanel} from "./SharePanel";
import {WoodPanel} from "./WoodPanel";
import type {BootStartScene} from "@game/scenes/boot";
import {
  applyTestStageForStart,
  bootStartForTestMode,
  isStageStartTestEnabled,
  readTestGameMode,
  readTestStageSelection,
  readTestStageStartMode,
  StageStartTestPanel,
  writeTestGameMode,
  writeTestStageSelection,
  writeTestStageStartMode,
  type TestStageStartMode,
} from "@game/level-up-test";
import {normalizeStageIndexForMode} from "@/settings/stage-map";

import {PhaserGame} from "./PhaserGame";
import {GridBrowser} from "./GridBrowser";
import {HomePlayTutorial} from "./HomePlayTutorial";
import {WorldScreen} from "./WorldScreen";
import {
  markHomePlayTutorialSeen,
  shouldShowHomePlayTutorial,
} from "@/settings/home-play-tutorial";

const INTRO_HOLD_MS = 900; // quanto resta grande al centro prima di salire
const INTRO_MOVE_MS = 1100; // durata della risalita
const LOGO_ASPECT = 702 / 942;
const PRESS_MS = 220; // attesa dell'effetto premuto prima di avviare il gioco

const MENU_BUTTONS = [
  {
    key: "share",
    panel: "share",
    src: "/images/ui_home/share.png",
    duration: "5.2s",
    delay: "-0.8s",
    x: "-2px",
    y: "-3px",
  },
  {
    key: "access",
    panel: "access",
    src: "/images/ui_home/user.png",
    duration: "4.6s",
    delay: "-1.6s",
    x: "2px",
    y: "-4px",
  },
  {
    key: "settings",
    panel: "settings",
    src: "/images/ui_home/settings.png",
    duration: "5.6s",
    delay: "-2.4s",
    x: "-1px",
    y: "-3px",
  },
] as const;

const START_FLOAT = {duration: "4.8s", delay: "0s", x: "2px", y: "-4px"};

type MenuButtonKey = (typeof MENU_BUTTONS)[number]["key"];
type MenuPanel = (typeof MENU_BUTTONS)[number]["panel"];

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
const PANEL_BODY_TEXT_CLASS = "font-accent text-lg font-bold text-[#fff8dc] sm:text-xl";
const PANEL_LANGUAGE_VALUE_CLASS =
  "font-display text-xl font-bold text-[#fff8dc] sm:text-2xl";

type TestamentCardProps = {
  label: string;
  src: string;
  className?: string;
  disabled?: boolean;
  isPressed?: boolean;
  tutorialHighlight?: boolean;
  onClick: () => void;
};

const TESTAMENTS: readonly {mode: GameModeId; label: string; src: string}[] = [
  {mode: 0, label: "newTestament", src: "/images/ui_game/mode_0.png"},
  {mode: 1, label: "oldTestament", src: "/images/ui_game/mode_1.png"},
];

const isTestStageMode = (): boolean => isStageStartTestEnabled();

function TestamentCard({
  label,
  src,
  className = "",
  disabled = false,
  isPressed = false,
  tutorialHighlight = false,
  onClick,
}: TestamentCardProps) {
  return (
    <button
      className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-[#e7c27a] bg-[#2a160c] shadow-[0_0_12px_rgba(255,214,120,0.45)] transition-transform duration-100 ${
        tutorialHighlight ? "home-mode-tutorial-glow" : ""
      } ${
        disabled
          ? "cursor-not-allowed opacity-45 brightness-[0.55] saturate-50"
          : isPressed
            ? "translate-y-1 scale-[0.97]"
            : "active:translate-y-1 active:scale-[0.97]"
      } ${className}`}
      aria-disabled={disabled}
      type="button"
      onClick={() => {
        if (disabled) {
          playNoTouch();
          return;
        }

        onClick();
      }}
    >
      <span
        className="shrink-0 px-2 py-1.5 font-display text-[clamp(0.72rem,2.4vw,0.95rem)] font-bold leading-tight text-[#fff8dc]"
        style={{textShadow: PANEL_TEXT_GLOW}}
      >
        {label}
      </span>
      <span className="relative min-h-0 w-full flex-1">
        <Image alt="" className="object-cover object-center" fill sizes="28rem" src={src} />
      </span>
    </button>
  );
}

const APP_CORNER_BTN_CLASS = "h-[min(16vw,4.75rem)] w-[min(16vw,4.75rem)]";

const GOOGLE_BUTTON_CLASS =
  "flex h-10 w-full max-w-xs items-center justify-center gap-2.5 rounded border border-[#747775] bg-white px-3 text-sm font-medium text-[#1f1f1f] shadow-sm transition-opacity disabled:opacity-60";

const GOOGLE_BUTTON_FONT = {fontFamily: "Roboto, Arial, sans-serif"} as const;

const PANEL_STATUS_CLASS =
  "text-center font-display text-[clamp(0.95rem,3.2vw,1.15rem)] font-bold leading-snug text-[#fff8dc]";

function GoogleMark() {
  return (
    <svg aria-hidden className="h-[18px] w-[18px] shrink-0" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.7 7.1l6.3 5.3C37.4 38.3 44 33 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function AccessPanel() {
  const {t} = useLanguage();
  const auth = useGoogleAuth();
  const busy = auth.phase !== "idle";
  const accountName = auth.user ? auth.user.displayName ?? t("googlePlayer") : null;

  return (
    <div className="flex w-full flex-col items-center pb-[env(safe-area-inset-bottom)]">
      <GoldTitle titleClassName={PANEL_SECTION_TITLE_CLASS} titleStyle={PANEL_TITLE_STYLE}>
        {t("access")}
      </GoldTitle>
      <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-3 max-[700px]:mt-3 sm:mt-6 sm:gap-4">
        {!auth.ready ? (
          <p className={PANEL_STATUS_CLASS} style={PANEL_TITLE_STYLE}>
            {t("loading")}
          </p>
        ) : !auth.native ? (
          <p className={PANEL_STATUS_CLASS} style={PANEL_TITLE_STYLE}>
            {t("googleSignInAndroidOnly")}
          </p>
        ) : accountName ? (
          <>
            <p className={`${PANEL_STATUS_CLASS} w-full truncate`} style={PANEL_TITLE_STYLE}>
              {accountName}
            </p>
            <button
              className="font-display text-lg font-bold text-[#ffd76a] underline-offset-4 disabled:opacity-60"
              disabled={busy}
              type="button"
              onClick={() => {
                playClick();
                auth.signOut();
              }}
            >
              {t("googleSignOut")}
            </button>
          </>
        ) : (
          <button
            aria-busy={busy}
            className={GOOGLE_BUTTON_CLASS}
            disabled={busy}
            style={GOOGLE_BUTTON_FONT}
            type="button"
            onClick={() => {
              playClick();
              auth.signIn();
            }}
          >
            <GoogleMark />
            <span>{t("googleSignIn")}</span>
          </button>
        )}
        {auth.phase === "signing-in" ? (
          <p className={PANEL_STATUS_CLASS} style={PANEL_TITLE_STYLE}>
            {t("googleSigningIn")}
          </p>
        ) : null}
        {auth.notice === "cancelled" ? (
          <p className={PANEL_STATUS_CLASS} style={PANEL_TITLE_STYLE}>
            {t("googleSignInCancelled")}
          </p>
        ) : null}
        {auth.notice === "failed" || auth.notice === "developer" ? (
          <p className={`${PANEL_STATUS_CLASS} text-[#ffb4a2]`} role="alert" style={PANEL_TITLE_STYLE}>
            {t(auth.notice === "developer" ? "googleSignInDeveloper" : "googleSignInFailed")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function SettingsSoundToggle({
  isOn,
  onEnable,
  onDisable,
  soundOnLabel,
  soundOffLabel,
}: {
  isOn: boolean;
  onEnable: () => void;
  onDisable: () => void;
  soundOnLabel: string;
  soundOffLabel: string;
}) {
  const activeClass = "z-10 scale-[1.1] opacity-100 brightness-100";
  const idleClass = "scale-[0.86] opacity-45 brightness-[0.52] saturate-[0.75]";

  return (
    <div className="mt-3 flex items-end justify-center gap-6 sm:gap-8">
      <button
        aria-label={soundOnLabel}
        aria-pressed={isOn}
        className={`touch-manipulation transition-all duration-200 ease-out active:scale-95 ${
          isOn ? activeClass : idleClass
        }`}
        type="button"
        onClick={() => {
          if (isOn) return;

          playClick();
          onEnable();
        }}
      >
        <Image
          alt=""
          className={`${APP_CORNER_BTN_CLASS} drop-shadow-lg`}
          height={156}
          src="/images/ui_game/btnSound.png"
          width={156}
        />
      </button>
      <button
        aria-label={soundOffLabel}
        aria-pressed={!isOn}
        className={`touch-manipulation transition-all duration-200 ease-out active:scale-95 ${
          isOn ? idleClass : activeClass
        }`}
        type="button"
        onClick={() => {
          if (!isOn) return;

          playClick();
          onDisable();
        }}
      >
        <Image
          alt=""
          className={`${APP_CORNER_BTN_CLASS} drop-shadow-lg`}
          height={156}
          src="/images/ui_game/btnNoSound.png"
          width={156}
        />
      </button>
    </div>
  );
}

function LanguageArrow({direction, onClick}: {direction: -1 | 1; onClick: () => void}) {
  const [zoomKey, setZoomKey] = useState(0);
  const isLeft = direction < 0;

  return (
    <button
      aria-label={isLeft ? "previous language" : "next language"}
      className="px-1.5 py-1 font-accent text-xl font-bold leading-none text-[#ffd76a] sm:text-2xl"
      type="button"
      onClick={() => {
        setZoomKey((key) => key + 1);
        onClick();
      }}
    >
      <span
        key={zoomKey}
        className={`inline-block ${zoomKey > 0 ? "language-arrow-zoom" : ""}`}
        style={PANEL_OUTLINE}
      >
        {isLeft ? "‹" : "›"}
      </span>
    </button>
  );
}

type CloudFloat = {
  duration: string;
  delay: string;
  x: string;
  y: string;
};

type HomeImageButtonProps = {
  alt: string;
  src: string;
  width: number;
  height: number;
  className: string;
  float: CloudFloat;
  isPressed?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
};

function HomeImageButton({
  alt,
  src,
  width,
  height,
  className,
  float,
  isPressed = false,
  children,
  onClick,
}: HomeImageButtonProps) {
  return (
    <button
      aria-label={alt}
      className={`${className} home-cloud group relative touch-manipulation`}
      style={{
        "--cloud-duration": float.duration,
        "--cloud-delay": float.delay,
        "--cloud-x": float.x,
        "--cloud-y": float.y,
      } as React.CSSProperties}
      type="button"
      onClick={() => {
        playClick();
        onClick?.();
      }}
    >
      <span
        className={`relative block w-full transition-transform duration-100 ease-out ${
          isPressed
            ? "translate-y-1 scale-[0.93]"
            : "group-active:translate-y-1 group-active:scale-[0.93]"
        }`}
      >
        <Image
          alt={alt}
          className={`h-auto w-full transition-[filter] duration-100 ease-out ${
            isPressed
              ? "brightness-90 drop-shadow-none"
              : "drop-shadow-lg group-active:brightness-90 group-active:drop-shadow-none"
          }`}
          height={height}
          src={src}
          width={width}
        />
        {children}
      </span>
    </button>
  );
}

const subscribeNothing = () => () => {};

const subscribeReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");

  media.addEventListener("change", onChange);

  return () => media.removeEventListener("change", onChange);
};

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HomeScreen() {
  const {language, setLanguage, t} = useLanguage();

  useGoogleAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [gridsOpen, setGridsOpen] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, prefersReducedMotion, () => false);
  const [introMoveStarted, setIntroMoveStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [logoIntroReady, setLogoIntroReady] = useState(false);
  const introMoveVisible = introMoveStarted || reducedMotion;
  const introDone = introComplete || reducedMotion;
  const logoReady = logoIntroReady || reducedMotion;
  const logoWrapRef = useRef<HTMLDivElement>(null);
  const [isStartPressed, setIsStartPressed] = useState(false);
  const [isTestamentOpen, setIsTestamentOpen] = useState(false);
  const [homePlayTutorialOpen, setHomePlayTutorialOpen] = useState(false);
  const [pressedMode, setPressedMode] = useState<GameModeId | null>(null);
  const [curtainPhase, setCurtainPhase] = useState<CloudCurtainPhase>("idle");
  const [showWorld, setShowWorld] = useState(false);
  const homeShellRef = useRef<HTMLDivElement>(null);
  const [phaserBootStart, setPhaserBootStart] = useState<BootStartScene>("default");
  const storedTestGameMode = useSyncExternalStore(subscribeNothing, readTestGameMode, () => 0 as GameModeId);
  const storedTestStageIndex = useSyncExternalStore(
    subscribeNothing,
    () => readTestStageSelection(readTestGameMode()),
    () => 0,
  );
  const storedTestStartMode = useSyncExternalStore(
    subscribeNothing,
    readTestStageStartMode,
    () => "map" as TestStageStartMode,
  );
  const [testGameModeDraft, setTestGameMode] = useState<GameModeId | null>(null);
  const [testStageIndexDraft, setTestStageIndex] = useState<number | null>(null);
  const [testStartModeDraft, setTestStartMode] = useState<TestStageStartMode | null>(null);
  const testGameMode = testGameModeDraft ?? storedTestGameMode;
  const testStageIndex = testStageIndexDraft ?? storedTestStageIndex;
  const testStartMode = testStartModeDraft ?? storedTestStartMode;
  const [pressedPanel, setPressedPanel] = useState<MenuButtonKey | null>(null);
  const [openPanel, setOpenPanel] = useState<MenuPanel | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(isMusicEnabled);
  const [isEffectsOn, setIsEffectsOn] = useState(isEffectsEnabled);

  const syncLogoIntroMetrics = useCallback(() => {
    const el = logoWrapRef.current;

    if (!el) return false;

    let height = el.getBoundingClientRect().height;

    if (height < 1 && el.offsetWidth > 0) height = el.offsetWidth * LOGO_ASPECT;

    if (height < 1) return false;

    const fromY = window.innerHeight / 2 - height / 2;
    const toY = Math.max(0, window.innerHeight * 0.01);

    el.style.setProperty("--home-logo-from-y", `${fromY}px`);
    el.style.setProperty("--home-logo-to-y", `${toY}px`);

    return true;
  }, []);

  useLayoutEffect(() => {
    if (!syncLogoIntroMetrics() || reducedMotion || logoIntroReady) return;

    const frame = requestAnimationFrame(() => setLogoIntroReady(true));

    return () => cancelAnimationFrame(frame);
  }, [logoIntroReady, reducedMotion, syncLogoIntroMetrics]);

  useEffect(() => {
    if (reducedMotion) return;

    const holdTimer = setTimeout(() => setIntroMoveStarted(true), INTRO_HOLD_MS);

    return () => clearTimeout(holdTimer);
  }, [reducedMotion]);

  useEffect(() => {
    if (!logoIntroReady || introComplete || reducedMotion) return;

    const failSafe = setTimeout(
      () => setIntroComplete(true),
      INTRO_HOLD_MS + INTRO_MOVE_MS + 80,
    );

    return () => clearTimeout(failSafe);
  }, [introComplete, logoIntroReady, reducedMotion]);

  useEffect(() => {
    if (isPlaying || showWorld || !isMusicOn) return;

    playTrack("home");
  }, [isPlaying, showWorld, isMusicOn]);

  //* Mappa mondi sopra Phaser: stesso angolo HUD del btnRead in stage-map (playBook).
  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-phaser-root]");

    if (!root) return;

    if (showWorld) {
      root.style.pointerEvents = "none";

      return () => {
        root.style.pointerEvents = "";
      };
    }

    root.style.pointerEvents = "";

    return undefined;
  }, [showWorld]);

  useEffect(() => {
    if (!isStartPressed) return;

    const timer = setTimeout(() => {
      setIsTestamentOpen(true);

      if (shouldShowHomePlayTutorial()) {
        setHomePlayTutorialOpen(true);
      }

      setIsStartPressed(false);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [isStartPressed]);

  useEffect(() => {
    if (pressedMode === null) return;

    const timer = window.setTimeout(() => {
      playStageTrack(getStageIndex());
      setIsTestamentOpen(false);
      setCurtainPhase("closing");
    }, PRESS_MS);

    return () => window.clearTimeout(timer);
  }, [pressedMode]);

  useEffect(() => {
    if (curtainPhase !== "open") return;

    const timer = window.setTimeout(() => {
      setCurtainPhase("opening");
    }, CLOUD_CURTAIN_HOLD_MS);

    return () => window.clearTimeout(timer);
  }, [curtainPhase]);

  useEffect(() => {
    if (!pressedPanel) return;

    const item = MENU_BUTTONS.find((button) => button.key === pressedPanel);

    const timer = setTimeout(() => {
      if (item) setOpenPanel(item.panel);
      setPressedPanel(null);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [pressedPanel]);

  const launchTestStage = () => {
    applyTestStageForStart(testStageIndex, testStartMode, testGameMode);
    playStageTrack(testStageIndex);
    setPhaserBootStart(bootStartForTestMode(testStartMode));
    setIsPlaying(true);
  };

  const handleTestGameModeChange = (mode: GameModeId) => {
    writeTestGameMode(mode);
    setTestGameMode(mode);
    const nextStage = normalizeStageIndexForMode(testStageIndex, mode);

    writeTestStageSelection(nextStage, mode);
    setTestStageIndex(nextStage);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {!isPlaying && (
      <div
        ref={homeShellRef}
        inert={showWorld ? true : undefined}
        className={`absolute inset-0 overflow-hidden bg-[url('/images/ui_home/background.png')] bg-cover bg-center bg-no-repeat ${
          showWorld ? "home-shell-suspended invisible pointer-events-none" : ""
        }`}
      >
      <HomeLightFall paused={showWorld || !introDone} />
      <HomeDriftingClouds paused={showWorld} visible={introDone} />
      <div
        ref={logoWrapRef}
        className={`home-logo-intro ${logoReady ? "home-logo-intro--animate" : ""} ${
          introDone ? "home-logo-intro--done" : ""
        }`}
        style={
          {
            "--home-logo-hold-ms": `${INTRO_HOLD_MS}ms`,
            "--home-logo-move-ms": `${INTRO_MOVE_MS}ms`,
          } as React.CSSProperties
        }
        onAnimationEnd={(event) => {
          if (event.animationName !== "home-logo-rise") return;

          setIntroComplete(true);
        }}
      >
        <Image
          alt="Holy Crush"
          className="h-auto w-full drop-shadow-xl"
          height={702}
          onLoad={() => {
            if (logoReady) return;

            if (syncLogoIntroMetrics()) setLogoIntroReady(true);
          }}
          priority
          src="/images/ui_home/logo.png"
          width={942}
        />
      </div>

      <div
        className={`absolute bottom-[12vh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[3.5vh] transition-all duration-500 ${
          introMoveVisible ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{transitionDelay: introMoveVisible ? `${INTRO_MOVE_MS * 0.6}ms` : "0ms"}}
      >
        {isStageStartTestEnabled() ? (
          <StageStartTestPanel
            gameMode={testGameMode}
            gameModeLabels={{
              0: t("newTestament"),
              1: t("oldTestament"),
            }}
            mode={testStartMode}
            stageIndex={testStageIndex}
            onBrowseGrids={() => setGridsOpen(true)}
            onGameModeChange={handleTestGameModeChange}
            onLaunch={launchTestStage}
            onModeChange={(mode) => {
              writeTestStageStartMode(mode);
              setTestStartMode(mode);
            }}
            onStageIndexChange={(index) => {
              writeTestStageSelection(index, testGameMode);
              setTestStageIndex(index);
            }}
          />
        ) : null}

        <HomeImageButton
          alt={t("start")}
          className="relative z-0 w-[min(62vw,18rem)]"
          float={START_FLOAT}
          height={181}
          src="/images/ui_home/start.png"
          width={479}
          isPressed={isStartPressed}
          onClick={() => {
            if (isStartPressed || isTestamentOpen) return;

            setIsStartPressed(true);
          }}
        >
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold tracking-wide transition-colors duration-100 ${
              isStartPressed ? "text-[#e8d090]" : "text-[#fde8a0] group-active:text-[#e8d090]"
            }`}
            style={{
              fontSize: "clamp(1.4rem, 6.5vw, 2.1rem)",
              WebkitTextStroke: "3px #9a6318",
              paintOrder: "stroke fill",
            }}
          >
            {t("start")}
          </span>
        </HomeImageButton>

        <div className="flex items-center gap-[6vw]">
          {MENU_BUTTONS.map(({key, src, duration, delay, x, y}) => (
            <HomeImageButton
              key={key}
              alt={key === "share" ? t("share") : t(key)}
              className="w-[min(16vw,4.75rem)]"
              float={{duration, delay, x, y}}
              height={512}
              src={src}
              width={512}
              isPressed={pressedPanel === key}
              onClick={() => {
                if (pressedPanel || isStartPressed) return;
                setPressedPanel(key);
              }}
            />
          ))}
        </div>
      </div>

      {isTestamentOpen && homePlayTutorialOpen ? (
        <div aria-hidden className="absolute inset-0 z-[28] bg-black/85 pointer-events-none" />
      ) : null}

      {isTestamentOpen && (
        <WoodPanel
          alt={t("newTestament")}
          backdropClassName={homePlayTutorialOpen ? "bg-transparent" : "bg-black/55"}
          className={homePlayTutorialOpen ? "absolute inset-0 z-[32]" : "absolute inset-0 z-20"}
          src="/images/ui_home/gameContainer.png"
          onClose={() => {
            if (pressedMode !== null || homePlayTutorialOpen) return;

            setHomePlayTutorialOpen(false);
            setIsTestamentOpen(false);
          }}
        >
          <div
            className={`relative flex h-full w-full flex-col gap-1 ${
              homePlayTutorialOpen ? "brightness-[0.55] saturate-[0.88]" : ""
            }`}
          >
            {homePlayTutorialOpen ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-[1] rounded-lg bg-black/25"
              />
            ) : null}
            {TESTAMENTS.map(({mode, label, src}, index) => (
              <TestamentCard
                key={mode}
                className={`relative z-[2] ${index > 0 ? "mt-1" : ""}`}
                label={t(label)}
                src={src}
                isPressed={pressedMode === mode}
                tutorialHighlight={homePlayTutorialOpen}
                onClick={() => {
                  if (pressedMode !== null || homePlayTutorialOpen) return;

                  playClick();
                  setGameMode(mode);
                  writeTestGameMode(mode);
                  setTestGameMode(mode);

                  if (isTestStageMode()) {
                    applyTestStageForStart(testStageIndex, testStartMode, mode);
                  }

                  setPressedMode(mode);
                }}
              />
            ))}
          </div>
        </WoodPanel>
      )}

      {isTestamentOpen && homePlayTutorialOpen ? (
        <HomePlayTutorial
          onComplete={() => {
            markHomePlayTutorialSeen();
            setHomePlayTutorialOpen(false);
          }}
        />
      ) : null}

      {openPanel && (
        <WoodPanel
          alt={t(openPanel)}
          className="absolute inset-0 z-20"
          contentAlign="start"
          onClose={() => setOpenPanel(null)}
        >
          {openPanel === "settings" ? (
            <>
              <GoldTitle titleClassName={PANEL_SECTION_TITLE_CLASS} titleStyle={PANEL_TITLE_STYLE}>
                {t("music")}
              </GoldTitle>
              <SettingsSoundToggle
                isOn={isMusicOn}
                soundOffLabel={t("off")}
                soundOnLabel={t("on")}
                onDisable={() => {
                  setIsMusicOn(false);
                  setMusicEnabled(false);
                  stopTrack();
                }}
                onEnable={() => {
                  setIsMusicOn(true);
                  setMusicEnabled(true);
                  playTrack("home");
                }}
              />

              <GoldTitle
                className="mt-4 max-[700px]:mt-3 sm:mt-6"
                titleClassName={PANEL_SECTION_TITLE_CLASS}
                titleStyle={PANEL_TITLE_STYLE}
              >
                {t("effects")}
              </GoldTitle>
              <SettingsSoundToggle
                isOn={isEffectsOn}
                soundOffLabel={t("off")}
                soundOnLabel={t("on")}
                onDisable={() => {
                  setIsEffectsOn(false);
                  setEffectsEnabled(false);
                }}
                onEnable={() => {
                  setIsEffectsOn(true);
                  setEffectsEnabled(true);
                }}
              />

              <GoldTitle
                className="mt-4 max-[700px]:mt-3 sm:mt-6"
                titleClassName={PANEL_SECTION_TITLE_CLASS}
                titleStyle={PANEL_TITLE_STYLE}
              >
                {t("language")}
              </GoldTitle>
              <div className="mt-2 flex items-center justify-center gap-1">
                <LanguageArrow
                  direction={-1}
                  onClick={() => {
                    const index = LANGUAGES.indexOf(language);
                    setLanguage(LANGUAGES[(index - 1 + LANGUAGES.length) % LANGUAGES.length]);
                  }}
                />
                <p className={PANEL_LANGUAGE_VALUE_CLASS} style={PANEL_TITLE_STYLE}>
                  {LANGUAGE_LABELS[language]}
                </p>
                <LanguageArrow
                  direction={1}
                  onClick={() => {
                    const index = LANGUAGES.indexOf(language);
                    setLanguage(LANGUAGES[(index + 1) % LANGUAGES.length]);
                  }}
                />
              </div>
            </>
          ) : openPanel === "share" ? (
            <SharePanel />
          ) : (
            <AccessPanel />
          )}
        </WoodPanel>
      )}
      </div>
      )}

      <CloudCurtainTransition
        hidden={isPlaying}
        phase={curtainPhase}
        onClosingComplete={() => {
          setIsPlaying(false);
          setShowWorld(true);
          setCurtainPhase("open");
        }}
        onOpeningComplete={() => {
          setCurtainPhase("idle");
          setPressedMode(null);
        }}
      />

      {showWorld && (
        <div className="absolute inset-0 z-30 isolate">
          <WorldScreen
            onBack={() => {
              setShowWorld(false);
              setPressedMode(null);
              setCurtainPhase("idle");
            }}
            onEnter={(worldIndex) => {
              if (isTestStageMode()) {
                applyTestStageForStart(testStageIndex, testStartMode, getGameMode());
              } else {
                prepareEnterWorld(worldIndex);
              }

              // Sempre opening dello stage effettivo (dopo prepareEnterWorld / test).
              setPhaserBootStart("opening");

              playStageTrack(getStageIndex());
              setShowWorld(false);
              setIsPlaying(true);
            }}
          />
        </div>
      )}

      {isPlaying && !showWorld && (
        <div className="absolute inset-0 z-20" data-phaser-root>
          <PhaserGame
            bootStart={phaserBootStart}
            onExit={() => {
              setIsPlaying(false);
              setIsStartPressed(false);
              setIsTestamentOpen(false);
              setPressedMode(null);
              setShowWorld(false);
              setPhaserBootStart("default");
            }}
          />
        </div>
      )}

      {gridsOpen ? <GridBrowser onClose={() => setGridsOpen(false)} /> : null}
    </div>
  );
}
