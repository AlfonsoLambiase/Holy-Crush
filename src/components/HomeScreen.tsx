"use client";

import Image from "next/image";
import {useEffect, useState} from "react";

import {LANGUAGE_LABELS, LANGUAGES} from "@/language";
import {useLanguage} from "@/language/LanguageProvider";
import {isMusicEnabled, setMusicEnabled} from "@/settings/music";

import {PhaserGame} from "./PhaserGame";

const INTRO_HOLD_MS = 900; // quanto resta grande al centro prima di salire
const INTRO_MOVE_MS = 1100; // durata della risalita
const PRESS_MS = 220; // attesa dell'effetto premuto prima di avviare il gioco

const MENU_BUTTONS = [
  {key: "objectives", src: "/home/objectives.png"},
  {key: "info", src: "/home/user.png"},
  {key: "settings", src: "/home/settings.png"},
] as const;

type MenuPanel = (typeof MENU_BUTTONS)[number]["key"];

const PANEL_TEXT_GLOW =
  "0 0 8px rgba(255,236,170,0.55), 0 2px 2px rgba(0,0,0,0.45)";

type WoodPanelProps = {
  alt: string;
  children: React.ReactNode;
  onClose: () => void;
};

function WoodPanel({alt, children, onClose}: WoodPanelProps) {
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
          className="h-auto w-full drop-shadow-2xl"
          height={1152}
          src="/home/settingContainer.png"
          width={863}
        />
        <div className="absolute inset-[11%] flex flex-col items-center justify-center overflow-hidden px-[6%] text-center">
          {children}
        </div>
      </div>
    </div>
  );
}

type SettingsChoiceProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

function SettingsChoice({label, isActive, onClick}: SettingsChoiceProps) {
  return (
    <button
      className={`rounded-2xl px-3 py-3 font-accent text-base font-bold transition-transform active:scale-95 ${
        isActive ? "bg-[#ffd76a] text-[#140d2d]" : "bg-[#3d2614] text-[#fff8dc]"
      }`}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type HomeImageButtonProps = {
  alt: string;
  src: string;
  width: number;
  height: number;
  className: string;
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
  isPressed = false,
  children,
  onClick,
}: HomeImageButtonProps) {
  return (
    <button
      aria-label={alt}
      className={`${className} group relative touch-manipulation`}
      type="button"
      onClick={onClick}
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
  const [pressedPanel, setPressedPanel] = useState<MenuPanel | null>(null);
  const [openPanel, setOpenPanel] = useState<MenuPanel | null>(null);
  const [isMusicOn, setIsMusicOn] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsIntroDone(true), INTRO_HOLD_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsMusicOn(isMusicEnabled());
  }, []);

  useEffect(() => {
    if (!isStartPressed) return;

    const timer = setTimeout(() => setIsPlaying(true), PRESS_MS);

    return () => clearTimeout(timer);
  }, [isStartPressed]);

  useEffect(() => {
    if (!pressedPanel) return;

    const timer = setTimeout(() => {
      setOpenPanel(pressedPanel);
      setPressedPanel(null);
    }, PRESS_MS);

    return () => clearTimeout(timer);
  }, [pressedPanel]);

  if (isPlaying) {
    return <PhaserGame onExit={() => setIsPlaying(false)} />;
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[url('/home/background.png')] bg-cover bg-center bg-no-repeat">
      <div
        className="absolute left-1/2 top-0 w-[82%] max-w-sm ease-out"
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
          src="/home/logo.png"
          width={942}
        />
      </div>

      <div
        className={`absolute bottom-[12vh] left-1/2 flex -translate-x-1/2 flex-col items-center gap-[3.5vh] transition-all duration-500 ${
          isIntroDone ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
        style={{transitionDelay: isIntroDone ? `${INTRO_MOVE_MS * 0.6}ms` : "0ms"}}
      >
        <HomeImageButton
          alt={t("start")}
          className="w-[min(62vw,18rem)]"
          height={181}
          src="/home/start.png"
          width={479}
          isPressed={isStartPressed}
          onClick={() => {
            if (!isStartPressed) setIsStartPressed(true);
          }}
        >
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center font-display font-bold tracking-wide text-white transition-transform duration-100 ${
              isStartPressed ? "translate-y-1 scale-[0.93]" : "group-active:translate-y-1 group-active:scale-[0.93]"
            }`}
            style={{
              fontSize: "clamp(1.4rem, 6.5vw, 2.1rem)",
              textShadow:
                "0 0 10px rgba(255,236,170,0.8), 0 0 22px rgba(255,210,90,0.4), 0 2px 2px rgba(0,0,0,0.4)",
            }}
          >
            {t("start")}
          </span>
        </HomeImageButton>

        <div className="flex items-center gap-[6vw]">
          {MENU_BUTTONS.map(({key, src}) => (
            <HomeImageButton
              key={key}
              alt={t(key)}
              className="w-[min(16vw,4.75rem)]"
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

      {openPanel && (
        <WoodPanel alt={t(openPanel)} onClose={() => setOpenPanel(null)}>
          {openPanel === "settings" ? (
            <>
              <p
                className="font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={{textShadow: PANEL_TEXT_GLOW}}
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
                  }}
                />
              </div>

              <p
                className="mt-10 font-display text-xl font-bold text-[#ffd76a] sm:mt-14 sm:text-2xl"
                style={{textShadow: PANEL_TEXT_GLOW}}
              >
                {t("language")}
              </p>
              <div className="mt-3 grid w-full max-w-md grid-cols-2 gap-3">
                {LANGUAGES.map((code) => (
                  <SettingsChoice
                    key={code}
                    label={LANGUAGE_LABELS[code]}
                    isActive={language === code}
                    onClick={() => setLanguage(code)}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <p
                className="font-display text-xl font-bold text-[#ffd76a] sm:text-2xl"
                style={{textShadow: PANEL_TEXT_GLOW}}
              >
                {t(openPanel)}
              </p>
              <p
                className="mt-6 font-display text-base leading-relaxed text-[#fff8dc] sm:text-lg"
                style={{textShadow: PANEL_TEXT_GLOW}}
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
