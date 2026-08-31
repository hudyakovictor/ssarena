/**
 * CandleChart — собственный график на Phaser.Graphics.
 * Причина отказа от lightweight-charts: график должен быть частью
 * игрового кадра (камера, тряска, партиклы, шейдер-зерно, твины),
 * а не DOM-виджетом поверх канваса.
 *
 * Возможности:
 *  · анимированное «печатание» свечей слева направо;
 *  · туман войны над будущим (reveal) + драматичное раскрытие;
 *  · сетка с ценовыми метками, кросс-хейр, уровни, зоны ликвидности;
 *  · объёмная гистограмма внизу;
 *  · вспышка/тряска на результате.
 */
import Phaser from 'phaser';
import { PALETTE, FONT, MOTION, hex, mix } from '../core/theme';
import type { Candle } from '../core/scenario';

export interface ChartOpts {
  w: number; h: number;
  showVolume?: boolean;
  showGrid?: boolean;
  showAxis?: boolean;
  padRight?: number;
}

export class CandleChart extends Phaser.GameObjects.Container {
  private gGrid: Phaser.GameObjects.Graphics;
  private gCandles: Phaser.GameObjects.Graphics;
  private gVol: Phaser.GameObjects.Graphics;
  private gOverlay: Phaser.GameObjects.Graphics;
  private gFog: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  private series: Candle[] = [];
  private visibleCount = 0;
  private revealFrom = Infinity;
  private lastPriceTag?: Phaser.GameObjects.Container;
  w: number; h: number;
  private volH: number;
  private padR: number;

  constructor(scene: Phaser.Scene, x: number, y: number, private opts: ChartOpts) {
    super(scene, x, y);
    this.w = opts.w; this.h = opts.h;
    this.padR = opts.padRight ?? 56;
    this.volH = opts.showVolume === false ? 0 : Math.round(opts.h * 0.18);
    this.gGrid = scene.add.graphics();
    this.gVol = scene.add.graphics();
    this.gCandles = scene.add.graphics();
    this.gOverlay = scene.add.graphics();
    this.gFog = scene.add.graphics();
    this.add([this.gGrid, this.gVol, this.gCandles, this.gOverlay, this.gFog]);
    scene.add.existing(this);
  }

  /** Загрузить сценарий. revealFrom — индекс, с которого начинается «будущее». */
  setSeries(candles: Candle[], revealFrom = Infinity) {
    this.series = candles;
    this.revealFrom = revealFrom;
    this.visibleCount = candles.length;
    this.render();
    return this;
  }

  /** Анимация «печати» графика — свечи проявляются одна за другой. */
  playIn(duration = 900) {
    const total = Math.min(this.series.length, this.revealFrom);
    this.visibleCount = 0;
    this.scene.tweens.addCounter({
      from: 0, to: total, duration, ease: 'Sine.easeOut',
      onUpdate: (t) => { this.visibleCount = Math.floor(t.getValue()!); this.render(); },
      onComplete: () => { this.visibleCount = this.series.length; this.render(); },
    });
    return this;
  }

  /** Раскрытие будущего: туман уходит, свечи выезжают, камера дрожит. */
  revealFuture(onDone?: () => void) {
    const start = this.revealFrom;
    this.revealFrom = Infinity;
    this.scene.tweens.addCounter({
      from: start, to: this.series.length, duration: 850, ease: 'Cubic.easeInOut',
      onUpdate: (t) => { this.visibleCount = Math.floor(t.getValue()!); this.render(); },
      onComplete: () => { this.visibleCount = this.series.length; this.render(); onDone?.(); },
    });
    return this;
  }

  private bounds() {
    const src = this.series.slice(0, Math.max(2, this.series.length));
    let lo = Infinity, hi = -Infinity, vmax = 0;
    for (const c of src) { lo = Math.min(lo, c.l); hi = Math.max(hi, c.h); vmax = Math.max(vmax, c.v); }
    const pad = (hi - lo) * 0.08;
    return { lo: lo - pad, hi: hi + pad, vmax };
  }

  private render() {
    const { lo, hi, vmax } = this.bounds();
    const plotW = this.w - this.padR;
    const plotH = this.h - this.volH - 18;
    const n = this.series.length;
    const step = plotW / n;
    const bw = Math.max(2, step * 0.62);
    const yOf = (p: number) => plotH - ((p - lo) / (hi - lo)) * plotH;

    // ── сетка ──
    const g = this.gGrid; g.clear();
    this.labels.forEach((l) => l.destroy()); this.labels = [];
    g.fillStyle(PALETTE.abyss, 0.55);
    g.fillRect(0, 0, this.w, this.h);
    if (this.opts.showGrid !== false) {
      g.lineStyle(1, PALETTE.edge, 0.35);
      for (let i = 0; i <= 4; i++) {
        const y = (plotH / 4) * i;
        g.beginPath(); g.moveTo(0, y); g.lineTo(plotW, y); g.strokePath();
        if (this.opts.showAxis !== false) {
          const price = hi - ((hi - lo) / 4) * i;
          const t = this.scene.add.text(plotW + 8, y, price.toFixed(1), {
            fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim),
          }).setOrigin(0, 0.5);
          this.add(t); this.labels.push(t);
        }
      }
      g.lineStyle(1, PALETTE.edge, 0.18);
      for (let i = 0; i <= 6; i++) {
        const x = (plotW / 6) * i;
        g.beginPath(); g.moveTo(x, 0); g.lineTo(x, plotH); g.strokePath();
      }
    }

    // ── объём ──
    const gv = this.gVol; gv.clear();
    if (this.volH > 0) {
      const vy = plotH + 14;
      for (let i = 0; i < Math.min(this.visibleCount, n); i++) {
        const c = this.series[i];
        const up = c.c >= c.o;
        const bh = Math.max(1, (c.v / (vmax || 1)) * (this.volH - 4));
        gv.fillStyle(up ? PALETTE.long : PALETTE.short, 0.28);
        gv.fillRect(i * step + (step - bw) / 2, vy + (this.volH - 4 - bh), bw, bh);
      }
    }

    // ── свечи ──
    const gc = this.gCandles; gc.clear();
    for (let i = 0; i < Math.min(this.visibleCount, n); i++) {
      const c = this.series[i];
      const up = c.c >= c.o;
      const col = up ? PALETTE.long : PALETTE.short;
      const x = i * step + step / 2;
      const isFuture = i >= this.revealFrom;
      const a = isFuture ? 0.25 : 1;
      gc.lineStyle(1, col, 0.85 * a);
      gc.beginPath(); gc.moveTo(x, yOf(c.h)); gc.lineTo(x, yOf(c.l)); gc.strokePath();
      const yTop = yOf(Math.max(c.o, c.c));
      const bodyH = Math.max(1.5, Math.abs(yOf(c.o) - yOf(c.c)));
      gc.fillStyle(up ? mix(col, PALETTE.void, 0.35) : col, a);
      gc.fillRect(x - bw / 2, yTop, bw, bodyH);
      gc.lineStyle(1, col, a);
      gc.strokeRect(x - bw / 2, yTop, bw, bodyH);
    }

    // ── линия последней цены + ярлык ──
    const go = this.gOverlay; go.clear();
    const lastIdx = Math.min(this.visibleCount, Math.min(n, this.revealFrom)) - 1;
    if (lastIdx >= 0) {
      const last = this.series[lastIdx];
      const y = yOf(last.c);
      const up = last.c >= last.o;
      const col = up ? PALETTE.long : PALETTE.short;
      go.lineStyle(1, col, 0.55);
      for (let x = 0; x < plotW; x += 8) { go.beginPath(); go.moveTo(x, y); go.lineTo(x + 4, y); go.strokePath(); }
      this.lastPriceTag?.destroy();
      const tag = this.scene.add.container(plotW + 4, y);
      const tg = this.scene.add.graphics();
      tg.fillStyle(col, 1); tg.fillRect(0, -9, 48, 18);
      const tt = this.scene.add.text(24, 0, last.c.toFixed(1), {
        fontFamily: FONT.mono, fontSize: '10px', fontStyle: '700', color: hex(PALETTE.void),
      }).setOrigin(0.5);
      tag.add([tg, tt]);
      this.add(tag);
      this.lastPriceTag = tag;
    }

    // ── туман войны над будущим ──
    const gf = this.gFog; gf.clear();
    if (this.revealFrom < n) {
      const fx = this.revealFrom * step;
      gf.fillStyle(PALETTE.void, 0.82);
      gf.fillRect(fx, -4, plotW - fx, this.h + 8);
      gf.lineStyle(1, PALETTE.gold, 0.5);
      gf.beginPath(); gf.moveTo(fx, -4); gf.lineTo(fx, this.h + 4); gf.strokePath();
      for (let y = -4; y < this.h; y += 10) {
        gf.lineStyle(1, PALETTE.edge, 0.25);
        gf.beginPath(); gf.moveTo(fx, y); gf.lineTo(plotW, y + 24); gf.strokePath();
      }
    }
  }

  /** Горизонтальный уровень (поддержка/сопротивление) с подписью. */
  drawLevel(price: number, color = PALETTE.gold, label = '') {
    const { lo, hi } = this.bounds();
    const plotW = this.w - this.padR;
    const plotH = this.h - this.volH - 18;
    const y = plotH - ((price - lo) / (hi - lo)) * plotH;
    const g = this.scene.add.graphics();
    g.lineStyle(1.5, color, 0.75);
    for (let x = 0; x < plotW; x += 12) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y); g.strokePath(); }
    this.add(g);
    if (label) {
      const t = this.scene.add.text(6, y - 14, label.toUpperCase(), {
        fontFamily: FONT.mono, fontSize: '9px', color: hex(color),
      }).setLetterSpacing(2);
      this.add(t);
    }
    return g;
  }

  /** Вспышка результата: зелёная/красная заливка + тряска камеры. */
  flash(win: boolean) {
    const g = this.scene.add.graphics();
    g.fillStyle(win ? PALETTE.long : PALETTE.short, 0.3);
    g.fillRect(0, 0, this.w, this.h);
    this.add(g);
    this.scene.tweens.add({ targets: g, alpha: 0, duration: MOTION.reveal, onComplete: () => g.destroy() });
    this.scene.cameras.main.shake(win ? 120 : 260, win ? 0.002 : 0.006);
  }
}
