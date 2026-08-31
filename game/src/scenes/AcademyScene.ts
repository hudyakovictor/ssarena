/**
 * АКАДЕМИЯ — Duolingo-слой. Пять дисциплин как «дорожки» с узлами уроков,
 * серия дней, дневная цель. Обучение подано как обязательная повинность:
 * тон угрожает, механика поощряет.
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { DISCIPLINES, HEADLINES } from '../content/lore';
import { store, getState } from '../core/store';
import { Panel, Button, text, kicker, chip, Meter, toast } from '../ui/kit';
import { backButton } from '../ui/nav';

const NODES_PER_DISC = 8;

export class AcademyScene extends Phaser.Scene {
  private active = 0;
  private trackLayer!: Phaser.GameObjects.Container;

  constructor() { super('academy'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.academy;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);
    this.backdrop(w, h, d.color);
    backButton(this);

    const hl = HEADLINES.academy;
    kicker(this, 96, 84, hl.kicker, d.color);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);
    text(this, 96, 136, hl.lead, 'small', PALETTE.inkSoft);

    this.dailyGoal(w, d.color);

    // ── вкладки дисциплин ──
    const tabsY = 178;
    DISCIPLINES.forEach((disc, i) => {
      const tw = 210, gap = 12;
      const x = 28 + i * (tw + gap);
      const done = getState().lessons[disc.id] ?? 0;
      const c = this.add.container(x, tabsY);
      const g = this.add.graphics();
      const draw = (hot: boolean) => {
        g.clear();
        const on = this.active === i;
        g.fillStyle(on ? mix(PALETTE.slabHi, disc.color, 0.14) : PALETTE.slab, on || hot ? 0.98 : 0.72);
        g.fillRect(0, 0, tw, 72);
        g.lineStyle(1, on ? disc.color : PALETTE.edge, 1);
        g.strokeRect(0, 0, tw, 72);
        g.fillStyle(disc.color, on ? 1 : 0.35);
        g.fillRect(0, 0, tw, 3);
      };
      draw(false);
      c.add(g);
      c.add(this.add.image(26, 26, makeIcon(this, disc.icon as any, 20, hex(disc.color))));
      c.add(this.add.text(46, 18, disc.name, { fontFamily: FONT.display, fontSize: '14px', fontStyle: '600', color: hex(PALETTE.paper) }));
      c.add(this.add.text(46, 36, `${done}/${NODES_PER_DISC} уроков`, { fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim) }));
      const m = new Meter(this, 14, 58, tw - 28, 4, disc.color, done / NODES_PER_DISC);
      c.add(m);
      const hit = this.add.rectangle(x, tabsY, tw, 72).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { draw(true); this.game.events.emit('sfx', 'hover'); });
      hit.on('pointerout', () => draw(false));
      hit.on('pointerdown', () => { this.active = i; this.game.events.emit('sfx', 'click'); this.scene.restart(); });
    });

    this.drawTrack(w, h);
  }

  private backdrop(w: number, h: number, accent: number) {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.void, 1); g.fillRect(0, 0, w, h);
    // «линованная бумага» академии
    g.lineStyle(1, accent, 0.035);
    for (let y = 80; y < h; y += 28) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.strokePath(); }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
  }

  private dailyGoal(w: number, accent: number) {
    const s = getState();
    const done = Math.min(3, s.streak % 4);
    const cw = 280;
    const c = this.add.container(w - cw - 28, 82);
    new Panel(this, 0, 0, cw, 78, { accent, fill: PALETTE.slab }).setPosition(0, 0);
    c.add(kicker(this, 16, 14, 'дневная норма', PALETTE.inkDim));
    c.add(text(this, 14, 28, `${done} / 3 урока`, 'h2', PALETTE.paper));
    c.add(new Meter(this, 14, 58, cw - 100, 6, accent, done / 3));
    c.add(this.add.image(cw - 40, 40, makeIcon(this, 'streak', 22, hex(PALETTE.amber))));
    c.add(this.add.text(cw - 26, 40, `${s.streak}`, { fontFamily: FONT.mono, fontSize: '16px', fontStyle: '700', color: hex(PALETTE.amber) }).setOrigin(0, 0.5));
  }

  /** Дорожка уроков: узлы-медальоны по змейке, замки, «босс» в конце. */
  private drawTrack(w: number, h: number) {
    this.trackLayer?.destroy();
    const disc = DISCIPLINES[this.active];
    const done = getState().lessons[disc.id] ?? 0;
    const c = this.add.container(0, 0);
    this.trackLayer = c;

    const top = 296;
    const cols = NODES_PER_DISC;
    const usableW = w - 200;
    const stepX = usableW / (cols - 1);

    // соединительная линия
    const g = this.add.graphics();
    c.add(g);
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < cols; i++) {
      pts.push({ x: 100 + i * stepX, y: top + Math.sin((i / (cols - 1)) * Math.PI * 2) * 70 });
    }
    for (let i = 0; i < cols - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const unlocked = i < done;
      g.lineStyle(3, unlocked ? disc.color : PALETTE.edge, unlocked ? 0.8 : 0.5);
      const steps = 14;
      for (let s = 0; s < steps; s += 2) {
        g.beginPath();
        g.moveTo(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps);
        g.lineTo(a.x + ((b.x - a.x) * (s + 1)) / steps, a.y + ((b.y - a.y) * (s + 1)) / steps);
        g.strokePath();
      }
    }

    pts.forEach((p, i) => {
      const state: 'done' | 'current' | 'locked' = i < done ? 'done' : i === done ? 'current' : 'locked';
      const isBoss = i === cols - 1;
      const r = isBoss ? 40 : 30;
      const col = state === 'locked' ? PALETTE.edgeHi : disc.color;
      const node = this.add.container(p.x, p.y);
      const ng = this.add.graphics();
      ng.fillStyle(state === 'done' ? mix(disc.color, PALETTE.void, 0.55) : PALETTE.slab, 1);
      ng.fillCircle(0, 0, r);
      ng.lineStyle(state === 'current' ? 3 : 2, col, state === 'locked' ? 0.5 : 1);
      ng.strokeCircle(0, 0, r);
      if (isBoss) { ng.lineStyle(1, col, 0.4); ng.strokeCircle(0, 0, r + 7); }
      node.add(ng);
      const icon = state === 'locked' ? 'lock' : state === 'done' ? 'check' : isBoss ? 'skull' : (disc.icon as any);
      node.add(this.add.image(0, 0, makeIcon(this, icon as any, r * 0.8, hex(state === 'locked' ? PALETTE.inkDim : col))));
      c.add(node);

      const label = this.add.text(p.x, p.y + r + 14, isBoss ? 'ЭКЗАМЕН' : `УРОК ${i + 1}`, {
        fontFamily: FONT.mono, fontSize: '10px', color: hex(state === 'locked' ? PALETTE.inkDim : PALETTE.paperDim),
      }).setOrigin(0.5).setLetterSpacing(2);
      c.add(label);

      if (state === 'current') {
        this.tweens.add({ targets: node, scale: 1.08, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const halo = this.add.graphics();
        halo.lineStyle(1, disc.color, 0.35); halo.strokeCircle(p.x, p.y, r + 12);
        c.add(halo);
        this.tweens.add({ targets: halo, alpha: 0.2, duration: 900, yoyo: true, repeat: -1 });
      }
      if (state !== 'locked') {
        const hit = this.add.circle(p.x, p.y, r + 6, 0xffffff, 0).setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => this.game.events.emit('sfx', 'hover'));
        hit.on('pointerdown', () => this.openLesson(disc, i, isBoss));
        c.add(hit);
      }
    });

    // подпись дисциплины
    c.add(text(this, 100, top + 150, disc.desc, 'body', PALETTE.inkSoft));
    const q = chip(this, 100, top + 182, disc.name, disc.color, true);
    c.add(q);
  }

  /** Карточка урока: правило → пример → «понял». Один экран, одна мысль. */
  private openLesson(disc: typeof DISCIPLINES[number], idx: number, isBoss: boolean) {
    const w = this.scale.width, h = this.scale.height;
    this.game.events.emit('sfx', 'enter');
    const veil = this.add.graphics().setDepth(300);
    veil.fillStyle(PALETTE.void, 0.78); veil.fillRect(0, 0, w, h);
    const cw = 560, ch = 320;
    const c = this.add.container(w / 2, h / 2 + 16).setDepth(301).setAlpha(0);
    c.add(new Panel(this, -cw / 2, -ch / 2, cw, ch, { accent: disc.color, fill: PALETTE.abyss, cut: 18 }));
    c.add(kicker(this, -cw / 2 + 24, -ch / 2 + 22, isBoss ? 'экзамен' : `урок ${idx + 1} · ${disc.name}`, disc.color));
    c.add(text(this, -cw / 2 + 22, -ch / 2 + 40, isBoss ? 'ПРОВЕРКА НА ПРОЧНОСТЬ' : 'ПРАВИЛО ДНЯ', 'h2', PALETTE.paper));

    const rules: Record<string, string> = {
      candles: 'Длинная нижняя тень на поддержке — покупатели забрали контроль. Одна свеча не тренд, но она уже мнение.',
      risk: 'Риск на сделку — 1%. Не потому что мало. Потому что серия из десяти провалов существует и придёт к тебе.',
      liquidity: 'Ровные максимумы — не уровень, а объявление: «здесь лежат стопы». Рынок читает объявления вслух.',
      psychology: 'FOMO появляется на третьей зелёной свече. Дисциплина — умение остаться скучным.',
      macro: 'Новость двигает цену, только если она меняет ожидания. Всё остальное — шум с заголовком.',
    };
    c.add(text(this, -cw / 2 + 22, -ch / 2 + 78, rules[disc.id], 'body', PALETTE.paperDim, { wordWrap: { width: cw - 44 }, lineSpacing: 6 }));

    const eg = this.add.graphics();
    eg.fillStyle(PALETTE.slab, 0.9); eg.fillRect(-cw / 2 + 22, -ch / 2 + 168, cw - 44, 66);
    eg.fillStyle(disc.color, 1); eg.fillRect(-cw / 2 + 22, -ch / 2 + 168, 3, 66);
    c.add(eg);
    c.add(kicker(this, -cw / 2 + 36, -ch / 2 + 180, 'вывод департамента', PALETTE.inkDim));
    c.add(text(this, -cw / 2 + 36, -ch / 2 + 196, 'Ты не обязан торговать. Рынок не обязан платить. Договорились.', 'small', PALETTE.paper, { wordWrap: { width: cw - 90 } }));

    c.add(new Button(this, -cw / 2 + 22, ch / 2 - 62, isBoss ? 'сдать экзамен' : 'понял, дальше', () => {
      store.getState().completeLesson(disc.id);
      this.game.events.emit('sfx', 'win');
      veil.destroy(); c.destroy();
      toast(this, `+60 XP. ${disc.name}: знание зафиксировано.`, disc.color);
      this.scene.restart();
    }, { w: 200, h: 44, accent: disc.color, variant: 'solid', icon: 'check' }));

    c.add(new Button(this, cw / 2 - 142, ch / 2 - 62, 'позже', () => { veil.destroy(); c.destroy(); },
      { w: 120, h: 44, accent: PALETTE.edgeHi, variant: 'ghost' }));

    this.tweens.add({ targets: c, alpha: 1, y: h / 2, duration: MOTION.base, ease: MOTION.ease });
  }
}
