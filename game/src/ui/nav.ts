import Phaser from 'phaser';
import { PALETTE, MOTION, FONT, hex } from '../core/theme';
import { makeIcon } from '../core/textures';

/** Кнопка «назад в город» — одинаковый адрес во всех локациях. */
export function backButton(scene: Phaser.Scene, target = 'city') {
  const c = scene.add.container(28, 92).setDepth(120);
  const g = scene.add.graphics();
  g.fillStyle(PALETTE.slab, 0.9); g.fillCircle(0, 0, 20);
  g.lineStyle(1, PALETTE.edge, 1); g.strokeCircle(0, 0, 20);
  const i = scene.add.image(0, 0, makeIcon(scene, 'back', 18, hex(PALETTE.paperDim)));
  c.add([g, i]);
  const hit = scene.add.circle(28, 92, 24, 0xffffff, 0).setInteractive({ useHandCursor: true }).setDepth(121);
  const label = scene.add.text(54, 92, 'В ГОРОД', {
    fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim),
  }).setOrigin(0, 0.5).setLetterSpacing(2).setDepth(120).setAlpha(0);
  hit.on('pointerover', () => {
    g.clear();
    g.fillStyle(PALETTE.slabHi, 1); g.fillCircle(0, 0, 20);
    g.lineStyle(1, PALETTE.signal, 1); g.strokeCircle(0, 0, 20);
    scene.tweens.add({ targets: label, alpha: 1, duration: MOTION.fast });
    scene.game.events.emit('sfx', 'hover');
  });
  hit.on('pointerout', () => {
    g.clear();
    g.fillStyle(PALETTE.slab, 0.9); g.fillCircle(0, 0, 20);
    g.lineStyle(1, PALETTE.edge, 1); g.strokeCircle(0, 0, 20);
    scene.tweens.add({ targets: label, alpha: 0, duration: MOTION.fast });
  });
  hit.on('pointerdown', () => {
    scene.game.events.emit('sfx', 'click');
    scene.cameras.main.fadeOut(MOTION.base);
    scene.time.delayedCall(MOTION.base, () => scene.scene.start(target));
  });
  scene.input.keyboard?.once('keydown-ESC', () => scene.scene.start(target));
  return c;
}
