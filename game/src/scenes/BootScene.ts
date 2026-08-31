import Phaser from 'phaser';
import { buildAllTextures } from '../core/textures';
import { PALETTE, FONT, hex, MOTION } from '../core/theme';
import { VOICE } from '../content/lore';

export class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  create() {
    buildAllTextures(this);
    const { width: w, height: h } = this.scale;

    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    const title = this.add.text(w / 2, h / 2 - 14, VOICE.brand, {
      fontFamily: FONT.display, fontSize: '44px', fontStyle: '700', color: hex(PALETTE.paper),
    }).setOrigin(0.5).setLetterSpacing(8).setAlpha(0);
    const sub = this.add.text(w / 2, h / 2 + 24, VOICE.tagline.toUpperCase(), {
      fontFamily: FONT.mono, fontSize: '11px', color: hex(PALETTE.short),
    }).setOrigin(0.5).setLetterSpacing(5).setAlpha(0);

    this.tweens.add({ targets: [title, sub], alpha: 1, duration: MOTION.reveal, ease: MOTION.ease });
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(MOTION.base);
      this.time.delayedCall(MOTION.base, () => {
        document.getElementById('boot-veil')?.classList.add('gone');
        this.scene.start('city');
        this.scene.launch('hud');
      });
    });
  }
}
