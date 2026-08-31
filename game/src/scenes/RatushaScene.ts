/**
 * РАТУША — личное дело игрока: профиль, статистика, журнал ошибок, лига.
 * Подача: официальный документ департамента, который слегка тебя осуждает.
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { HEADLINES, RANKS } from '../content/lore';
import { getState, accuracy, rankOf } from '../core/store';
import { Panel, text, kicker, chip, Meter } from '../ui/kit';
import { backButton } from '../ui/nav';

const JOURNAL = [
  { when: 'сегодня', what: 'Вошёл в позицию на третьей зелёной свече', verdict: 'FOMO', color: PALETTE.short },
  { when: 'вчера', what: 'Передержал прибыль до полного возврата', verdict: 'Жадность', color: PALETTE.short },
  { when: '2 дня', what: 'Пропустил ловушку пробоя. Остался вне рынка', verdict: 'Дисциплина', color: PALETTE.long },
  { when: '3 дня', what: 'Снизил риск перед новостью', verdict: 'Расчёт', color: PALETTE.long },
  { when: '4 дня', what: 'Удвоил размер после серии побед', verdict: 'Гордыня', color: PALETTE.short },
];

const LEAGUE = [
  { n: 'Кит-в-отпуске', r: 2140 }, { n: 'Тихий Лимит', r: 1890 },
  { n: 'Аноним #4417', r: 0 }, { n: 'Плечо-на-двоих', r: 1042 }, { n: 'Стоп-лосс Сергей', r: 980 },
];

export class RatushaScene extends Phaser.Scene {
  constructor() { super('ratusha'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    const d = DISTRICT.ratusha;
    const s = getState();
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.void, 1); bg.fillRect(0, 0, w, h);
    bg.lineStyle(1, d.color, 0.03);
    for (let y = 0; y < h; y += 24) { bg.beginPath(); bg.moveTo(0, y); bg.lineTo(w, y); bg.strokePath(); }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD);
    backButton(this);

    const hl = HEADLINES.ratusha;
    kicker(this, 96, 84, hl.kicker, d.color);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);

    const colW = (w - 84) / 3;

    // ── карточка личности ──
    const ph = 250;
    new Panel(this, 28, 156, colW, ph, { accent: d.color, fill: PALETTE.slab });
    const av = this.add.graphics();
    av.fillStyle(mix(d.color, PALETTE.void, 0.7), 1); av.fillRect(52, 180, 84, 84);
    av.lineStyle(1.5, d.color, 0.9); av.strokeRect(52, 180, 84, 84);
    for (let i = 0; i < 5; i++) { av.lineStyle(1, d.color, 0.15); av.strokeCircle(94, 222, 12 + i * 8); }
    this.add.image(94, 222, makeIcon(this, 'ratusha', 40, hex(d.color)));
    kicker(this, 152, 182, 'гражданин', PALETTE.inkDim);
    text(this, 150, 196, s.name, 'h2', PALETTE.paper);
    const r = rankOf(s.xp);
    this.add.existing(chip(this, 152, 240, r.cur.name, d.color, true));
    text(this, 152, 254, `${s.xp} XP`, 'data', PALETTE.inkSoft);
    kicker(this, 52, 288, `до ранга «${r.next?.name ?? 'предел'}»`, PALETTE.inkDim);
    new Meter(this, 52, 302, colW - 56, 6, d.color, r.pct);
    text(this, 52, 320, RANKS[Math.min(RANKS.length - 1, r.index)].name, 'small', PALETTE.paperDim);
    text(this, 52, 344, 'Система помнит каждое решение. Особенно плохие.', 'small', PALETTE.inkDim, { wordWrap: { width: colW - 56 } });

    // ── статистика ──
    const sx = 28 + colW + 14;
    new Panel(this, sx, 156, colW, ph, { accent: PALETTE.edge, fill: PALETTE.slab });
    kicker(this, sx + 18, 172, 'сводка департамента', PALETTE.inkDim);
    const stats: [string, string, number][] = [
      ['Раундов сыграно', String(s.played), PALETTE.paper],
      ['Верных решений', String(s.correct), PALETTE.long],
      ['Точность', `${accuracy()}%`, accuracy() >= 55 ? PALETTE.long : PALETTE.short],
      ['Рейтинг арены', String(s.rating), PALETTE.signal],
      ['Серия дней', `${s.streak}`, PALETTE.amber],
      ['Баланс', `${s.sig} $SIG`, PALETTE.gold],
    ];
    stats.forEach((st, i) => {
      const y = 196 + i * 32;
      this.add.text(sx + 18, y, st[0], { fontFamily: FONT.body, fontSize: '12px', color: hex(PALETTE.inkSoft) });
      this.add.text(sx + colW - 18, y - 2, st[1], {
        fontFamily: FONT.mono, fontSize: '15px', fontStyle: '700', color: hex(st[2]),
      }).setOrigin(1, 0);
      const line = this.add.graphics();
      line.lineStyle(1, PALETTE.edge, 0.5);
      line.beginPath(); line.moveTo(sx + 18, y + 22); line.lineTo(sx + colW - 18, y + 22); line.strokePath();
    });

    // ── лига ──
    const lx = 28 + (colW + 14) * 2;
    new Panel(this, lx, 156, colW, ph, { accent: PALETTE.gold, fill: PALETTE.slab });
    kicker(this, lx + 18, 172, 'лига · текущий сезон', PALETTE.gold);
    const league = LEAGUE.map((p) => (p.r === 0 ? { ...p, r: s.rating, me: true } : { ...p, me: false }))
      .sort((a, b) => b.r - a.r);
    league.forEach((p, i) => {
      const y = 198 + i * 36;
      if (p.me) {
        const hg = this.add.graphics();
        hg.fillStyle(PALETTE.gold, 0.1); hg.fillRect(lx + 10, y - 6, colW - 20, 30);
        hg.fillStyle(PALETTE.gold, 1); hg.fillRect(lx + 10, y - 6, 3, 30);
      }
      this.add.text(lx + 22, y, `${i + 1}`, { fontFamily: FONT.mono, fontSize: '12px', color: hex(i < 3 ? PALETTE.gold : PALETTE.inkDim) });
      this.add.text(lx + 46, y, p.n, {
        fontFamily: FONT.body, fontSize: '13px', fontStyle: p.me ? '700' : '400',
        color: hex(p.me ? PALETTE.paper : PALETTE.inkSoft),
      });
      this.add.text(lx + colW - 20, y, String(p.r), {
        fontFamily: FONT.mono, fontSize: '13px', color: hex(p.me ? PALETTE.gold : PALETTE.inkDim),
      }).setOrigin(1, 0);
    });

    // ── журнал ошибок ──
    const jy = 156 + ph + 22;
    new Panel(this, 28, jy, w - 56, h - jy - 28, { accent: PALETTE.short, fill: PALETTE.slab });
    kicker(this, 46, jy + 16, 'журнал ошибок · рынок принял твои решения', PALETTE.short);
    JOURNAL.forEach((j, i) => {
      const y = jy + 44 + i * 30;
      if (y > h - 50) return;
      this.add.text(46, y, j.when.toUpperCase(), { fontFamily: FONT.mono, fontSize: '10px', color: hex(PALETTE.inkDim) }).setLetterSpacing(1.5);
      this.add.text(140, y - 2, j.what, { fontFamily: FONT.body, fontSize: '13px', color: hex(PALETTE.paperDim) });
      const c = chip(this, w - 60, y + 5, j.verdict, j.color, false);
      c.setX(w - 60 - (c as any).w);
      this.add.existing(c);
    });
  }
}
