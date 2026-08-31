/**
 * UI-KIT — игровые примитивы поверх Phaser.Graphics/Container.
 * Каждый примитив: чёткая иерархия, состояние hover/press/disabled,
 * гранж-слой и «печатная» типографика. Никаких HTML-виджетов.
 */
import Phaser from 'phaser';
import { PALETTE, TYPE, FONT, MOTION, RADIUS, hex, mix } from '../core/theme';
import { makeIcon, IconName } from '../core/textures';

export type Sc = Phaser.Scene;

/** Панель: скошенный угол, двойная обводка, зерно, царапины. */
export class Panel extends Phaser.GameObjects.Container {
  private g: Phaser.GameObjects.Graphics;
  private noise?: Phaser.GameObjects.TileSprite;
  constructor(
    scene: Sc, x: number, y: number,
    public w: number, public h: number,
    private opts: { accent?: number; fill?: number; alpha?: number; cut?: number; grain?: boolean; glow?: boolean } = {},
  ) {
    super(scene, x, y);
    this.g = scene.add.graphics();
    this.add(this.g);
    if (opts.grain !== false && scene.textures.exists('tx-scratch')) {
      this.noise = scene.add.tileSprite(0, 0, w, h, 'tx-scratch').setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.noise);
    }
    this.redraw();
    scene.add.existing(this);
  }
  redraw(w = this.w, h = this.h) {
    this.w = w; this.h = h;
    const { accent = PALETTE.edge, fill = PALETTE.slab, alpha = 0.94, cut = 14 } = this.opts;
    const g = this.g;
    g.clear();
    const pts = [0, 0, w - cut, 0, w, cut, w, h, cut, h, 0, h - cut];
    g.fillStyle(fill, alpha);
    g.fillPoints(toPts(pts), true);
    g.lineStyle(1, accent, 0.85);
    g.strokePoints(toPts(pts), true);
    // внутренняя световая грань — ощущение толщины материала
    g.lineStyle(1, mix(fill, 0xffffff, 0.1), 0.5);
    g.strokePoints(toPts(pts.map((v, i) => (i % 2 ? v + (i === 1 ? 0 : 0) : v))), true);
    // угловые засечки — «крепления» панели
    g.lineStyle(2, accent, 1);
    const t = 10;
    g.beginPath(); g.moveTo(0, t); g.lineTo(0, 0); g.lineTo(t, 0); g.strokePath();
    g.beginPath(); g.moveTo(w, h - t); g.lineTo(w, h); g.lineTo(w - t, h); g.strokePath();
    if (this.noise) this.noise.setSize(w, h).setOrigin(0, 0);
    return this;
  }
}
const toPts = (a: number[]) => {
  const p: Phaser.Geom.Point[] = [];
  for (let i = 0; i < a.length; i += 2) p.push(new Phaser.Geom.Point(a[i], a[i + 1]));
  return p;
};

/** Текст с пресетом из типо-шкалы. */
export function text(
  scene: Sc, x: number, y: number, str: string,
  preset: keyof typeof TYPE = 'body',
  color = PALETTE.paper,
  extra: Partial<Phaser.Types.GameObjects.Text.TextStyle> = {},
) {
  return scene.add.text(x, y, str, { ...TYPE[preset], color: hex(color), ...extra } as any);
}

/** «Кикер» — микро-надпись капсом с разрядкой (газетная рубрика). */
export function kicker(scene: Sc, x: number, y: number, str: string, color = PALETTE.inkSoft) {
  return scene.add.text(x, y, str.toUpperCase(), {
    fontFamily: FONT.mono, fontSize: '10px', color: hex(color),
  }).setLetterSpacing(3);
}

/** Кнопка: 4 состояния, иконка слева, тактильный отклик + звук. */
export interface BtnOpts {
  w?: number; h?: number; icon?: IconName; accent?: number;
  variant?: 'solid' | 'ghost' | 'danger'; disabled?: boolean; sub?: string;
}
export class Button extends Phaser.GameObjects.Container {
  private g!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;
  private ico?: Phaser.GameObjects.Image;
  private hot = false;
  private _disabled: boolean;
  w: number; h: number;
  constructor(scene: Sc, x: number, y: number, private caption: string, private onTap: () => void, private o: BtnOpts = {}) {
    super(scene, x, y);
    this.w = o.w ?? 190; this.h = o.h ?? 46;
    this._disabled = !!o.disabled;
    this.g = scene.add.graphics();
    this.add(this.g);
    const accent = o.accent ?? PALETTE.signal;
    if (o.icon) {
      this.ico = scene.add.image(20, this.h / 2, makeIcon(scene, o.icon, 18, hex(o.variant === 'solid' ? PALETTE.void : accent)));
      this.add(this.ico);
    }
    this.label = scene.add.text(o.icon ? 38 : 18, this.h / 2, caption.toUpperCase(), {
      fontFamily: FONT.display, fontSize: '14px', fontStyle: '600',
      color: hex(o.variant === 'solid' ? PALETTE.void : PALETTE.paper),
    }).setOrigin(0, 0.5).setLetterSpacing(1.5);
    this.add(this.label);
    this.setSize(this.w, this.h);
    this.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.w, this.h), Phaser.Geom.Rectangle.Contains);
    this.on('pointerover', () => { if (!this._disabled) { this.hot = true; this.draw(); scene.game.events.emit('sfx', 'hover'); } });
    this.on('pointerout', () => { this.hot = false; this.draw(); });
    this.on('pointerdown', () => {
      if (this._disabled) return;
      scene.tweens.add({ targets: this, scaleX: 0.97, scaleY: 0.94, duration: MOTION.instant, yoyo: true, ease: MOTION.ease });
      scene.game.events.emit('sfx', 'click');
      this.onTap();
    });
    this.draw();
    scene.add.existing(this);
  }
  setDisabled(v: boolean) { this._disabled = v; this.draw(); return this; }
  setCaption(s: string) { this.label.setText(s.toUpperCase()); return this; }
  private draw() {
    const { variant = 'ghost' } = this.o;
    const accent = this.o.accent ?? PALETTE.signal;
    const g = this.g; g.clear();
    const w = this.w, h = this.h, cut = 10;
    const pts = toPts([0, 0, w - cut, 0, w, cut, w, h, cut, h, 0, h - cut]);
    const dim = this._disabled;
    if (variant === 'solid') {
      g.fillStyle(dim ? PALETTE.edge : this.hot ? mix(accent, 0xffffff, 0.22) : accent, dim ? 0.4 : 1);
      g.fillPoints(pts, true);
    } else {
      g.fillStyle(this.hot ? mix(PALETTE.slabHi, accent, 0.16) : PALETTE.slab, dim ? 0.35 : 0.9);
      g.fillPoints(pts, true);
      g.lineStyle(1.5, dim ? PALETTE.edge : this.hot ? accent : mix(accent, PALETTE.edge, 0.5), 1);
      g.strokePoints(pts, true);
    }
    this.label.setAlpha(dim ? 0.45 : 1);
    this.ico?.setAlpha(dim ? 0.45 : 1);
    if (this.hot && !dim) {
      g.lineStyle(1, accent, 0.35);
      g.strokeRoundedRect(-3, -3, w + 6, h + 6, RADIUS.sharp);
    }
  }
}

/** Значок-чип: рубрика, редкость, статус. */
export function chip(scene: Sc, x: number, y: number, label: string, color = PALETTE.signal, filled = false) {
  const c = scene.add.container(x, y);
  const t = scene.add.text(8, 0, label.toUpperCase(), {
    fontFamily: FONT.mono, fontSize: '10px', color: hex(filled ? PALETTE.void : color),
  }).setOrigin(0, 0.5).setLetterSpacing(1.5);
  const w = t.width + 16, h = 18;
  const g = scene.add.graphics();
  g.fillStyle(filled ? color : mix(color, PALETTE.void, 0.82), filled ? 1 : 0.9);
  g.fillRect(0, -h / 2, w, h);
  g.lineStyle(1, color, filled ? 1 : 0.55);
  g.strokeRect(0, -h / 2, w, h);
  c.add([g, t]);
  (c as any).w = w;
  return c;
}

/** Прогресс-бар с «печатной» шкалой и подписью. */
export class Meter extends Phaser.GameObjects.Container {
  private fillG: Phaser.GameObjects.Graphics;
  constructor(scene: Sc, x: number, y: number, private w2: number, private h2: number, private color: number, private value = 0) {
    super(scene, x, y);
    const bg = scene.add.graphics();
    bg.fillStyle(PALETTE.void, 0.8); bg.fillRect(0, 0, w2, h2);
    bg.lineStyle(1, PALETTE.edge, 1); bg.strokeRect(0, 0, w2, h2);
    this.fillG = scene.add.graphics();
    this.add([bg, this.fillG]);
    this.set(value, false);
    scene.add.existing(this);
  }
  set(v: number, animate = true) {
    const target = Phaser.Math.Clamp(v, 0, 1);
    if (!animate) { this.value = target; this.render(); return this; }
    this.scene.tweens.addCounter({
      from: this.value, to: target, duration: MOTION.slow, ease: MOTION.ease,
      onUpdate: (t) => { this.value = t.getValue()!; this.render(); },
    });
    return this;
  }
  private render() {
    const g = this.fillG; g.clear();
    const w = Math.max(0, (this.w2 - 2) * this.value);
    g.fillStyle(this.color, 1);
    g.fillRect(1, 1, w, this.h2 - 2);
    g.fillStyle(0xffffff, 0.18);
    g.fillRect(1, 1, w, Math.max(1, (this.h2 - 2) / 2));
    // насечки шкалы
    g.fillStyle(PALETTE.void, 0.45);
    for (let i = 1; i < 10; i++) g.fillRect(1 + ((this.w2 - 2) * i) / 10, 1, 1, this.h2 - 2);
  }
}

/** Заголовок экрана в стиле газетной полосы. */
export function headline(scene: Sc, x: number, y: number, kick: string, title: string, lead: string, accent: number) {
  const c = scene.add.container(x, y);
  const rule = scene.add.graphics();
  rule.fillStyle(accent, 1); rule.fillRect(0, 0, 46, 3);
  rule.fillStyle(PALETTE.edge, 1); rule.fillRect(50, 1, 200, 1);
  const k = kicker(scene, 0, 12, kick, accent);
  const t = text(scene, -2, 28, title, 'h1', PALETTE.paper).setLetterSpacing(1);
  const l = text(scene, 0, 72, lead, 'small', PALETTE.inkSoft);
  c.add([rule, k, t, l]);
  return c;
}

/** Тост — короткая сатирическая реплика системы. */
export function toast(scene: Sc, msg: string, accent = PALETTE.signal) {
  const cam = scene.cameras.main;
  const c = scene.add.container(cam.width / 2, 76).setDepth(9999).setAlpha(0);
  const t = scene.add.text(0, 0, msg, { fontFamily: FONT.body, fontSize: '13px', color: hex(PALETTE.paper) }).setOrigin(0.5);
  const w = t.width + 44, h = 38;
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.abyss, 0.97); g.fillRect(-w / 2, -h / 2, w, h);
  g.lineStyle(1, accent, 0.9); g.strokeRect(-w / 2, -h / 2, w, h);
  g.fillStyle(accent, 1); g.fillRect(-w / 2, -h / 2, 3, h);
  c.add([g, t]);
  scene.tweens.add({ targets: c, alpha: 1, y: 92, duration: MOTION.base, ease: MOTION.back });
  scene.time.delayedCall(2300, () => {
    scene.tweens.add({ targets: c, alpha: 0, y: 74, duration: MOTION.base, onComplete: () => c.destroy() });
  });
  return c;
}

/** Иконка в круглом медальоне (навигация города). */
export function medallion(scene: Sc, x: number, y: number, icon: IconName, color: number, r = 34) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.void, 0.72); g.fillCircle(0, 0, r);
  g.lineStyle(2, color, 0.95); g.strokeCircle(0, 0, r);
  g.lineStyle(1, color, 0.3); g.strokeCircle(0, 0, r + 6);
  const i = scene.add.image(0, 0, makeIcon(scene, icon, r * 0.9, hex(color)));
  c.add([g, i]);
  return c;
}
