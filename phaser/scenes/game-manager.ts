/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import * as Phaser from "phaser";

import {getCurrentLanguage, t} from "@/language";
import type {BoosterId} from "@/settings/boosters";
import {isLowEndDevice, layoutScaleForViewport} from "@/settings/app-header-layout";
import {isEffectsEnabled} from "@/settings/effects";
import {getPieceKeysForStageLevel} from "@/settings/level-pieces";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";
import {plateFillForStage} from "@/settings/stage-scenery-assets";

import {AudioManager} from "../components/audioManager";
import {ItemsBar} from "../components/items-bar";
import {StarsEffectManager} from "../components/starsEffectManager";
import {
  centerFirst,
  findComboSetup,
  isSameFamily,
  runFirstLevelScript,
  type GuidedMove,
} from "../tutorial/first-level-script";
import {isObstacleTipSeen, markObstacleTipSeen} from "../tutorial/obstacle-tip-storage";
import {pendingObstacleTips} from "../tutorial/obstacle-tutorials";
import {shouldShowTutorial, TutorialScreen} from "../tutorial/tutorial";
import {createBoardPlate, destroyBoardPlate, type BoardPlate} from "../shared/board-frame";
import {POPUP_OPEN_MS} from "../shared/popup-motion";
import {stylePopupTitle} from "../shared/popup-text";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {
  getCellSize,
  getGridForLevel,
  getLevelsInStage,
  GRID_PIECE_FIT,
} from "../shared/config/grid-generation.const";
import type {GridShape} from "../grid/create-grid";
import {missionForGrid, remainingOf, type MissionGoal} from "../shared/level-mission";
import {
  BOMB,
  Cell,
  EMPTY,
  ROCKET_H,
  ROCKET_V,
  areaBlastCells,
  collectBlasts,
  crossBlastCells,
  spiralBlastCells,
  findMatchRuns,
  findHintMove,
  generatePlayableBoard,
  hasMatches,
  hasValidMove,
  isAdjacent,
  isPiece,
  isSpecial,
  sameCell,
  shuffleBoard,
  specialsFromRuns,
  swapCells,
} from "../shared/match3";
import {
  applyWave,
  blocksColumn,
  columnSegments,
  coverKey,
  holdsPiece,
  obstacleFromSymbol,
  pickThornTarget,
  magmaCooled,
  terrainKey,
  type ObstacleCell,
} from "../shared/obstacles";

import {Game} from "./game";

const assetConf = CandyCrushAssetConf; //* Generalizzazione
const gameName = "candy-crush";

const GRID_VERTICAL_PAD = 0.02;
const SWAP_MS = 280; // swipe / scambio pezzi
const DESTROY_MS = 280; // esplosione match
const FALL_MS = 420; // caduta e refill
const SWIPE_RATIO = 0.22; // soglia drag (non è velocità)
const BOMB_SHOCK_MS = 350;
const EXPLOSION_AUDIO_MS = 1200;
const AUDIO_FADE_MS = 450;
/** super.mp3 al drop in griglia: taglio secco, sotto 500 ms. */
const SUPER_AUDIO_MS = 420;
const SUPER_AUDIO_MAX_MS = 480;
const BOMB_RIPPLE_MS = 60;
const ROCKET_ZOOM_MS = 200;
const MISSILE_AUDIO_DELAY_MS = 0;
const ROCKET_FLY_CELL_MS = 70;
const MEGA_RADIUS = 2;
const MEGA_SPREAD = 2;
const MEGA_STAR_YELLOW = 0xffd83d;
const MEGA_ELECTRIC_CORE = 0xfff6a8;
const MEGA_STAR_FX_MS = 420;
const MEGA_ELECTRIC_TICK_MS = 48;
const SUPER_WAVE_FADE_MS = 520;
const SUPER_WAVE_ELECTRIC_EVERY = 6;
const SPIRAL_STEP_MS = 48;
const ULTRA_VORTEX_TURNS = 2;
/** Quota animazione per lo scatto verso la casella a sinistra del drop. */
const ULTRA_VORTEX_PHASE1_T = 0.12;
const MAXI_SHOCK_BLUE = 0x7ad7ff;
const MAXI_ELECTRIC_CORE = 0xd6f7ff;
const MAXI_ELECTRIC_TICK_MS = 52;
const BOOSTER_BURST_TINT: Record<BoosterId, number> = {
  super: 0x45e06a,
  mega: 0xffd83d,
  maxi: MAXI_SHOCK_BLUE,
  ultra: 0xe62838,
};
const ULTRA_BLADE_COLOR = 0xff3344;
const ULTRA_ELECTRIC_CORE = 0xffa8b8;
const ULTRA_TRAIL_FADE_MS = 720;
const ULTRA_VORTEX_FX_SPEED = 0.52;
const ULTRA_TRAIL_ELECTRIC_EVERY = 2;
const MOVE_GRANT_TICK_MS = 70;
const HINT_IDLE_MS = 10000;
const HINT_PULSE_MS = 420;
const HINT_PULSE_SCALE = 1.12;
//* Nel tutorial lo zoom deve essere ovvio: +42% contro il +12% del suggerimento.
const GUIDE_PULSE_SCALE = 1.42;
const GUIDE_PULSE_MS = 480;

type RocketOrigin = {cell: Cell; type: number};
type FadeArt = {cell: Cell; image: Phaser.GameObjects.Image};
type UltraVortexFxMetrics = {
  hubPos: {x: number; y: number};
  leftPos: {x: number; y: number};
  startAngle: number;
  rMin: number;
  rMax: number;
};

const ICE_ALPHA = 0.72;
const BLOCK_ALPHA = 0.45;
const MAGMA_COOL_VEIL_COLOR = 0x9a9a9a;
const MAGMA_COOL_VEIL_ALPHA = 0.65;
//* Sopra griglia, pezzi e (via trasparenza) header/footer della scena Game.
const SHUFFLE_OVERLAY_DEPTH = 1200;
const SHUFFLE_TEXT_DEPTH = 1201;
const SHUFFLE_DIM_ALPHA = 0.72;
const FULL_CELL_ART = new Set(["G", "H", "I", "J", "R", "X"]);

export class GameManager extends Phaser.Scene {
  audioManager!: AudioManager;

  private gameWidth!: number;
  private gameHeight!: number;

  private marginTop = 200;

  public canShoot: boolean = true;
  public isGameOver: boolean = false;

  gameScene!: Game;
  speedBall: number = 800;
  timeAddNewRow: number = 20000;

  private mainContainer!: Phaser.GameObjects.Container;
  private blocks: (Phaser.GameObjects.Image | null)[][] = [];
  private boardPlate: BoardPlate | null = null;
  private obstacles: (ObstacleCell | null)[][] = [];
  private covers: (Phaser.GameObjects.Image | null)[][] = [];
  private terrains: (Phaser.GameObjects.Image | null)[][] = [];
  private magmaVeils: (Phaser.GameObjects.Rectangle | null)[][] = [];
  private pieces: (Phaser.GameObjects.Image | null)[][] = [];
  private board: number[][] = [];

  private gridCols = 0;
  private gridRows = 0;
  private cellW = 0;
  private cellH = 0;
  private startX = 0;
  private startY = 0;
  private gridLeft = 0;
  private gridTop = 0;
  private pieceScale = 1;
  private isBusy = false;
  private swipeStart: {cell: Cell; x: number; y: number} | null = null;
  private swipeLocked = false;
  private starsEffect!: StarsEffectManager;
  private hintTimer?: Phaser.Time.TimerEvent;
  private hintCells: Cell[] = [];
  #itemsBar: ItemsBar | null = null;
  #pieceKeys: readonly string[] = [];
  #scripted = false;
  #guide: {from: Cell; to?: Cell; done: () => void} | null = null;
  #shape: GridShape | null = null;
  #goals: MissionGoal[] = [];
  #moves = 0;
  #collectLeft = 0;
  #moveAdUsed = false;

  constructor() {
    super({key: assetConf.scene.gameManager});
  }

  init(data: {gameScene?: Game}) {
    if (data.gameScene) {
      this.gameScene = data.gameScene;
    }
  }

  create() {
    this.#resetMatchInput();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.#onShutdown, this);
    console.log(`Gioco caricato ${gameName}`);
    const selected = Number(this.registry.get("level"));
    const level = Number.isFinite(selected) && selected > 0 ? selected : getUnlockedCount();
    this.#pieceKeys = getPieceKeysForStageLevel(level, getStageIndex());
    const tutorial = shouldShowTutorial(level);
    const shape = getGridForLevel(level, getStageIndex());

    this.#shape = shape;
    this.#armMission(shape);
    this.obstacles = shape.cells.map((row) =>
      row.map((symbol) => (symbol === "." ? null : obstacleFromSymbol(symbol))),
    );
    this.gridCols = shape.cols;
    this.gridRows = shape.rows;
    this.computeLayoutDimensions();
    this.starsEffect = new StarsEffectManager(this);
    this.createGrid();
    this.bindSwipe();
    this.#itemsBar = new ItemsBar(
      this,
      (min, max) => this.gameScene.setDynamicValueBasedOnScale(min, max),
      (x, y) => this.cellAtWorld(x, y),
      this.gameScene,
      (id, cell) => this.tryDropBooster(id, cell),
    );
    this.#itemsBar.create();
    this.presentMission();
    this.layoutGrid();

    this.time.delayedCall(50, () => {
      this.isGameOver = false;

      if (tutorial) void this.#runTutorial();
      else void this.#beginWithObstacleTips();
    });
  }

  async #beginWithObstacleTips(): Promise<void> {
    await this.#runObstacleTips(false);

    if (!this.scene.isActive()) return;

    this.#startPlay();
  }

  async #runObstacleTips(skipCollect: boolean): Promise<void> {
    if (!this.#shape) return;

    const language = getCurrentLanguage();
    let tips = pendingObstacleTips(this.#shape.cells, this.#goals, getStageIndex()).filter(
      (tip) => !isObstacleTipSeen(tip.id),
    );

    if (skipCollect) tips = tips.filter((tip) => tip.id !== "collect");

    if (!tips.length) return;

    this.canShoot = false;
    const screen = new TutorialScreen(this);

    for (const tip of tips) {
      if (!this.scene.isActive()) return;

      await screen.customPage(tip.image, tip.text[language] || tip.text.it);
      markObstacleTipSeen(tip.id);
      await screen.close();
    }
  }

  #startPlay(): void {
    this.canShoot = true;
    this.restartHintTimer();
  }

  //* Primo livello del primo stage, prima volta: si muove solo il pezzo che pulsa e la vittoria è sospesa.
  //* Finito lo script, questa partita ha i booster infiniti.
  async #runTutorial(): Promise<void> {
    const screen = new TutorialScreen(this);

    this.#scripted = true;

    await runFirstLevelScript({
      page: async (index, options = {}) => {
        this.canShoot = false;
        await screen.page(index, options);

        if (!options.keepDark) await screen.close();
      },
      rig: (type) => this.#rigCombo(type),
      guide: (from, to) => this.#guideMove(from, to),
      ensureSpecial: (type) => this.#ensureSpecial(type),
      showcaseItems: (on) => {
        if (on) this.#itemsBar?.setUnlimited();

        this.#itemsBar?.showcase(on);
      },
      yourTurn: () => screen.yourTurn(),
    });

    if (!this.scene.isActive()) return;

    screen.finish();
    this.#scripted = false;

    if (this.#shape) this.#armMission(this.#shape);

    this.presentMission();
    await this.#runObstacleTips(true);
    await screen.close();

    if (!this.scene.isActive()) return;

    this.#startPlay();
  }

  #rigCombo(type: number): GuidedMove | null {
    const canMatch = (row: number, col: number) => this.canMatch(row, col);
    const setup = findComboSetup(
      this.board,
      this.#pieceKeys.length,
      type,
      (row, col) => this.allowsSwap(row, col) && canMatch(row, col),
      canMatch,
    );

    if (!setup) return null;

    for (const {cell, type: piece} of setup.cells) {
      this.board[cell.r][cell.c] = piece;

      const image = this.pieces[cell.r][cell.c];

      if (image) {
        this.applyPieceLook(image, piece);
        this.#popIn(image);
      }
    }

    return setup;
  }

  #popIn(image: Phaser.GameObjects.Image): void {
    const scale = image.scale;

    this.tweens.killTweensOf(image);
    image.setScale(0);
    this.tweens.add({targets: image, scale, duration: 360, ease: "Back.easeOut"});
  }

  #guideMove(from: Cell, to?: Cell): Promise<void> {
    return new Promise((done) => {
      this.#guide = {from, to, done};
      this.canShoot = true;
      this.restartHintTimer();
    });
  }

  //* Chiude la mossa guidata. Lo script riprende e il gioco resta fermo fino alla prossima pagina.
  #finishGuide(): boolean {
    const guide = this.#guide;

    if (!guide) return false;

    this.#guide = null;
    this.canShoot = false;
    guide.done();

    return true;
  }

  #hasSwapNeighbor(cell: Cell): boolean {
    return [
      {r: cell.r - 1, c: cell.c},
      {r: cell.r + 1, c: cell.c},
      {r: cell.r, c: cell.c - 1},
      {r: cell.r, c: cell.c + 1},
    ].some((next) => this.inBounds(next) && this.canMove(next));
  }

  //* Usa il power-up già in griglia, altrimenti lo fa comparire sulla cella libera più centrale.
  #ensureSpecial(type: number): Cell | null {
    const cells: Cell[] = [];

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.canMove({r, c}) && this.#hasSwapNeighbor({r, c})) cells.push({r, c});
      }
    }

    const ordered = centerFirst(cells, this.gridRows, this.gridCols);
    const found = ordered.find((cell) => isSameFamily(this.board[cell.r][cell.c], type));

    if (found) return found;

    const cell = ordered.find((next) => !isSpecial(this.board[next.r][next.c]));

    if (!cell) return null;

    this.placeSpecial(cell, type);

    const piece = this.pieces[cell.r][cell.c];

    if (piece) this.#popIn(piece);

    return cell;
  }

  #armMission(shape: GridShape): void {
    const pieceIcon = this.#pieceKeys[0] ?? assetConf.image.block;
    const stageIndex = getStageIndex();
    const selected = Number(this.registry.get("level"));
    const level = Number.isFinite(selected) && selected > 0 ? selected : getUnlockedCount();
    const levelsInStage = getLevelsInStage(stageIndex);
    const localLevel = ((level - 1) % levelsInStage) + 1;
    const mission = missionForGrid(shape.cells, pieceIcon, {
      stageIndex,
      localLevel,
      levelsInStage,
    });

    this.#goals = mission.goals;
    //* Test: 2 mosse sul primo livello. Togli quando hai finito di provare.
    this.#moves = this.#isFirstLevel() ? 2 : mission.moves;
    this.#collectLeft = mission.collect;
    this.#moveAdUsed = false;
  }

  #isFirstLevel(): boolean {
    const selected = Number(this.registry.get("level"));
    const level = Number.isFinite(selected) && selected > 0 ? selected : getUnlockedCount();

    return level === 1 && getStageIndex() === 0;
  }

  presentMission(): void {
    this.#pushMission();
  }

  grantExtraMoves(amount: number): void {
    this.#moveAdUsed = true;
    this.isGameOver = false;
    this.canShoot = false;
    this.isBusy = true;

    const target = this.#moves + Math.max(0, amount);

    this.gameScene.uiManager.setMoves(this.#moves, false);

    if (this.#moves >= target) {
      this.canShoot = true;
      this.isBusy = false;
      this.restartHintTimer();

      return;
    }

    const tick = this.time.addEvent({
      delay: MOVE_GRANT_TICK_MS,
      loop: true,
      callback: () => {
        this.#moves += 1;
        this.gameScene.uiManager.setMoves(this.#moves);

        if (this.#moves < target) return;

        tick.remove(false);
        this.canShoot = true;
        this.isBusy = false;
        this.restartHintTimer();
      },
    });
  }

  #goalLeft(goal: MissionGoal): number {
    return remainingOf(goal.kind, this.obstacles, this.#collectLeft);
  }

  #pushMission(): void {
    const ui = this.gameScene?.uiManager;

    if (!ui?.showMission) return;

    ui.showMission(
      this.#goals.map((goal) => ({icon: goal.icon, left: this.#goalLeft(goal)})),
      this.#moves,
    );
  }

  #collectHits(cells: Cell[]): number {
    const icon = this.#goals.find((goal) => goal.kind === "collect")?.icon;

    if (!icon) return 0;

    return cells.reduce((total, cell) => {
      const type = this.board[cell.r]?.[cell.c];

      return type != null && this.textureKey(type) === icon ? total + 1 : total;
    }, 0);
  }

  #notePop(cells: Cell[]): void {
    if (this.#scripted || cells.length === 0) return;

    this.#collectLeft = Math.max(0, this.#collectLeft - this.#collectHits(cells));
    this.#pushMission();
  }

  #spendMove(): void {
    this.#moves = Math.max(0, this.#moves - 1);
    this.gameScene.uiManager.setMoves(this.#moves);
  }

  #goalReached(): boolean {
    return !this.#scripted && this.#goals.length > 0 && this.#goals.every((goal) => this.#goalLeft(goal) <= 0);
  }

  async #finishMatch(won: boolean): Promise<void> {
    if (won) {
      this.canShoot = false;
      await this.collapseAndFill();
      await this.delay(400);
      this.gameScene.gameOver(true);

      return;
    }

    this.canShoot = false;

    if (this.#moveAdUsed) {
      this.gameScene.gameOver(false);

      return;
    }

    this.gameScene.offerMoveAd();
  }

  //* Placca col bordo dorato, sopra il block dello stage un po' trasparente, poi i pezzi.
  private createGrid(): void {
    this.clearBoardPlate();
    this.mainContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);

    this.applyGridMetrics();
    const stageOneBased = getStageIndex() + 1;

    this.boardPlate = createBoardPlate(
      this,
      this.obstacles.map((row) => row.map((cell) => cell != null)),
      this.cellW,
      this.gridLeft,
      this.gridTop,
      plateFillForStage(stageOneBased),
    );

    if (this.boardPlate) this.mainContainer.add([this.boardPlate.fill, this.boardPlate.rim]);

    this.board = generatePlayableBoard(
      this.gridRows,
      this.gridCols,
      this.#pieceKeys.length,
      (row, col) => holdsPiece(this.obstacles[row]?.[col] ?? null),
      (row, col) => this.allowsSwap(row, col),
      (row, col) => this.canMatch(row, col),
    );

    this.blocks = [];
    this.pieces = [];
    this.covers = [];
    this.terrains = [];
    this.magmaVeils = [];

    for (let row = 0; row < this.gridRows; row++) {
      const rowBlocks: (Phaser.GameObjects.Image | null)[] = [];
      const rowPieces: (Phaser.GameObjects.Image | null)[] = [];
      const rowCovers: (Phaser.GameObjects.Image | null)[] = [];
      const rowTerrains: (Phaser.GameObjects.Image | null)[] = [];
      const rowVeils: (Phaser.GameObjects.Rectangle | null)[] = [];

      for (let col = 0; col < this.gridCols; col++) {
        rowCovers.push(null);
        rowTerrains.push(null);
        rowVeils.push(null);

        if (!this.isOpen(row, col)) {
          rowBlocks.push(null);
          rowPieces.push(null);
          continue;
        }

        const {x, y} = this.cellPos({r: row, c: col});
        const block = this.add
          .image(x, y, assetConf.image.block)
          .setOrigin(0.5)
          .setDisplaySize(this.cellW, this.cellH)
          .setAlpha(BLOCK_ALPHA);

        this.mainContainer.add(block);
        rowBlocks.push(block);

        const type = this.board[row][col];

        rowPieces.push(type === EMPTY ? null : this.spawnPiece(row, col, type, y));
      }

      this.blocks.push(rowBlocks);
      this.pieces.push(rowPieces);
      this.covers.push(rowCovers);
      this.terrains.push(rowTerrains);
      this.magmaVeils.push(rowVeils);
    }

    this.syncArt();
  }

  private spawnPiece(
    row: number,
    col: number,
    type: number,
    fromY?: number,
  ): Phaser.GameObjects.Image {
    const {x, y} = this.cellPos({r: row, c: col});
    const piece = this.add.image(x, fromY ?? y, this.textureKey(type)).setOrigin(0.5);

    this.applyPieceLook(piece, type);
    this.mainContainer.add(piece);
    this.mainContainer.bringToTop(piece);

    return piece;
  }

  private textureKey(type: number): string {
    if (type === ROCKET_H || type === ROCKET_V) return assetConf.image.rocket;
    if (type === BOMB) return assetConf.image.bomb;

    return this.#pieceKeys[type];
  }

  private fitScale(piece: Phaser.GameObjects.Image): number {
    return Math.min(this.cellW / piece.width, this.cellH / piece.height) * GRID_PIECE_FIT;
  }

  private applyPieceLook(piece: Phaser.GameObjects.Image, type: number): void {
    piece.setTexture(this.textureKey(type));
    //* Il png punta in su: in piedi = colonna, di lato = riga.
    piece.setAngle(type === ROCKET_H ? 90 : 0);
    this.pieceScale = this.fitScale(piece);
    piece.setScale(this.pieceScale).setAlpha(1).setVisible(true);
  }

  //* La scena Phaser viene riusata. Senza reset, una vittoria col booster lascia isBusy e il livello dopo non riceve gli swipe.
  #resetMatchInput(): void {
    this.isBusy = false;
    this.isGameOver = false;
    this.canShoot = false;
    this.swipeStart = null;
    this.swipeLocked = false;
    this.#scripted = false;
    this.#guide = null;

    if (this.scene.isPaused()) this.scene.resume();
  }

  #onShutdown = (): void => {
    this.clearBoardPlate();
    this.isBusy = false;
    this.swipeStart = null;
    this.swipeLocked = false;
  };

  #onSwipeDown = (pointer: Phaser.Input.Pointer): void => {
      this.restartHintTimer();
      if (this.#itemsBar?.isOnBar(pointer) || this.#itemsBar?.isBlocking()) return;
      if (!this.canPlay()) return;

      const local = this.toLocal(pointer);
      const cell = this.getCellAt(local.x, local.y);

      if (!cell || !this.canMove(cell)) return;
      if (this.#guide && !sameCell(cell, this.#guide.from)) return;

      this.swipeStart = {cell, x: local.x, y: local.y};
      this.swipeLocked = false;
  };

  #onSwipeMove = (pointer: Phaser.Input.Pointer): void => {
      if (this.#itemsBar?.isBlocking()) return;
      if (!this.canPlay() || !this.swipeStart || this.swipeLocked) return;

      const local = this.toLocal(pointer);
      const dx = local.x - this.swipeStart.x;
      const dy = local.y - this.swipeStart.y;
      const threshold = Math.min(this.cellW, this.cellH) * SWIPE_RATIO;

      if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;

      const neighbor =
        Math.abs(dx) > Math.abs(dy)
          ? {r: this.swipeStart.cell.r, c: this.swipeStart.cell.c + (dx > 0 ? 1 : -1)}
          : {r: this.swipeStart.cell.r + (dy > 0 ? 1 : -1), c: this.swipeStart.cell.c};

      this.swipeLocked = true;

      if (this.#guide?.to && !sameCell(neighbor, this.#guide.to)) return;

      void this.trySwap(this.swipeStart.cell, neighbor);
  };

  #onSwipeUp = (): void => {
    this.swipeStart = null;
    this.swipeLocked = false;
  };

  #unbindSwipe(): void {
    this.input.off("pointerdown", this.#onSwipeDown);
    this.input.off("pointermove", this.#onSwipeMove);
    this.input.off("pointerup", this.#onSwipeUp);
  }

  private bindSwipe(): void {
    this.#unbindSwipe();
    this.input.on("pointerdown", this.#onSwipeDown);
    this.input.on("pointermove", this.#onSwipeMove);
    this.input.on("pointerup", this.#onSwipeUp);
  }

  private canPlay(): boolean {
    return !this.isBusy && !this.isGameOver && this.canShoot;
  }

  private restartHintTimer(): void {
    this.stopHintTimer();
    this.clearHint();
    if (!this.canPlay()) return;

    if (this.#guide) {
      this.pulseCells([this.#guide.from], GUIDE_PULSE_SCALE, GUIDE_PULSE_MS);

      return;
    }

    this.hintTimer = this.time.addEvent({
      delay: HINT_IDLE_MS,
      callback: () => this.showHint(),
    });
  }

  private stopHintTimer(): void {
    this.hintTimer?.remove(false);
    this.hintTimer = undefined;
  }

  private clearHint(): void {
    for (const cell of this.hintCells) {
      const piece = this.pieces[cell.r]?.[cell.c];

      if (!piece?.active) continue;

      this.tweens.killTweensOf(piece);
      this.applyPieceLook(piece, this.board[cell.r][cell.c]);
    }

    this.hintCells = [];
    this.stackSprites();
  }

  private showHint(): void {
    if (!this.canPlay()) return;

    const move = findHintMove(this.board, (row, col) => this.allowsSwap(row, col), (row, col) => this.canMatch(row, col));

    if (!move) return;

    this.pulseCells([move.a, move.b]);
  }

  private pulseCells(cells: Cell[], zoom = HINT_PULSE_SCALE, duration = HINT_PULSE_MS): void {
    this.hintCells = cells;

    for (const cell of this.hintCells) {
      const piece = this.pieces[cell.r][cell.c];

      if (!piece?.active) continue;

      this.tweens.killTweensOf(piece);
      this.mainContainer.bringToTop(piece);

      const scale = this.fitScale(piece);

      this.tweens.add({
        targets: piece,
        scaleX: scale * zoom,
        scaleY: scale * zoom,
        duration,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private toLocal(pointer: Phaser.Input.Pointer): Phaser.Math.Vector2 {
    return this.mainContainer.getLocalPoint(pointer.worldX, pointer.worldY);
  }

  public cellAtWorld(worldX: number, worldY: number): Cell | null {
    if (!this.mainContainer) return null;

    const local = this.mainContainer.getLocalPoint(worldX, worldY);

    return this.getCellAt(local.x, local.y);
  }

  private getCellAt(localX: number, localY: number): Cell | null {
    const col = Math.floor((localX - this.gridLeft) / this.cellW);
    const row = Math.floor((localY - this.gridTop) / this.cellH);

    if (row < 0 || col < 0 || row >= this.gridRows || col >= this.gridCols || !this.isOpen(row, col)) {
      return null;
    }

    return {r: row, c: col};
  }

  private cellPos(cell: Cell): {x: number; y: number} {
    return {
      x: this.startX + cell.c * this.cellW,
      y: this.startY + cell.r * this.cellH,
    };
  }

  private isOpen(row: number, col: number): boolean {
    return this.obstacles[row]?.[col] != null;
  }

  //* Il pezzo si può scambiare: niente cassa, muro, roccia, rovo, ghiaccio o catena.
  private allowsSwap(row: number, col: number): boolean {
    const cell = this.obstacles[row]?.[col];

    return !!cell && cell.blocker === null && !(cell.lock && cell.lockLayers > 0);
  }

  //* Il ghiaccio non entra nei match. La catena sì.
  private canMatch(row: number, col: number): boolean {
    const cell = this.obstacles[row]?.[col];

    return !!cell && cell.blocker === null && cell.lock !== "ice";
  }

  private canMove(cell: Cell): boolean {
    return this.allowsSwap(cell.r, cell.c) && isPiece(this.board[cell.r][cell.c]);
  }

  private inBounds(cell: Cell): boolean {
    return cell.r >= 0 && cell.c >= 0 && cell.r < this.gridRows && cell.c < this.gridCols;
  }

  public tryDropBooster(id: BoosterId, cell: Cell): boolean {
    if (this.#scripted || !this.canPlay() || !this.inBounds(cell) || !this.isOpen(cell.r, cell.c)) {
      return false;
    }

    this.isBusy = true;
    this.stopHintTimer();
    this.clearHint();
    void this.runBooster(id, cell).finally(() => {
      this.isBusy = false;
      this.swipeStart = null;
      this.swipeLocked = false;

      if (this.isGameOver || !this.scene?.isActive()) return;

      this.restartHintTimer();
    });

    return true;
  }

  //* Tutta la griglia giocabile. I muri restano, come nello scoppio di mega.
  private allOpenCells(): Cell[] {
    const cells: Cell[] = [];

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.obstacles[r]?.[c];

        if (!cell || cell.blocker === "wall") continue;

        cells.push({r, c});
      }
    }

    return cells;
  }

  private boosterCells(id: BoosterId, origin: Cell): Cell[] {
    if (id === "mega") return areaBlastCells(this.board, origin, MEGA_RADIUS);
    if (id === "maxi") return this.allOpenCells();
    if (id === "super") return crossBlastCells(this.board, origin);

    return spiralBlastCells(
      this.gridRows,
      this.gridCols,
      origin,
      (row, col) => {
        const cell = this.obstacles[row]?.[col];

        return !!cell && cell.blocker !== "wall";
      },
      MEGA_RADIUS,
    );
  }

  //* La cella del drop perde subito pezzo, lucchetto e ostacolo. Il muro resta.
  private releaseOrigin(origin: Cell, pop: Cell[]): void {
    const obs = this.obstacles[origin.r]?.[origin.c];

    if (obs && obs.blocker !== "wall") {
      obs.blocker = null;
      obs.blockerLayers = 0;
      obs.lock = null;
      obs.lockLayers = 0;
    }

    if (this.board[origin.r][origin.c] === EMPTY) return;
    if (pop.some((cell) => cell.r === origin.r && cell.c === origin.c)) return;

    pop.unshift(origin);
  }

  private async runBooster(id: BoosterId, origin: Cell): Promise<void> {
    const pattern = this.boosterCells(id, origin);
    const chained =
      id === "ultra"
        ? []
        : collectBlasts(
            this.board,
            pattern.filter((cell) => isSpecial(this.board[cell.r][cell.c])),
          );
    const {pop, thornDamaged} = applyWave(
      this.board,
      this.obstacles,
      [],
      [pattern, ...chained],
      new Set(),
    );

    this.releaseOrigin(origin, pop);

    const isOrigin = (cell: Cell) => cell.r === origin.r && cell.c === origin.c;
    const bombCenters = pop.filter((cell) => this.board[cell.r][cell.c] === BOMB && !isOrigin(cell));
    const rocketCenters = this.rocketOrigins(pop).filter((rocket) => !isOrigin(rocket.cell));
    const spiralDelay = new Map<string, number>();

    if (id === "ultra") {
      pattern.forEach((cell, index) => {
        spiralDelay.set(`${cell.r},${cell.c}`, index * SPIRAL_STEP_MS);
      });
    }

    this.playBoosterFx(id, origin, pattern, bombCenters.length > 0, rocketCenters.length > 0);

    const flies = id === "super" ? [this.playSuperCrossWaveFx(origin)] : [];

    this.#notePop(pop);

    await Promise.all([
      this.destroyMatches(
        pop,
        bombCenters,
        rocketCenters,
        this.peelArt(),
        (cell) => this.boosterDelay(id, origin, cell, bombCenters, rocketCenters, spiralDelay),
        origin,
        BOOSTER_BURST_TINT[id],
      ),
      ...flies,
    ]);

    this.syncArt();
    this.stackSprites();
    this.gameScene.audioManager.playAudio(assetConf.audio.success);

    if (this.#goalReached()) {
      await this.#finishMatch(true);

      return;
    }

    await this.collapseAndFill();
    await this.resolveBoard([], undefined, !thornDamaged);
  }

  private playBoosterFx(
    id: BoosterId,
    origin: Cell,
    pattern: Cell[],
    hasBomb: boolean,
    hasRocket: boolean,
  ): void {
    if (id === "ultra") {
      this.playUltraScytheFx(origin, pattern);
    }

    if (id === "mega") {
      this.playMegaStarOfDavidFx(origin);
      this.#maybeShake(130, 0.0048);
      this.gameScene.audioManager.playAudio(
        assetConf.audio.mega,
        EXPLOSION_AUDIO_MS,
        AUDIO_FADE_MS,
      );
    }

    if (id === "maxi") {
      const spread = Math.max(MEGA_SPREAD, Math.max(this.gridRows, this.gridCols) / 2);

      this.playMaxiElectricPulse(origin, spread);

      if (!hasBomb) {
        this.#maybeShake(180, 0.006);
        this.gameScene.audioManager.playAudio(
          assetConf.audio.explosion,
          EXPLOSION_AUDIO_MS,
          AUDIO_FADE_MS,
        );
      }
    }

    if (id === "super") {
      this.time.delayedCall(MISSILE_AUDIO_DELAY_MS, () => {
        const key = assetConf.audio.super;

        this.gameScene.audioManager.playAudio(key, SUPER_AUDIO_MS, 0);
        this.time.delayedCall(SUPER_AUDIO_MAX_MS, () => {
          this.gameScene.audioManager.stopAudio(key);
        });
      });
    }

    if (id === "ultra") {
      this.gameScene.audioManager.playAudio(
        assetConf.audio.ultra,
        EXPLOSION_AUDIO_MS,
        AUDIO_FADE_MS,
      );
    }
  }

  private boosterDelay(
    id: BoosterId,
    origin: Cell,
    cell: Cell,
    bombCenters: Cell[],
    rocketCenters: RocketOrigin[],
    spiralDelay: Map<string, number>,
  ): number {
    if (cell.r === origin.r && cell.c === origin.c) return 0;

    if (id === "ultra") return spiralDelay.get(`${cell.r},${cell.c}`) ?? 0;

    if (id === "mega" || id === "maxi") return this.destroyDelay(cell, [origin, ...bombCenters], rocketCenters);

    const onCross = cell.r === origin.r || cell.c === origin.c;
    const cross = onCross
      ? Math.max(Math.abs(cell.r - origin.r), Math.abs(cell.c - origin.c)) * ROCKET_FLY_CELL_MS
      : null;
    const chained =
      bombCenters.length || rocketCenters.length
        ? this.destroyDelay(cell, bombCenters, rocketCenters)
        : null;

    if (cross === null) return chained ?? 0;
    if (chained === null) return cross;

    return Math.min(cross, chained);
  }

  private async trySwap(a: Cell, b: Cell): Promise<void> {
    if (!this.inBounds(b) || !isAdjacent(a, b) || this.isBusy || this.isGameOver) return;
    if (!this.canMove(a) || !this.canMove(b)) return;

    const pieceA = this.pieces[a.r][a.c];
    const pieceB = this.pieces[b.r][b.c];

    if (!pieceA || !pieceB) return;

    this.stopHintTimer();
    this.clearHint();
    this.isBusy = true;
    this.swapSprites(a, b);
    swapCells(this.board, a, b);
    await this.animateSwap(pieceA, pieceB);
    this.stackSprites();

    const activated = [a, b].filter((cell) => isSpecial(this.board[cell.r][cell.c]));

    if (!hasMatches(this.board, (row, col) => this.canMatch(row, col)) && activated.length === 0) {
      this.swapSprites(a, b);
      swapCells(this.board, a, b);
      await this.animateSwap(pieceA, pieceB);
      this.stackSprites();
      this.gameScene.audioManager.playAudio(assetConf.audio.error);
      this.isBusy = false;
      this.restartHintTimer();

      return;
    }

    if (!this.#scripted) this.#spendMove();

    await this.resolveBoard(activated, b);
    this.isBusy = false;

    if (this.isGameOver || this.#finishGuide() || this.#scripted) return;

    if (this.#goalReached()) {
      await this.#finishMatch(true);

      return;
    }

    if (this.#moves <= 0) {
      await this.#finishMatch(false);

      return;
    }

    this.restartHintTimer();
  }

  private swapSprites(a: Cell, b: Cell): void {
    const tmp = this.pieces[a.r][a.c];

    this.pieces[a.r][a.c] = this.pieces[b.r][b.c];
    this.pieces[b.r][b.c] = tmp;
  }

  private async animateSwap(
    pieceA: Phaser.GameObjects.Image,
    pieceB: Phaser.GameObjects.Image,
  ): Promise<void> {
    const posA = {x: pieceA.x, y: pieceA.y};
    const posB = {x: pieceB.x, y: pieceB.y};

    this.mainContainer.bringToTop(pieceA);
    this.mainContainer.bringToTop(pieceB);

    await Promise.all([
      this.moveImage(pieceA, posB.x, posB.y, SWAP_MS),
      this.moveImage(pieceB, posA.x, posA.y, SWAP_MS),
    ]);
  }

  //* Scopo: Distrugge i match, colpisce gli ostacoli, fa cadere i pezzi e ripete le cascate.
  private async resolveBoard(activated: Cell[] = [], preferred?: Cell, growThorns = true): Promise<void> {
    let isFirstWave = true;
    let thornDamaged = false;
    const canMatch = (row: number, col: number) => this.canMatch(row, col);
    const allowsSwap = (row: number, col: number) => this.allowsSwap(row, col);

    while (!this.isGameOver) {
      const runs = findMatchRuns(this.board, canMatch);
      const matches = runs.flatMap((run) => run.cells);
      const extra = isFirstWave ? activated : [];

      isFirstWave = false;

      if (matches.length === 0 && extra.length === 0) break;

      const spawns = matches.length ? specialsFromRuns(runs, preferred) : [];
      const spawnKeys = new Set(spawns.map((spawn) => `${spawn.cell.r},${spawn.cell.c}`));
      const uniqueMatches = this.uniqueCells(matches);
      const origins = this.uniqueCells(
        [...uniqueMatches, ...extra].filter((cell) => isSpecial(this.board[cell.r][cell.c])),
      );
      const {pop, thornDamaged: hit} = applyWave(
        this.board,
        this.obstacles,
        uniqueMatches,
        collectBlasts(this.board, origins),
        spawnKeys,
      );

      if (hit) thornDamaged = true;

      const bombCenters = pop.filter((cell) => this.board[cell.r][cell.c] === BOMB);
      const rocketCenters = this.rocketOrigins(pop);

      preferred = undefined;

      this.#notePop(pop);
      await this.destroyMatches(pop, bombCenters, rocketCenters, this.peelArt());
      this.syncArt();

      for (const spawn of spawns) this.placeSpecial(spawn.cell, spawn.type);

      this.stackSprites();
      this.gameScene.audioManager.playAudio(assetConf.audio.success);

      if (this.#goalReached()) {
        await this.#finishMatch(true);
        break;
      }

      await this.collapseAndFill();
    }

    const stillPlaying = !this.isGameOver && !this.#goalReached();

    if (growThorns && stillPlaying && !thornDamaged) {
      this.growThorn();
      this.#pushMission();
    }

    if (stillPlaying && !hasValidMove(this.board, allowsSwap, canMatch)) {
      await this.warnAndShuffle();
    }
  }

  private uniqueCells(cells: Cell[]): Cell[] {
    const seen = new Set<string>();
    const unique: Cell[] = [];

    for (const cell of cells) {
      const key = `${cell.r},${cell.c}`;

      if (seen.has(key)) continue;

      seen.add(key);
      unique.push(cell);
    }

    return unique;
  }

  #maybeShake(duration: number, intensity: number): void {
    if (!isEffectsEnabled()) return;

    const scale = isLowEndDevice() ? 0.55 : 1;

    this.cameras.main.shake(duration, intensity * scale);
  }

  private placeSpecial(cell: Cell, type: number): void {
    this.board[cell.r][cell.c] = type;

    const existing = this.pieces[cell.r][cell.c];

    if (existing?.active) {
      this.tweens.killTweensOf(existing);
      this.applyPieceLook(existing, type);
      this.mainContainer.bringToTop(existing);

      return;
    }

    this.pieces[cell.r][cell.c] = this.spawnPiece(cell.r, cell.c, type);
  }

  private rocketOrigins(cells: Cell[]): RocketOrigin[] {
    const origins: RocketOrigin[] = [];

    for (const cell of cells) {
      const type = this.board[cell.r][cell.c];

      if (type !== ROCKET_H && type !== ROCKET_V) continue;

      origins.push({cell, type});
    }

    return origins;
  }

  private async destroyMatches(
    matches: Cell[],
    bombCenters: Cell[] = [],
    rocketCenters: RocketOrigin[] = [],
    fades: FadeArt[] = [],
    delayFor?: (cell: Cell) => number,
    instant?: Cell,
    burstTint?: number,
  ): Promise<void> {
    for (const bomb of bombCenters) {
      this.playBombShockwave(bomb);
    }

    if (bombCenters.length) {
      this.#maybeShake(140, 0.005);
      this.gameScene.audioManager.playAudio(
        assetConf.audio.explosion,
        EXPLOSION_AUDIO_MS,
        AUDIO_FADE_MS,
      );
    }

    if (rocketCenters.length) {
      this.time.delayedCall(MISSILE_AUDIO_DELAY_MS, () => {
        this.gameScene.audioManager.playAudio(assetConf.audio.missile, undefined, AUDIO_FADE_MS);
      });
    }

    const rocketKeys = new Set(rocketCenters.map((rocket) => `${rocket.cell.r},${rocket.cell.c}`));
    const launches = rocketCenters.map((rocket) => {
      const piece = this.pieces[rocket.cell.r][rocket.cell.c];

      this.board[rocket.cell.r][rocket.cell.c] = EMPTY;
      this.pieces[rocket.cell.r][rocket.cell.c] = null;

      return this.playRocketLaunch(rocket.cell, rocket.type, piece, burstTint);
    });

    const starBase = Math.min(this.cellW, this.cellH) / 92;
    const tweens = matches
      .filter((cell) => !rocketKeys.has(`${cell.r},${cell.c}`))
      .map((cell) => {
        const piece = this.pieces[cell.r][cell.c];

        this.board[cell.r][cell.c] = EMPTY;
        this.pieces[cell.r][cell.c] = null;

        if (!piece || !piece.active) return Promise.resolve();

        const delay = delayFor ? delayFor(cell) : this.destroyDelay(cell, bombCenters, rocketCenters);
        const isCenter =
          (instant != null && instant.r === cell.r && instant.c === cell.c) ||
          bombCenters.some((bomb) => bomb.r === cell.r && bomb.c === cell.c);
        const starScale = starBase * (isCenter ? 1.35 : 1);

        return new Promise<void>((resolve) => {
          const pop = () => {
            if (!piece.active) {
              resolve();

              return;
            }

            this.starsEffect.playAt(
              piece.x,
              piece.y,
              this.mainContainer,
              starScale,
              isCenter,
              burstTint,
            );
            this.tweens.killTweensOf(piece);

            if (isCenter) {
              piece.destroy();
              resolve();

              return;
            }

            this.tweens.add({
              targets: piece,
              scaleX: 0,
              scaleY: 0,
              alpha: 0,
              duration: DESTROY_MS,
              ease: "Back.easeIn",
              onComplete: () => {
                this.tweens.killTweensOf(piece);
                if (piece.active) {
                  piece.destroy();
                }
                resolve();
              },
            });
          };

          if (delay <= 0) {
            pop();
          } else {
            this.time.delayedCall(delay, pop);
          }
        });
      });

    const fadeTweens = fades.map(({cell, image}) => {
      const delay = delayFor ? delayFor(cell) : this.destroyDelay(cell, bombCenters, rocketCenters);
      const isInstant = instant != null && instant.r === cell.r && instant.c === cell.c;

      return new Promise<void>((resolve) => {
        const pop = () => {
          if (!image.active) {
            resolve();

            return;
          }

          if (isInstant) {
            this.starsEffect.playAt(image.x, image.y, this.mainContainer, starBase, true, burstTint);
            image.destroy();
            resolve();

            return;
          }

          this.mainContainer.bringToTop(image);
          this.starsEffect.playAt(image.x, image.y, this.mainContainer, starBase, isInstant, burstTint);

          this.tweens.killTweensOf(image);
          this.tweens.add({
            targets: image,
            scaleX: 0,
            scaleY: 0,
            alpha: 0,
            duration: DESTROY_MS,
            ease: "Back.easeIn",
            onComplete: () => {
              if (image.active) image.destroy();
              resolve();
            },
          });
        };

        if (delay <= 0) pop();
        else this.time.delayedCall(delay, pop);
      });
    });

    await Promise.all([...launches, ...tweens, ...fadeTweens]);
  }

  private destroyDelay(cell: Cell, bombCenters: Cell[], rocketCenters: RocketOrigin[]): number {
    const bombDelay = this.bombRippleDelay(cell, bombCenters);
    const rocketDelay = this.rocketPassDelay(cell, rocketCenters);

    if (!rocketCenters.length) return bombDelay;

    if (rocketDelay === null) return ROCKET_ZOOM_MS + bombDelay;

    if (!bombCenters.length) return rocketDelay;

    return Math.min(rocketDelay, ROCKET_ZOOM_MS + bombDelay);
  }

  private rocketPassDelay(cell: Cell, rockets: RocketOrigin[]): number | null {
    if (!rockets.length) return null;

    let min: number | null = null;

    for (const rocket of rockets) {
      const onLine = rocket.type === ROCKET_H ? cell.r === rocket.cell.r : cell.c === rocket.cell.c;

      if (!onLine) continue;

      const dist =
        rocket.type === ROCKET_H
          ? Math.abs(cell.c - rocket.cell.c)
          : Math.abs(cell.r - rocket.cell.r);
      const delay = ROCKET_ZOOM_MS + dist * ROCKET_FLY_CELL_MS;

      if (min === null || delay < min) {
        min = delay;
      }
    }

    return min;
  }

  private bombRippleDelay(cell: Cell, bombCenters: Cell[]): number {
    if (!bombCenters.length) return 0;

    const dist = bombCenters.reduce((min, bomb) => {
      const manhattan = Math.abs(cell.r - bomb.r) + Math.abs(cell.c - bomb.c);

      return Math.min(min, manhattan);
    }, Number.POSITIVE_INFINITY);

    return dist * BOMB_RIPPLE_MS;
  }

  private async playRocketLaunch(
    cell: Cell,
    type: number,
    piece: Phaser.GameObjects.Image | null,
    burstTint?: number,
  ): Promise<void> {
    const {x, y} = this.cellPos(cell);
    const starScale = (Math.min(this.cellW, this.cellH) / 92) * 1.2;

    if (piece?.active) {
      this.tweens.killTweensOf(piece);
      this.mainContainer.bringToTop(piece);

      const scale = this.fitScale(piece);

      await this.tweenPromise({
        targets: piece,
        scaleX: scale * 1.7,
        scaleY: scale * 1.7,
        duration: ROCKET_ZOOM_MS,
        ease: "Back.easeOut",
      });

      this.starsEffect.playAt(piece.x, piece.y, this.mainContainer, starScale, true, burstTint);
      piece.destroy();
    } else {
      await this.delay(ROCKET_ZOOM_MS);
      this.starsEffect.playAt(x, y, this.mainContainer, starScale, true, burstTint);
    }

    await this.playRocketFly(cell, type);
  }

  #sampleSuperIntertwinedWave(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    t: number,
    cellSize: number,
    phase: number,
  ): {x: number; y: number; tangent: number} {
    const bx = Phaser.Math.Linear(x0, x1, t);
    const by = Phaser.Math.Linear(y0, y1, t);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);

    if (len < 0.5) return {x: bx, y: by, tangent: 0};

    const nx = -dy / len;
    const ny = dx / len;
    const waves = Math.max(3, Math.round(len / (cellSize * 0.9)));
    const amp = cellSize * 0.15;
    const weave = Math.sin(t * waves * Math.PI * 2 + phase) * amp;
    const tangent = Math.atan2(dy, dx);

    return {x: bx + nx * weave, y: by + ny * weave, tangent};
  }

  #drawSuperRootLightning(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tangent: number,
    cellSize: number,
  ): void {
    const side = Phaser.Math.Between(0, 1) === 0 ? -1 : 1;
    const angle = tangent + side * (Math.PI / 2) + Phaser.Math.FloatBetween(-0.18, 0.18);

    this.#strokeElectricBolt(
      graphics,
      x,
      y,
      angle,
      cellSize * 0.24,
      cellSize,
      MEGA_STAR_YELLOW,
      MEGA_ELECTRIC_CORE,
      3,
      0.12,
    );
  }

  private async playSuperWaveArm(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    cellSize: number,
    lowEnd: boolean,
  ): Promise<void> {
    const dist = Math.hypot(x1 - x0, y1 - y0);
    const duration = Math.max(ROCKET_FLY_CELL_MS, (dist / cellSize) * ROCKET_FLY_CELL_MS);
    const strandA = this.add.graphics();
    const strandB = this.add.graphics();
    const roots = this.add.graphics();
    const lineWidth = Math.max(2, cellSize * (lowEnd ? 0.082 : 0.1));
    const coreWidth = Math.max(1, lineWidth * 0.42);

    strandA.setBlendMode(Phaser.BlendModes.ADD);
    strandB.setBlendMode(Phaser.BlendModes.ADD);
    roots.setBlendMode(Phaser.BlendModes.ADD);
    this.mainContainer.add(strandA);
    this.mainContainer.add(strandB);
    this.mainContainer.add(roots);
    this.mainContainer.bringToTop(roots);

    let lastA = this.#sampleSuperIntertwinedWave(x0, y0, x1, y1, 0, cellSize, 0);
    let lastB = this.#sampleSuperIntertwinedWave(x0, y0, x1, y1, 0, cellSize, Math.PI);
    let tick = 0;
    const progress = {t: 0};

    await this.tweenPromise({
      targets: progress,
      t: 1,
      duration,
      ease: "Linear",
      onUpdate: () => {
        const sampleA = this.#sampleSuperIntertwinedWave(x0, y0, x1, y1, progress.t, cellSize, 0);
        const sampleB = this.#sampleSuperIntertwinedWave(x0, y0, x1, y1, progress.t, cellSize, Math.PI);

        strandA.lineStyle(lineWidth, MEGA_STAR_YELLOW, 0.5);
        strandA.beginPath();
        strandA.moveTo(lastA.x, lastA.y);
        strandA.lineTo(sampleA.x, sampleA.y);
        strandA.strokePath();
        strandA.lineStyle(coreWidth, MEGA_ELECTRIC_CORE, 0.94);
        strandA.beginPath();
        strandA.moveTo(lastA.x, lastA.y);
        strandA.lineTo(sampleA.x, sampleA.y);
        strandA.strokePath();

        strandB.lineStyle(lineWidth, MEGA_STAR_YELLOW, 0.46);
        strandB.beginPath();
        strandB.moveTo(lastB.x, lastB.y);
        strandB.lineTo(sampleB.x, sampleB.y);
        strandB.strokePath();
        strandB.lineStyle(coreWidth, MEGA_ELECTRIC_CORE, 0.9);
        strandB.beginPath();
        strandB.moveTo(lastB.x, lastB.y);
        strandB.lineTo(sampleB.x, sampleB.y);
        strandB.strokePath();

        const electricEvery = lowEnd ? 10 : SUPER_WAVE_ELECTRIC_EVERY;

        if (tick > 0 && tick % electricEvery === 0) {
          roots.clear();
          const midX = (sampleA.x + sampleB.x) * 0.5;
          const midY = (sampleA.y + sampleB.y) * 0.5;

          this.#drawSuperRootLightning(roots, midX, midY, sampleA.tangent, cellSize);
          this.#drawSuperRootLightning(roots, midX, midY, sampleB.tangent, cellSize);
        }

        lastA = sampleA;
        lastB = sampleB;
        tick += 1;
      },
    });

    this.tweens.add({
      targets: [strandA, strandB, roots],
      alpha: 0,
      duration: SUPER_WAVE_FADE_MS,
      ease: "Cubic.easeOut",
      onComplete: () => {
        strandA.destroy();
        strandB.destroy();
        roots.destroy();
      },
    });
  }

  #superWaveArmDurationMs(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    cellSize: number,
  ): number {
    const dist = Math.hypot(x1 - x0, y1 - y0);

    return Math.max(ROCKET_FLY_CELL_MS, (dist / cellSize) * ROCKET_FLY_CELL_MS);
  }

  private async playSuperCrossWaveFx(cell: Cell): Promise<void> {
    const {x, y} = this.cellPos(cell);
    const cellSize = Math.min(this.cellW, this.cellH);
    const lowEnd = isLowEndDevice();
    const leftX = this.startX;
    const rightX = this.startX + (this.gridCols - 1) * this.cellW;
    const topY = this.startY;
    const bottomY = this.startY + (this.gridRows - 1) * this.cellH;
    const arms: ReadonlyArray<readonly [number, number, number, number]> = [
      [x, y, leftX, y],
      [x, y, rightX, y],
      [x, y, x, topY],
      [x, y, x, bottomY],
    ];

    if (!isEffectsEnabled()) {
      const waitMs = Math.max(
        ...arms.map(([ax, ay, bx, by]) => this.#superWaveArmDurationMs(ax, ay, bx, by, cellSize)),
      );

      await this.delay(waitMs);

      return;
    }

    this.#maybeShake(95, 0.0035);

    await Promise.all(
      arms.map(([x0, y0, x1, y1]) => this.playSuperWaveArm(x0, y0, x1, y1, cellSize, lowEnd)),
    );
  }

  private async playRocketFly(cell: Cell, type: number): Promise<void> {
    const {x, y} = this.cellPos(cell);
    const isH = type === ROCKET_H;
    const extra = (isH ? this.cellW : this.cellH) * 1.4;
    const cellSize = isH ? this.cellW : this.cellH;
    const endA = isH
      ? {x: this.startX + (this.gridCols - 1) * this.cellW + extra, y}
      : {x, y: this.startY + (this.gridRows - 1) * this.cellH + extra};
    const endB = isH ? {x: this.startX - extra, y} : {x, y: this.startY - extra};

    const spawnCopy = (flipX: boolean, flipY: boolean) => {
      const copy = this.add.image(x, y, assetConf.image.rocket).setOrigin(0.5);
      const base = this.fitScale(copy) * 1.35;

      copy.setAngle(isH ? 90 : 0);
      copy.setScale(flipX ? -base : base, flipY ? -base : base);
      this.mainContainer.add(copy);
      this.mainContainer.bringToTop(copy);

      return copy;
    };

    const fly = (copy: Phaser.GameObjects.Image, dest: {x: number; y: number}) => {
      const dist = isH ? Math.abs(dest.x - x) : Math.abs(dest.y - y);
      const duration = Math.max(ROCKET_FLY_CELL_MS, (dist / cellSize) * ROCKET_FLY_CELL_MS);

      return this.tweenPromise({
        targets: copy,
        x: dest.x,
        y: dest.y,
        duration,
        ease: "Linear",
        onComplete: () => {
          if (copy.active) {
            copy.destroy();
          }
        },
      });
    };

    // endA = destra (H) o basso (V); endB = sinistra (H) o alto (V). A 90° lo specchio sinistra/destra è flipY.
    const a = spawnCopy(false, !isH);
    const b = spawnCopy(false, isH);

    await Promise.all([fly(a, endA), fly(b, endB)]);
  }

  #ultraFxLeftCell(origin: Cell): Cell | null {
    const col = origin.c - 1;

    if (col < 0 || col >= this.gridCols) return null;

    const obs = this.obstacles[origin.r]?.[col];

    if (!obs || obs.blocker === "wall") return null;

    return {r: origin.r, c: col};
  }

  #ultraVortexFxMetrics(origin: Cell, pattern: Cell[]): UltraVortexFxMetrics {
    const hubPos = this.cellPos(origin);
    const cellSize = Math.min(this.cellW, this.cellH);
    const left = this.#ultraFxLeftCell(origin);
    const leftPos = left
      ? this.cellPos(left)
      : {x: hubPos.x - cellSize * 0.92, y: hubPos.y};
    const toLeftX = leftPos.x - hubPos.x;
    const toLeftY = leftPos.y - hubPos.y;
    const startAngle = Math.atan2(toLeftY, toLeftX);
    const rMin = Math.max(Math.hypot(toLeftX, toLeftY), cellSize * 0.38);
    let rMax = cellSize * MEGA_RADIUS;

    for (const cell of pattern) {
      const pos = this.cellPos(cell);

      rMax = Math.max(rMax, Math.hypot(pos.x - hubPos.x, pos.y - hubPos.y));
    }

    rMax = Math.max(rMax, rMin + cellSize * 0.45);

    return {hubPos, leftPos, startAngle, rMin, rMax};
  }

  #sampleUltraVortexFx(metrics: UltraVortexFxMetrics, t: number): {x: number; y: number} {
    const {hubPos, leftPos, startAngle, rMin, rMax} = metrics;

    if (t <= ULTRA_VORTEX_PHASE1_T) {
      const u = t / ULTRA_VORTEX_PHASE1_T;
      const ease = Phaser.Math.Easing.Sine.InOut(u);

      return {
        x: Phaser.Math.Linear(hubPos.x, leftPos.x, ease),
        y: Phaser.Math.Linear(hubPos.y, leftPos.y, ease),
      };
    }

    const u = (t - ULTRA_VORTEX_PHASE1_T) / (1 - ULTRA_VORTEX_PHASE1_T);
    const radiusEase = Phaser.Math.Easing.Quadratic.In(u);
    const theta = startAngle + ULTRA_VORTEX_TURNS * Math.PI * 2 * u;
    const r = Phaser.Math.Linear(rMin, rMax, radiusEase);

    return {
      x: hubPos.x + Math.cos(theta) * r,
      y: hubPos.y + Math.sin(theta) * r,
    };
  }

  private playUltraScytheFx(origin: Cell, pattern: Cell[]): void {
    if (!isEffectsEnabled() || pattern.length === 0) return;

    const cellSize = Math.min(this.cellW, this.cellH);
    const lowEnd = isLowEndDevice();
    const originPos = this.cellPos(origin);

    if (pattern.length === 1) {
      const pulse = this.add.circle(originPos.x, originPos.y, cellSize * 0.16, ULTRA_BLADE_COLOR, 0.65);

      pulse.setBlendMode(Phaser.BlendModes.ADD);
      this.mainContainer.add(pulse);
      this.tweens.add({
        targets: pulse,
        scale: 2.2,
        alpha: 0,
        duration: 320,
        onComplete: () => pulse.destroy(),
      });
      this.#maybeShake(60, 0.0025);

      return;
    }

    const vortex = this.#ultraVortexFxMetrics(origin, pattern);
    const duration = Math.floor(
      Math.max(lowEnd ? 320 : 420, (pattern.length - 1) * SPIRAL_STEP_MS) * ULTRA_VORTEX_FX_SPEED,
    );
    const trail = this.add.graphics();
    const electric = this.add.graphics();
    const scythe = this.add.image(originPos.x, originPos.y, assetConf.image.ultra).setOrigin(0.5, 0.78);
    const baseScale = this.fitScale(scythe) * 1.05;

    scythe.setScale(baseScale).setAlpha(0.94);
    trail.setBlendMode(Phaser.BlendModes.ADD);
    electric.setBlendMode(Phaser.BlendModes.ADD);
    this.mainContainer.add(trail);
    this.mainContainer.add(electric);
    this.mainContainer.add(scythe);
    this.mainContainer.bringToTop(trail);
    this.mainContainer.bringToTop(electric);
    this.mainContainer.bringToTop(scythe);

    let lastX = originPos.x;
    let lastY = originPos.y;
    let shakeTick = 0;
    const progress = {t: 0};
    const lineWidth = Math.max(3, cellSize * (lowEnd ? 0.09 : 0.11));

    this.#maybeShake(65, 0.0028);

    this.tweens.add({
      targets: progress,
      t: 1,
      duration,
      ease: "Linear",
      onUpdate: () => {
        const sample = this.#sampleUltraVortexFx(vortex, progress.t);
        const x = sample.x;
        const y = sample.y;
        const dx = x - lastX;
        const dy = y - lastY;
        const moved = dx * dx + dy * dy > 0.04;

        if (moved) {
          const tangent = Math.atan2(dy, dx);

          scythe.setRotation(tangent + Math.PI * 0.55);

          if (shakeTick % (lowEnd ? 3 : ULTRA_TRAIL_ELECTRIC_EVERY) === 0) {
            const midX = (lastX + x) * 0.5;
            const midY = (lastY + y) * 0.5;

            this.#drawUltraTrailElectric(electric, midX, midY, tangent, cellSize, lowEnd);
          }
        }

        scythe.setPosition(x, y);
        this.mainContainer.bringToTop(scythe);

        trail.lineStyle(lineWidth, ULTRA_BLADE_COLOR, 0.78);
        trail.beginPath();
        trail.moveTo(lastX, lastY);
        trail.lineTo(x, y);
        trail.strokePath();

        lastX = x;
        lastY = y;
        shakeTick += 1;

        if (shakeTick % 7 === 0) this.#maybeShake(42, 0.0022);
      },
      onComplete: () => {
        this.tweens.add({
          targets: [trail, electric, scythe],
          alpha: 0,
          duration: ULTRA_TRAIL_FADE_MS,
          ease: "Cubic.easeOut",
          onComplete: () => {
            trail.destroy();
            electric.destroy();
            scythe.destroy();
          },
        });
      },
    });
  }

  #megaStarTriangleVerts(baseAngle: number, radius: number): Phaser.Math.Vector2[] {
    return [0, 1, 2].map(
      (index) =>
        new Phaser.Math.Vector2(
          Math.cos(baseAngle + index * ((Math.PI * 2) / 3)) * radius,
          Math.sin(baseAngle + index * ((Math.PI * 2) / 3)) * radius,
        ),
    );
  }

  #paintMegaStarOfDavid(
    fill: Phaser.GameObjects.Graphics,
    outline: Phaser.GameObjects.Graphics,
    radius: number,
  ): void {
    const up = this.#megaStarTriangleVerts(-Math.PI / 2, radius);
    const down = this.#megaStarTriangleVerts(Math.PI / 2, radius);
    const stroke = Math.max(2, radius * 0.045);

    fill.fillStyle(MEGA_STAR_YELLOW, 0.42);
    fill.beginPath();
    fill.moveTo(up[0].x, up[0].y);

    for (let i = 1; i < up.length; i++) fill.lineTo(up[i].x, up[i].y);

    fill.closePath();
    fill.fillPath();

    fill.fillStyle(MEGA_STAR_YELLOW, 0.28);
    fill.beginPath();
    fill.moveTo(down[0].x, down[0].y);

    for (let i = 1; i < down.length; i++) fill.lineTo(down[i].x, down[i].y);

    fill.closePath();
    fill.fillPath();

    outline.lineStyle(stroke, MEGA_ELECTRIC_CORE, 0.95);
    outline.beginPath();
    outline.moveTo(up[0].x, up[0].y);

    for (let i = 1; i < up.length; i++) outline.lineTo(up[i].x, up[i].y);

    outline.closePath();
    outline.strokePath();

    outline.beginPath();
    outline.moveTo(down[0].x, down[0].y);

    for (let i = 1; i < down.length; i++) outline.lineTo(down[i].x, down[i].y);

    outline.closePath();
    outline.strokePath();
  }

  #megaStarEdges(radius: number): ReadonlyArray<readonly [Phaser.Math.Vector2, Phaser.Math.Vector2]> {
    const edges: Array<[Phaser.Math.Vector2, Phaser.Math.Vector2]> = [];

    for (const base of [-Math.PI / 2, Math.PI / 2]) {
      const verts = this.#megaStarTriangleVerts(base, radius);

      for (let i = 0; i < verts.length; i++) {
        edges.push([verts[i], verts[(i + 1) % verts.length]]);
      }
    }

    return edges;
  }

  #strokeElectricAlongEdge(
    graphics: Phaser.GameObjects.Graphics,
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cellSize: number,
    segments: number,
  ): void {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);

    if (len < 0.5) return;

    const nx = -dy / len;
    const ny = dx / len;
    const alongJitter = cellSize * 0.1;
    const sideJitter = cellSize * 0.28;
    const alpha = Phaser.Math.FloatBetween(0.72, 0.98);

    graphics.lineStyle(Phaser.Math.Between(2, 4), MEGA_STAR_YELLOW, alpha);
    graphics.beginPath();
    graphics.moveTo(
      ax + Phaser.Math.FloatBetween(-alongJitter, alongJitter),
      ay + Phaser.Math.FloatBetween(-alongJitter, alongJitter),
    );

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const px = Phaser.Math.Linear(ax, bx, t);
      const py = Phaser.Math.Linear(ay, by, t);
      const side = Phaser.Math.FloatBetween(-sideJitter, sideJitter);

      graphics.lineTo(px + nx * side + Phaser.Math.FloatBetween(-alongJitter, alongJitter), py + ny * side);
    }

    graphics.strokePath();

    graphics.lineStyle(1, MEGA_ELECTRIC_CORE, alpha * 0.92);
    graphics.beginPath();
    graphics.moveTo(ax, ay);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const px = Phaser.Math.Linear(ax, bx, t);
      const py = Phaser.Math.Linear(ay, by, t);
      const side = Phaser.Math.FloatBetween(-sideJitter * 0.55, sideJitter * 0.55);

      graphics.lineTo(px + nx * side, py + ny * side);
    }

    graphics.strokePath();

    const sparkT = Phaser.Math.FloatBetween(0.18, 0.82);
    const sx = Phaser.Math.Linear(ax, bx, sparkT);
    const sy = Phaser.Math.Linear(ay, by, sparkT);
    const outward = Phaser.Math.Between(0, 1) === 1 ? 1 : -1;
    const sparkAngle = Math.atan2(ny * outward, nx * outward);

    this.#strokeElectricBolt(
      graphics,
      sx,
      sy,
      sparkAngle,
      cellSize * Phaser.Math.FloatBetween(0.22, 0.38),
      cellSize,
      MEGA_STAR_YELLOW,
      MEGA_ELECTRIC_CORE,
      4,
      0.16,
    );
  }

  #drawMegaStarElectric(
    graphics: Phaser.GameObjects.Graphics,
    radius: number,
    cellSize: number,
    sparksPerEdge: number,
  ): void {
    graphics.clear();

    const edges = this.#megaStarEdges(radius);
    const segments = 7;

    for (const [from, to] of edges) {
      for (let n = 0; n < sparksPerEdge; n++) {
        this.#strokeElectricAlongEdge(graphics, from.x, from.y, to.x, to.y, cellSize, segments);
      }
    }
  }

  private playMegaStarOfDavidFx(cell: Cell): void {
    if (!isEffectsEnabled()) return;

    const {x, y} = this.cellPos(cell);
    const cellSize = Math.min(this.cellW, this.cellH);
    const lowEnd = isLowEndDevice();
    const outerR = cellSize * (MEGA_RADIUS + 0.38);
    const fx = this.add.container(x, y);
    const fill = this.add.graphics();
    const outline = this.add.graphics();
    const electric = this.add.graphics();
    const emblem = this.add.image(0, 0, assetConf.image.mega).setOrigin(0.5);

    fill.setBlendMode(Phaser.BlendModes.ADD);
    outline.setBlendMode(Phaser.BlendModes.ADD);
    electric.setBlendMode(Phaser.BlendModes.ADD);
    emblem.setAlpha(0.92);

    this.#paintMegaStarOfDavid(fill, outline, outerR);

    const emblemScale = this.fitScale(emblem) * 0.72;

    emblem.setScale(emblemScale);
    fx.add([fill, outline, electric, emblem]);
    this.mainContainer.add(fx);
    this.mainContainer.bringToTop(fx);

    fx.setScale(0.12);
    fx.setAlpha(0.98);

    this.tweens.add({
      targets: fx,
      scale: 1,
      alpha: 0,
      duration: MEGA_STAR_FX_MS,
      ease: "Cubic.easeOut",
      onComplete: () => fx.destroy(),
    });

    this.tweens.add({
      targets: emblem,
      scale: emblemScale * 1.35,
      duration: MEGA_STAR_FX_MS * 0.55,
      ease: "Back.easeOut",
    });

    const sparksPerEdge = lowEnd ? 1 : 2;
    const tickRepeats = Math.max(3, Math.floor(MEGA_STAR_FX_MS / MEGA_ELECTRIC_TICK_MS) - 1);

    const tick = this.time.addEvent({
      delay: MEGA_ELECTRIC_TICK_MS,
      repeat: tickRepeats,
      callback: () => {
        this.#drawMegaStarElectric(electric, outerR, cellSize, sparksPerEdge);
      },
    });

    this.#drawMegaStarElectric(electric, outerR, cellSize, sparksPerEdge);

    this.time.delayedCall(MEGA_STAR_FX_MS, () => tick.destroy());
  }

  #maxiPulseDurationMs(): number {
    const rippleReach = Math.max(this.gridRows - 1, this.gridCols - 1);

    return rippleReach * BOMB_RIPPLE_MS + BOMB_SHOCK_MS + DESTROY_MS * 0.35;
  }

  #strokeElectricBolt(
    graphics: Phaser.GameObjects.Graphics,
    x0: number,
    y0: number,
    angle: number,
    reach: number,
    cellSize: number,
    primary: number,
    core: number,
    segments = 5,
    jitterMul = 0.38,
  ): void {
    const jitter = cellSize * jitterMul;
    const width = Phaser.Math.Between(2, 4);
    const alpha = Phaser.Math.FloatBetween(0.42, 0.9);

    graphics.lineStyle(width, primary, alpha);
    graphics.beginPath();
    graphics.moveTo(x0, y0);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const bx = x0 + Math.cos(angle) * reach * t + Phaser.Math.FloatBetween(-jitter, jitter);
      const by = y0 + Math.sin(angle) * reach * t + Phaser.Math.FloatBetween(-jitter, jitter);

      graphics.lineTo(bx, by);
    }

    graphics.strokePath();

    graphics.lineStyle(1, core, alpha * 0.88);
    graphics.beginPath();
    graphics.moveTo(x0, y0);

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const bx =
        x0 + Math.cos(angle) * reach * t + Phaser.Math.FloatBetween(-jitter * 0.42, jitter * 0.42);
      const by =
        y0 + Math.sin(angle) * reach * t + Phaser.Math.FloatBetween(-jitter * 0.42, jitter * 0.42);

      graphics.lineTo(bx, by);
    }

    graphics.strokePath();
  }

  #drawUltraTrailElectric(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    tangent: number,
    cellSize: number,
    lowEnd: boolean,
  ): void {
    const reach = cellSize * (lowEnd ? 0.26 : 0.34);
    const sides = lowEnd ? 1 : 2;

    for (let side = -1; side <= sides; side += 2) {
      const angle = tangent + side * (Math.PI / 2) + Phaser.Math.FloatBetween(-0.35, 0.35);

      this.#strokeElectricBolt(
        graphics,
        x,
        y,
        angle,
        reach,
        cellSize,
        ULTRA_BLADE_COLOR,
        ULTRA_ELECTRIC_CORE,
        4,
        0.2,
      );
    }

    if (!lowEnd && Phaser.Math.Between(0, 1) === 1) {
      this.#strokeElectricBolt(
        graphics,
        x,
        y,
        tangent + Phaser.Math.FloatBetween(-0.5, 0.5),
        reach * 0.55,
        cellSize,
        ULTRA_BLADE_COLOR,
        ULTRA_ELECTRIC_CORE,
        3,
        0.14,
      );
    }
  }

  #drawMaxiElectricArcs(
    graphics: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    maxReach: number,
    cellSize: number,
    boltCount: number,
  ): void {
    graphics.clear();

    for (let b = 0; b < boltCount; b++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const reach = Phaser.Math.FloatBetween(maxReach * 0.42, maxReach);

      this.#strokeElectricBolt(
        graphics,
        cx,
        cy,
        angle,
        reach,
        cellSize,
        MAXI_SHOCK_BLUE,
        MAXI_ELECTRIC_CORE,
      );
    }
  }

  private playMaxiElectricPulse(cell: Cell, spread: number): void {
    this.playBombShockwave(cell, spread);

    if (!isEffectsEnabled()) return;

    const {x, y} = this.cellPos(cell);
    const cellSize = Math.min(this.cellW, this.cellH);
    const lowEnd = isLowEndDevice();
    const pulseMs = this.#maxiPulseDurationMs();
    const maxReach = cellSize * 2.65 * spread;
    const ringCount = lowEnd ? 2 : 4;

    for (let i = 0; i < ringCount; i++) {
      const baseRadius = cellSize * 0.22;
      const ring = this.add.circle(x, y, baseRadius, MAXI_SHOCK_BLUE, 0);

      ring.setStrokeStyle(lowEnd ? 3 : 5, MAXI_SHOCK_BLUE, 0.82);
      ring.setBlendMode(Phaser.BlendModes.ADD);
      this.mainContainer.add(ring);
      this.mainContainer.bringToTop(ring);

      this.tweens.add({
        targets: ring,
        scale: maxReach / baseRadius,
        alpha: {from: 0.88, to: 0},
        delay: i * 95,
        duration: BOMB_SHOCK_MS + 220,
        ease: "Cubic.easeOut",
        onComplete: () => ring.destroy(),
      });
    }

    const core = this.add.circle(x, y, cellSize * 0.14, MAXI_ELECTRIC_CORE, 0.55);

    core.setBlendMode(Phaser.BlendModes.ADD);
    this.mainContainer.add(core);
    this.mainContainer.bringToTop(core);

    this.tweens.add({
      targets: core,
      scale: {from: 1, to: 2.4},
      alpha: {from: 0.7, to: 0},
      duration: 280,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const arcs = this.add.graphics();

    arcs.setBlendMode(Phaser.BlendModes.ADD);
    this.mainContainer.add(arcs);
    this.mainContainer.bringToTop(arcs);

    const tickRepeats = Math.max(4, Math.floor(pulseMs / MAXI_ELECTRIC_TICK_MS) - 1);
    const boltCount = lowEnd ? 2 : 4;

    const tick = this.time.addEvent({
      delay: MAXI_ELECTRIC_TICK_MS,
      repeat: tickRepeats,
      callback: () => {
        this.#drawMaxiElectricArcs(arcs, x, y, maxReach, cellSize, boltCount);
      },
    });

    this.#drawMaxiElectricArcs(arcs, x, y, maxReach, cellSize, boltCount);

    this.time.delayedCall(pulseMs, () => {
      tick.destroy();
      this.tweens.killTweensOf(core);
      core.destroy();
      this.tweens.add({
        targets: arcs,
        alpha: 0,
        duration: 180,
        onComplete: () => arcs.destroy(),
      });
    });
  }

  private playBombShockwave(cell: Cell, spread = 1): void {
    const {x, y} = this.cellPos(cell);
    const radius = Math.min(this.cellW, this.cellH) * 0.38;
    const flash = this.add.circle(x, y, radius, 0xffffff, 0.8);

    flash.setStrokeStyle(8, MAXI_SHOCK_BLUE, 0.95);
    this.mainContainer.add(flash);

    const boom = this.add.image(x, y, assetConf.image.bomb).setOrigin(0.5);
    const boomScale = this.fitScale(boom);

    boom.setScale(boomScale).setAlpha(1);
    this.mainContainer.add(boom);
    this.mainContainer.bringToTop(flash);
    this.mainContainer.bringToTop(boom);

    this.tweens.add({
      targets: flash,
      scale: 3.4 * spread,
      alpha: 0,
      duration: BOMB_SHOCK_MS,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });

    this.tweens.add({
      targets: boom,
      scale: boomScale * 3 * spread,
      alpha: 0,
      duration: BOMB_SHOCK_MS,
      ease: "Cubic.easeOut",
      onComplete: () => boom.destroy(),
    });
  }

  private async collapseAndFill(): Promise<void> {
    this.gameScene.audioManager.playAudio(assetConf.audio.fill);

    const moves: Promise<void>[] = [];

    for (let col = 0; col < this.gridCols; col++) {
      const segments = columnSegments(this.gridRows, (row) => this.columnKind(row, col));

      for (const segment of segments) {
        const keptSprites: Phaser.GameObjects.Image[] = [];
        const keptTypes: number[] = [];

        for (const row of segment.slots) {
          const piece = this.pieces[row][col];

          if (piece?.active && this.board[row][col] !== EMPTY) {
            keptSprites.push(piece);
            keptTypes.push(this.board[row][col]);
          } else if (piece?.active) {
            this.tweens.killTweensOf(piece);
            piece.destroy();
          }

          this.pieces[row][col] = null;
          this.board[row][col] = EMPTY;
        }

        for (let i = 0; i < keptSprites.length; i++) {
          const row = segment.slots[i];
          const pos = this.cellPos({r: row, c: col});

          this.pieces[row][col] = keptSprites[i];
          this.board[row][col] = keptTypes[i];
          this.tweens.killTweensOf(keptSprites[i]);
          this.applyPieceLook(keptSprites[i], keptTypes[i]);
          moves.push(this.moveImage(keptSprites[i], pos.x, pos.y, FALL_MS));
        }

        if (!segment.refill) continue;

        const missing = segment.slots.length - keptSprites.length;

        for (let i = 0; i < missing; i++) {
          const row = segment.slots[keptSprites.length + i];
          const type = Phaser.Math.Between(0, this.#pieceKeys.length - 1);
          const fromY = this.startY - (i + 1) * this.cellH;
          const piece = this.spawnPiece(row, col, type, fromY);
          const pos = this.cellPos({r: row, c: col});

          this.board[row][col] = type;
          this.pieces[row][col] = piece;
          moves.push(this.moveImage(piece, pos.x, pos.y, FALL_MS));
        }
      }
    }

    this.stackSprites();
    await Promise.all(moves);
    this.syncPieceVisuals();
  }

  private columnKind(row: number, col: number): "hole" | "block" | "mobile" {
    const cell = this.obstacles[row]?.[col] ?? null;

    if (!cell) return "hole";
    if (blocksColumn(cell)) return "block";

    return "mobile";
  }

  private growThorn(): void {
    const target = pickThornTarget(this.obstacles, this.board);

    if (!target) return;

    const piece = this.pieces[target.r][target.c];

    if (piece?.active) {
      this.tweens.killTweensOf(piece);
      piece.destroy();
    }

    this.pieces[target.r][target.c] = null;
    this.board[target.r][target.c] = EMPTY;

    const cell = this.obstacles[target.r][target.c];

    if (!cell) return;

    cell.blocker = "thorn";
    this.syncArt();
  }

  //* Toglie l'arte degli ostacoli distrutti e scala J in I, D in C, C in B.
  private peelArt(): FadeArt[] {
    const fading: FadeArt[] = [];

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const cell = this.obstacles[row]?.[col] ?? null;

        this.peelLayer(row, col, coverKey(cell), this.covers, fading);
        this.peelLayer(row, col, terrainKey(cell), this.terrains, fading);
      }
    }

    return fading;
  }

  private peelLayer(
    row: number,
    col: number,
    nextKey: string | null,
    layer: (Phaser.GameObjects.Image | null)[][],
    fading: FadeArt[],
  ): void {
    const current = layer[row]?.[col];

    if (!current?.active) return;
    if (current.texture.key === nextKey) return;

    if (!nextKey) {
      layer[row][col] = null;
      fading.push({cell: {r: row, c: col}, image: current});

      return;
    }

    this.paintObstacle(current, nextKey);
  }

  private syncArt(): void {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const cell = this.obstacles[row]?.[col] ?? null;

        this.syncLayer(row, col, coverKey(cell), this.covers);
        this.syncTerrainLayer(row, col, cell);
        this.syncMagmaVeil(row, col, cell);
      }
    }

    this.stackSprites();
  }

  private syncMagmaVeil(row: number, col: number, cell: ObstacleCell | null): void {
    const show = magmaCooled(cell);
    const layer = this.magmaVeils;
    let veil = layer[row]?.[col] ?? null;

    if (!show) {
      if (veil?.active) veil.destroy();
      if (layer[row]) layer[row][col] = null;

      return;
    }

    const {x, y} = this.cellPos({r: row, c: col});

    if (!veil?.active) {
      veil = this.add
        .rectangle(x, y, this.cellW, this.cellH, MAGMA_COOL_VEIL_COLOR, MAGMA_COOL_VEIL_ALPHA)
        .setOrigin(0.5);
      this.mainContainer.add(veil);
      if (layer[row]) layer[row][col] = veil;
    } else {
      veil
        .setPosition(x, y)
        .setSize(this.cellW, this.cellH)
        .setFillStyle(MAGMA_COOL_VEIL_COLOR, MAGMA_COOL_VEIL_ALPHA)
        .setVisible(true);
    }
  }

  private syncTerrainLayer(row: number, col: number, cell: ObstacleCell | null): void {
    const nextKey = terrainKey(cell);
    const layer = this.terrains;
    const current = layer[row]?.[col];

    if (!nextKey) {
      if (current?.active) current.destroy();
      if (layer[row]) layer[row][col] = null;

      return;
    }

    if (!current?.active) {
      layer[row][col] = this.spawnTerrainArt(row, col, cell);

      return;
    }

    this.paintTerrain(current, cell);
    const pos = this.cellPos({r: row, c: col});

    current.setPosition(pos.x, pos.y);
  }

  private syncLayer(
    row: number,
    col: number,
    nextKey: string | null,
    layer: (Phaser.GameObjects.Image | null)[][],
  ): void {
    const current = layer[row]?.[col];

    if (!nextKey) {
      if (current?.active) current.destroy();
      if (layer[row]) layer[row][col] = null;

      return;
    }

    if (!current?.active) {
      layer[row][col] = this.spawnArt(row, col, nextKey);

      return;
    }

    this.paintObstacle(current, nextKey);
    const pos = this.cellPos({r: row, c: col});

    current.setPosition(pos.x, pos.y);
  }

  private spawnArt(row: number, col: number, key: string): Phaser.GameObjects.Image {
    const {x, y} = this.cellPos({r: row, c: col});
    const image = this.add.image(x, y, key).setOrigin(0.5);

    this.paintObstacle(image, key);
    this.mainContainer.add(image);

    return image;
  }

  private spawnTerrainArt(
    row: number,
    col: number,
    cell: ObstacleCell | null,
  ): Phaser.GameObjects.Image {
    const key = terrainKey(cell) ?? "G";
    const {x, y} = this.cellPos({r: row, c: col});
    const image = this.add.image(x, y, key).setOrigin(0.5);

    this.paintTerrain(image, cell);
    this.mainContainer.add(image);

    return image;
  }

  private paintObstacle(image: Phaser.GameObjects.Image, key: string): void {
    image.setTexture(key).setAngle(0).setVisible(true).clearTint();

    if (FULL_CELL_ART.has(key)) image.setDisplaySize(this.cellW, this.cellH);
    else image.setScale(this.fitScale(image));

    image.setAlpha(key === "I" || key === "J" ? ICE_ALPHA : 1);
  }

  private paintTerrain(image: Phaser.GameObjects.Image, cell: ObstacleCell | null): void {
    const key = terrainKey(cell);

    if (!key) return;

    image.setTexture(key).setAngle(0).setVisible(true).clearTint();
    image.setDisplaySize(this.cellW, this.cellH);
    image.setAlpha(1);
  }

  //* Dal basso: fondo, block, cornice dorata, terreno, velo magma raffreddato, pezzo, copertura.
  private stackSprites(): void {
    if (!this.mainContainer) return;

    if (this.boardPlate?.fill.active) this.mainContainer.sendToBack(this.boardPlate.fill);

    const raise = (rows: (Phaser.GameObjects.Image | null)[][]) => {
      for (const row of rows) {
        for (const image of row) {
          if (image?.active) this.mainContainer.bringToTop(image);
        }
      }
    };

    raise(this.blocks);

    if (this.boardPlate?.rim.active) this.mainContainer.bringToTop(this.boardPlate.rim);

    raise(this.terrains);
    raise(this.magmaVeils);
    raise(this.pieces);
    raise(this.covers);
  }

  private syncPieceVisuals(): void {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        if (!this.isOpen(row, col) || this.board[row][col] === EMPTY) continue;

        const pos = this.cellPos({r: row, c: col});
        let piece = this.pieces[row][col];

        if (!piece || !piece.active) {
          piece = this.spawnPiece(row, col, this.board[row][col], pos.y);
          this.pieces[row][col] = piece;
        }

        this.tweens.killTweensOf(piece);
        this.applyPieceLook(piece, this.board[row][col]);
        piece.setPosition(pos.x, pos.y);
      }
    }

    this.stackSprites();
  }

  private async warnAndShuffle(): Promise<void> {
    const {width, height} = this.scale;
    const fontSize = layoutScaleForViewport(width, height, 38, 50);
    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x000000, 1)
      .setScrollFactor(0)
      .setDepth(SHUFFLE_OVERLAY_DEPTH)
      .setAlpha(0);
    const label = this.add
      .text(width / 2, height / 2, t("noMovesShuffle", getCurrentLanguage()), {
        fontFamily: APP_FONT,
        fontSize: `${fontSize}px`,
        align: "center",
        wordWrap: {width: width * 0.72},
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(SHUFFLE_TEXT_DEPTH)
      .setAlpha(0)
      .setScale(0.92);

    stylePopupTitle(label, fontSize);

    await this.tweenPromise({
      targets: overlay,
      alpha: SHUFFLE_DIM_ALPHA,
      duration: POPUP_OPEN_MS,
      ease: "Sine.easeOut",
    });
    await this.tweenPromise({
      targets: label,
      alpha: 1,
      scale: 1,
      duration: POPUP_OPEN_MS,
      ease: "Back.easeOut",
    });
    await this.delay(900);

    shuffleBoard(
      this.board,
      this.#pieceKeys.length,
      (row, col) => this.allowsSwap(row, col),
      (row, col) => this.canMatch(row, col),
    );
    this.applyBoardTextures();

    await this.tweenPromise({
      targets: label,
      scale: 0.92,
      duration: POPUP_OPEN_MS * 0.8,
      ease: "Sine.easeIn",
    });
    await this.tweenPromise({
      targets: [overlay, label],
      alpha: 0,
      duration: POPUP_OPEN_MS * 0.8,
      ease: "Sine.easeIn",
    });
    overlay.destroy();
    label.destroy();

    if (hasMatches(this.board, (row, col) => this.canMatch(row, col))) {
      await this.resolveBoard([], undefined, false);
    }
  }

  private applyBoardTextures(): void {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridCols; col++) {
        const piece = this.pieces[row][col];

        if (!piece) continue;

        this.applyPieceLook(piece, this.board[row][col]);
      }
    }
  }

  private moveImage(
    image: Phaser.GameObjects.Image,
    x: number,
    y: number,
    duration: number,
  ): Promise<void> {
    if (image.x === x && image.y === y) return Promise.resolve();

    return this.tweenPromise({
      targets: image,
      x,
      y,
      duration,
      ease: "Quad.easeIn",
    });
  }

  private tweenPromise(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      const previousComplete = config.onComplete;

      this.tweens.add({
        ...config,
        onComplete: (tween, targets) => {
          if (typeof previousComplete === "function") previousComplete(tween, targets);
          resolve();
        },
      });
    });
  }

  private clearBoardPlate(): void {
    destroyBoardPlate(this, this.boardPlate);
    this.boardPlate = null;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  //* Scopo: Cella quadrata fissa sulla larghezza. La misura sta in GRID_LIMITS.blockSizeColumns.
  private applyGridMetrics(): void {
    const cell = getCellSize(this.gameWidth);

    this.cellW = cell;
    this.cellH = cell;

    const gridW = this.gridCols * cell;
    const gridH = this.gridRows * cell;

    this.startX = -gridW / 2 + cell / 2;
    this.startY = -gridH / 2 + cell / 2;
    this.gridLeft = -gridW / 2;
    this.gridTop = -gridH / 2;
  }

  //* Scopo: Calcola le dimensioni e la posizione centrale dell’area di gioco
  private computeLayoutDimensions(): void {
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;

    this.marginTop = this.gameScene.setDynamicValueBasedOnScale(150, 400);
  }

  //* Scopo: Bordo sinistro della griglia in coordinate mondo
  public getGridLeft(): number | null {
    if (!this.mainContainer || this.cellW <= 0) return null;

    const gridW = this.gridCols * this.cellW;

    return this.mainContainer.x - (gridW / 2) * this.mainContainer.scaleX;
  }

  //* Scopo: Centra la griglia sotto le missioni. Se non ci sta, si rimpicciolisce.
  public layoutGrid(): void {
    if (!this.mainContainer) return;

    const padY = this.gameHeight * GRID_VERTICAL_PAD;
    const top = this.getPlayAreaTop() + padY;
    const footer = this.#itemsBar?.top ?? this.gameHeight;
    const bottom = Math.max(top + 1, footer - padY);
    const availableH = bottom - top;
    const availableW = this.gameWidth * 0.96;
    const gridH = Math.max(1, this.gridRows * this.cellH);
    const gridW = Math.max(1, this.gridCols * this.cellW);
    const fit = Math.min(1, availableH / gridH, availableW / gridW);

    this.mainContainer.setScale(fit);
    this.mainContainer.setPosition(this.gameWidth / 2, (top + bottom) / 2);
  }

  private getPlayAreaTop(): number {
    const ui = this.gameScene.uiManager;

    if (!ui?.scoreContainer) return 0;

    return ui.getHeaderBottom();
  }

  //* Scopo: Controlla se non ci sono piu file disponibile e attiva il gameOver
  checkGameOver() {
    if (this.isGameOver) {
      console.log(`GAME OVER:`);

      this.canShoot = false;

      this.scene.pause();
      this.gameScene.gameOver(false);
    }
  }
}
