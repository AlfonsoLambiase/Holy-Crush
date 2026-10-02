/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import * as Phaser from "phaser";

import {getPieceKeysForStageLevel} from "@/settings/level-pieces";
import {getStageIndex, getUnlockedCount} from "@/settings/progress";

import {AudioManager} from "../components/audioManager";
import {ItemsBar} from "../components/items-bar";
import {StarsEffectManager} from "../components/starsEffectManager";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {APP_FONT} from "../shared/config/font.const";
import {getCellSize, getGridForLevel, GRID_PIECE_FIT} from "../shared/config/grid-generation.const";
import {
  BOMB,
  Cell,
  EMPTY,
  ROCKET_H,
  ROCKET_V,
  collectBlasts,
  findMatchRuns,
  findHintMove,
  generatePlayableBoard,
  hasMatches,
  hasValidMove,
  isAdjacent,
  isPiece,
  isSpecial,
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
const BOMB_RIPPLE_MS = 60;
const ROCKET_ZOOM_MS = 200;
const MISSILE_AUDIO_DELAY_MS = 0;
const ROCKET_FLY_CELL_MS = 70;
const HINT_IDLE_MS = 10000;
const HINT_PULSE_MS = 420;
const HINT_PULSE_SCALE = 1.12;

type RocketOrigin = {cell: Cell; type: number};
type FadeArt = {cell: Cell; image: Phaser.GameObjects.Image};

const ICE_ALPHA = 0.72;
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
  private gridBackground!: Phaser.GameObjects.Image;
  private blocks: (Phaser.GameObjects.Image | null)[][] = [];
  private obstacles: (ObstacleCell | null)[][] = [];
  private covers: (Phaser.GameObjects.Image | null)[][] = [];
  private terrains: (Phaser.GameObjects.Image | null)[][] = [];
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

  constructor() {
    super({key: assetConf.scene.gameManager});
  }

  init(data: {gameScene?: Game}) {
    if (data.gameScene) {
      this.gameScene = data.gameScene;
    }
  }

  create() {
    console.log(`Gioco caricato ${gameName}`);
    const selected = Number(this.registry.get("level"));
    const level = Number.isFinite(selected) && selected > 0 ? selected : getUnlockedCount();
    this.#pieceKeys = getPieceKeysForStageLevel(level, getStageIndex());
    const shape = getGridForLevel(level);

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
    );
    this.#itemsBar.create();
    this.layoutGrid();

    this.time.delayedCall(50, () => {
      this.canShoot = true;
      this.isGameOver = false;
      this.restartHintTimer();
    });
  }

  //* Scopo: Crea i block (colonne x righe). Lo sfondo griglia resta, ma spento.
  private createGrid(): void {
    this.mainContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);

    this.gridBackground = this.add
      .image(0, 0, assetConf.image.backgroundGriglia)
      .setOrigin(0.5)
      .setVisible(false);
    this.mainContainer.add(this.gridBackground);
    this.applyGridMetrics();

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

    for (let row = 0; row < this.gridRows; row++) {
      const rowBlocks: (Phaser.GameObjects.Image | null)[] = [];
      const rowPieces: (Phaser.GameObjects.Image | null)[] = [];
      const rowCovers: (Phaser.GameObjects.Image | null)[] = [];
      const rowTerrains: (Phaser.GameObjects.Image | null)[] = [];

      for (let col = 0; col < this.gridCols; col++) {
        rowCovers.push(null);
        rowTerrains.push(null);

        if (!this.isOpen(row, col)) {
          rowBlocks.push(null);
          rowPieces.push(null);
          continue;
        }

        const {x, y} = this.cellPos({r: row, c: col});
        const block = this.add
          .image(x, y, assetConf.image.block)
          .setOrigin(0.5)
          .setDisplaySize(this.cellW, this.cellH);

        this.mainContainer.add(block);
        rowBlocks.push(block);

        const type = this.board[row][col];

        rowPieces.push(type === EMPTY ? null : this.spawnPiece(row, col, type, y));
      }

      this.blocks.push(rowBlocks);
      this.pieces.push(rowPieces);
      this.covers.push(rowCovers);
      this.terrains.push(rowTerrains);
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
    piece.setAngle(type === ROCKET_V ? 90 : 0);
    this.pieceScale = this.fitScale(piece);
    piece.setScale(this.pieceScale).setAlpha(1).setVisible(true);
  }

  private bindSwipe(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.restartHintTimer();
      if (this.#itemsBar?.isOnBar(pointer) || this.#itemsBar?.isBlocking()) return;
      if (!this.canPlay()) return;

      const local = this.toLocal(pointer);
      const cell = this.getCellAt(local.x, local.y);

      if (!cell || !this.canMove(cell)) return;

      this.swipeStart = {cell, x: local.x, y: local.y};
      this.swipeLocked = false;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
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
      void this.trySwap(this.swipeStart.cell, neighbor);
    });

    this.input.on("pointerup", () => {
      this.swipeStart = null;
      this.swipeLocked = false;
    });
  }

  private canPlay(): boolean {
    return !this.isBusy && !this.isGameOver && this.canShoot;
  }

  private restartHintTimer(): void {
    this.stopHintTimer();
    this.clearHint();
    if (!this.canPlay()) return;

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

    this.hintCells = [move.a, move.b];

    for (const cell of this.hintCells) {
      const piece = this.pieces[cell.r][cell.c];

      if (!piece?.active) continue;

      this.tweens.killTweensOf(piece);
      this.mainContainer.bringToTop(piece);

      const scale = this.fitScale(piece);

      this.tweens.add({
        targets: piece,
        scaleX: scale * HINT_PULSE_SCALE,
        scaleY: scale * HINT_PULSE_SCALE,
        duration: HINT_PULSE_MS,
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

  //* Il pezzo si può scambiare: niente muro, roccia, rovo, ghiaccio o catena.
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

    await this.resolveBoard(activated, b);
    this.isBusy = false;
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

      await this.destroyMatches(pop, bombCenters, rocketCenters, this.peelArt());
      this.syncArt();

      for (const spawn of spawns) this.placeSpecial(spawn.cell, spawn.type);

      this.stackSprites();
      this.gameScene.uiManager.updateScore(pop.length);
      this.gameScene.audioManager.playAudio(assetConf.audio.success);

      if (this.gameScene.uiManager.score >= this.gameScene.uiManager.maxScore) {
        this.canShoot = false;
        await this.collapseAndFill();
        await this.delay(400);
        this.gameScene.gameOver();
        break;
      }

      await this.collapseAndFill();
    }

    const stillPlaying =
      !this.isGameOver && this.gameScene.uiManager.score < this.gameScene.uiManager.maxScore;

    if (growThorns && stillPlaying && !thornDamaged) this.growThorn();

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
  ): Promise<void> {
    for (const bomb of bombCenters) {
      this.playBombShockwave(bomb);
    }

    if (bombCenters.length) {
      this.cameras.main.shake(140, 0.005);
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

      return this.playRocketLaunch(rocket.cell, rocket.type, piece);
    });

    const starBase = Math.min(this.cellW, this.cellH) / 184;
    const tweens = matches
      .filter((cell) => !rocketKeys.has(`${cell.r},${cell.c}`))
      .map((cell) => {
        const piece = this.pieces[cell.r][cell.c];

        this.board[cell.r][cell.c] = EMPTY;
        this.pieces[cell.r][cell.c] = null;

        if (!piece || !piece.active) return Promise.resolve();

        const delay = this.destroyDelay(cell, bombCenters, rocketCenters);
        const isCenter = bombCenters.some((bomb) => bomb.r === cell.r && bomb.c === cell.c);
        const starScale = starBase * (isCenter ? 2.2 : 1);

        return new Promise<void>((resolve) => {
          const pop = () => {
            if (!piece.active) {
              resolve();

              return;
            }

            this.starsEffect.playAt(piece.x, piece.y, this.mainContainer, starScale);
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
      const delay = this.destroyDelay(cell, bombCenters, rocketCenters);

      return new Promise<void>((resolve) => {
        const pop = () => {
          if (!image.active) {
            resolve();

            return;
          }

          this.mainContainer.bringToTop(image);
          this.starsEffect.playAt(image.x, image.y, this.mainContainer, starBase);
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
  ): Promise<void> {
    const {x, y} = this.cellPos(cell);
    const starScale = (Math.min(this.cellW, this.cellH) / 184) * 1.4;

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

      this.starsEffect.playAt(piece.x, piece.y, this.mainContainer, starScale);
      piece.destroy();
    } else {
      await this.delay(ROCKET_ZOOM_MS);
      this.starsEffect.playAt(x, y, this.mainContainer, starScale);
    }

    await this.playRocketFly(cell, type);
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

    const spawnCopy = () => {
      const copy = this.add.image(x, y, assetConf.image.rocket).setOrigin(0.5);

      copy.setAngle(isH ? 0 : 90);
      copy.setScale(this.fitScale(copy) * 1.35);
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

    const a = spawnCopy();
    const b = spawnCopy();

    await Promise.all([fly(a, endA), fly(b, endB)]);
  }

  private playBombShockwave(cell: Cell): void {
    const {x, y} = this.cellPos(cell);
    const radius = Math.min(this.cellW, this.cellH) * 0.38;
    const flash = this.add.circle(x, y, radius, 0xffffff, 0.8);

    flash.setStrokeStyle(8, 0x7ad7ff, 0.95);
    this.mainContainer.add(flash);

    const boom = this.add.image(x, y, assetConf.image.bomb).setOrigin(0.5);
    const boomScale = this.fitScale(boom);

    boom.setScale(boomScale).setAlpha(1);
    this.mainContainer.add(boom);
    this.mainContainer.bringToTop(flash);
    this.mainContainer.bringToTop(boom);

    this.tweens.add({
      targets: flash,
      scale: 3.4,
      alpha: 0,
      duration: BOMB_SHOCK_MS,
      ease: "Cubic.easeOut",
      onComplete: () => flash.destroy(),
    });

    this.tweens.add({
      targets: boom,
      scale: boomScale * 3,
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

  //* Toglie l'arte degli ostacoli distrutti e scala J in I, H in G.
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
        this.syncLayer(row, col, terrainKey(cell), this.terrains);
      }
    }

    this.stackSprites();
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

  private paintObstacle(image: Phaser.GameObjects.Image, key: string): void {
    image.setTexture(key).setAngle(0).setVisible(true);

    if (FULL_CELL_ART.has(key)) image.setDisplaySize(this.cellW, this.cellH);
    else image.setScale(this.fitScale(image));

    image.setAlpha(key === "I" || key === "J" ? ICE_ALPHA : 1);
  }

  //* Dal basso: block, terreno, pezzo, copertura.
  private stackSprites(): void {
    if (!this.mainContainer) return;

    const raise = (rows: (Phaser.GameObjects.Image | null)[][]) => {
      for (const row of rows) {
        for (const image of row) {
          if (image?.active) this.mainContainer.bringToTop(image);
        }
      }
    };

    raise(this.blocks);
    raise(this.terrains);
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
    const overlay = this.add.rectangle(
      0,
      0,
      this.gridCols * this.cellW,
      this.gridRows * this.cellH,
      0x001428,
      0.55,
    );
    const label = this.add
      .text(0, 0, "Nessuna mossa disponibile\nRimescolo la griglia", {
        fontFamily: APP_FONT,
        fontSize: "42px",
        color: "#ffffff",
        align: "center",
        stroke: "#003366",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    overlay.setAlpha(0);
    label.setAlpha(0);
    this.mainContainer.add([overlay, label]);

    await this.tweenPromise({targets: [overlay, label], alpha: 1, duration: 220});
    await this.delay(900);

    shuffleBoard(
      this.board,
      this.#pieceKeys.length,
      (row, col) => this.allowsSwap(row, col),
      (row, col) => this.canMatch(row, col),
    );
    this.applyBoardTextures();

    await this.tweenPromise({targets: [overlay, label], alpha: 0, duration: 220});
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

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      this.time.delayedCall(ms, resolve);
    });
  }

  //* Scopo: Cella quadrata fissa sulla larghezza. 1 o 6 colonne usano la stessa misura.
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

  //* Scopo: Centra la griglia nell'area di gioco. La scala della cella non cambia.
  public layoutGrid(): void {
    if (!this.mainContainer) return;

    const padY = this.gameHeight * GRID_VERTICAL_PAD;
    const top = this.getPlayAreaTop() + padY;
    const footer = this.#itemsBar?.top ?? this.gameHeight;
    const bottom = footer - padY;

    this.mainContainer.setScale(1);
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
      this.gameScene.gameOver();
    }
  }
}
