/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import * as Phaser from "phaser";

import {AudioManager} from "../components/audioManager";
import {StarsEffectManager} from "../components/starsEffectManager";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";
import {
  BOMB,
  Cell,
  EMPTY,
  ROCKET_H,
  ROCKET_V,
  expandDestroyed,
  findMatchRuns,
  findHintMove,
  generatePlayableBoard,
  hasMatches,
  hasValidMove,
  isAdjacent,
  isSpecial,
  shuffleBoard,
  specialsFromRuns,
  swapCells,
} from "../shared/match3";

import {Game} from "./game";

const assetConf = CandyCrushAssetConf; //* Generalizzazione
const gameName = "candy-crush";

const GRID_COLS = 5;
const GRID_ROWS = 7;
const GRID_OFFSET = 32;
const GRID_SIDE_MARGIN = 0.08;
const GRID_VERTICAL_PAD = 0.02;
const PIECE_FIT = 0.78;
const SWAP_MS = 280; // swipe / scambio pezzi
const DESTROY_MS = 280; // esplosione match
const FALL_MS = 420; // caduta e refill
const SWIPE_RATIO = 0.22; // soglia drag (non è velocità)
const BOMB_SHOCK_MS = 350;
const BOMB_RIPPLE_MS = 60;
const ROCKET_ZOOM_MS = 200;
const ROCKET_FLY_CELL_MS = 70;
const HINT_IDLE_MS = 10000;
const HINT_PULSE_MS = 420;
const HINT_PULSE_SCALE = 1.12;

type RocketOrigin = {cell: Cell; type: number};

const PIECE_KEYS = [
  assetConf.image.obj_0_0,
  assetConf.image.obj_1_0,
  assetConf.image.obj_2_0,
  assetConf.image.obj_3_0,
] as const;

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
  private blocks: Phaser.GameObjects.Image[][] = [];
  private pieces: (Phaser.GameObjects.Image | null)[][] = [];
  private board: number[][] = [];

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
    this.computeLayoutDimensions();
    this.starsEffect = new StarsEffectManager(this);
    this.createGrid();
    this.bindSwipe();
    this.layoutGrid();

    this.time.delayedCall(50, () => {
      this.canShoot = true;
      this.isGameOver = false;
      this.restartHintTimer();
    });
  }

  //* Scopo: Crea lo sfondo della griglia e i 5x7 block dentro un container scalabile
  private createGrid(): void {
    this.mainContainer = this.add.container(this.gameWidth / 2, this.gameHeight / 2);

    this.gridBackground = this.add.image(0, 0, assetConf.image.backgroundGriglia).setOrigin(0.5);
    this.mainContainer.add(this.gridBackground);
    this.layoutGrid();

    const bgW = this.gridBackground.width;
    const bgH = this.gridBackground.height;

    this.cellW = (bgW - GRID_OFFSET * 2) / GRID_COLS;
    this.cellH = (bgH - GRID_OFFSET * 2) / GRID_ROWS;
    this.startX = -bgW / 2 + GRID_OFFSET + this.cellW / 2;
    this.startY = -bgH / 2 + GRID_OFFSET + this.cellH / 2;
    this.gridLeft = this.startX - this.cellW / 2;
    this.gridTop = this.startY - this.cellH / 2;

    this.board = generatePlayableBoard(GRID_ROWS, GRID_COLS, PIECE_KEYS.length);
    this.blocks = [];
    this.pieces = [];

    for (let row = 0; row < GRID_ROWS; row++) {
      const rowBlocks: Phaser.GameObjects.Image[] = [];
      const rowPieces: (Phaser.GameObjects.Image | null)[] = [];

      for (let col = 0; col < GRID_COLS; col++) {
        const {x, y} = this.cellPos({r: row, c: col});
        const block = this.add
          .image(x, y, assetConf.image.block)
          .setOrigin(0.5)
          .setDisplaySize(this.cellW, this.cellH);

        this.mainContainer.add(block);
        rowBlocks.push(block);
        rowPieces.push(this.spawnPiece(row, col, this.board[row][col], y));
      }

      this.blocks.push(rowBlocks);
      this.pieces.push(rowPieces);
    }
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

    return PIECE_KEYS[type];
  }

  private fitScale(piece: Phaser.GameObjects.Image): number {
    return Math.min(this.cellW / piece.width, this.cellH / piece.height) * PIECE_FIT;
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
      if (!this.canPlay()) return;

      const local = this.toLocal(pointer);
      const cell = this.getCellAt(local.x, local.y);

      if (!cell) return;

      this.swipeStart = {cell, x: local.x, y: local.y};
      this.swipeLocked = false;
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
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
  }

  private showHint(): void {
    if (!this.canPlay()) return;

    const move = findHintMove(this.board);

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

  private getCellAt(localX: number, localY: number): Cell | null {
    const col = Math.floor((localX - this.gridLeft) / this.cellW);
    const row = Math.floor((localY - this.gridTop) / this.cellH);

    if (row < 0 || col < 0 || row >= GRID_ROWS || col >= GRID_COLS) return null;

    return {r: row, c: col};
  }

  private cellPos(cell: Cell): {x: number; y: number} {
    return {
      x: this.startX + cell.c * this.cellW,
      y: this.startY + cell.r * this.cellH,
    };
  }

  private inBounds(cell: Cell): boolean {
    return cell.r >= 0 && cell.c >= 0 && cell.r < GRID_ROWS && cell.c < GRID_COLS;
  }

  private async trySwap(a: Cell, b: Cell): Promise<void> {
    if (!this.inBounds(b) || !isAdjacent(a, b) || this.isBusy || this.isGameOver) return;

    const pieceA = this.pieces[a.r][a.c];
    const pieceB = this.pieces[b.r][b.c];

    if (!pieceA || !pieceB) return;

    this.stopHintTimer();
    this.clearHint();
    this.isBusy = true;
    this.swapSprites(a, b);
    swapCells(this.board, a, b);
    await this.animateSwap(pieceA, pieceB);

    const activated = [a, b].filter((cell) => isSpecial(this.board[cell.r][cell.c]));

    if (!hasMatches(this.board) && activated.length === 0) {
      this.swapSprites(a, b);
      swapCells(this.board, a, b);
      await this.animateSwap(pieceA, pieceB);
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

  //* Scopo: Distrugge i match, crea rocket/bomb, fa cadere i pezzi e ripete finché ci sono cascade
  private async resolveBoard(activated: Cell[] = [], preferred?: Cell): Promise<void> {
    let isFirstWave = true;

    while (!this.isGameOver) {
      const runs = findMatchRuns(this.board);
      const matches = runs.flatMap((run) => run.cells);
      const extra = isFirstWave ? activated : [];

      isFirstWave = false;

      if (matches.length === 0 && extra.length === 0) break;

      const spawns = matches.length ? specialsFromRuns(runs, preferred) : [];
      const spawnKeys = new Set(spawns.map((spawn) => `${spawn.cell.r},${spawn.cell.c}`));
      const uniqueMatches = this.uniqueCells(matches);
      const destroyCells = expandDestroyed(this.board, uniqueMatches, extra).filter(
        (cell) => !spawnKeys.has(`${cell.r},${cell.c}`),
      );

      const bombCenters = destroyCells.filter((cell) => this.board[cell.r][cell.c] === BOMB);
      const rocketCenters = this.rocketOrigins(destroyCells);

      preferred = undefined;

      await this.destroyMatches(destroyCells, bombCenters, rocketCenters);

      for (const spawn of spawns) this.placeSpecial(spawn.cell, spawn.type);

      this.gameScene.uiManager.updateScore(destroyCells.length);
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

    if (
      !this.isGameOver &&
      this.gameScene.uiManager.score < this.gameScene.uiManager.maxScore &&
      !hasValidMove(this.board)
    ) {
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
  ): Promise<void> {
    for (const bomb of bombCenters) {
      this.playBombShockwave(bomb);
    }

    if (bombCenters.length) {
      this.cameras.main.shake(140, 0.005);
      this.gameScene.audioManager.playAudio(assetConf.audio.explosion);
    }

    if (rocketCenters.length) {
      this.time.delayedCall(ROCKET_ZOOM_MS, () => {
        this.gameScene.audioManager.playAudio(assetConf.audio.missile);
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

    await Promise.all([...launches, ...tweens]);
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
      ? {x: this.startX + (GRID_COLS - 1) * this.cellW + extra, y}
      : {x, y: this.startY + (GRID_ROWS - 1) * this.cellH + extra};
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

    for (let col = 0; col < GRID_COLS; col++) {
      const keptSprites: Phaser.GameObjects.Image[] = [];
      const keptTypes: number[] = [];

      for (let row = GRID_ROWS - 1; row >= 0; row--) {
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
        const row = GRID_ROWS - 1 - i;
        const pos = this.cellPos({r: row, c: col});

        this.pieces[row][col] = keptSprites[i];
        this.board[row][col] = keptTypes[i];
        this.tweens.killTweensOf(keptSprites[i]);
        this.applyPieceLook(keptSprites[i], keptTypes[i]);
        this.mainContainer.bringToTop(keptSprites[i]);
        moves.push(this.moveImage(keptSprites[i], pos.x, pos.y, FALL_MS));
      }

      const emptyCount = GRID_ROWS - keptSprites.length;

      for (let i = 0; i < emptyCount; i++) {
        const row = emptyCount - 1 - i;
        const type = Phaser.Math.Between(0, PIECE_KEYS.length - 1);
        const fromY = this.startY - (i + 1) * this.cellH;
        const piece = this.spawnPiece(row, col, type, fromY);
        const pos = this.cellPos({r: row, c: col});

        this.board[row][col] = type;
        this.pieces[row][col] = piece;
        moves.push(this.moveImage(piece, pos.x, pos.y, FALL_MS));
      }
    }

    await Promise.all(moves);
    this.syncPieceVisuals();
  }

  private syncPieceVisuals(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
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
  }

  private async warnAndShuffle(): Promise<void> {
    const overlay = this.add.rectangle(
      0,
      0,
      this.gridBackground.width,
      this.gridBackground.height,
      0x001428,
      0.55,
    );
    const label = this.add
      .text(0, 0, "Nessuna mossa disponibile\nRimescolo la griglia", {
        fontFamily: "Paytone One",
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

    shuffleBoard(this.board, PIECE_KEYS.length);
    this.applyBoardTextures();

    await this.tweenPromise({targets: [overlay, label], alpha: 0, duration: 220});
    overlay.destroy();
    label.destroy();

    if (hasMatches(this.board)) {
      await this.resolveBoard();
    }
  }

  private applyBoardTextures(): void {
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
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

  //* Scopo: Calcola le dimensioni e la posizione centrale dell’area di gioco (background),
  private computeLayoutDimensions(): void {
    const config = this.sys.game.config as {width: number; height: number};

    this.gameWidth = Number(config.width);
    this.gameHeight = Number(config.height);

    this.marginTop = this.gameScene.setDynamicValueBasedOnScale(150, 400);
  }

  //* Scopo: Bordo sinistro della griglia in coordinate mondo
  public getGridLeft(): number | null {
    if (!this.mainContainer || !this.gridBackground) return null;

    return this.mainContainer.x - (this.gridBackground.width / 2) * this.mainContainer.scaleX;
  }

  //* Scopo: Scala la griglia al massimo nello spazio utile (8% lati, sotto lo score)
  public layoutGrid(): void {
    if (!this.mainContainer || !this.gridBackground) return;

    const padY = this.gameHeight * GRID_VERTICAL_PAD;
    const maxW = this.gameWidth * (1 - GRID_SIDE_MARGIN * 2);
    const top = this.getPlayAreaTop() + padY;
    const bottom = this.gameHeight - padY;
    const maxH = Math.max(1, bottom - top);
    const scale = this.gameScene.fitUniformScale(
      this.gridBackground.width,
      this.gridBackground.height,
      maxW,
      maxH,
    );

    this.mainContainer.setScale(scale);
    this.mainContainer.setY((top + bottom) / 2);
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
