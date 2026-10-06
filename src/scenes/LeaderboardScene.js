import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle, titleStyle } from '../gfx/palette.js';
import { Leaderboard, formatTime, sameEntry } from '../core/Leaderboard.js';
import { panel, button, transitionTo } from '../ui/widgets.js';
import { acTitle } from '../gfx/tex/logo.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  init(data) { this.highlight = data?.highlight; }

  async create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 15, 61, 92);
    // lucht en gras, zoals op het startscherm
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x6fd3ff, 0x6fd3ff, 0xcfefff, 0xcfefff, 1).fillRect(0, 0, width, height * 0.62);
    bg.fillStyle(0x7cc95a).fillRect(0, height * 0.62, width, height * 0.38);
    bg.fillStyle(0x6ab84c).fillEllipse(width * 0.25, height * 0.63, width * 0.7, 80).fillEllipse(width * 0.8, height * 0.64, width * 0.6, 70);
    acTitle(this, width / 2, 62, t('leaderboard.title'), 62);
    panel(this, width / 2, 380, 820, 520);
    const cols = [width / 2 - 340, width / 2 - 270, width / 2 + 170, width / 2 + 340];
    this.add.text(cols[1], 155, t('leaderboard.name'), textStyle(22, P.inkSoft)).setOrigin(0, 0.5);
    this.add.text(cols[2], 155, t('leaderboard.score'), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    this.add.text(cols[3], 155, t('leaderboard.time'), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    button(this, width / 2, height - 52, t('leaderboard.back'), () => transitionTo(this, 'Menu'), { width: 260, color: HEX.cream, icon: 'home' });
    const loading = this.add.text(width / 2, 380, t('leaderboard.loading'), textStyle(26, P.inkSoft)).setOrigin(0.5);
    const all = await Leaderboard.top(100);
    const list = all.slice(0, 10);
    if (!this.sys.isActive()) return; // scène al verlaten tijdens het laden
    loading.destroy();
    // waar komen de scores vandaan?
    const src = Leaderboard.lastSource === 'online' ? t('leaderboard.online') : Leaderboard.shared ? t('leaderboard.offline') : t('leaderboard.localOnly');
    this.add.text(width / 2, 112, src, textStyle(20, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5);
    if (!list.length) {
      this.add.text(width / 2, 380, t('leaderboard.empty'), textStyle(26, P.inkSoft, { align: 'center', wordWrap: { width: 600 } })).setOrigin(0.5);
      return;
    }
    // eigen plek buiten de top 10? Dan top 9 + "…" + jouw regel
    const myIdx = this.highlight ? all.findIndex((e) => sameEntry(e, this.highlight)) : -1;
    const rows = list.map((e, i) => ({ e, i }));
    if (myIdx >= 10) { rows.splice(9, 1, { gap: true }, { e: all[myIdx], i: myIdx }); }
    rows.forEach(({ e, i, gap }, k) => {
      const y = 196 + k * 40;
      if (gap) { this.add.text(width / 2, y - 6, '• • •', textStyle(24, P.inkSoft)).setOrigin(0.5); return; }
      const me = sameEntry(e, this.highlight);
      if (me) {
        const bar = this.add.rectangle(width / 2, y, 780, 38, HEX.gold, 0.55).setStrokeStyle(3, HEX.ink);
        this.tweens.add({ targets: bar, alpha: 0.35, duration: 600, yoyo: true, repeat: -1 });
        this.add.text(cols[0] - 44, y, '▶', textStyle(26, P.red)).setOrigin(0.5);
      }
      const col = i < 3 ? [P.gold, '#9aa3b5', '#c47a3f'][i] : P.ink;
      this.add.text(cols[0], y, `${i + 1}`, textStyle(24, col, { stroke: i < 3 ? P.ink : undefined, strokeThickness: i < 3 ? 4 : 0 })).setOrigin(0, 0.5);
      const nm = this.add.text(cols[1], y, String(e.name).slice(0, 20), textStyle(24, P.ink)).setOrigin(0, 0.5);
      const extra = [e.org, me ? `← ${t('leaderboard.you')}` : ''].filter(Boolean).join('  ');
      if (extra) this.add.text(nm.x + nm.width + 12, y + 2, extra, textStyle(17, me ? P.ink : P.inkSoft)).setOrigin(0, 0.5);
      this.add.text(cols[2], y, `${e.score}`, textStyle(24, P.ink)).setOrigin(1, 0.5);
      this.add.text(cols[3], y, formatTime(e.timeMs), textStyle(22, P.inkSoft)).setOrigin(1, 0.5);
    });
  }

  update(_t, dt) { if (this.waves) this.waves.tilePositionX += dt * 0.02; }
}
