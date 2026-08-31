/**
 * Процедурная генерация всех текстур: гранж-зерно, бумага, виньетка,
 * царапины, полутон (halftone), штампы и вектор-иконки.
 * Ни одного внешнего PNG — весь визуальный слой считается на канвасе,
 * поэтому масштабируется под любой DPR и весит ноль килобайт.
 */
import Phaser from 'phaser';
import { PALETTE, hex } from './theme';

type Scene = Phaser.Scene;

function ctxOf(scene: Scene, key: string, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  return { tex, ctx: tex.getContext() as CanvasRenderingContext2D };
}

/** Плёночное зерно — накладывается на весь кадр в режиме overlay. */
export function makeGrain(scene: Scene, key = 'tx-grain', size = 256, strength = 26) {
  const { tex, ctx } = ctxOf(scene, key, size, size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * strength * 2;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return key;
}

/** Бумага таблоида: тёплая основа + волокна + пятна печати. */
export function makePaper(scene: Scene, key = 'tx-paper', w = 512, h = 512) {
  const { tex, ctx } = ctxOf(scene, key, w, h);
  ctx.fillStyle = hex(PALETTE.paper);
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const a = Math.random() * 0.06;
    ctx.fillStyle = `rgba(70,58,40,${a})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1);
  }
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * w, y = Math.random() * h, r = 20 + Math.random() * 90;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(120,96,60,0.07)');
    g.addColorStop(1, 'rgba(120,96,60,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  tex.refresh();
  return key;
}

/** Полутоновая сетка — «печатный» слой для акцентных плашек. */
export function makeHalftone(scene: Scene, key = 'tx-halftone', cell = 6) {
  const size = cell * 16;
  const { tex, ctx } = ctxOf(scene, key, size, size);
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const off = (y / cell) % 2 ? cell / 2 : 0;
      ctx.beginPath();
      ctx.arc(x + off, y, cell * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  tex.refresh();
  return key;
}

/** Виньетка + лёгкая хроматика по краям кадра. */
export function makeVignette(scene: Scene, key = 'tx-vignette', w = 1024, h = 576) {
  const { tex, ctx } = ctxOf(scene, key, w, h);
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.28, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.66, 'rgba(0,0,0,0.30)');
  g.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  tex.refresh();
  return key;
}

/** Царапины/потёртости — редкий слой поверх панелей. */
export function makeScratches(scene: Scene, key = 'tx-scratch', w = 512, h = 512) {
  const { tex, ctx } = ctxOf(scene, key, w, h);
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w, y = Math.random() * h;
    const len = 8 + Math.random() * 120;
    const ang = (Math.random() - 0.5) * 0.8 + (Math.random() < 0.5 ? 0 : Math.PI / 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + Math.random() * 0.05})`;
    ctx.lineWidth = Math.random() < 0.85 ? 1 : 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  tex.refresh();
  return key;
}

/** Мягкая круглая «искра» для партиклов. */
export function makeSpark(scene: Scene, key = 'tx-spark', size = 32) {
  const { tex, ctx } = ctxOf(scene, key, size, size);
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

/** Пыль/пепел — квадратный пиксель для «городской взвеси». */
export function makeDust(scene: Scene, key = 'tx-dust', size = 4) {
  const { tex, ctx } = ctxOf(scene, key, size, size);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
  return key;
}

// ─────────────────────────────────────────────────────────────
// ИКОНКИ: единая сетка 24×24, штрих 2px, скруглённые концы.
// Рисуются как path-команды, растеризуются в текстуру нужного размера.
// ─────────────────────────────────────────────────────────────
type Draw = (c: CanvasRenderingContext2D) => void;

const ICONS: Record<string, Draw> = {
  arena: (c) => { // скрещённые мечи
    c.beginPath(); c.moveTo(4, 20); c.lineTo(18, 5); c.moveTo(20, 20); c.lineTo(6, 5); c.stroke();
    c.beginPath(); c.moveTo(15, 4); c.lineTo(20, 4); c.lineTo(20, 9); c.moveTo(9, 4); c.lineTo(4, 4); c.lineTo(4, 9); c.stroke();
  },
  academy: (c) => { // книга
    c.beginPath(); c.moveTo(12, 7); c.lineTo(12, 20);
    c.moveTo(12, 7); c.bezierCurveTo(9, 4, 6, 4, 3, 5); c.lineTo(3, 18); c.bezierCurveTo(6, 17, 9, 17, 12, 20);
    c.moveTo(12, 7); c.bezierCurveTo(15, 4, 18, 4, 21, 5); c.lineTo(21, 18); c.bezierCurveTo(18, 17, 15, 17, 12, 20);
    c.stroke();
  },
  bazaar: (c) => { // навес рынка
    c.beginPath(); c.moveTo(3, 9); c.lineTo(5, 4); c.lineTo(19, 4); c.lineTo(21, 9); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(4, 9); c.lineTo(4, 20); c.lineTo(20, 20); c.lineTo(20, 9); c.stroke();
    c.beginPath(); c.moveTo(9, 20); c.lineTo(9, 14); c.lineTo(15, 14); c.lineTo(15, 20); c.stroke();
  },
  bestiary: (c) => { // лапа
    c.beginPath(); c.ellipse(12, 16, 5, 4, 0, 0, Math.PI * 2); c.stroke();
    [[6, 9], [10, 7], [14, 7], [18, 9]].forEach(([x, y], i) => {
      c.beginPath(); c.ellipse(x, y, 1.8, 2.4 + (i === 1 || i === 2 ? 0.4 : 0), 0, 0, Math.PI * 2); c.stroke();
    });
  },
  treasury: (c) => { // кубок
    c.beginPath(); c.moveTo(7, 4); c.lineTo(17, 4); c.lineTo(16, 12);
    c.bezierCurveTo(16, 15, 8, 15, 8, 12); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(7, 6); c.bezierCurveTo(3, 6, 3, 11, 8, 11);
    c.moveTo(17, 6); c.bezierCurveTo(21, 6, 21, 11, 16, 11); c.stroke();
    c.beginPath(); c.moveTo(12, 15); c.lineTo(12, 18); c.moveTo(8, 20); c.lineTo(16, 20); c.stroke();
  },
  ratusha: (c) => { // ID-карта
    c.beginPath(); c.rect(3, 5, 18, 14); c.stroke();
    c.beginPath(); c.arc(9, 11, 2.4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(5.5, 16.5); c.bezierCurveTo(6.5, 13.6, 11.5, 13.6, 12.5, 16.5); c.stroke();
    c.beginPath(); c.moveTo(15, 10); c.lineTo(19, 10); c.moveTo(15, 13); c.lineTo(19, 13); c.stroke();
  },
  kiosk: (c) => { // шестерёнка
    c.beginPath(); c.arc(12, 12, 3.4, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(12 + Math.cos(a) * 6, 12 + Math.sin(a) * 6);
      c.lineTo(12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9);
      c.stroke();
    }
    c.beginPath(); c.arc(12, 12, 6, 0, Math.PI * 2); c.stroke();
  },
  long: (c) => { c.beginPath(); c.moveTo(12, 20); c.lineTo(12, 5); c.moveTo(6, 11); c.lineTo(12, 5); c.lineTo(18, 11); c.stroke(); },
  short: (c) => { c.beginPath(); c.moveTo(12, 4); c.lineTo(12, 19); c.moveTo(6, 13); c.lineTo(12, 19); c.lineTo(18, 13); c.stroke(); },
  wait: (c) => {
    c.beginPath(); c.arc(12, 12, 8, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(12, 7); c.lineTo(12, 12); c.lineTo(15.5, 14); c.stroke();
  },
  flame: (c) => {
    c.beginPath(); c.moveTo(12, 3); c.bezierCurveTo(17, 8, 19, 12, 18, 15);
    c.bezierCurveTo(17, 19, 14, 21, 12, 21); c.bezierCurveTo(10, 21, 7, 19, 6, 15);
    c.bezierCurveTo(5, 11, 8, 9, 9, 6); c.bezierCurveTo(10.5, 8.5, 11, 10, 12, 3); c.stroke();
  },
  shield: (c) => {
    c.beginPath(); c.moveTo(12, 3); c.lineTo(20, 6); c.lineTo(20, 12);
    c.bezierCurveTo(20, 17, 16, 20, 12, 21); c.bezierCurveTo(8, 20, 4, 17, 4, 12);
    c.lineTo(4, 6); c.closePath(); c.stroke();
  },
  skull: (c) => {
    c.beginPath(); c.moveTo(5, 13); c.bezierCurveTo(5, 6, 19, 6, 19, 13);
    c.lineTo(19, 16); c.lineTo(15, 18); c.lineTo(15, 21); c.lineTo(9, 21); c.lineTo(9, 18); c.lineTo(5, 16); c.closePath(); c.stroke();
    c.beginPath(); c.arc(9.4, 13, 1.8, 0, Math.PI * 2); c.moveTo(16.4, 13); c.arc(14.6, 13, 1.8, 0, Math.PI * 2); c.stroke();
  },
  bolt: (c) => { c.beginPath(); c.moveTo(13, 2); c.lineTo(5, 13); c.lineTo(11, 13); c.lineTo(10, 22); c.lineTo(19, 10); c.lineTo(13, 10); c.closePath(); c.stroke(); },
  eye: (c) => {
    c.beginPath(); c.moveTo(2, 12); c.bezierCurveTo(6, 5, 18, 5, 22, 12);
    c.bezierCurveTo(18, 19, 6, 19, 2, 12); c.closePath(); c.stroke();
    c.beginPath(); c.arc(12, 12, 3, 0, Math.PI * 2); c.stroke();
  },
  chart: (c) => {
    c.beginPath(); c.moveTo(3, 20); c.lineTo(21, 20); c.moveTo(3, 20); c.lineTo(3, 4); c.stroke();
    c.beginPath(); c.moveTo(6, 16); c.lineTo(10, 10); c.lineTo(14, 13); c.lineTo(20, 6); c.stroke();
  },
  coin: (c) => {
    c.beginPath(); c.arc(12, 12, 8, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(12, 7); c.lineTo(12, 17); c.moveTo(14.5, 9.5);
    c.bezierCurveTo(12, 7.5, 9, 9, 9.5, 11.5); c.bezierCurveTo(10, 14, 14, 12.5, 14.5, 15);
    c.bezierCurveTo(14.8, 17, 11, 17.5, 9.5, 15.5); c.stroke();
  },
  lock: (c) => {
    c.beginPath(); c.rect(5, 11, 14, 10); c.stroke();
    c.beginPath(); c.moveTo(8, 11); c.lineTo(8, 8); c.bezierCurveTo(8, 3.5, 16, 3.5, 16, 8); c.lineTo(16, 11); c.stroke();
  },
  check: (c) => { c.beginPath(); c.moveTo(4, 13); c.lineTo(9.5, 18.5); c.lineTo(20, 6); c.stroke(); },
  cross: (c) => { c.beginPath(); c.moveTo(6, 6); c.lineTo(18, 18); c.moveTo(18, 6); c.lineTo(6, 18); c.stroke(); },
  news: (c) => {
    c.beginPath(); c.rect(3, 5, 15, 15); c.stroke();
    c.beginPath(); c.moveTo(18, 9); c.lineTo(21, 9); c.lineTo(21, 18);
    c.bezierCurveTo(21, 20, 18, 20, 18, 18); c.stroke();
    c.beginPath(); c.moveTo(6, 9); c.lineTo(15, 9); c.moveTo(6, 13); c.lineTo(15, 13); c.moveTo(6, 16); c.lineTo(11, 16); c.stroke();
  },
  target: (c) => {
    c.beginPath(); c.arc(12, 12, 8, 0, Math.PI * 2); c.moveTo(16, 12); c.arc(12, 12, 4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(12, 1.5); c.lineTo(12, 5); c.moveTo(12, 19); c.lineTo(12, 22.5);
    c.moveTo(1.5, 12); c.lineTo(5, 12); c.moveTo(19, 12); c.lineTo(22.5, 12); c.stroke();
  },
  back: (c) => { c.beginPath(); c.moveTo(20, 12); c.lineTo(5, 12); c.moveTo(11, 6); c.lineTo(5, 12); c.lineTo(11, 18); c.stroke(); },
  map: (c) => {
    c.beginPath(); c.moveTo(3, 6); c.lineTo(9, 3); c.lineTo(15, 6); c.lineTo(21, 3);
    c.lineTo(21, 18); c.lineTo(15, 21); c.lineTo(9, 18); c.lineTo(3, 21); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(9, 3); c.lineTo(9, 18); c.moveTo(15, 6); c.lineTo(15, 21); c.stroke();
  },
  streak: (c) => {
    c.beginPath(); c.moveTo(4, 18); c.lineTo(8, 12); c.lineTo(12, 15); c.lineTo(16, 7); c.lineTo(20, 10); c.stroke();
    c.beginPath(); c.arc(16, 7, 1.6, 0, Math.PI * 2); c.stroke();
  },
  sound: (c) => {
    c.beginPath(); c.moveTo(4, 9); c.lineTo(8, 9); c.lineTo(13, 5); c.lineTo(13, 19); c.lineTo(8, 15); c.lineTo(4, 15); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(16, 9); c.bezierCurveTo(18.5, 12, 18.5, 12, 16, 15); c.stroke();
  },
};

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

/** Растеризация иконки в текстуру `ic-<name>-<size>`. */
export function makeIcon(scene: Scene, name: IconName, size = 24, color = '#ffffff', lw = 2) {
  const key = `ic-${name}-${size}-${color}`;
  if (scene.textures.exists(key)) return key;
  const dpr = 2;
  const { tex, ctx } = ctxOf(scene, key, size * dpr, size * dpr);
  ctx.scale((size * dpr) / 24, (size * dpr) / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ICONS[name](ctx);
  tex.refresh();
  return key;
}

/** Единый вызов из BootScene. */
export function buildAllTextures(scene: Scene) {
  makeGrain(scene);
  makePaper(scene);
  makeHalftone(scene);
  makeVignette(scene, 'tx-vignette', 1600, 900);
  makeScratches(scene);
  makeSpark(scene);
  makeDust(scene);
}
