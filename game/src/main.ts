import Phaser from 'phaser';
import { PALETTE, hex } from './core/theme';
import { installSfx } from './core/sfx';
import { BootScene } from './scenes/BootScene';
import { HudScene } from './scenes/HudScene';
import { CityScene } from './scenes/CityScene';
import { ArenaScene } from './scenes/ArenaScene';
import { AcademyScene } from './scenes/AcademyScene';
import { BestiaryScene } from './scenes/BestiaryScene';
import { BazaarScene } from './scenes/BazaarScene';
import { TreasuryScene } from './scenes/TreasuryScene';
import { RatushaScene } from './scenes/RatushaScene';
import { KioskScene } from './scenes/KioskScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: hex(PALETTE.void),
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: '100%',
    height: '100%',
  },
  render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
  scene: [BootScene, CityScene, ArenaScene, AcademyScene, BestiaryScene, BazaarScene, TreasuryScene, RatushaScene, KioskScene, HudScene],
});

installSfx(game);
(window as any).__SIGNAL_ARENA__ = game;
