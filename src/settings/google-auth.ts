import {Capacitor, type PluginListenerHandle} from "@capacitor/core";
import {
  FirebaseAuthentication,
  type User as FirebaseUser,
} from "@capacitor-firebase/authentication";
import {useSyncExternalStore} from "react";

export type GoogleAccount = {
  displayName: string | null;
};

export type GoogleAuthNotice = "cancelled" | "failed" | "developer";

export type GoogleAuthPhase = "idle" | "signing-in" | "signing-out";

export type GoogleAuthSnapshot = {
  ready: boolean;
  native: boolean;
  user: GoogleAccount | null;
  phase: GoogleAuthPhase;
  notice: GoogleAuthNotice | null;
};

const serverSnapshot: GoogleAuthSnapshot = {
  ready: false,
  native: false,
  user: null,
  phase: "idle",
  notice: null,
};

let snapshot: GoogleAuthSnapshot = serverSnapshot;
let generation = 0;
let userVersion = 0;
let requestLock = false;
let acceptEvents = false;
let subscribers = 0;
let startQueued = false;
let activeHandle: PluginListenerHandle | null = null;
const listeners = new Set<() => void>();

const isAndroid = (): boolean =>
  typeof window !== "undefined" && Capacitor.getPlatform() === "android";

const toAccount = (user: FirebaseUser | null): GoogleAccount | null => {
  if (!user || user.isAnonymous) return null;

  const displayName = user.displayName?.trim();

  return {displayName: displayName ? displayName : null};
};

const emit = () => {
  listeners.forEach((listener) => listener());
};

const update = (next: GoogleAuthSnapshot) => {
  snapshot = next;
  emit();
};

const errorText = (error: unknown): string => {
  if (typeof error === "string") return error;

  if (!error || typeof error !== "object" || !("message" in error)) return "";

  const message = typeof error.message === "string" ? error.message : "";
  const code = "code" in error && typeof error.code === "string" ? error.code : "";

  return `${code} ${message}`;
};

const isSignInCancelled = (error: unknown): boolean => {
  const text = errorText(error).toLowerCase();

  return text.includes("cancel") || text.includes("12501") || /\b16\b/.test(text);
};

const isDeveloperError = (error: unknown): boolean => {
  const text = errorText(error).toLowerCase();

  return text.includes("developer_error") || text.includes("developer console") || /\b10\b/.test(text);
};

const beginSession = () => {
  const session = ++generation;

  if (!isAndroid()) {
    update({ready: true, native: false, user: null, phase: "idle", notice: null});

    return;
  }

  update({...snapshot, ready: false, native: true});

  void (async () => {
    let handle: PluginListenerHandle;

    try {
      handle = await FirebaseAuthentication.addListener("authStateChange", (change) => {
      if (session !== generation || !acceptEvents) return;

      userVersion += 1;
      const user = toAccount(change.user);

      update({
        ready: true,
        native: true,
        user,
        phase: requestLock ? snapshot.phase : "idle",
        notice: user ? null : snapshot.notice,
      });
    });
    } catch {
      if (session !== generation) return;

      update({...snapshot, ready: true, native: true, notice: "failed"});

      return;
    }

    if (session !== generation) {
      await handle.remove();

      return;
    }

    activeHandle = handle;

    const versionAtFetch = userVersion;

    try {
      const current = await FirebaseAuthentication.getCurrentUser();

      if (session !== generation) return;

      if (versionAtFetch === userVersion) {
        update({
          ...snapshot,
          ready: true,
          native: true,
          user: toAccount(current.user),
        });
      } else if (!snapshot.ready) {
        update({...snapshot, ready: true, native: true});
      }
    } catch {
      if (session !== generation) return;

      if (!snapshot.ready) update({...snapshot, ready: true, native: true});
    } finally {
      if (session === generation) acceptEvents = true;
    }
  })();
};

const endSession = () => {
  generation += 1;
  acceptEvents = false;
  const handle = activeHandle;

  activeHandle = null;

  if (handle) void handle.remove();
};

const queueStart = () => {
  if (startQueued) return;

  startQueued = true;
  queueMicrotask(() => {
    startQueued = false;

    if (subscribers === 0) return;

    beginSession();
  });
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  subscribers += 1;

  if (subscribers === 1) queueStart();

  return () => {
    listeners.delete(listener);
    subscribers -= 1;

    if (subscribers === 0) endSession();
  };
};

const getSnapshot = () => snapshot;
const getServerSnapshot = () => serverSnapshot;

export const signInWithGoogleAccount = async (): Promise<void> => {
  if (!isAndroid() || requestLock || snapshot.phase !== "idle" || snapshot.user) return;

  requestLock = true;
  update({...snapshot, phase: "signing-in", notice: null});

  try {
    const result = await FirebaseAuthentication.signInWithGoogle({
      useCredentialManager: false,
    });

    userVersion += 1;

    if (!result.user) {
      update({...snapshot, phase: "idle", user: null, notice: "cancelled"});

      return;
    }

    update({
      ready: true,
      native: true,
      user: toAccount(result.user),
      phase: "idle",
      notice: null,
    });
  } catch (error) {
    userVersion += 1;
    update({
      ...snapshot,
      phase: "idle",
      notice: isSignInCancelled(error) ? "cancelled" : isDeveloperError(error) ? "developer" : "failed",
    });
  } finally {
    requestLock = false;

    if (snapshot.phase !== "idle") update({...snapshot, phase: "idle"});
  }
};

export const signOutGoogleAccount = async (): Promise<void> => {
  if (!isAndroid() || requestLock || snapshot.phase !== "idle" || !snapshot.user) return;

  requestLock = true;
  userVersion += 1;
  update({...snapshot, user: null, phase: "signing-out", notice: null});

  try {
    await FirebaseAuthentication.signOut();
    update({...snapshot, user: null, phase: "idle", notice: null});
  } catch {
    try {
      const current = await FirebaseAuthentication.getCurrentUser();

      userVersion += 1;
      update({
        ...snapshot,
        user: toAccount(current.user),
        phase: "idle",
        notice: current.user ? "failed" : null,
      });
    } catch {
      update({...snapshot, phase: "idle", notice: "failed"});
    }
  } finally {
    requestLock = false;

    if (snapshot.phase !== "idle") update({...snapshot, phase: "idle"});
  }
};

export const useGoogleAuth = (): GoogleAuthSnapshot & {
  signIn: () => void;
  signOut: () => void;
} => {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    ...current,
    signIn: () => {
      void signInWithGoogleAccount();
    },
    signOut: () => {
      void signOutGoogleAccount();
    },
  };
};
