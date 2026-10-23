import {notifyLocalSave} from "@/settings/local-save-signal";

const STORAGE_KEY = "holy-crush-obstacle-tips";

const read = (): Set<string> => {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return new Set();

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) return new Set();

    return new Set(parsed.filter((entry) => typeof entry === "string"));
  } catch {
    return new Set();
  }
};

const write = (seen: Set<string>): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  notifyLocalSave();
};

export const isObstacleTipSeen = (id: string): boolean => read().has(id);

export const readObstacleTips = (): string[] => [...read()];

export const writeObstacleTips = (ids: readonly string[]): void => {
  const unique = [...new Set(ids.filter((id) => id.length > 0 && id.length < 80))].slice(0, 200);

  write(new Set(unique));
};

export const markObstacleTipSeen = (id: string): void => {
  const seen = read();

  seen.add(id);
  write(seen);
};
