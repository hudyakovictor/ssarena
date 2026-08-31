/**
 * ARENA — ядро игры. TradingView-точность + Hearthstone-драматургия.
 * Петля: досье раунда → чтение графика → выбор LONG/SHORT/WAIT под таймер →
 * раскрытие будущего → вердикт голосом системы → разбор ошибки.
 */
import Phaser from 'phaser';
import { PALETTE, DISTRICT, FONT, MOTION, hex, mix } from '../core/theme';
import { makeIcon } from '../core/textures';
import { generateScenario, Scenario, Answer, dailySeed } from '../core/scenario';
import { store, getState } from '../core/store';
import { VERDICT, HEADLINES } from '../content/lore';
import { Panel, Button, text, kicker, chip, Meter, toast } from '../ui/kit';
import { CandleChart } from '../ui/CandleChart';
import { backButton } from '../ui/nav';

const ROUND_TIME = 25_000;

export class ArenaScene extends Phaser.Scene {
  private sc!: Scenario;
  private chart!: CandleChart;
  private timerMeter!: Meter;
  private timerText!: Phaser.GameObjects.Text;
  private timerEvent?: Phaser.Time.TimerEvent;
  private buttons: Button[] = [];
  private roundNo = 1;
  private locked = false;
  private questionText!: Phaser.GameObjects.Text;
  private headlineText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private combo = 0;
  private startedAt = 0;

  constructor() { super('arena'); }

  create() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setBackgroundColor(hex(PALETTE.void));
    this.cameras.main.fadeIn(MOTION.base);
    this.drawBackdrop(w, h);

    const d = DISTRICT.arena;
    const hl = HEADLINES.arena;
    backButton(this, 'city');

    kicker(this, 96, 84, hl.kicker, d.color);
    text(this, 94, 98, hl.title, 'h1', PALETTE.paper).setLetterSpacing(1);

    // ── ставка/раунд справа сверху ──
    this.comboText = text(this, w - 32, 92, '', 'h2', PALETTE.gold).setOrigin(1, 0);

    // ── левая колонка: досье раунда ──
    const railW = 250;
    const rail = new Panel(this, 28, 150, railW, h - 200, { accent: PALETTE.edge, fill: PALETTE.slab });
    void rail;
    kicker(this, 46, 168, 'досье раунда', PALETTE.inkDim);
    this.headlineText = text(this, 46, 186, '', 'h3', PALETTE.paper, { wordWrap: { width: railW - 36 }, lineSpacing: 4 });
    this.questionText = text(this, 46, 264, '', 'small', PALETTE.inkSoft, { wordWrap: { width: railW - 36 }, lineSpacing: 5 });

    // ── график ──
    const chartX = 28 + railW + 24;
    const chartW = w - chartX - 28;
    const chartH = h - 150 - 168;
    const frame = new Panel(this, chartX, 150, chartW, chartH + 12, { accent: PALETTE.edge, fill: PALETTE.abyss });
    void frame;
    this.chart = new CandleChart(this, chartX + 12, 162, { w: chartW - 24, h: chartH - 12 });

    // ── таймер ──
    this.timerMeter = new Meter(this, chartX, h - 158, chartW, 4, PALETTE.gold, 1);
    this.timerText = text(this, chartX + chartW, h - 176, '25.0', 'data', PALETTE.gold).setOrigin(1, 0);
    kicker(this, chartX, h - 176, 'окно решения', PALETTE.inkDim);

    // ── кнопки решения (Hearthstone-карты действий) ──
    this.buildActions(chartX, h - 138, chartW);

    this.nextRound();
  }

  private drawBackdrop(w: number, h: number) {
    const g = this.add.graphics();
    g.fillStyle(PALETTE.void, 1); g.fillRect(0, 0, w, h);
    // «трибуны» — намёк на арену: дуги света сверху
    for (let i = 0; i < 5; i++) {
      g.lineStyle(1, PALETTE.short, 0.05 + i * 0.01);
      g.beginPath(); g.arc(w / 2, -h * 0.6, h * (0.9 + i * 0.12), 0.2, Math.PI - 0.2); g.strokePath();
    }
    this.add.tileSprite(0, 0, w, h, 'tx-scratch').setOrigin(0).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD);
  }

  private buildActions(x: number, y: number, w: number) {
    const defs: { a: Answer; label: string; sub: string; color: number; icon: any }[] = [
      { a: 'long', label: 'LONG', sub: 'Верю в рост', color: PALETTE.long, icon: 'long' },
      { a: 'wait', label: 'WAIT', sub: 'Не мой рынок', color: PALETTE.gold, icon: 'wait' },
      { a: 'short', label: 'SHORT', sub: 'Верю в падение', color: PALETTE.short, icon: 'short' },
    ];
    const gap = 16;
    const bw = (w - gap * 2) / 3;
    defs.forEach((d, i) => {
      const b = new Button(this, x + i * (bw + gap), y, d.label, () => this.answer(d.a), {
        w: bw, h: 62, icon: d.icon, accent: d.color, variant: 'ghost',
      });
      text(this, x + i * (bw + gap) + (bw / 2), y + 44, d.sub, 'micro', PALETTE.inkDim).setOrigin(0.5);
      this.buttons.push(b);
    });
    // горячие клавиши — уважение к трейдерской моторике
    this.input.keyboard?.on('keydown-ONE', () => this.answer('long'));
    this.input.keyboard?.on('keydown-TWO', () => this.answer('wait'));
    this.input.keyboard?.on('keydown-THREE', () => this.answer('short'));
  }

  private nextRound() {
    this.locked = false;
    this.buttons.forEach((b) => b.setDisabled(false));
    this.sc = generateScenario(`${dailySeed()}-r${this.roundNo}-${getState().rating}`, Math.min(5, 1 + Math.floor(this.roundNo / 2)) as any);
    const cut = this.sc.candles.length - this.sc.reveal;
    this.chart.setSeries(this.sc.candles, cut).playIn(700);
    this.headlineText.setText(this.sc.headline.toUpperCase());
    this.questionText.setText(this.sc.question);
    this.comboText.setText(`РАУНД ${this.roundNo}${this.combo > 1 ? `  ·  СЕРИЯ ×${this.combo}` : ''}`);

    this.startedAt = this.time.now;
    this.timerEvent?.remove();
    this.timerEvent = this.time.addEvent({
      delay: 50, loop: true, callback: () => {
        const left = Math.max(0, ROUND_TIME - (this.time.now - this.startedAt));
        this.timerMeter.set(left / ROUND_TIME, false);
        this.timerText.setText((left / 1000).toFixed(1));
        if (left < 6000) this.timerText.setColor(hex(PALETTE.short));
        else this.timerText.setColor(hex(PALETTE.gold));
        if (left <= 0) { this.timerEvent?.remove(); this.answer('wait', true); }
      },
    });
  }

  private answer(a: Answer, timeout = false) {
    if (this.locked) return;
    this.locked = true;
    this.timerEvent?.remove();
    this.buttons.forEach((b) => b.setDisabled(true));

    const win = a === this.sc.answer;
    this.combo = win ? this.combo + 1 : 0;
    const xp = 40 + this.sc.difficulty * 15 + this.combo * 10;
    const sig = win ? 20 + this.sc.difficulty * 6 : 0;
    store.getState().answer(win, xp, sig);
    this.game.events.emit('sfx', win ? 'win' : 'lose');

    this.chart.revealFuture(() => {
      this.chart.flash(win);
      this.showVerdict(win, timeout, xp, sig);
    });
  }

  private showVerdict(win: boolean, timeout: boolean, xp: number, sig: number) {
    const w = this.scale.width, h = this.scale.height;
    const color = win ? PALETTE.long : PALETTE.short;
    const veil = this.add.graphics().setDepth(200);
    veil.fillStyle(PALETTE.void, 0.72); veil.fillRect(0, 0, w, h);

    const cw = 620, ch = 300;
    const c = this.add.container(w / 2, h / 2 + 20).setDepth(201).setAlpha(0);
    const p = new Panel(this, -cw / 2, -ch / 2, cw, ch, { accent: color, fill: PALETTE.abyss, cut: 18 });
    c.add(p);

    // «печать» вердикта
    const stampText = win ? 'ПРИНЯТО' : timeout ? 'ПРОСРОЧЕНО' : 'ОТКЛОНЕНО';
    const stamp = this.add.container(cw / 2 - 96, -ch / 2 + 56);
    const sg = this.add.graphics();
    sg.lineStyle(3, color, 0.85); sg.strokeRect(-58, -18, 116, 36);
    const st = this.add.text(0, 0, stampText, {
      fontFamily: FONT.display, fontSize: '15px', fontStyle: '700', color: hex(color),
    }).setOrigin(0.5).setLetterSpacing(2);
    stamp.add([sg, st]); stamp.setAngle(-9).setScale(2.4).setAlpha(0);
    c.add(stamp);
    this.tweens.add({ targets: stamp, scale: 1, alpha: 1, duration: MOTION.base, ease: 'Back.easeIn', delay: 120 });

    const pool = timeout ? VERDICT.skip : win ? VERDICT.win : VERDICT.lose;
    const line = pool[Math.floor(Math.random() * pool.length)];

    c.add(kicker(this, -cw / 2 + 26, -ch / 2 + 26, win ? 'рынок согласился' : 'рынок не согласился', color));
    c.add(text(this, -cw / 2 + 24, -ch / 2 + 44, line, 'h2', PALETTE.paper, { wordWrap: { width: cw - 190 }, lineSpacing: 4 }));

    // разбор — обучающая ценность
    const eg = this.add.graphics();
    eg.fillStyle(PALETTE.slab, 0.9); eg.fillRect(-cw / 2 + 24, -ch / 2 + 120, cw - 48, 78);
    eg.fillStyle(color, 1); eg.fillRect(-cw / 2 + 24, -ch / 2 + 120, 3, 78);
    c.add(eg);
    c.add(kicker(this, -cw / 2 + 38, -ch / 2 + 132, 'разбор', PALETTE.inkDim));
    c.add(text(this, -cw / 2 + 38, -ch / 2 + 148, this.sc.explain, 'small', PALETTE.paperDim, { wordWrap: { width: cw - 84 }, lineSpacing: 5 }));

    // награды
    const rw = this.add.container(-cw / 2 + 24, ch / 2 - 74);
    rw.add(chip(this, 0, 0, `+${win ? xp : Math.round(xp * 0.25)} XP`, PALETTE.signal));
    rw.add(chip(this, 110, 0, `+${sig} $SIG`, PALETTE.gold));
    if (this.combo > 1) rw.add(chip(this, 220, 0, `серия ×${this.combo}`, PALETTE.amber, true));
    c.add(rw);

    const next = new Button(this, cw / 2 - 210, ch / 2 - 62, 'следующий раунд', () => {
      this.tweens.add({
        targets: [c, veil], alpha: 0, duration: MOTION.fast,
        onComplete: () => { c.destroy(); veil.destroy(); this.roundNo++; this.nextRound(); },
      });
    }, { w: 190, h: 44, accent: color, variant: 'solid', icon: 'bolt' });
    c.add(next);

    this.tweens.add({ targets: c, alpha: 1, y: h / 2, duration: MOTION.base, ease: MOTION.ease });

    if (win) {
      this.add.particles(w / 2, h / 2 - 60, 'tx-spark', {
        speed: { min: 120, max: 420 }, lifespan: 900, quantity: 26,
        scale: { start: 0.5, end: 0 }, tint: [PALETTE.long, PALETTE.gold],
        blendMode: 'ADD', emitting: false,
      }).setDepth(202).explode(26);
    }
    if (getState().lives === 0) {
      toast(this, 'Терпение закончилось. Департамент рекомендует прогулку.', PALETTE.short);
    }
  }
}
