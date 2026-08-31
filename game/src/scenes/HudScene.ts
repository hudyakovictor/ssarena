/**
 * HUD — постоянный слой: шапка игрока, валюта, серия, бегущая строка,
 * а также глобальные пост-эффекты (зерно, виньетка) поверх всех сцен.
 */
import Phaser from 'phaser';
import { PALETTE, FONT, MOTION, hex } from '../core/theme';
import { makeIcon } from '../core/textures';
import { store, getState, rankOf, accuracy } from '../core/store';
import { TICKER } from '../content/lore';
import { Meter, kicker } from '../ui/kit';

export class HudScene extends Phaser.Scene {
  private xpMeter!: Meter;
  private sigText!: Phaser.GameObjects.Text;
  private rankText!: Phaser.GameObjects.Text;
  private streakText!: Phaser.GameObjects.Text;
  private accText!: Phaser.GameObjects.Text;
  private tickerText!: Phaser.GameObjects.Text;
  private hearts: Phaser.GameObjects.Graphics[] = [];
  private tickerIdx = 0;

  constructor() { super({ key: 'hud', active: false }); }

  create() {
    const w = this.scale.width;
    const barH = 54;

    // ── фон шапки ──
    const g = this.add.graphics();
    g.fillStyle(PALETTE.abyss, 0.96);
    g.fillRect(0, 0, w, barH);
    g.lineStyle(1, PALETTE.edge, 1);
    g.beginPath(); g.moveTo(0, barH); g.lineTo(w, barH); g.strokePath();
    g.fillStyle(PALETTE.short, 1); g.fillRect(0, 0, w, 2);

    // ── лого ──
    const logo = this.add.container(18, barH / 2);
    const lg = this.add.graphics();
    lg.fillStyle(PALETTE.short, 1);
    lg.fillPoints([
      new Phaser.Geom.Point(0, -13), new Phaser.Geom.Point(22, -13),
      new Phaser.Geom.Point(26, -9), new Phaser.Geom.Point(26, 13),
      new Phaser.Geom.Point(4, 13), new Phaser.Geom.Point(0, 9),
    ], true);
    const ls = this.add.text(13, 0, 'S', {
      fontFamily: FONT.display, fontSize: '20px', fontStyle: '700', color: hex(PALETTE.void),
    }).setOrigin(0.5);
    logo.add([lg, ls]);
    this.add.text(52, barH / 2 - 9, 'SIGNAL', { fontFamily: FONT.display, fontSize: '13px', fontStyle: '700', color: hex(PALETTE.paper) }).setLetterSpacing(3);
    this.add.text(52, barH / 2 + 4, 'ARENA', { fontFamily: FONT.display, fontSize: '11px', fontStyle: '600', color: hex(PALETTE.short) }).setLetterSpacing(4);

    // ── ранг + XP ──
    const rx = 150;
    this.rankText = this.add.text(rx, barH / 2 - 12, '', { fontFamily: FONT.body, fontSize: '12px', fontStyle: '600', color: hex(PALETTE.paper) });
    this.xpMeter = new Meter(this, rx, barH / 2 + 4, 170, 6, PALETTE.signal, 0);
    kicker(this, rx + 178, barH / 2 - 3, 'XP', PALETTE.inkDim);

    // ── валюта / серия / точность ──
    const stat = (x: number, icon: any, color: number) => {
      this.add.image(x, barH / 2, makeIcon(this, icon, 16, hex(color)));
      return this.add.text(x + 14, barH / 2, '', {
        fontFamily: FONT.mono, fontSize: '13px', fontStyle: '700', color: hex(PALETTE.paper),
      }).setOrigin(0, 0.5);
    };
    this.sigText = stat(w - 330, 'coin', PALETTE.gold);
    this.streakText = stat(w - 240, 'streak', PALETTE.amber);
    this.accText = stat(w - 150, 'target', PALETTE.signal);

    // ── сердца «терпения» ──
    for (let i = 0; i < 5; i++) {
      const hg = this.add.graphics();
      hg.setPosition(w - 96 + i * 15, barH / 2);
      this.hearts.push(hg);
    }

    // ── бегущая строка ──
    const tg = this.add.graphics();
    tg.fillStyle(PALETTE.paper, 1);
    tg.fillRect(0, barH, w, 22);
    this.add.text(10, barH + 11, 'СРОЧНО', {
      fontFamily: FONT.display, fontSize: '11px', fontStyle: '700', color: hex(PALETTE.short),
    }).setOrigin(0, 0.5).setLetterSpacing(2);
    const sep = this.add.graphics();
    sep.fillStyle(PALETTE.ink, 0.25); sep.fillRect(66, barH + 4, 1, 14);
    this.tickerText = this.add.text(78, barH + 11, TICKER[0], {
      fontFamily: FONT.body, fontSize: '12px', color: hex(PALETTE.ink),
    }).setOrigin(0, 0.5);

    this.time.addEvent({
      delay: 7000, loop: true, callback: () => {
        this.tickerIdx = (this.tickerIdx + 1) % TICKER.length;
        this.tweens.add({
          targets: this.tickerText, alpha: 0, x: 68, duration: MOTION.fast,
          onComplete: () => {
            this.tickerText.setText(TICKER[this.tickerIdx]).setX(88);
            this.tweens.add({ targets: this.tickerText, alpha: 1, x: 78, duration: MOTION.base });
          },
        });
      },
    });

    // ── глобальные эффекты кадра ──
    this.add.tileSprite(0, 0, w, this.scale.height, 'tx-grain')
      .setOrigin(0).setAlpha(0.055).setBlendMode(Phaser.BlendModes.OVERLAY).setDepth(500);
    this.add.image(w / 2, this.scale.height / 2, 'tx-vignette')
      .setDisplaySize(w, this.scale.height).setAlpha(0.85).setDepth(499);

    this.refresh();
    store.subscribe(() => this.refresh());
    this.scale.on('resize', () => this.scene.restart());
  }

  private refresh() {
    const s = getState();
    const r = rankOf(s.xp);
    this.rankText.setText(`${r.cur.name}`);
    this.xpMeter.set(r.pct);
    this.sigText.setText(String(s.sig));
    this.streakText.setText(`${s.streak}д`);
    this.accText.setText(`${accuracy()}%`);
    this.hearts.forEach((hg, i) => {
      hg.clear();
      const on = i < s.lives;
      hg.fillStyle(on ? PALETTE.short : PALETTE.edge, on ? 1 : 0.6);
      hg.fillCircle(-3, -2, 3.4); hg.fillCircle(3, -2, 3.4);
      hg.fillTriangle(-6.4, 0, 6.4, 0, 0, 7);
    });
  }
}
