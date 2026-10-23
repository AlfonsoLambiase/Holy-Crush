import {Capacitor} from "@capacitor/core";
import {FirebaseFirestore, type DocumentData} from "@capacitor-firebase/firestore";

import {getCurrentLanguage, isLanguage, type Language} from "@/language";
import {applyLanguage} from "@/language/LanguageProvider";
import {readObstacleTips, writeObstacleTips} from "@game/tutorial/obstacle-tip-storage";
import {isTutorialSeen, setTutorialSeen} from "@game/tutorial/tutorial-seen";

import {type BoosterId, getBoosterStock, setBoosterStock} from "./boosters";
import {isEffectsEnabled, setEffectsEnabled} from "./effects";
import {type GameModeId, getGameMode, setGameMode} from "./game-mode";
import {getGoogleAuthSnapshot, subscribeGoogleAuth} from "./google-auth";
import {readHeartSave, writeHeartSave} from "./heart";
import {setHomePlayTutorialSeen, shouldShowHomePlayTutorial} from "./home-play-tutorial";
import {
  LOCAL_SAVE_STAMP_KEY,
  muteLocalSaveSignal,
  readLocalSaveStamp,
  subscribeLocalSave,
} from "./local-save-signal";
import {isMusicEnabled, setMusicEnabled} from "./music";
import {
  normalizeStageProgress,
  readProgressForMode,
  writeProgressForMode,
  type StageProgress,
} from "./progress";
import {getShopAdProgress, setShopAdProgress, type ShopAdId} from "./shop-ads";
import {stopTrack} from "./soundtrack";
import {setWorldMapTutorialSeen, shouldShowWorldMapTutorial} from "./world-map-tutorial";

type Stock = Record<BoosterId, number>;
type Ads = Record<ShopAdId, number>;

type PlaySave = {
  mode: GameModeId;
  cleared: StageProgress;
  clearedOld: StageProgress;
  heart: number;
  heartCredit: number;
  heartRegenAt: number;
  boosters: Stock;
  shopAds: Ads;
  language: Language;
  music: boolean;
  effects: boolean;
  tutorialSeen: boolean;
  homePlayTutorialSeen: boolean;
  worldMapTutorialSeen: boolean;
  obstacleTips: string[];
};

type CloudSave = PlaySave & {updatedAt: number};

const PUSH_DELAY_MS = 1000;
const SIGN_OUT_FLUSH_MS = 5000;
const BOOSTERS: BoosterId[] = ["super", "mega", "maxi", "ultra"];
const ADS: ShopAdId[] = ["energy", "moves", "super", "mega", "ultra", "maxi"];

let activeUid: string | null = null;
let pendingUid: string | null = null;
let pullGeneration = 0;
let pushTimer = 0;
let writeChain: Promise<void> = Promise.resolve();
let remoteRevision = 0;
const remoteListeners = new Set<() => void>();

const isAndroid = (): boolean =>
  typeof window !== "undefined" && Capacitor.getPlatform() === "android";

const isUid = (uid: string): boolean => /^[A-Za-z0-9]{1,128}$/.test(uid);

const rank = (progress: StageProgress): number => progress.stage * 100000 + progress.cleared;

const further = (left: StageProgress, right: StageProgress): StageProgress =>
  rank(left) >= rank(right) ? left : right;

const sortedTips = (ids: readonly string[]): string[] =>
  [...new Set(ids.filter((id) => id.length > 0 && id.length < 80))].sort().slice(0, 200);

const clampCount = (value: number, max = Number.POSITIVE_INFINITY): number =>
  Math.min(max, Math.max(0, Math.floor(value)));

const normalizePlay = (save: PlaySave): PlaySave => ({
  mode: save.mode === 1 ? 1 : 0,
  cleared: save.cleared,
  clearedOld: save.clearedOld,
  heart: Math.min(1, Math.max(0, Math.round(save.heart * 10) / 10)),
  heartCredit: Math.max(0, Math.round(save.heartCredit * 1000) / 1000),
  heartRegenAt: Math.max(0, Math.floor(save.heartRegenAt)),
  boosters: {
    super: clampCount(save.boosters.super, 5),
    mega: clampCount(save.boosters.mega, 5),
    maxi: clampCount(save.boosters.maxi, 5),
    ultra: clampCount(save.boosters.ultra, 5),
  },
  shopAds: {
    energy: clampCount(save.shopAds.energy),
    moves: clampCount(save.shopAds.moves),
    super: clampCount(save.shopAds.super),
    mega: clampCount(save.shopAds.mega),
    ultra: clampCount(save.shopAds.ultra),
    maxi: clampCount(save.shopAds.maxi),
  },
  language: save.language,
  music: save.music,
  effects: save.effects,
  tutorialSeen: save.tutorialSeen,
  homePlayTutorialSeen: save.homePlayTutorialSeen,
  worldMapTutorialSeen: save.worldMapTutorialSeen,
  obstacleTips: sortedTips(save.obstacleTips),
});

const samePlay = (left: PlaySave, right: PlaySave): boolean =>
  JSON.stringify(normalizePlay(left)) === JSON.stringify(normalizePlay(right));

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return value as Record<string, unknown>;
};

const finite = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value);

  return Number.isFinite(number) ? number : null;
};

const parseProgress = (value: unknown, mode: GameModeId): StageProgress | null => {
  const record = asRecord(value);
  const stage = finite(record?.stage);
  const cleared = finite(record?.cleared);

  if (stage === null || cleared === null) return null;

  return normalizeStageProgress(mode, stage, cleared);
};

const parseStock = (value: unknown): Stock | null => {
  const record = asRecord(value);

  if (!record) return null;

  const stock = {super: 0, mega: 0, maxi: 0, ultra: 0};

  for (const id of BOOSTERS) {
    const count = finite(record[id]);

    if (count === null) return null;

    stock[id] = count;
  }

  return stock;
};

const parseAds = (value: unknown): Ads | null => {
  const record = asRecord(value);

  if (!record) return null;

  const ads = {energy: 0, moves: 0, super: 0, mega: 0, ultra: 0, maxi: 0};

  for (const id of ADS) {
    const count = finite(record[id]);

    if (count === null) return null;

    ads[id] = count;
  }

  return ads;
};

const parseCloud = (value: unknown): CloudSave | null => {
  const record = asRecord(value);

  if (!record || record.v !== 1 || (record.mode !== 0 && record.mode !== 1)) return null;

  const updatedAt = finite(record.updatedAt);
  const cleared = parseProgress(record.cleared, 0);
  const clearedOld = parseProgress(record.clearedOld, 1);
  const heart = finite(record.heart);
  const heartCredit = finite(record.heartCredit);
  const heartRegenAt = finite(record.heartRegenAt);
  const boosters = parseStock(record.boosters);
  const shopAds = parseAds(record.shopAds);
  const language = typeof record.language === "string" && isLanguage(record.language) ? record.language : null;

  if (
    updatedAt === null ||
    updatedAt <= 0 ||
    !cleared ||
    !clearedOld ||
    heart === null ||
    heartCredit === null ||
    heartRegenAt === null ||
    !boosters ||
    !shopAds ||
    !language ||
    typeof record.music !== "boolean" ||
    typeof record.effects !== "boolean" ||
    typeof record.tutorialSeen !== "boolean" ||
    typeof record.homePlayTutorialSeen !== "boolean" ||
    typeof record.worldMapTutorialSeen !== "boolean" ||
    !Array.isArray(record.obstacleTips) ||
    !record.obstacleTips.every((entry) => typeof entry === "string")
  ) {
    return null;
  }

  return {
    updatedAt,
    ...normalizePlay({
      mode: record.mode,
      cleared,
      clearedOld,
      heart,
      heartCredit,
      heartRegenAt,
      boosters,
      shopAds,
      language,
      music: record.music,
      effects: record.effects,
      tutorialSeen: record.tutorialSeen,
      homePlayTutorialSeen: record.homePlayTutorialSeen,
      worldMapTutorialSeen: record.worldMapTutorialSeen,
      obstacleTips: record.obstacleTips,
    }),
  };
};

const readPlay = (): PlaySave => {
  const release = muteLocalSaveSignal();

  try {
    const heart = readHeartSave();

    return normalizePlay({
      mode: getGameMode(),
      cleared: readProgressForMode(0),
      clearedOld: readProgressForMode(1),
      heart: heart.remaining,
      heartCredit: heart.credit,
      heartRegenAt: heart.regenAt,
      boosters: getBoosterStock(),
      shopAds: getShopAdProgress(),
      language: getCurrentLanguage(),
      music: isMusicEnabled(),
      effects: isEffectsEnabled(),
      tutorialSeen: isTutorialSeen(),
      homePlayTutorialSeen: !shouldShowHomePlayTutorial(),
      worldMapTutorialSeen: !shouldShowWorldMapTutorial(),
      obstacleTips: readObstacleTips(),
    });
  } finally {
    release();
  }
};

const merge = (local: PlaySave, cloud: CloudSave): PlaySave => {
  const newer: PlaySave = cloud.updatedAt >= readLocalSaveStamp() ? cloud : local;

  return normalizePlay({
    ...newer,
    cleared: further(local.cleared, cloud.cleared),
    clearedOld: further(local.clearedOld, cloud.clearedOld),
    tutorialSeen: local.tutorialSeen || cloud.tutorialSeen,
    homePlayTutorialSeen: local.homePlayTutorialSeen || cloud.homePlayTutorialSeen,
    worldMapTutorialSeen: local.worldMapTutorialSeen || cloud.worldMapTutorialSeen,
    obstacleTips: [...local.obstacleTips, ...cloud.obstacleTips],
  });
};

const applyPlay = (save: PlaySave): void => {
  const musicWasOn = isMusicEnabled();
  const release = muteLocalSaveSignal();

  try {
    if (getGameMode() !== save.mode) setGameMode(save.mode);

    const cleared = readProgressForMode(0);
    const clearedOld = readProgressForMode(1);

    if (cleared.stage !== save.cleared.stage || cleared.cleared !== save.cleared.cleared) {
      writeProgressForMode(0, save.cleared);
    }

    if (clearedOld.stage !== save.clearedOld.stage || clearedOld.cleared !== save.clearedOld.cleared) {
      writeProgressForMode(1, save.clearedOld);
    }

    const heart = readHeartSave();

    if (heart.remaining !== save.heart || heart.credit !== save.heartCredit || heart.regenAt !== save.heartRegenAt) {
      writeHeartSave({remaining: save.heart, credit: save.heartCredit, regenAt: save.heartRegenAt});
    }

    if (JSON.stringify(getBoosterStock()) !== JSON.stringify(save.boosters)) setBoosterStock(save.boosters);
    if (JSON.stringify(getShopAdProgress()) !== JSON.stringify(save.shopAds)) setShopAdProgress(save.shopAds);
    if (getCurrentLanguage() !== save.language) applyLanguage(save.language);
    if (isMusicEnabled() !== save.music) setMusicEnabled(save.music);
    if (isEffectsEnabled() !== save.effects) setEffectsEnabled(save.effects);
    if (isTutorialSeen() !== save.tutorialSeen) setTutorialSeen(save.tutorialSeen);

    if (!shouldShowHomePlayTutorial() !== save.homePlayTutorialSeen) {
      setHomePlayTutorialSeen(save.homePlayTutorialSeen);
    }

    if (!shouldShowWorldMapTutorial() !== save.worldMapTutorialSeen) {
      setWorldMapTutorialSeen(save.worldMapTutorialSeen);
    }

    if (sortedTips(readObstacleTips()).join() !== save.obstacleTips.join()) writeObstacleTips(save.obstacleTips);

    localStorage.setItem(LOCAL_SAVE_STAMP_KEY, String(Date.now()));
  } finally {
    release();
  }

  if (musicWasOn && !save.music) stopTrack();
};

const toDocument = (play: PlaySave, updatedAt: number): DocumentData => ({
  v: 1,
  updatedAt,
  mode: play.mode,
  cleared: play.cleared,
  clearedOld: play.clearedOld,
  heart: play.heart,
  heartCredit: play.heartCredit,
  heartRegenAt: play.heartRegenAt,
  boosters: play.boosters,
  shopAds: play.shopAds,
  language: play.language,
  music: play.music,
  effects: play.effects,
  tutorialSeen: play.tutorialSeen,
  homePlayTutorialSeen: play.homePlayTutorialSeen,
  worldMapTutorialSeen: play.worldMapTutorialSeen,
  obstacleTips: play.obstacleTips,
});

const bumpRemote = (): void => {
  remoteRevision += 1;
  remoteListeners.forEach((listener) => listener());
};

const writeAccount = async (uid: string): Promise<void> => {
  const updatedAt = Date.now();

  await FirebaseFirestore.setDocument({
    reference: `users/${uid}`,
    data: toDocument(readPlay(), updatedAt),
  });

  if (readLocalSaveStamp() <= updatedAt) {
    const release = muteLocalSaveSignal();

    localStorage.setItem(LOCAL_SAVE_STAMP_KEY, String(updatedAt));
    release();
  }
};

export const flushAccountSave = (uid: string): Promise<void> => {
  if (!isAndroid() || !isUid(uid)) return Promise.resolve();

  const run = writeChain.then(() => writeAccount(uid));

  writeChain = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
};

const readCloud = async (uid: string): Promise<{ok: true; save: CloudSave | null} | {ok: false}> => {
  try {
    const {snapshot} = await FirebaseFirestore.getDocument({reference: `users/${uid}`});

    if (!snapshot.data) return {ok: true, save: null};

    const save = parseCloud(snapshot.data);

    return save ? {ok: true, save} : {ok: false};
  } catch {
    return {ok: false};
  }
};

const pullAccount = async (uid: string, generation: number): Promise<void> => {
  const cloud = await readCloud(uid);

  if (generation !== pullGeneration) return;

  if (!cloud.ok) {
    pendingUid = null;
    activeUid = uid;

    return;
  }

  const local = readPlay();
  const merged = cloud.save ? merge(local, cloud.save) : local;
  const changed = !samePlay(local, merged);

  if (generation !== pullGeneration) return;

  pendingUid = null;
  activeUid = uid;

  if (changed) {
    applyPlay(merged);
    bumpRemote();
  }

  if (!cloud.save || !samePlay(cloud.save, merged)) {
    try {
      await flushAccountSave(uid);
    } catch {
      return;
    }
  }
};

const signedInUid = (): string | null => {
  const snapshot = getGoogleAuthSnapshot();

  if (!snapshot.ready || !snapshot.native || !snapshot.user || !isUid(snapshot.user.uid)) return null;

  return snapshot.user.uid;
};

const followAuth = (): void => {
  const next = signedInUid();

  if (next === activeUid || (next !== null && next === pendingUid)) return;

  window.clearTimeout(pushTimer);
  activeUid = null;
  pendingUid = next;
  const generation = ++pullGeneration;

  if (!next) return;

  void pullAccount(next, generation);
};

const schedulePush = (): void => {
  if (!activeUid) return;

  const uid = activeUid;

  window.clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    void flushAccountSave(uid).catch(() => undefined);
  }, PUSH_DELAY_MS);
};

export const startAccountSave = (): (() => void) => {
  const unlistenLocal = subscribeLocalSave(schedulePush);
  const unlistenAuth = subscribeGoogleAuth(followAuth);

  followAuth();

  return () => {
    pullGeneration += 1;
    activeUid = null;
    pendingUid = null;
    window.clearTimeout(pushTimer);
    unlistenLocal();
    unlistenAuth();
  };
};

export const subscribeRemoteSave = (listener: () => void): (() => void) => {
  remoteListeners.add(listener);

  return () => remoteListeners.delete(listener);
};

export const getRemoteSaveRevision = (): number => remoteRevision;

export const accountSignOutFlush = (uid: string): Promise<void> =>
  Promise.race([
    flushAccountSave(uid).catch(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, SIGN_OUT_FLUSH_MS);
    }),
  ]);
