/**
 * КИОСК — настройки и «слухи». Переключатели поданы как регулировка
 * громкости паники. Здесь же — выбор настроения рынка (сцена города).
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { HEADLINES, TICKER } from '../content/lore';
import { store, getState, MarketMood } from '../core/store';
import { Panel, Button, text, kicker, toast } from '../ui/kit';
import { backButton } from '../ui/nav';

const MOODS: { id: MarketMood; label: string; note: string; color: number }[] = [
  { id: 'normal', label: 'Обычный', note: 'Синий час. Все делают вид, что всё под контролем.', color: PALETTE.signal },
  { id: 'euphoria', label: 'Эйфория', note: 'Фестиваль. Никто не помнит, чем это заканчивалось.', color: PALETTE.long },
  { id: 'panic', label: 'Паника', note: 'Дождь и ликвидации. Департамент работает сверхурочно.', color: PALETTE.short },
  { id: 'aftermath', label: 'После', note: 'Заборы, серость и один тёплый киоск.', color: PALETTE.edgeHi },
];

export class KioskScene extends Phaser.Scene {
  constructor() { super('kiosk'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.kiosk;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);
    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.void, 1); bg.fillRect(0, 0, w, h);
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
    backButton(this);

    const hl = HEADLINES.kiosk;
    kicker(this, 96, 84, hl.kicker, PALETTE.paperDim);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);
    text(this, 96, 136, hl.lead, 'small', PALETTE.inkSoft);

    const colW = Math.min(520, (w - 84) / 2);

    // ── переключатели ──
    new Panel(this, 28, 176, colW, 230, { accent: PALETTE.edge, fill: PALETTE.slab });
    kicker(this, 46, 192, 'регуляторы', PALETTE.inkDim);
    this.toggleRow(46, 224, colW - 36, 'Звук', 'Синтезированный терминал. Тише, чем твои мысли.', 'sound');
    this.toggleRow(46, 292, colW - 36, 'Меньше движения', 'Для тех, кому хватает волатильности на графике.', 'reduceMotion');
    new Button(this, 46, 350, 'обнулить дело', () => {
      store.getState().reset();
      this.game.events.emit('sfx', 'lose');
      toast(this, 'Личное дело уничтожено. Департамент всё равно помнит.', PALETTE.short);
      this.scene.restart();
    }, { w: 200, h: 40, accent: PALETTE.short, icon: 'cross' });

    // ── сцена города ──
    const mx = 28 + colW + 28;
    new Panel(this, mx, 176, colW, 230, { accent: PALETTE.grape, fill: PALETTE.slab });
    kicker(this, mx + 18, 192, 'сезон рынка · вид города', PALETTE.grape);
    const cur = getState().mood;
    MOODS.forEach((m, i) => {
      const y = 220 + i * 44;
      const on = cur === m.id;
      const g = this.add.graphics();
      g.fillStyle(on ? mix(PALETTE.slabHi, m.color, 0.16) : PALETTE.abyss, 0.9);
      g.fillRect(mx + 18, y, colW - 36, 36);
      g.lineStyle(1, on ? m.color : PALETTE.edge, 1);
      g.strokeRect(mx + 18, y, colW - 36, 36);
      g.fillStyle(m.color, on ? 1 : 0.35); g.fillRect(mx + 18, y, 3, 36);
      this.add.text(mx + 34, y + 8, m.label, { fontFamily: FONT.display, fontSize: '14px', fontStyle: '600', color: hex(on ? m.color : PALETTE.paperDim) });
      this.add.text(mx + 34, y + 22, m.note, { fontFamily: FONT.body, fontSize: '10px', color: hex(PALETTE.inkDim) });
      if (on) this.add.image(mx + colW - 36, y + 18, makeIcon(this, 'check', 16, hex(m.color)));
      const hit = this.add.rectangle(mx + 18, y, colW - 36, 36).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => {
        store.getState().setMood(m.id);
        this.game.events.emit('sfx', 'click');
        toast(this, `Сезон переключён: ${m.label.toLowerCase()}. Город уже в курсе.`, m.color);
        this.scene.restart();
      });
      hit.on('pointerover', () => this.game.events.emit('sfx', 'hover'));
    });

    // ── слухи ──
    const ry = 176 + 230 + 22;
    new Panel(this, 28, ry, w - 56, h - ry - 28, { accent: PALETTE.gold, fill: PALETTE.slab });
    kicker(this, 46, ry + 16, 'слухи с площади · непроверено, как обычно', PALETTE.gold);
    TICKER.slice(0, 4).forEach((t, i) => {
      const y = ry + 44 + i * 26;
      if (y > h - 46) return;
      this.add.image(52, y + 6, makeIcon(this, 'news', 12, hex(PALETTE.inkDim)));
      this.add.text(70, y, t, { fontFamily: FONT.body, fontSize: '12px', color: hex(PALETTE.paperDim) });
    });
  }

  private toggleRow(x: number, y: number, w: number, title: string, note: string, key: 'sound' | 'reduceMotion') {
    const on = getState()[key];
    this.add.text(x, y, title, { fontFamily: FONT.display, fontSize: '15px', fontStyle: '600', color: hex(PALETTE.paper) });
    this.add.text(x, y + 20, note, { fontFamily: FONT.body, fontSize: '11px', color: hex(PALETTE.inkDim), wordWrap: { width: w - 90 } });
    const tx = x + w - 62, ty = y + 8;
    const g = this.add.graphics();
    const draw = (v: boolean) => {
      g.clear();
      g.fillStyle(v ? mix(PALETTE.long, PALETTE.void, 0.45) : PALETTE.abyss, 1);
      g.fillRect(tx, ty, 52, 24);
      g.lineStyle(1, v ? PALETTE.long : PALETTE.edge, 1);
      g.strokeRect(tx, ty, 52, 24);
      g.fillStyle(v ? PALETTE.long : PALETTE.edgeHi, 1);
      g.fillRect(v ? tx + 28 : tx + 2, ty + 2, 22, 20);
    };
    draw(on);
    const hit = this.add.rectangle(tx, ty, 52, 24).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      store.getState().toggle(key);
      draw(getState()[key]);
      this.game.events.emit('sfx', 'click');
    });
  }
}
