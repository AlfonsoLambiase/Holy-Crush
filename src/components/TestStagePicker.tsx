"use client";

import {useEffect, useId, useRef, useState} from "react";

import {normalizeStageIndex, STAGE_COUNT} from "@/settings/stage-map";

const TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 rounded-lg border border-amber-700/60 bg-[#2a1810] px-2 py-1.5 text-left text-sm text-[#fde8a0] outline-none";

const LIST_CLASS =
  "absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-amber-700/60 bg-[#2a1810] py-1 shadow-lg";

type TestStagePickerProps = {
  stageIndex: number;
  onStageIndexChange: (stageIndex: number) => void;
};

export function TestStagePicker({stageIndex, onStageIndexChange}: TestStagePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const pick = (index: number) => {
    const next = normalizeStageIndex(index);

    onStageIndexChange(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        className={TRIGGER_CLASS}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{`Stage ${stageIndex + 1}`}</span>
        <span aria-hidden className="text-amber-400/80">
          {open ? "▴" : "▾"}
        </span>
      </button>
      {open ? (
        <ul id={listId} role="listbox" aria-label="Stage" className={LIST_CLASS}>
          {Array.from({length: STAGE_COUNT}, (_, index) => (
            <li key={index} role="option" aria-selected={index === stageIndex}>
              <button
                type="button"
                className={`block w-full px-2 py-1.5 text-left text-sm text-[#fde8a0] hover:bg-amber-900/50 ${
                  index === stageIndex ? "bg-amber-950/80 font-bold" : ""
                }`}
                onClick={() => pick(index)}
              >
                {`Stage ${index + 1}`}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
