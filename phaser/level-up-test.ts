import {Capacitor} from "@capacitor/core";
import {createElement, type ReactNode} from "react";

import {TestStagePicker} from "@/components/TestStagePicker";
import {type GameModeId, getGameMode, setGameMode} from "@/settings/game-mode";
import {notifyLocalSave} from "@/settings/local-save-signal";
import {progressStorageKey} from "@/settings/progress";
import {normalizeStageIndexForMode} from "@/settings/stage-map";
import type {BootStartScene} from "./scenes/boot";

const SESSION_STAGE_KEY = "holy-crush-test-stage";
const SESSION_MODE_KEY = "holy-crush-test-start-mode";
const SESSION_GAME_MODE_KEY = "holy-crush-test-game-mode";

export type TestStageStartMode = "opening" | "map";

export const isStageStartTestEnabled = (): boolean =>
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_ENABLE_STAGE_PICKER === "true" ||
  (typeof window !== "undefined" && Capacitor.isNativePlatform());

export const readTestGameMode = (): GameModeId => {
  if (typeof sessionStorage === "undefined") return getGameMode();

  const raw = sessionStorage.getItem(SESSION_GAME_MODE_KEY);

  return raw === "1" ? 1 : 0;
};

export const writeTestGameMode = (mode: GameModeId): void => {
  if (typeof sessionStorage === "undefined") return;

  sessionStorage.setItem(SESSION_GAME_MODE_KEY, String(mode));
};

export const readTestStageSelection = (gameMode: GameModeId = readTestGameMode()): number => {
  if (typeof sessionStorage === "undefined") return 0;

  const value = Number(sessionStorage.getItem(SESSION_STAGE_KEY));

  return Number.isFinite(value) ? normalizeStageIndexForMode(value, gameMode) : 0;
};

export const writeTestStageSelection = (
  stageIndex: number,
  gameMode: GameModeId = readTestGameMode(),
): void => {
  if (typeof sessionStorage === "undefined") return;

  sessionStorage.setItem(
    SESSION_STAGE_KEY,
    String(normalizeStageIndexForMode(stageIndex, gameMode)),
  );
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
  gameMode: GameModeId = readTestGameMode(),
): void => {
  if (typeof localStorage === "undefined") return;

  setGameMode(gameMode);

  const stage = normalizeStageIndexForMode(stageIndex, gameMode);

  localStorage.setItem(progressStorageKey(), JSON.stringify({stage, cleared: 0}));
  notifyLocalSave();
};

export const bootStartForTestMode = (mode: TestStageStartMode): BootStartScene =>
  mode === "map" ? "stageMap" : "default";

export type StageStartTestPanelProps = {
  gameMode: GameModeId;
  gameModeLabels: Record<GameModeId, string>;
  stageIndex: number;
  mode: TestStageStartMode;
  onGameModeChange: (gameMode: GameModeId) => void;
  onStageIndexChange: (stageIndex: number) => void;
  onModeChange: (mode: TestStageStartMode) => void;
  onLaunch: () => void;
  onBrowseGrids: () => void;
};

/** Solo dev: scegli stage e salta alla mappa (o opening) dello stage. */
export function StageStartTestPanel({
  gameMode,
  gameModeLabels,
  stageIndex,
  mode,
  onGameModeChange,
  onStageIndexChange,
  onModeChange,
  onLaunch,
  onBrowseGrids,
}: StageStartTestPanelProps): ReactNode {
  if (!isStageStartTestEnabled()) return null;

  const modeButtonClass = (active: boolean) =>
    `flex-1 rounded-lg border px-2 py-1.5 text-center text-[0.7rem] font-bold leading-tight transition-colors ${
      active
        ? "border-amber-400 bg-[#5c3a14] text-[#fff8dc]"
        : "border-amber-800/70 bg-[#2a1810] text-amber-100/85 hover:bg-amber-950/60"
    }`;

  return createElement(
    "div",
    {
      className:
        "relative z-20 flex w-[min(92vw,20rem)] flex-col gap-2 rounded-xl border border-amber-600/50 bg-black/55 px-3 py-2 text-left font-display text-xs text-[#fff8dc] shadow-lg backdrop-blur-sm",
    },
    createElement(
      "fieldset",
      {className: "flex flex-col gap-1 border-0 p-0"},
      createElement("legend", {className: "text-[0.65rem] uppercase tracking-wide text-amber-200/90"}, "Modalità"),
      createElement(
        "div",
        {className: "flex gap-2"},
        ([0, 1] as const).map((value) =>
          createElement(
            "button",
            {
              key: value,
              type: "button",
              className: modeButtonClass(gameMode === value),
              onClick: () => {
                writeTestGameMode(value);
                onGameModeChange(value);
              },
            },
            gameModeLabels[value],
          ),
        ),
      ),
    ),
    createElement(
      "label",
      {className: "flex flex-col gap-1"},
      createElement("span", {className: "text-[0.65rem] uppercase tracking-wide text-amber-200/90"}, "Stage"),
      createElement(TestStagePicker, {gameMode, stageIndex, onStageIndexChange}),
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
    createElement(
      "button",
      {
        type: "button",
        className:
          "rounded-lg border border-amber-500 bg-[#5c3a14] px-3 py-2 text-sm font-bold text-[#fff8dc] active:scale-[0.98]",
        onClick: onBrowseGrids,
      },
      "Vedi griglie",
    ),
  );
}
