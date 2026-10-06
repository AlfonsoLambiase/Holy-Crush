import {createElement, type ChangeEvent, type ReactNode} from "react";

import {normalizeStageIndex, STAGE_COUNT} from "@/settings/stage-map";
import type {BootStartScene} from "./scenes/boot";

const PROGRESS_KEY = "holy-crush-cleared";
const SESSION_STAGE_KEY = "holy-crush-test-stage";
const SESSION_MODE_KEY = "holy-crush-test-start-mode";

export type TestStageStartMode = "opening" | "map";

export const isStageStartTestEnabled = (): boolean => process.env.NODE_ENV === "development";

export const readTestStageSelection = (): number => {
  if (typeof sessionStorage === "undefined") return 0;

  const value = Number(sessionStorage.getItem(SESSION_STAGE_KEY));

  return Number.isFinite(value) ? normalizeStageIndex(value) : 0;
};

export const writeTestStageSelection = (stageIndex: number): void => {
  if (typeof sessionStorage === "undefined") return;

  sessionStorage.setItem(SESSION_STAGE_KEY, String(normalizeStageIndex(stageIndex)));
};

export const readTestStageStartMode = (): TestStageStartMode => {
  if (typeof sessionStorage === "undefined") return "map";

  return sessionStorage.getItem(SESSION_MODE_KEY) === "opening" ? "opening" : "map";
};

export const writeTestStageStartMode = (mode: TestStageStartMode): void => {
  if (typeof sessionStorage === "undefined") return;

  sessionStorage.setItem(SESSION_MODE_KEY, mode);
};

/** Scrive il progresso per partire dallo stage scelto (solo test). */
export const applyTestStageForStart = (
  stageIndex: number,
  mode: TestStageStartMode = readTestStageStartMode(),
): void => {
  if (typeof localStorage === "undefined") return;

  const stage = normalizeStageIndex(stageIndex);
  const cleared = mode === "map" ? 1 : 0;

  localStorage.setItem(PROGRESS_KEY, JSON.stringify({stage, cleared}));
};

export const bootStartForTestMode = (mode: TestStageStartMode): BootStartScene =>
  mode === "map" ? "stageMap" : "default";

export type StageStartTestPanelProps = {
  stageIndex: number;
  mode: TestStageStartMode;
  onStageIndexChange: (stageIndex: number) => void;
  onModeChange: (mode: TestStageStartMode) => void;
  onLaunch: () => void;
};

/** Solo dev: scegli stage e salta alla mappa (o opening) dello stage. */
export function StageStartTestPanel({
  stageIndex,
  mode,
  onStageIndexChange,
  onModeChange,
  onLaunch,
}: StageStartTestPanelProps): ReactNode {
  if (!isStageStartTestEnabled()) return null;

  const options = Array.from({length: STAGE_COUNT}, (_, index) =>
    createElement("option", {key: index, value: String(index)}, `Stage ${index + 1}`),
  );

  return createElement(
    "div",
    {
      className:
        "flex w-[min(92vw,20rem)] flex-col gap-2 rounded-xl border border-amber-600/50 bg-black/55 px-3 py-2 text-left font-display text-xs text-[#fff8dc] shadow-lg backdrop-blur-sm",
    },
    createElement(
      "label",
      {className: "flex flex-col gap-1"},
      createElement("span", {className: "text-[0.65rem] uppercase tracking-wide text-amber-200/90"}, "Test stage"),
      createElement(
        "select",
        {
          className:
            "rounded-lg border border-amber-700/60 bg-[#2a1810] px-2 py-1.5 text-sm text-[#fde8a0] outline-none",
          value: String(stageIndex),
          onChange: (event: ChangeEvent<HTMLSelectElement>) => {
            const next = normalizeStageIndex(Number(event.target.value));

            writeTestStageSelection(next);
            onStageIndexChange(next);
          },
        },
        options,
      ),
    ),
    createElement(
      "fieldset",
      {className: "flex flex-wrap gap-3 border-0 p-0"},
      createElement("legend", {className: "sr-only"}, "Avvio test"),
      (["map", "opening"] as const).map((value) =>
        createElement(
          "label",
          {key: value, className: "flex cursor-pointer items-center gap-1.5"},
          createElement("input", {
            type: "radio",
            name: "test-stage-mode",
            checked: mode === value,
            onChange: () => {
              writeTestStageStartMode(value);
              onModeChange(value);
            },
          }),
          value === "map" ? "Mappa stage" : "Opening",
        ),
      ),
    ),
    createElement(
      "button",
      {
        type: "button",
        className:
          "rounded-lg border border-amber-500 bg-[#5c3a14] px-3 py-2 text-sm font-bold text-[#fff8dc] active:scale-[0.98]",
        onClick: onLaunch,
      },
      "Avvia stage selezionato",
    ),
  );
}
