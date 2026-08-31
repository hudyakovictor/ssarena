/**
 * SIGNAL ARENA · DESIGN TOKENS
 * ---------------------------------------------------------------
 * Стиль: «панк-таблоидная криптосатира» — типографика газетного
 * подполья, лёгкий гранж (зерно, тиснение, потёртая краска),
 * тёплая бумага поверх холодного ночного города.
 *
 * Правила системы:
 *  1. Ровно 3 семейства шрифтов: заголовок (Oswald), данные (JetBrains
 *     Mono), тело (Inter). Больше — никогда.
 *  2. Цвет несёт смысл: LONG/SHORT/SIGNAL/GOLD/GRAPE — это состояние
 *     рынка и раздела, а не украшение.
 *  3. Все размеры кратны 4 (сетка 4pt), радиусы — 2/6/14.
 *  4. Никаких «неоновых соплей»: свечение допускается только на
 *     активном фокусе и в момент результата.
 */

export const PALETTE = {
  // подложка — не «чёрный», а закопчённый асфальт с синевой
  void: 0x07080c,
  abyss: 0x0b0e15,
  slab: 0x11151f,
  slabHi: 0x181d2a,
  edge: 0x232a3a,
  edgeHi: 0x36405a,

  // бумага/чернила — таблоидный слой
  paper: 0xe8e2d6,
  paperDim: 0xc7c0b1,
  ink: 0x0a0a0c,
  inkSoft: 0x9aa3b5,
  inkDim: 0x5e6d85,

  // смысловые
  signal: 0x2ad4e6,
  long: 0x35d68a,
  short: 0xfb4b6b,
  gold: 0xf5b13d,
  grape: 0x9b6cff,
  amber: 0xf59e0b,
  rust: 0xc2410c,
} satisfies Record<string, number> as Record<string, number> & {
  void: number; abyss: number; slab: number; slabHi: number; edge: number; edgeHi: number;
  paper: number; paperDim: number; ink: number; inkSoft: number; inkDim: number;
  signal: number; long: number; short: number; gold: number; grape: number; amber: number; rust: number;
};

export const CSS = Object.fromEntries(
  Object.entries(PALETTE).map(([k, v]) => [k, '#' + v.toString(16).padStart(6, '0')]),
) as Record<keyof typeof PALETTE, string>;

/** Разделы города = стабильный цветовой адрес (память места). */
export const DISTRICT: Record<string, { key: string; title: string; color: number; sub: string }> & {
  home: any; arena: any; academy: any; bazaar: any; bestiary: any; treasury: any; ratusha: any; kiosk: any;
} = {
  home: { key: 'home', title: 'ПЛОЩАДЬ', color: PALETTE.paper, sub: 'Signal City' },
  arena: { key: 'arena', title: 'АРЕНА', color: PALETTE.short, sub: 'Проверка навыка' },
  academy: { key: 'academy', title: 'АКАДЕМИЯ', color: PALETTE.gold, sub: 'Департамент дисциплины' },
  bazaar: { key: 'bazaar', title: 'БАЗАР', color: PALETTE.amber, sub: 'Рынок обещаний' },
  bestiary: { key: 'bestiary', title: 'БЕСТИАРИЙ', color: PALETTE.grape, sub: 'Реестр хищников' },
  treasury: { key: 'treasury', title: 'КАЗНА', color: PALETTE.gold, sub: 'Коллекция трофеев' },
  ratusha: { key: 'ratusha', title: 'РАТУША', color: PALETTE.signal, sub: 'Личное дело' },
  kiosk: { key: 'kiosk', title: 'КИОСК', color: PALETTE.inkSoft, sub: 'Настройки и слухи' },
};
export type DistrictKey = 'home' | 'arena' | 'academy' | 'bazaar' | 'bestiary' | 'treasury' | 'ratusha' | 'kiosk';

export const FONT = {
  display: 'Oswald, Impact, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  body: 'Inter, system-ui, sans-serif',
} as const;

/** Типографическая шкала — 7 ступеней, ничего между ними. */
export const TYPE = {
  hero: { fontFamily: FONT.display, fontSize: '54px', fontStyle: '700' },
  h1: { fontFamily: FONT.display, fontSize: '34px', fontStyle: '700' },
  h2: { fontFamily: FONT.display, fontSize: '22px', fontStyle: '600' },
  h3: { fontFamily: FONT.display, fontSize: '16px', fontStyle: '600' },
  body: { fontFamily: FONT.body, fontSize: '14px' },
  small: { fontFamily: FONT.body, fontSize: '12px' },
  data: { fontFamily: FONT.mono, fontSize: '13px' },
  micro: { fontFamily: FONT.mono, fontSize: '10px' },
} as const;

export const SPACE = (n: number) => n * 4;
export const RADIUS = { sharp: 2, soft: 6, pill: 14 } as const;

/** Тайминги — единая «физика» интерфейса. */
export const MOTION = {
  instant: 90,
  fast: 160,
  base: 260,
  slow: 420,
  reveal: 640,
  ease: 'Cubic.easeOut',
  easeIn: 'Cubic.easeIn',
  back: 'Back.easeOut',
} as const;

export const Z = { bg: 0, art: 10, board: 20, ui: 30, hud: 40, overlay: 50, toast: 60 } as const;

export const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');

/** Смешивание цветов для состояний (hover / disabled / прогресс). */
export function mix(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (
    ((ar + (br - ar) * t) << 16) | ((ag + (bg - ag) * t) << 8) | (ab + (bb - ab) * t)
  ) & 0xffffff;
}
