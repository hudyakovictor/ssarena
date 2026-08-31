/**
 * БЕСТИАРИЙ — реестр рыночных хищников (Hearthstone-коллекция).
 * Сетка карточек с редкостью, уровнем угрозы и досье.
 * Закрытые сущности — силуэт «ещё не встречал».
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { ENTITIES, HEADLINES, Entity } from '../content/lore';
import { getState, store } from '../core/store';
import { Panel, Button, text, kicker, chip, Meter, toast } from '../ui/kit';
import { backButton } from '../ui/nav';

const RARITY: Record<Entity['rarity'], { label: string; color: number }> = {
  common: { label: 'обычный', color: 0x7d8aa3 },
  rare: { label: 'редкий', color: 0x4f8cff },
  epic: { label: 'эпический', color: 0x9b6cff },
  legendary: { label: 'легендарный', color: 0xf5b13d },
  mythic: { label: 'мифический', color: 0xfb4b6b },
};

export class BestiaryScene extends Phaser.Scene {
  private filter: 'all' | 'known' | 'unknown' = 'all';
  private grid!: Phaser.GameObjects.Container;

  constructor() { super('bestiary'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.bestiary;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);
    this.backdrop(w, h, d.color);
    backButton(this);

    const hl = HEADLINES.bestiary;
    kicker(this, 96, 84, hl.kicker, d.color);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);
    text(this, 96, 136, hl.lead, 'small', PALETTE.inkSoft);

    // счётчик
    const known = getState().unlocked.length;
    const cnt = this.add.container(w - 240, 92);
    new Panel(this, w - 240, 84, 212, 62, { accent: d.color, fill: PALETTE.slab });
    cnt.add(kicker(this, 16, 8, 'изучено досье', PALETTE.inkDim));
    cnt.add(text(this, 14, 22, `${known} / ${ENTITIES.length}`, 'h2', PALETTE.paper));
    cnt.add(new Meter(this, 14, 46, 180, 5, d.color, known / ENTITIES.length));

    // фильтры
    const filters: [typeof this.filter, string][] = [['all', 'все'], ['known', 'изучены'], ['unknown', 'не встречал']];
    filters.forEach(([k, label], i) => {
      new Button(this, 28 + i * 132, 176, label, () => { this.filter = k; this.renderGrid(); }, {
        w: 122, h: 34, accent: this.filter === k ? d.color : PALETTE.edgeHi,
        variant: this.filter === k ? 'solid' : 'ghost',
      });
    });

    this.renderGrid();
  }

  private backdrop(w: number, h: number, accent: number) {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.void, 1); g.fillRect(0, 0, w, h);
    // «вольеры» — вертикальные решётки в дымке
    for (let x = 0; x < w; x += 46) {
      g.fillStyle(accent, 0.022); g.fillRect(x, 0, 2, h);
    }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD);
  }

  private renderGrid() {
    this.grid?.destroy();
    const w = this.scale.width;
    const c = this.add.container(0, 0);
    this.grid = c;
    const unlocked = getState().unlocked;
    const list = ENTITIES.filter((e) =>
      this.filter === 'all' ? true : this.filter === 'known' ? unlocked.includes(e.id) : !unlocked.includes(e.id));

    const cols = Math.max(3, Math.min(6, Math.floor((w - 56) / 220)));
    const cw = (w - 56 - (cols - 1) * 16) / cols;
    const chh = 150;

    list.forEach((e, i) => {
      const x = 28 + (i % cols) * (cw + 16);
      const y = 232 + Math.floor(i / cols) * (chh + 16);
      const known = unlocked.includes(e.id);
      const rar = RARITY[e.rarity];
      const card = this.add.container(x, y).setAlpha(0);
      c.add(card);

      const g = this.add.graphics();
      const drawCard = (hot: boolean) => {
        g.clear();
        const cut = 12;
        const pts = [0, 0, cw - cut, 0, cw, cut, cw, chh, cut, chh, 0, chh - cut]
          .reduce<Phaser.Geom.Point[]>((acc, v, idx, arr) => (idx % 2 ? acc : [...acc, new Phaser.Geom.Point(v, arr[idx + 1])]), []);
        g.fillStyle(known ? mix(PALETTE.slab, rar.color, hot ? 0.14 : 0.05) : PALETTE.abyss, 0.96);
        g.fillPoints(pts, true);
        g.lineStyle(1.5, known ? (hot ? rar.color : mix(rar.color, PALETTE.edge, 0.5)) : PALETTE.edge, 1);
        g.strokePoints(pts, true);
        g.fillStyle(known ? rar.color : PALETTE.edge, 1);
        g.fillRect(0, 0, cw, 3);
      };
      drawCard(false);
      card.add(g);

      card.add(this.add.image(38, 56, makeIcon(this, (known ? e.icon : 'lock') as any, 34, hex(known ? rar.color : PALETTE.inkDim))).setAlpha(known ? 1 : 0.5));
      card.add(this.add.text(72, 30, known ? e.name : '???', {
        fontFamily: FONT.display, fontSize: '15px', fontStyle: '600', color: hex(known ? PALETTE.paper : PALETTE.inkDim),
        wordWrap: { width: cw - 88 },
      }));
      card.add(this.add.text(72, 66, known ? e.tag : 'не встречал', {
        fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim),
      }).setLetterSpacing(1.5));

      // шкала угрозы
      card.add(this.add.text(14, chh - 42, 'УГРОЗА', { fontFamily: FONT.mono, fontSize: '9px', color: hex(PALETTE.inkDim) }).setLetterSpacing(2));
      card.add(new Meter(this, 14, chh - 28, cw - 76, 6, known ? rar.color : PALETTE.edge, known ? e.threat / 100 : 0));
      card.add(this.add.text(cw - 14, chh - 30, known ? `${e.threat}` : '—', {
        fontFamily: FONT.mono, fontSize: '13px', fontStyle: '700', color: hex(known ? rar.color : PALETTE.inkDim),
      }).setOrigin(1, 0));
      const rc = chip(this, cw - 14, 14, rar.label, known ? rar.color : PALETTE.edgeHi);
      rc.setX(cw - 14 - (rc as any).w);
      card.add(rc);

      const hit = this.add.rectangle(x, y, cw, chh).setOrigin(0).setInteractive({ useHandCursor: true });
      c.add(hit);
      hit.on('pointerover', () => { drawCard(true); this.tweens.add({ targets: card, y: y - 4, duration: MOTION.fast }); this.game.events.emit('sfx', 'hover'); });
      hit.on('pointerout', () => { drawCard(false); this.tweens.add({ targets: card, y, duration: MOTION.fast }); });
      hit.on('pointerdown', () => known ? this.openDossier(e, rar.color) : this.tease(e));

      this.tweens.add({ targets: card, alpha: 1, duration: MOTION.base, delay: i * 28 });
    });
  }

  private tease(e: Entity) {
    this.game.events.emit('sfx', 'lose');
    toast(this, 'Досье закрыто. Встреться с ним на Арене — потом поговорим.', PALETTE.edgeHi);
    // милосердие прототипа: клик по неизвестному даёт шанс открыть
    if (Math.random() < 0.5) {
      store.getState().unlock(e.id);
      this.time.delayedCall(700, () => { toast(this, `Новое досье: ${e.name}`, PALETTE.grape); this.renderGrid(); });
    }
  }

  private openDossier(e: Entity, color: number) {
    const w = this.scale.width, h = this.scale.height;
    this.game.events.emit('sfx', 'enter');
    const veil = this.add.graphics().setDepth(300);
    veil.fillStyle(PALETTE.void, 0.8); veil.fillRect(0, 0, w, h);
    veil.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

    const cw = 600, ch = 340;
    const c = this.add.container(w / 2, h / 2 + 16).setDepth(301).setAlpha(0);
    c.add(new Panel(this, -cw / 2, -ch / 2, cw, ch, { accent: color, fill: PALETTE.abyss, cut: 18 }));

    // «портрет» — процедурная эмблема
    const pg = this.add.graphics();
    pg.fillStyle(mix(color, PALETTE.void, 0.72), 1);
    pg.fillRect(-cw / 2 + 24, -ch / 2 + 24, 150, 150);
    pg.lineStyle(1, color, 0.7);
    pg.strokeRect(-cw / 2 + 24, -ch / 2 + 24, 150, 150);
    for (let i = 0; i < 8; i++) {
      pg.lineStyle(1, color, 0.12);
      pg.strokeCircle(-cw / 2 + 99, -ch / 2 + 99, 20 + i * 9);
    }
    c.add(pg);
    c.add(this.add.image(-cw / 2 + 99, -ch / 2 + 99, makeIcon(this, e.icon as any, 74, hex(color))));

    const tx = -cw / 2 + 194;
    c.add(kicker(this, tx, -ch / 2 + 26, `досье · ${RARITY[e.rarity].label}`, color));
    c.add(text(this, tx - 2, -ch / 2 + 42, e.name.toUpperCase(), 'h2', PALETTE.paper));
    c.add(text(this, tx, -ch / 2 + 76, e.lore, 'small', PALETTE.paperDim, { wordWrap: { width: cw - 230 }, lineSpacing: 5 }));

    const eg = this.add.graphics();
    eg.fillStyle(PALETTE.slab, 0.92); eg.fillRect(tx, -ch / 2 + 138, cw - 230, 62);
    eg.fillStyle(PALETTE.long, 1); eg.fillRect(tx, -ch / 2 + 138, 3, 62);
    c.add(eg);
    c.add(kicker(this, tx + 14, -ch / 2 + 148, 'как не стать едой', PALETTE.long));
    c.add(text(this, tx + 14, -ch / 2 + 164, e.counter, 'small', PALETTE.paper, { wordWrap: { width: cw - 258 }, lineSpacing: 4 }));

    c.add(new Button(this, -cw / 2 + 24, ch / 2 - 62, 'встретиться на арене', () => { veil.destroy(); c.destroy(); this.scene.start('arena'); },
      { w: 230, h: 44, accent: PALETTE.short, variant: 'solid', icon: 'arena' }));
    c.add(new Button(this, cw / 2 - 144, ch / 2 - 62, 'закрыть', () => { veil.destroy(); c.destroy(); },
      { w: 120, h: 44, accent: PALETTE.edgeHi }));

    this.tweens.add({ targets: c, alpha: 1, y: h / 2, duration: MOTION.base, ease: MOTION.ease });
  }
}
