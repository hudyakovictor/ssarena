/**
 * КАЗНА — трофеи и достижения. Витрина «доказательств выживания».
 * Заблокированные слоты честно показывают условие получения.
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { HEADLINES } from '../content/lore';
import { getState, accuracy, rankOf } from '../core/store';
import { Panel, text, kicker, chip, Meter } from '../ui/kit';
import { backButton } from '../ui/nav';

interface Trophy { id: string; name: string; icon: string; need: string; done: (s: any) => boolean; rare: number }

const TROPHIES: Trophy[] = [
  { id: 'first', name: 'Первый график', icon: 'chart', need: 'Открыть Арену один раз', done: (s) => s.played > 0, rare: 0x7d8aa3 },
  { id: 'ten', name: 'Десять решений', icon: 'target', need: '10 сыгранных раундов', done: (s) => s.played >= 10, rare: 0x4f8cff },
  { id: 'streak7', name: 'Неделя дисциплины', icon: 'streak', need: 'Серия 7 дней', done: (s) => s.streak >= 7, rare: 0xf5b13d },
  { id: 'acc60', name: 'Читатель рынка', icon: 'eye', need: 'Точность 60%+', done: () => accuracy() >= 60, rare: 0x9b6cff },
  { id: 'rank5', name: 'Анти-FOMO', icon: 'flame', need: 'Ранг 5+', done: (s) => rankOf(s.xp).index >= 5, rare: 0xfb4b6b },
  { id: 'rich', name: 'Ликвидный', icon: 'coin', need: '2000 $SIG на счету', done: (s) => s.sig >= 2000, rare: 0xf5b13d },
  { id: 'dex', name: 'Полный бестиарий', icon: 'skull', need: 'Изучить 12 досье', done: (s) => s.unlocked.length >= 12, rare: 0xfb4b6b },
  { id: 'scholar', name: 'Выпускник', icon: 'academy', need: 'Все дисциплины по 8 уроков', done: (s) => Object.values(s.lessons).every((v: any) => v >= 8), rare: 0x35d68a },
];

export class TreasuryScene extends Phaser.Scene {
  constructor() { super('treasury'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.treasury;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);

    const g = this.add.graphics();
    g.fillStyle(PALETTE.void, 1); g.fillRect(0, 0, w, h);
    // золотой купол-градиент сверху
    for (let i = 0; i < 30; i++) {
      g.fillStyle(mix(PALETTE.void, d.color, 0.06 * (1 - i / 30)), 1);
      g.fillRect(0, i * 6, w, 6);
    }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
    backButton(this);

    const hl = HEADLINES.treasury;
    kicker(this, 96, 84, hl.kicker, d.color);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);
    text(this, 96, 136, hl.lead, 'small', PALETTE.inkSoft);

    const s = getState();
    const got = TROPHIES.filter((t) => t.done(s)).length;
    new Panel(this, w - 240, 84, 212, 62, { accent: d.color, fill: PALETTE.slab });
    kicker(this, w - 224, 96, 'трофеев собрано', PALETTE.inkDim);
    text(this, w - 226, 110, `${got} / ${TROPHIES.length}`, 'h2', PALETTE.paper);
    new Meter(this, w - 226, 132, 180, 5, d.color, got / TROPHIES.length);

    const cols = Math.max(2, Math.min(4, Math.floor((w - 56) / 260)));
    const cw = (w - 56 - (cols - 1) * 18) / cols;
    const chh = 132;

    TROPHIES.forEach((t, i) => {
      const x = 28 + (i % cols) * (cw + 18);
      const y = 196 + Math.floor(i / cols) * (chh + 18);
      const done = t.done(s);
      const accent = done ? t.rare : PALETTE.edge;
      const card = this.add.container(x, y).setAlpha(0);
      const cg = this.add.graphics();
      cg.fillStyle(done ? mix(PALETTE.slab, t.rare, 0.07) : PALETTE.abyss, 0.95);
      cg.fillRect(0, 0, cw, chh);
      cg.lineStyle(1.5, accent, done ? 1 : 0.6);
      cg.strokeRect(0, 0, cw, chh);
      if (done) { cg.fillStyle(t.rare, 1); cg.fillRect(0, 0, cw, 3); }
      card.add(cg);

      // постамент трофея
      const pg = this.add.graphics();
      pg.fillStyle(done ? mix(t.rare, PALETTE.void, 0.72) : PALETTE.slab, 1);
      pg.fillCircle(52, 58, 30);
      pg.lineStyle(1, accent, done ? 0.9 : 0.4);
      pg.strokeCircle(52, 58, 30);
      if (done) { pg.lineStyle(1, t.rare, 0.28); pg.strokeCircle(52, 58, 37); }
      card.add(pg);
      card.add(this.add.image(52, 58, makeIcon(this, (done ? t.icon : 'lock') as any, 28, hex(done ? t.rare : PALETTE.inkDim))));

      card.add(this.add.text(94, 30, t.name, {
        fontFamily: FONT.display, fontSize: '15px', fontStyle: '600',
        color: hex(done ? PALETTE.paper : PALETTE.inkDim), wordWrap: { width: cw - 110 },
      }));
      card.add(this.add.text(94, 62, t.need, {
        fontFamily: FONT.body, fontSize: '11px', color: hex(PALETTE.inkDim), wordWrap: { width: cw - 110 }, lineSpacing: 3,
      }));
      card.add(chip(this, 94, chh - 26, done ? 'получено' : 'закрыто', done ? PALETTE.long : PALETTE.edgeHi, done));

      if (done) {
        this.tweens.add({ targets: card, alpha: 1, duration: MOTION.base, delay: i * 45 });
        this.add.particles(x + 52, y + 58, 'tx-spark', {
          speed: { min: 4, max: 18 }, lifespan: 2200, quantity: 1, frequency: 700,
          scale: { start: 0.22, end: 0 }, tint: t.rare, blendMode: 'ADD',
        });
      } else {
        this.tweens.add({ targets: card, alpha: 0.75, duration: MOTION.base, delay: i * 45 });
      }
      this.add.existing(card);
    });
  }
}
