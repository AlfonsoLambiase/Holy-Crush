"use client";

import Image from "next/image";
import {useCallback, useEffect, useRef, useState} from "react";

import {useLanguage} from "@/language/LanguageProvider";

const TYPE_SPEED_MS = 55;
const FADE_MS = 320;
const TEXT_CLEAR_MS = 160;
const IMAGE_SWAP_MS = 200;

export type StoryTutorialPage = {
  image: string;
  textKey: string;
};

type StoryTutorialOverlayProps = {
  pages: readonly StoryTutorialPage[];
  ariaLabelKey: string;
  onComplete: () => void;
  className?: string;
};

export function StoryTutorialOverlay({
  pages,
  ariaLabelKey,
  onComplete,
  className = "absolute inset-0 z-30",
}: StoryTutorialOverlayProps) {
  const {t} = useLanguage();
  const [pageIndex, setPageIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [bodyTextOpacity, setBodyTextOpacity] = useState(1);
  const [characterOpacity, setCharacterOpacity] = useState(0);
  const [shellOpacity, setShellOpacity] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const fullTextRef = useRef("");
  const skipAutoTypeRef = useRef(false);

  const page = pages[pageIndex];
  const fullText = t(page.textKey);
  const reserveBodyText = pages
    .map((entry) => t(entry.textKey))
    .reduce((longest, line) => (line.length > longest.length ? line : longest));
  const bodyTextClass =
    "font-display text-center text-[clamp(0.95rem,3.8vw,1.25rem)] font-bold leading-snug transition-opacity duration-150";
  const bodyStrokeStyle: React.CSSProperties = {
    WebkitTextStroke: "2px #2a160ccc",
    paintOrder: "stroke fill",
  };

  const clearTyping = useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTyping = useCallback(
    (text: string) => {
      clearTyping();
      fullTextRef.current = text;
      setDisplayText("");
      setTypingDone(false);
      setBodyTextOpacity(1);

      let index = 0;

      intervalRef.current = window.setInterval(() => {
        index += 1;
        setDisplayText(text.slice(0, index));

        if (index >= text.length) {
          clearTyping();
          setTypingDone(true);
        }
      }, TYPE_SPEED_MS);
    },
    [clearTyping],
  );

  const completeTyping = useCallback(() => {
    clearTyping();
    setDisplayText(fullTextRef.current);
    setTypingDone(true);
  }, [clearTyping]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCharacterOpacity(1), 40);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (skipAutoTypeRef.current) {
      skipAutoTypeRef.current = false;

      return clearTyping;
    }

    startTyping(fullText);

    return clearTyping;
  }, [fullText, startTyping, clearTyping]);

  const dismissAll = () => {
    setTransitioning(true);
    setShellOpacity(0);
    window.setTimeout(onComplete, FADE_MS);
  };

  const advanceToNextPage = () => {
    const nextIndex = pageIndex + 1;

    setTransitioning(true);
    setBodyTextOpacity(0);

    window.setTimeout(() => {
      clearTyping();
      setDisplayText("");
      setTypingDone(false);
      setCharacterOpacity(0);

      window.setTimeout(() => {
        skipAutoTypeRef.current = true;
        setPageIndex(nextIndex);

        window.setTimeout(() => {
          setCharacterOpacity(1);
          startTyping(t(pages[nextIndex].textKey));
          setBodyTextOpacity(1);
          setTransitioning(false);
        }, 40);
      }, IMAGE_SWAP_MS);
    }, TEXT_CLEAR_MS);
  };

  const advance = () => {
    if (transitioning) return;

    if (!typingDone) {
      completeTyping();

      return;
    }

    if (pageIndex >= pages.length - 1) {
      dismissAll();

      return;
    }

    advanceToNextPage();
  };

  return (
    <div
      className={`${className} touch-auto bg-black/72 transition-opacity duration-300`}
      role="dialog"
      aria-modal
      aria-label={t(ariaLabelKey)}
      style={{opacity: shellOpacity, transitionDuration: `${FADE_MS}ms`}}
      onClick={advance}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") advance();
      }}
    >
      <div className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] flex justify-center px-3">
        <div className="relative w-[min(92vw,28rem)]">
          <div
            className="pointer-events-none absolute bottom-full right-[10%] z-10 w-[min(65vw,18rem)] transition-opacity duration-200"
            style={{opacity: characterOpacity}}
          >
            <Image
              alt=""
              className="block h-auto w-full max-h-[min(48dvh,22rem)] object-contain object-bottom"
              height={800}
              src={page.image}
              width={600}
              priority
            />
          </div>

          <div className="relative rounded-2xl border-2 border-[#a67c22] bg-[#3d2614]/95 px-4 py-4 shadow-[0_0_18px_rgba(255,214,120,0.35)]">
            <div className="relative">
              <p className={`${bodyTextClass} invisible`} aria-hidden>
                {reserveBodyText}
              </p>
              <p
                className={`${bodyTextClass} absolute inset-x-0 top-0 text-[#fff8dc]`}
                style={{...bodyStrokeStyle, opacity: bodyTextOpacity}}
              >
                {displayText}
              </p>
            </div>
            <p
              className={`mt-3 text-center font-display text-[0.65rem] font-bold tracking-wide sm:text-xs ${
                typingDone ? "text-[#ffd76a]/90" : "invisible"
              }`}
              aria-hidden={!typingDone}
            >
              {t("tapToContinue")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
