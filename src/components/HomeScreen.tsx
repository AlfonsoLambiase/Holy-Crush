"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

import {LANGUAGE_LABELS, LANGUAGES} from "@/language";
import {useLanguage} from "@/language/LanguageProvider";
import {playClick} from "@/settings/click";
import {isEffectsEnabled, setEffectsEnabled} from "@/settings/effects";
import {isMusicEnabled, setMusicEnabled} from "@/settings/music";
import {getMusicTrack, playTrack, stopTrack} from "@/settings/soundtrack";

import {HomeLightFall} from "./HomeLightFall";
import {PhaserGame} from "./PhaserGame";

const INTRO_HOLD_MS = 900; // quanto resta grande al centro prima di salire
const INTRO_MOVE_MS = 1100; // durata della risalita
const PRESS_MS = 220; // attesa dell'effetto premuto prima di avviare il gioco

const MENU_BUTTONS = [
  {key: "shop", src: "/ui_home/shop.png", duration: "5.2s", delay: "-0.8s", x: "-2px", y: "-3px"},
  {key: "info", src: "/ui_home/user.png", duration: "4.6s", delay: "-1.6s", x: "2px", y: "-4px"},
  {key: "settings", src: "/ui_home/settings.png", duration: "5.6s", delay: "-2.4s", x: "-1px", y: "-3px"},
] as const;

const START_FLOAT = {duration: "4.8s", delay: "0s", x: "2px", y: "-4px"};

type MenuPanel = (typeof MENU_BUTTONS)[number]["key"];

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

type WoodPanelProps = {
  alt: string;
  src?: string;
  children: React.ReactNode;
  onClose: () => void;
};

function WoodPanel({alt, src = "/ui_home/settingContainer.png", children, onClose}: WoodPanelProps) {
  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 px-3"
      onClick={onClose}
    >
      <div
        className="relative w-[min(88vw,28rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <Image
          alt={alt}
          className={`h-auto w-full ${src.includes("gameContainer") ? "" : "drop-shadow-2xl"}`}
          height={1152}
          src={src}
          width={863}
        />
        <div className="absolute inset-[11%] flex flex-col items-center justify-center overflow-hidden px-[6%] text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

type TestamentCardProps = {
  label: string;
  src: string;
  className?: string;
  isPressed?: boolean;
  onClick: () => void;
};

function TestamentCard({label, src, className = "", isPressed = false, onClick}: TestamentCardProps) {
  return (
    <button
      className={`flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-xl border border-[#e7c27a] bg-[#2a160c] shadow-[0_0_12px_rgba(255,214,120,0.45)] transition-transform duration-100 ${
        isPressed ? "translate-y-1 scale-[0.97]" : "active:translate-y-1 active:scale-[0.97]"
      } ${className}`}
      type="button"
      onClick={onClick}
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

type SettingsChoiceProps = {
  label: string;
  isActive: boolean;
  isPressed?: boolean;
  onClick: () => void;
};

const SHOP_ITEMS = [
  {src: "/mode_0/stage_ui/logo_stage_fill.png", title: "shopEnergy", body: "shopEnergyBody"},
  {src: "/mode_0/stage_common/super.png", title: "shopCross", body: "shopCrossBody"},
  {src: "/mode_0/stage_common/mega.png", title: "shopStar", body: "shopStarBody"},
] as const;

function ShopMarket() {
  const {t} = useLanguage();

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
            <Image
              alt={t(item.title)}
              className="h-11 w-11 shrink-0 object-contain"
              height={96}
              src={item.src}
              width={96}
            />
            <div className="min-w-0 flex-1 text-left">
              <p className="font-display text-sm font-bold leading-tight text-[#ffd76a]">{t(item.title)}</p>
              <p className="mt-0.5 font-display text-[0.68rem] leading-snug text-[#fff8dc]">{t(item.body)}</p>
              <button
                className="mt-1.5 rounded-xl border-2 border-[#a67c22] bg-[#3d2614] px-2 py-1.5 font-accent text-[0.62rem] font-bold leading-tight text-[#fff8dc]"
                type="button"
                onClick={() => playClick()}
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

function SettingsChoice({label, isActive, isPressed = false, onClick}: SettingsChoiceProps) {
  return (
    <button
      className={`w-[90%] justify-self-center rounded-2xl border-2 border-[#a67c22] px-3 py-2 font-accent text-base font-bold transition-transform duration-100 ${
        isPressed ? "translate-y-1 scale-95" : "active:translate-y-1 active:scale-95"
      } ${isActive ? "bg-[#ffd76a] text-[#140d2d]" : "bg-[#3d2614] text-[#fff8dc]"}`}
      style={{outline: `2px solid ${isActive ? "#96743c" : "#2a160ccc"}`}}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function LanguageArrow({direction, onClick}: {direction: -1 | 1; onClick: () => void}) {
  const [zoomKey, setZoomKey] = useState(0);
  const isLeft = direction < 0;

  return (
    <button
      aria-label={isLeft ? "previous language" : "next language"}
      className="px-1.5 py-1 font-accent text-lg font-bold leading-none text-[#ffd76a]"
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
      <Image
        alt={alt}
        className={`h-auto w-full transition-[transform,filter] duration-100 ease-out ${
          isPressed
            ? "translate-y-1 scale-[0.93] brightness-90 drop-shadow-none"
            : "drop-shadow-lg group-active:translate-y-1 group-active:scale-[0.93] group-active:brightness-90 group-active:drop-shadow-none"
        }`}
        height={height}
        src={src}
        width={width}
      />
      {children}
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
  const [pressedPanel, setPressedPanel] = useState<MenuPanel | null>(null);
  const [openPanel, setOpenPanel] = useState<MenuPanel | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(isMusicEnabled);
  const [isEffectsOn, setIsEffectsOn] = useState(isEffectsEnabled);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isPlaying || !isMusicOn) return;

    playTrack("home");

    return () => {
      if (getMusicTrack() === "home") stopTrack();
    };
  }, [isPlaying, isMusicOn]);

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

    const timer = setTimeout(() => {
      playTrack("stage");
      setIsPlaying(true);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [isNewTestamentPressed]);

  useEffect(() => {
    if (!pressedPanel) return;

    const timer = setTimeout(() => {
      setOpenPanel(pressedPanel);
      setPressedPanel(null);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [pressedPanel]);

  if (isPlaying) {
    return <PhaserGame onExit={() => {
      setIsPlaying(false);
      setIsStartPressed(false);
      setIsTestamentOpen(false);
      setIsNewTestamentPressed(false);
    }} />;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[url('/ui_home/background.png')] bg-cover bg-center bg-no-repeat">
      <HomeLightFall />
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
          src="/ui_home/logo.png"
          width={942}
        />
      </div>

      <div
        className={`absolute bottom-[12vh] left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-[3.5vh] transition-all duration-500 ${
          isIntroDone ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{transitionDelay: isIntroDone ? `${INTRO_MOVE_MS * 0.6}ms` : "0ms"}}
      >
        <HomeImageButton
          alt={t("start")}
          className="w-[min(62vw,18rem)]"
          float={START_FLOAT}
          height={181}
          src="/ui_home/start.png"
          width={479}
          isPressed={isStartPressed}
          onClick={() => {
            if (isStartPressed || isTestamentOpen) return;

            setIsStartPressed(true);
          }}
        >
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold tracking-wide text-white transition-transform duration-100 ${
              isStartPressed ? "translate-y-1 scale-[0.93]" : "group-active:translate-y-1 group-active:scale-[0.93]"
            }`}
            style={{
              fontSize: "clamp(1.4rem, 6.5vw, 2.1rem)",
              WebkitTextStroke: "2.5px #a67c22",
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
              alt={t(key)}
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
          src="/ui_home/gameContainer.png"
          onClose={() => {
            if (isNewTestamentPressed) return;

            setIsTestamentOpen(false);
          }}
        >
          <div className="flex h-full w-full flex-col gap-1">
            <TestamentCard
              label={t("newTestament")}
              src="/ui_game/mode_0.png"
              isPressed={isNewTestamentPressed}
              onClick={() => {
                if (isNewTestamentPressed) return;

                playClick();
                setIsNewTestamentPressed(true);
              }}
            />
            <TestamentCard
              className="mt-1"
              label={t("oldTestament")}
              src="/ui_game/mode_1.png"
              onClick={() => playClick()}
            />
          </div>
        </WoodPanel>
      )}

      {openPanel && (
        <WoodPanel
          alt={t(openPanel)}
          src={openPanel === "shop" ? "/ui_home/gameContainer.png" : undefined}
          onClose={() => setOpenPanel(null)}
        >
          {openPanel === "settings" ? (
            <>
              <p
                className="font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={PANEL_TITLE_STYLE}
              >
                {t("music")}
              </p>
              <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-3">
                <SettingsChoice
                  label={t("on")}
                  isActive={isMusicOn}
                  onClick={() => {
                    setIsMusicOn(true);
                    setMusicEnabled(true);
                  }}
                />
                <SettingsChoice
                  label={t("off")}
                  isActive={!isMusicOn}
                  onClick={() => {
                    setIsMusicOn(false);
                    setMusicEnabled(false);
                    stopTrack();
                  }}
                />
              </div>

              <p
                className="mt-6 font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={PANEL_TITLE_STYLE}
              >
                {t("effects")}
              </p>
              <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-3">
                <SettingsChoice
                  label={t("on")}
                  isActive={isEffectsOn}
                  onClick={() => {
                    setIsEffectsOn(true);
                    setEffectsEnabled(true);
                  }}
                />
                <SettingsChoice
                  label={t("off")}
                  isActive={!isEffectsOn}
                  onClick={() => {
                    setIsEffectsOn(false);
                    setEffectsEnabled(false);
                  }}
                />
              </div>

              <p
                className="mt-6 font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={PANEL_TITLE_STYLE}
              >
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
                <p
                  className="font-display text-lg font-bold text-[#fff8dc] sm:text-xl"
                  style={PANEL_TITLE_STYLE}
                >
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
          ) : openPanel === "shop" ? (
            <ShopMarket />
          ) : (
            <>
              <p
                className="font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={PANEL_TITLE_STYLE}
              >
                {t(openPanel)}
              </p>
              <p
                className="mt-6 font-display text-base leading-relaxed text-[#fff8dc] sm:text-lg"
                style={PANEL_TITLE_STYLE}
              >
                {t(`${openPanel}Body`)}
              </p>
            </>
          )}
        </WoodPanel>
      )}
    </div>
  );
}
