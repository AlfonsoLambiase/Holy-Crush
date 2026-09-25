import * as Phaser from "phaser";

import {isEffectsEnabled} from "@/settings/effects";
import {CandyCrushAssetConf} from "../shared/config/asset-conf.const";

const assetConf = CandyCrushAssetConf; //* Generalizzazione

export class AudioManager {
  private scene: Phaser.Scene;
  audios: {[key: string]: Phaser.Sound.BaseSound} = {};
  private stopTimers = new Map<string, Phaser.Time.TimerEvent>();
  private fades = new Map<string, Phaser.Tweens.Tween>();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  loadAudios(): void {
    for (const key in assetConf.audio) {
      if (!this.scene.cache.audio.exists(key)) continue;

      this.audios[key] = this.scene.sound.add(key);
    }
  }

  playAudio(key: keyof typeof assetConf.audio, durationMs?: number, fadeMs = 0): void {
    if (!isEffectsEnabled() || !this.audios[key]) return;

    const audio = this.audios[key];

    this.stopTimers.get(key)?.remove(false);
    this.stopTimers.delete(key);
    this.fades.get(key)?.stop();
    this.fades.delete(key);
    this.setVolume(audio, 1);

    if ((durationMs || fadeMs) && audio.isPlaying) audio.stop();

    audio.play();

    const totalMs = durationMs ?? (fadeMs > 0 ? this.clipMs(audio) : 0);

    if (!totalMs) return;

    const fade = Math.min(Math.max(fadeMs, 0), totalMs);
    const timer = this.scene.time.delayedCall(totalMs - fade, () => {
      this.stopTimers.delete(key);

      if (!audio.isPlaying) return;

      if (fade <= 0) {
        audio.stop();
        return;
      }

      const level = {volume: 1};
      const tween = this.scene.tweens.add({
        targets: level,
        volume: 0,
        duration: fade,
        onUpdate: () => this.setVolume(audio, level.volume),
        onComplete: () => {
          if (this.fades.get(key) !== tween) return;

          audio.stop();
          this.setVolume(audio, 1);
          this.fades.delete(key);
        },
      });

      this.fades.set(key, tween);
    });

    this.stopTimers.set(key, timer);
  }

  private clipMs(audio: Phaser.Sound.BaseSound): number {
    const seconds = "duration" in audio && typeof audio.duration === "number" ? audio.duration : 0;

    return seconds > 0 ? seconds * 1000 : 0;
  }

  private setVolume(audio: Phaser.Sound.BaseSound, volume: number): void {
    if ("setVolume" in audio && typeof audio.setVolume === "function") {
      audio.setVolume(volume);
    }
  }
}

//* Metodo per richiamarlo
//  this.gameScene.audioManager.playAudio(assetConf.audio.bubblepop);
