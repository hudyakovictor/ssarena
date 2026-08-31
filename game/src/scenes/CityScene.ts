/**
 * CITY — главное меню как город (Signal City).
 * Полностью процедурная панорама: 4 слоя параллакса, дождь/пепел,
 * окна-огни, дым, медальоны-адреса. Каждый «адрес» = экран.
 * Здания никогда не меняют места — меняется только среда (mood).
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, DistrictKey, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon, IconName } from '../core/textures';
import { getState } from '../core/store';
import { HEADLINES } from '../content/lore';
import { Panel, text, kicker, medallion, toast } from '../ui/kit';

interface Address {
  key: DistrictKey; scene: string; icon: IconName;
  x: number; wRel: number; hRel: number; shape: 'dome' | 'tower' | 'arcade' | 'stadium' | 'block' | 'kiosk';
}

const ADDRESSES: Address[] = [
  { key: 'ratusha', scene: 'ratusha', icon: 'ratusha', x: 0.10, wRel: 0.115, hRel: 0.30, shape: 'tower' },
  { key: 'treasury', scene: 'treasury', icon: 'treasury', x: 0.235, wRel: 0.115, hRel: 0.26, shape: 'dome' },
  { key: 'academy', scene: 'academy', icon: 'academy', x: 0.385, wRel: 0.145, hRel: 0.40, shape: 'block' },
  { key: 'bazaar', scene: 'bazaar', icon: 'bazaar', x: 0.545, wRel: 0.125, hRel: 0.25, shape: 'arcade' },
  { key: 'bestiary', scene: 'bestiary', icon: 'bestiary', x: 0.685, wRel: 0.11, hRel: 0.28, shape: 'dome' },
  { key: 'arena', scene: 'arena', icon: 'arena', x: 0.845, wRel: 0.16, hRel: 0.32, shape: 'stadium' },
  { key: 'kiosk', scene: 'kiosk', icon: 'kiosk', x: 0.955, wRel: 0.06, hRel: 0.11, shape: 'kiosk' },
];

export class CityScene extends Phaser.Scene {
  private hoverCard?: Phaser.GameObjects.Container;
  constructor() { super('city'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const mood = getState().mood;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.reveal);

    this.drawSky(w, h, mood);
    this.drawFarSkyline(w, h);
    this.drawMidSkyline(w, h);
    const ground = h * 0.80;
    this.drawSquare(w, h, ground);
    ADDRESSES.forEach((a) => this.drawBuilding(a, w, h, ground));
    this.drawWeather(w, h, mood);
    this.drawTitle(w, h);
    ADDRESSES.forEach((a, i) => this.drawMedallion(a, w, h, ground, i));
  }

  // ── небо: градиент синего часа + луна-«индикатор настроения» ──
  private drawSky(w: number, h: number, mood: string) {
    const top = mood === 'panic' ? 0x1a0a12 : mood === 'euphoria' ? 0x0d1a1e : 0x0a0e1a;
    const bot = mood === 'panic' ? 0x3a1220 : mood === 'euphoria' ? 0x123028 : 0x1b2438;
    const g = this.add.graphics();
    const steps = 48;
    for (let i = 0; i < steps; i++) {
      g.fillStyle(mix(top, bot, i / steps), 1);
      g.fillRect(0, (h * 0.86 * i) / steps, w, h * 0.86 / steps + 1);
    }
    // луна
    const mg = this.add.graphics();
    mg.fillStyle(PALETTE.paper, 0.10); mg.fillCircle(w * 0.78, h * 0.16, 78);
    mg.fillStyle(PALETTE.paper, 0.16); mg.fillCircle(w * 0.78, h * 0.16, 46);
    mg.fillStyle(PALETTE.paperDim, 0.9); mg.fillCircle(w * 0.78, h * 0.16, 34);
    mg.fillStyle(top, 0.85); mg.fillCircle(w * 0.765, h * 0.15, 30);
    // звёзды
    const sg = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w, y = Math.random() * h * 0.5;
      sg.fillStyle(PALETTE.paper, 0.1 + Math.random() * 0.35);
      sg.fillRect(x, y, 1, 1);
    }
  }

  // ── дальние силуэты в дымке ──
  private drawFarSkyline(w: number, h: number) {
    const g = this.add.graphics().setAlpha(0.55);
    let x = -40;
    while (x < w + 40) {
      const bw = 30 + Math.random() * 70;
      const bh = h * (0.10 + Math.random() * 0.26);
      g.fillStyle(mix(PALETTE.abyss, 0x1b2438, 0.55), 1);
      g.fillRect(x, h * 0.72 - bh, bw, bh);
      if (Math.random() < 0.3) g.fillRect(x + bw / 2 - 2, h * 0.72 - bh - 18, 4, 18);
      x += bw + 6 + Math.random() * 14;
    }
    // дымка
    const hz = this.add.graphics();
    for (let i = 0; i < 26; i++) {
      hz.fillStyle(0x2a3550, 0.03);
      hz.fillRect(0, h * 0.58 + i * 4, w, 6);
    }
  }

  private drawMidSkyline(w: number, h: number) {
    const g = this.add.graphics().setAlpha(0.85);
    let x = -30;
    while (x < w + 30) {
      const bw = 40 + Math.random() * 60;
      const bh = h * (0.12 + Math.random() * 0.2);
      const top = h * 0.79 - bh;
      g.fillStyle(mix(PALETTE.abyss, PALETTE.slab, 0.6), 1);
      g.fillRect(x, top, bw, bh);
      g.lineStyle(1, PALETTE.edge, 0.5);
      g.strokeRect(x, top, bw, bh);
      // окна
      for (let wy = top + 8; wy < top + bh - 6; wy += 12) {
        for (let wx = x + 6; wx < x + bw - 6; wx += 10) {
          if (Math.random() < 0.34) {
            g.fillStyle(Math.random() < 0.14 ? PALETTE.signal : PALETTE.gold, 0.18 + Math.random() * 0.5);
            g.fillRect(wx, wy, 4, 5);
          }
        }
      }
      x += bw + 4;
    }
  }

  // ── площадь с перспективной мостовой ──
  private drawSquare(w: number, h: number, ground: number) {
    const g = this.add.graphics();
    g.fillStyle(0x0d1017, 1);
    g.fillRect(0, ground, w, h - ground);
    // мокрый асфальт: линии перспективы
    g.lineStyle(1, PALETTE.edge, 0.28);
    for (let i = -12; i <= 12; i++) {
      g.beginPath();
      g.moveTo(w / 2 + i * (w / 22), ground);
      g.lineTo(w / 2 + i * (w / 7), h + 40);
      g.strokePath();
    }
    for (let i = 1; i < 7; i++) {
      const y = ground + Math.pow(i / 7, 1.7) * (h - ground);
      g.lineStyle(1, PALETTE.edge, 0.16);
      g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.strokePath();
    }
    // отражение огней
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * w;
      const y = ground + Math.random() * (h - ground);
      g.fillStyle(Math.random() < 0.3 ? PALETTE.signal : PALETTE.gold, 0.05 + Math.random() * 0.1);
      g.fillRect(x, y, 1 + Math.random() * 2, 10 + Math.random() * 30);
    }
    // бордюр площади
    g.lineStyle(2, PALETTE.edgeHi, 0.6);
    g.beginPath(); g.moveTo(0, ground); g.lineTo(w, ground); g.strokePath();
  }

  // ── здание-адрес ──
  private drawBuilding(a: Address, w: number, h: number, ground: number) {
    const d = DISTRICT[a.key];
    const bw = w * a.wRel, bh = h * a.hRel;
    const cx = w * a.x, top = ground - bh;
    const g = this.add.graphics();
    const body = mix(PALETTE.slab, d.color, 0.06);

    g.fillStyle(body, 1);
    g.fillRect(cx - bw / 2, top, bw, bh);
    g.lineStyle(1.5, mix(d.color, PALETTE.edge, 0.35), 0.9);
    g.strokeRect(cx - bw / 2, top, bw, bh);

    // силуэтные надстройки по архетипу
    if (a.shape === 'dome') {
      g.fillStyle(mix(body, d.color, 0.2), 1);
      g.slice(cx, top, bw * 0.34, Math.PI, 0, false);
      g.fillPath();
      g.lineStyle(1.5, d.color, 0.8); g.beginPath();
      g.arc(cx, top, bw * 0.34, Math.PI, 0, false); g.strokePath();
      g.fillStyle(d.color, 1); g.fillRect(cx - 1.5, top - bw * 0.34 - 14, 3, 14);
    } else if (a.shape === 'tower') {
      g.fillStyle(body, 1); g.fillRect(cx - bw * 0.16, top - bh * 0.34, bw * 0.32, bh * 0.34);
      g.lineStyle(1.5, mix(d.color, PALETTE.edge, 0.4), 0.9);
      g.strokeRect(cx - bw * 0.16, top - bh * 0.34, bw * 0.32, bh * 0.34);
      g.fillStyle(PALETTE.paperDim, 0.9); g.fillCircle(cx, top - bh * 0.2, bw * 0.09);
      g.lineStyle(1.5, PALETTE.ink, 1);
      g.beginPath(); g.moveTo(cx, top - bh * 0.2); g.lineTo(cx, top - bh * 0.2 - bw * 0.06);
      g.moveTo(cx, top - bh * 0.2); g.lineTo(cx + bw * 0.05, top - bh * 0.2); g.strokePath();
      g.fillStyle(d.color, 1); g.fillTriangle(cx - bw * 0.16, top - bh * 0.34, cx + bw * 0.16, top - bh * 0.34, cx, top - bh * 0.46);
    } else if (a.shape === 'stadium') {
      g.lineStyle(2, d.color, 0.85);
      g.beginPath(); g.arc(cx, top + 6, bw * 0.48, Math.PI, 0, false); g.strokePath();
      g.fillStyle(d.color, 0.10);
      g.slice(cx, top + 6, bw * 0.48, Math.PI, 0, false); g.fillPath();
      // голограмма мечей
      const holo = this.add.image(cx, top - bh * 0.18, makeIcon(this, 'arena', bw * 0.34, hex(d.color)))
        .setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: holo, alpha: 0.85, y: holo.y - 6, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (a.shape === 'arcade') {
      for (let i = 0; i < 5; i++) {
        const ax = cx - bw / 2 + (bw / 5) * i + bw / 10;
        g.fillStyle(mix(PALETTE.amber, PALETTE.void, 0.35), 0.85);
        g.slice(ax, top + bh * 0.55, bw * 0.09, Math.PI, 0, false); g.fillPath();
      }
      g.fillStyle(d.color, 0.5);
      g.fillRect(cx - bw / 2, top, bw, 6);
    } else if (a.shape === 'kiosk') {
      g.fillStyle(d.color, 0.35); g.fillRect(cx - bw / 2 - 4, top - 6, bw + 8, 8);
    } else {
      // block: часовая башня-фронтон
      g.fillStyle(body, 1);
      g.fillTriangle(cx - bw * 0.5, top, cx + bw * 0.5, top, cx, top - bh * 0.14);
      g.lineStyle(1.5, d.color, 0.7);
      g.beginPath(); g.moveTo(cx - bw * 0.5, top); g.lineTo(cx, top - bh * 0.14); g.lineTo(cx + bw * 0.5, top); g.strokePath();
    }

    // окна
    for (let y = top + 14; y < ground - 12; y += 16) {
      for (let x = cx - bw / 2 + 8; x < cx + bw / 2 - 8; x += 14) {
        if (Math.random() < 0.55) {
          const lit = Math.random();
          g.fillStyle(lit < 0.15 ? d.color : PALETTE.gold, 0.2 + Math.random() * 0.6);
          g.fillRect(x, y, 6, 8);
        }
      }
    }

    // вывеска у крыши
    const sign = this.add.container(cx, top - 4);
    const st = this.add.text(0, 0, DISTRICT[a.key].title, {
      fontFamily: FONT.display, fontSize: `${Math.max(11, bw * 0.11)}px`, fontStyle: '700', color: hex(d.color),
    }).setOrigin(0.5, 1).setLetterSpacing(2);
    const glow = this.add.text(0, 0, DISTRICT[a.key].title, {
      fontFamily: FONT.display, fontSize: `${Math.max(11, bw * 0.11)}px`, fontStyle: '700', color: hex(d.color),
    }).setOrigin(0.5, 1).setLetterSpacing(2).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setScale(1.04);
    sign.add([glow, st]);
    this.tweens.add({ targets: glow, alpha: 0.15, duration: 1600 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // архитектурная подсветка снизу
    const up = this.add.graphics();
    up.fillStyle(d.color, 0.07);
    up.fillTriangle(cx - bw * 0.7, ground, cx + bw * 0.7, ground, cx, top);
  }

  // ── погода/атмосфера по настроению рынка ──
  private drawWeather(w: number, h: number, mood: string) {
    const count = mood === 'panic' ? 260 : 90;
    const p = this.add.particles(0, 0, 'tx-dust', {
      x: { min: 0, max: w }, y: { min: -20, max: h * 0.5 },
      lifespan: mood === 'panic' ? 1400 : 6000,
      speedY: mood === 'panic' ? { min: 420, max: 620 } : { min: 12, max: 40 },
      speedX: mood === 'panic' ? { min: -60, max: -20 } : { min: -14, max: 14 },
      scale: mood === 'panic' ? { min: 0.25, max: 0.7 } : { min: 0.2, max: 0.5 },
      alpha: { start: mood === 'panic' ? 0.35 : 0.22, end: 0 },
      quantity: 2, frequency: mood === 'panic' ? 12 : 60,
      tint: mood === 'panic' ? PALETTE.short : PALETTE.paperDim,
      blendMode: 'ADD',
    });
    p.setDepth(45);
    void count;
  }

  private drawTitle(w: number, h: number) {
    const hl = HEADLINES.home;
    const c = this.add.container(28, 96);
    const rule = this.add.graphics();
    rule.fillStyle(PALETTE.short, 1); rule.fillRect(0, 0, 44, 3);
    const k = kicker(this, 0, 12, hl.kicker, PALETTE.short);
    const t = text(this, -2, 26, hl.title, 'hero', PALETTE.paper).setLetterSpacing(2);
    const l = text(this, 0, 92, hl.lead, 'body', PALETTE.inkSoft);
    c.add([rule, k, t, l]);
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, x: 36, duration: MOTION.reveal, ease: MOTION.ease });
  }

  // ── медальон-кнопка на площади ──
  private drawMedallion(a: Address, w: number, h: number, ground: number, i: number) {
    const d = DISTRICT[a.key];
    const arc = (i / (ADDRESSES.length - 1)) * Math.PI;
    const cx = w * (0.09 + (a.x - 0.09) * 0.98);
    const cy = ground + 52 + Math.sin(arc) * (h - ground) * 0.34;
    const r = 30;
    const m = medallion(this, cx, cy, a.icon, d.color, r);
    m.setDepth(60).setScale(0);
    this.tweens.add({ targets: m, scale: 1, duration: MOTION.slow, delay: 240 + i * 70, ease: MOTION.back });

    const cap = this.add.text(cx, cy + r + 14, d.title, {
      fontFamily: FONT.display, fontSize: '12px', fontStyle: '600', color: hex(PALETTE.paperDim),
    }).setOrigin(0.5).setLetterSpacing(2).setDepth(60).setAlpha(0);
    this.tweens.add({ targets: cap, alpha: 1, duration: MOTION.base, delay: 400 + i * 70 });

    const hit = this.add.circle(cx, cy, r + 8, 0xffffff, 0).setInteractive({ useHandCursor: true }).setDepth(61);
    const ring = this.add.graphics().setDepth(59);

    hit.on('pointerover', () => {
      this.game.events.emit('sfx', 'hover');
      this.tweens.add({ targets: m, scale: 1.12, duration: MOTION.fast, ease: MOTION.ease });
      cap.setColor(hex(d.color));
      ring.clear(); ring.lineStyle(1, d.color, 0.5); ring.strokeCircle(cx, cy, r + 12);
      this.showCard(a, cx, cy - r - 20);
    });
    hit.on('pointerout', () => {
      this.tweens.add({ targets: m, scale: 1, duration: MOTION.fast });
      cap.setColor(hex(PALETTE.paperDim));
      ring.clear();
      this.hoverCard?.destroy(); this.hoverCard = undefined;
    });
    hit.on('pointerdown', () => {
      this.game.events.emit('sfx', 'enter');
      this.hoverCard?.destroy();
      this.cameras.main.fadeOut(MOTION.base);
      this.time.delayedCall(MOTION.base, () => {
        if (this.scene.get(a.scene)) this.scene.start(a.scene);
        else { this.cameras.main.fadeIn(MOTION.base); toast(this, 'Локация на реконструкции. Департамент извиняется.', d.color); }
      });
    });
  }

  private showCard(a: Address, x: number, y: number) {
    const d = DISTRICT[a.key];
    this.hoverCard?.destroy();
    const c = this.add.container(x, y).setDepth(80);
    const w = 200, h = 60;
    const p = new Panel(this, -w / 2, -h, w, h, { accent: d.color, fill: PALETTE.abyss, cut: 10, grain: false });
    c.add(p);
    c.add(text(this, -w / 2 + 12, -h + 10, d.title, 'h3', d.color).setLetterSpacing(1));
    c.add(text(this, -w / 2 + 12, -h + 32, d.sub, 'small', PALETTE.inkSoft));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, y: y - 6, duration: MOTION.fast });
    this.hoverCard = c;
  }
}
