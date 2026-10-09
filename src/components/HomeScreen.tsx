"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

import {
  CLOUD_CURTAIN_HOLD_MS,
  CloudCurtainTransition,
  type CloudCurtainPhase,
} from "./CloudCurtainTransition";

import {LANGUAGE_LABELS, LANGUAGES} from "@/language";
import {useLanguage} from "@/language/LanguageProvider";
import {playClick, playNoTouch} from "@/settings/click";
import {isEffectsEnabled, setEffectsEnabled} from "@/settings/effects";
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
  readTestStageSelection,
  readTestStageStartMode,
  StageStartTestPanel,
  writeTestStageSelection,
  writeTestStageStartMode,
  type TestStageStartMode,
} from "@game/level-up-test";

import {PhaserGame} from "./PhaserGame";
import {WorldScreen} from "./WorldScreen";

const INTRO_HOLD_MS = 900; // quanto resta grande al centro prima di salire
const INTRO_MOVE_MS = 1100; // durata della risalita
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
  onClick: () => void;
};

function TestamentCard({
  label,
  src,
  className = "",
  disabled = false,
  isPressed = false,
  onClick,
}: TestamentCardProps) {
  return (
    <button
      className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-[#e7c27a] bg-[#2a160c] shadow-[0_0_12px_rgba(255,214,120,0.45)] transition-transform duration-100 ${
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

const PANEL_ICON_BTN_CLASS =
  "flex h-[min(14vw,4rem)] w-[min(14vw,4rem)] shrink-0 items-center justify-center rounded-full border-2 border-[#a67c22] bg-[#3d2614] text-[#fff8dc] shadow-[0_0_10px_rgba(255,214,120,0.35)] transition-transform duration-100 active:scale-95";

const PANEL_HINT_TEXT_CLASS = "font-display text-sm font-bold text-[#fff8dc] sm:text-base";

function GoogleMark() {
  return (
    <svg aria-hidden className="h-[52%] w-[52%]" viewBox="0 0 48 48">
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

function FacebookMark() {
  return (
    <svg aria-hidden className="h-[52%] w-[52%]" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function AccessPanel() {
  const {t} = useLanguage();

  return (
    <div className="flex w-full flex-col items-center">
      <p className={PANEL_SECTION_TITLE_CLASS} style={PANEL_TITLE_STYLE}>
        {t("access")}
      </p>
      <div className="mt-4 flex w-full max-w-sm flex-col items-stretch gap-3 max-[700px]:mt-3 sm:mt-6 sm:gap-5">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            aria-label={t("googleSignIn")}
            className={PANEL_ICON_BTN_CLASS}
            type="button"
            onClick={() => playClick()}
          >
            <GoogleMark />
          </button>
          <p className={PANEL_HINT_TEXT_CLASS} style={PANEL_TITLE_STYLE}>
            {t("googleSignIn")}
          </p>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            aria-label={t("facebookSignIn")}
            className={PANEL_ICON_BTN_CLASS}
            type="button"
            onClick={() => playClick()}
          >
            <FacebookMark />
          </button>
          <p className={PANEL_HINT_TEXT_CLASS} style={PANEL_TITLE_STYLE}>
            {t("facebookSignIn")}
          </p>
        </div>
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

export function HomeScreen() {
  const {language, setLanguage, t} = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isStartPressed, setIsStartPressed] = useState(false);
  const [isTestamentOpen, setIsTestamentOpen] = useState(false);
  const [isNewTestamentPressed, setIsNewTestamentPressed] = useState(false);
  const [curtainPhase, setCurtainPhase] = useState<CloudCurtainPhase>("idle");
  const [showWorld, setShowWorld] = useState(false);
  const [phaserBootStart, setPhaserBootStart] = useState<BootStartScene>("default");
  const [testStageIndex, setTestStageIndex] = useState(0);
  const [testStartMode, setTestStartMode] = useState<TestStageStartMode>("map");
  const [pressedPanel, setPressedPanel] = useState<MenuButtonKey | null>(null);
  const [openPanel, setOpenPanel] = useState<MenuPanel | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(isMusicEnabled);
  const [isEffectsOn, setIsEffectsOn] = useState(isEffectsEnabled);
  useEffect(() => {
    setTestStageIndex(readTestStageSelection());
    setTestStartMode(readTestStageStartMode());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying || showWorld || !isMusicOn) return;

    playTrack("home");
  }, [isPlaying, showWorld, isMusicOn]);

  useEffect(() => {
    if (!isStartPressed) return;

    const timer = setTimeout(() => {
      setIsTestamentOpen(true);
      setIsStartPressed(false);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [isStartPressed]);

  useEffect(() => {
    if (!isNewTestamentPressed) return;

    const timer = window.setTimeout(() => {
      playStageTrack(getStageIndex());
      setIsTestamentOpen(false);
      setCurtainPhase("closing");
    }, PRESS_MS);

    return () => window.clearTimeout(timer);
  }, [isNewTestamentPressed]);

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

  const homeSuspended = showWorld || isPlaying;

  const launchTestStage = () => {
    applyTestStageForStart(testStageIndex, testStartMode);
    playStageTrack(testStageIndex);
    setPhaserBootStart(bootStartForTestMode(testStartMode));
    setIsPlaying(true);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div
        aria-hidden={homeSuspended}
        className={`absolute inset-0 overflow-hidden bg-[url('/images/ui_home/background.png')] bg-cover bg-center bg-no-repeat ${
          homeSuspended ? "home-shell-suspended invisible pointer-events-none" : ""
        }`}
      >
      <HomeLightFall />
      <HomeDriftingClouds paused={homeSuspended} visible={isIntroDone} />
      <div
        className="absolute left-1/2 top-0 z-10 w-[82%] max-w-sm ease-out"
        style={{
          transition: `transform ${INTRO_MOVE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          transform: isIntroDone
            ? "translate(-50%, 1vh) scale(0.62)"
            : "translate(-50%, calc(50dvh - 50%)) scale(1)",
        }}
      >
        <Image
          alt="Holy Crush"
          className="h-auto w-full drop-shadow-xl"
          height={702}
          priority
          src="/images/ui_home/logo.png"
          width={942}
        />
      </div>

      <div
        className={`absolute bottom-[12vh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[3.5vh] transition-all duration-500 ${
          isIntroDone ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{transitionDelay: isIntroDone ? `${INTRO_MOVE_MS * 0.6}ms` : "0ms"}}
      >
        {isStageStartTestEnabled() ? (
          <StageStartTestPanel
            mode={testStartMode}
            stageIndex={testStageIndex}
            onLaunch={launchTestStage}
            onModeChange={(mode) => {
              writeTestStageStartMode(mode);
              setTestStartMode(mode);
            }}
            onStageIndexChange={(index) => {
              writeTestStageSelection(index);
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

      {isTestamentOpen && (
        <WoodPanel
          alt={t("newTestament")}
          className="absolute inset-0 z-20"
          src="/images/ui_home/gameContainer.png"
          onClose={() => {
            if (isNewTestamentPressed) return;

            setIsTestamentOpen(false);
          }}
        >
          <div className="flex h-full w-full flex-col gap-1">
            <TestamentCard
              label={t("newTestament")}
              src="/images/ui_game/mode_0.png"
              isPressed={isNewTestamentPressed}
              onClick={() => {
                if (isNewTestamentPressed) return;

                playClick();

                if (isStageStartTestEnabled()) {
                  applyTestStageForStart(testStageIndex, testStartMode);
                }

                setIsNewTestamentPressed(true);
              }}
            />
            <TestamentCard
              className="mt-1"
              disabled
              label={t("oldTestament")}
              src="/images/ui_game/mode_1.png"
              onClick={() => playNoTouch()}
            />
          </div>
        </WoodPanel>
      )}

      {openPanel && (
        <WoodPanel
          alt={t(openPanel)}
          className="absolute inset-0 z-20"
          contentAlign="start"
          onClose={() => setOpenPanel(null)}
        >
          {openPanel === "settings" ? (
            <>
              <p className={PANEL_SECTION_TITLE_CLASS} style={PANEL_TITLE_STYLE}>
                {t("music")}
              </p>
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

              <p className={`mt-4 max-[700px]:mt-3 sm:mt-6 ${PANEL_SECTION_TITLE_CLASS}`} style={PANEL_TITLE_STYLE}>
                {t("effects")}
              </p>
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

              <p className={`mt-4 max-[700px]:mt-3 sm:mt-6 ${PANEL_SECTION_TITLE_CLASS}`} style={PANEL_TITLE_STYLE}>
                {t("language")}
              </p>
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

      <CloudCurtainTransition
        hidden={isPlaying}
        phase={curtainPhase}
        onClosingComplete={() => {
          setShowWorld(true);
          setCurtainPhase("open");
        }}
        onOpeningComplete={() => {
          setCurtainPhase("idle");
          setIsNewTestamentPressed(false);
        }}
      />

      {showWorld && (
        <div className="absolute inset-0 z-20">
          <WorldScreen
            onBack={() => {
              setShowWorld(false);
              setIsNewTestamentPressed(false);
              setCurtainPhase("idle");
            }}
            onEnter={(worldIndex) => {
              if (isStageStartTestEnabled()) {
                applyTestStageForStart(testStageIndex, testStartMode);
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

      {isPlaying && (
        <div className="absolute inset-0 z-20">
          <PhaserGame
            bootStart={phaserBootStart}
            onExit={() => {
              setIsPlaying(false);
              setIsStartPressed(false);
              setIsTestamentOpen(false);
              setIsNewTestamentPressed(false);
              setShowWorld(false);
              setPhaserBootStart("default");
            }}
          />
        </div>
      )}
    </div>
  );
}
