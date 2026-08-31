/**
 * БАЗАР — рынок обещаний. Витрина товаров, «сделка дня», честный ценник.
 * Всё покупается за $SIG (мягкая валюта), Web3-слой — витринный (прототип).
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { BAZAAR_GOODS, HEADLINES } from '../content/lore';
import { store, getState } from '../core/store';
import { Panel, Button, text, kicker, chip, toast } from '../ui/kit';
import { backButton } from '../ui/nav';

export class BazaarScene extends Phaser.Scene {
  private grid!: Phaser.GameObjects.Container;
  constructor() { super('bazaar'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.bazaar;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);

    const g = this.add.graphics();
    g.fillStyle(PALETTE.void, 1); g.fillRect(0, 0, w, h);
    // навесы рынка сверху
    for (let x = -20; x < w + 20; x += 64) {
      g.fillStyle(x % 128 === 0 ? mix(d.color, PALETTE.void, 0.7) : mix(PALETTE.short, PALETTE.void, 0.78), 1);
      g.fillTriangle(x, 68, x + 64, 68, x + 32, 96);
    }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.2).setBlendMode(Phaser.BlendModes.ADD);
    backButton(this);

    const hl = HEADLINES.bazaar;
    kicker(this, 96, 104, hl.kicker, d.color);
    text(this, 94, 118, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);
    text(this, 96, 156, hl.lead, 'small', PALETTE.inkSoft);

    // кошелёк
    const wc = this.add.container(w - 228, 104);
    new Panel(this, w - 228, 104, 200, 56, { accent: PALETTE.gold, fill: PALETTE.slab });
    wc.add(this.add.image(28, 28, makeIcon(this, 'coin', 22, hex(PALETTE.gold))));
    wc.add(kicker(this, 50, 12, 'баланс', PALETTE.inkDim));
    const bal = text(this, 48, 24, `${getState().sig} $SIG`, 'h3', PALETTE.paper);
    wc.add(bal);
    store.subscribe((s) => bal.setText(`${s.sig} $SIG`));

    this.render();
  }

  private render() {
    this.grid?.destroy();
    const w = this.scale.width;
    const c = this.add.container(0, 0);
    this.grid = c;
    const owned = getState().owned;
    const cols = Math.max(2, Math.min(3, Math.floor((w - 56) / 320)));
    const cw = (w - 56 - (cols - 1) * 18) / cols;
    const chh = 158;

    BAZAAR_GOODS.forEach((it, i) => {
      const x = 28 + (i % cols) * (cw + 18);
      const y = 210 + Math.floor(i / cols) * (chh + 18);
      const has = owned.includes(it.id);
      const hot = i === 0; // «сделка дня»
      const accent = hot ? PALETTE.gold : has ? PALETTE.long : DISTRICT.bazaar.color;

      const card = this.add.container(x, y).setAlpha(0);
      c.add(card);
      const g = this.add.graphics();
      const draw = (over: boolean) => {
        g.clear();
        g.fillStyle(mix(PALETTE.slab, accent, over ? 0.12 : 0.04), 0.96);
        g.fillRect(0, 0, cw, chh);
        g.lineStyle(1.5, over ? accent : mix(accent, PALETTE.edge, 0.55), 1);
        g.strokeRect(0, 0, cw, chh);
        g.fillStyle(accent, 1); g.fillRect(0, 0, 3, chh);
      };
      draw(false);
      card.add(g);

      card.add(this.add.image(48, 54, makeIcon(this, it.icon as any, 36, hex(accent))));
      card.add(this.add.text(90, 24, it.name, { fontFamily: FONT.display, fontSize: '17px', fontStyle: '600', color: hex(PALETTE.paper) }));
      card.add(this.add.text(90, 48, it.desc, {
        fontFamily: FONT.body, fontSize: '12px', color: hex(PALETTE.inkSoft), wordWrap: { width: cw - 110 }, lineSpacing: 4,
      }));
      card.add(chip(this, 90, 108, it.tag, PALETTE.edgeHi));
      if (hot) card.add(chip(this, cw - 108, 20, 'сделка дня', PALETTE.gold, true));

      card.add(this.add.text(cw - 18, chh - 46, `${it.price}`, {
        fontFamily: FONT.mono, fontSize: '20px', fontStyle: '700', color: hex(PALETTE.gold),
      }).setOrigin(1, 0));
      card.add(this.add.text(cw - 18, chh - 24, '$SIG', {
        fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim),
      }).setOrigin(1, 0).setLetterSpacing(2));

      const btn = new Button(this, x + 88, y + chh - 46, has ? 'куплено' : 'взять', () => {
        if (has) return;
        const ok = store.getState().buy(it.id, it.price);
        if (ok) { this.game.events.emit('sfx', 'coin'); toast(this, `${it.name}: сделка закрыта. Возврата не будет.`, PALETTE.gold); this.render(); }
        else { this.game.events.emit('sfx', 'lose'); toast(this, 'Недостаточно $SIG. Рынок сочувствует формально.', PALETTE.short); }
      }, { w: 140, h: 36, accent: has ? PALETTE.long : accent, variant: has ? 'ghost' : 'solid', icon: has ? 'check' : 'coin', disabled: has });
      c.add(btn);

      const hit = this.add.rectangle(x, y, cw - 150, chh).setOrigin(0).setInteractive();
      hit.on('pointerover', () => draw(true));
      hit.on('pointerout', () => draw(false));
      c.add(hit);
      this.tweens.add({ targets: card, alpha: 1, duration: MOTION.base, delay: i * 40 });
    });
  }
}
