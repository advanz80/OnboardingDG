// Herbruikbare koppelingspuzzel (gebruikt door IJk en de finale).
import Phaser from 'phaser';
import { P, HEX, textStyle } from '../../gfx/palette.js';
import { Audio } from '../../core/AudioEngine.js';
import { burst } from '../../core/Juice.js';
import { makeTexture, rrect, circle, style } from '../../gfx/draw.js';

const N = 1, E = 2, S = 4, W = 8;
export const rot = (m) => ((m << 1) | (m >> 3)) & 15;
const DIRS = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
const CANON = { end: 1, straight: 5, corner: 3, tee: 7, cross: 15 };
export const CELL = 84;

function pieceOf(mask) {
  for (const [name, c] of Object.entries(CANON)) {
    let m = c;
    for (let r = 0; r < 4; r++) { if (m === mask) return { name, r }; m = rot(m); }
  }
  return { name: 'cross', r: 0 };
}

export function makePipeTextures(scene) {
  if (scene.textures.exists('pipe_straight')) return;
  makeTexture(scene, 'pipe_bg', CELL, CELL, (c) => {
    rrect(c, 3, 3, CELL - 6, CELL - 6, 12); style(c, { fill: '#1d3557', stroke: '#0e1f33', lw: 3 });
    c.fillStyle = 'rgba(255,255,255,0.05)'; rrect(c, 8, 8, CELL - 16, 12, 6); c.fill();
  });
  makeTexture(scene, 'belt', 64, 36, (c) => {
    c.fillStyle = '#3b3f55'; c.fillRect(0, 0, 64, 36);
    c.fillStyle = '#565b78'; for (let x = -36; x < 64; x += 16) { c.beginPath(); c.moveTo(x, 36); c.lineTo(x + 8, 36); c.lineTo(x + 44, 0); c.lineTo(x + 36, 0); c.closePath(); c.fill(); }
  });
  const h = CELL / 2;
  const ends = { N: [h, 0], E: [CELL, h], S: [h, CELL], W: [0, h] };
  const draw = (key, dirs) => makeTexture(scene, key, CELL, CELL, (c) => {
    c.lineCap = 'butt';
    for (const [col, lw] of [[P.ink, 30], ['#ffffff', 20]]) {
      for (const d of dirs) { c.beginPath(); c.moveTo(h, h); c.lineTo(...ends[d]); c.strokeStyle = col; c.lineWidth = lw; c.stroke(); }
      circle(c, h, h, lw / 2); c.fillStyle = col; c.fill();
    }
    for (const d of dirs) {
      const v = d === 'N' || d === 'S';
      const p = { N: [h, 6], E: [CELL - 6, h], S: [h, CELL - 6], W: [6, h] }[d];
      c.fillStyle = P.ink; c.fillRect(p[0] - (v ? 16 : 3), p[1] - (v ? 3 : 16), v ? 32 : 6, v ? 6 : 32);
    }
  });
  draw('pipe_end', ['N']);
  draw('pipe_straight', ['N', 'S']);
  draw('pipe_corner', ['N', 'E']);
  draw('pipe_tee', ['N', 'E', 'S']);
  draw('pipe_cross', ['N', 'E', 'S', 'W']);
}

/**
 * opts: { w, h, sources:[rij], target: rij, cx, cy, flow, idle, sourceIcons:[frame], sourceLabels:[tekst],
 *         targetIcon, targetLabel, depth, onSolved(info) }
 */
export class PipePuzzle {
  constructor(scene, opts) {
    this.scene = scene;
    this.o = { flow: 0x4fd1ff, idle: 0xb9bccb, depth: 10, ...opts };
    makePipeTextures(scene);
    this.moves = 0;
    this.solved = false;
    this.enabled = true;
    this.generate();
    this.build();
    this.updateFlow();
  }

  generate() {
    const { w, h, sources, target } = this.o;
    const sol = Array.from({ length: h }, () => Array(w).fill(0));
    const inNet = Array.from({ length: h }, () => Array(w).fill(false));
    inNet[target][w - 1] = true;
    sol[target][w - 1] |= E;
    for (const sy of sources) {
      sol[sy][0] |= W;
      if (inNet[sy][0]) continue;
      const cost = Array.from({ length: h }, () => Array.from({ length: w }, () => 1 + Math.random() * 4));
      const dist = Array.from({ length: h }, () => Array(w).fill(Infinity));
      const prev = Array.from({ length: h }, () => Array(w).fill(null));
      dist[sy][0] = 0;
      const open = [[0, sy]];
      let found = null;
      while (open.length) {
        open.sort((a, b) => dist[a[1]][a[0]] - dist[b[1]][b[0]]);
        const [x, y] = open.shift();
        if (inNet[y][x]) { found = [x, y]; break; }
        for (const [, dx, dy] of DIRS) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nd = dist[y][x] + cost[ny][nx];
          if (nd < dist[ny][nx]) { dist[ny][nx] = nd; prev[ny][nx] = [x, y]; open.push([nx, ny]); }
        }
      }
      let cur = found;
      while (cur && prev[cur[1]][cur[0]]) {
        const [x, y] = cur, [px, py] = prev[y][x];
        const d = DIRS.find(([, dx, dy]) => px + dx === x && py + dy === y);
        sol[py][px] |= d[0];
        sol[y][x] |= d[3];
        inNet[py][px] = true; inNet[y][x] = true;
        cur = [px, py];
      }
      inNet[sy][0] = true;
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!sol[y][x]) {
        let m = Phaser.Utils.Array.GetRandom([5, 3, 3, 7]);
        for (let r = Phaser.Math.Between(0, 3); r > 0; r--) m = rot(m);
        sol[y][x] = m;
      }
    }
    this.sol = sol; this.inNet = inNet;
  }

  build() {
    const s = this.scene, o = this.o;
    const bw = o.w * CELL, bh = o.h * CELL;
    const ox = o.cx - bw / 2, oy = o.cy - bh / 2;
    this.container = s.add.container(0, 0).setDepth(o.depth);
    this.container.add(s.add.rectangle(o.cx, o.cy, bw + 24, bh + 24, 0x0e1f33).setStrokeStyle(5, HEX.ink));
    this.cells = [];
    let minMoves = 0;
    for (let y = 0; y < o.h; y++) {
      this.cells.push([]);
      for (let x = 0; x < o.w; x++) {
        let m = this.sol[y][x];
        const spins = this.inNet[y][x] ? Phaser.Math.Between(1, 3) : Phaser.Math.Between(0, 3);
        for (let r = 0; r < spins; r++) m = rot(m);
        if (this.inNet[y][x]) { let k = 0, t = m; while (t !== this.sol[y][x] && k < 4) { t = rot(t); k++; } minMoves += k; }
        const cx = ox + x * CELL + CELL / 2, cy = oy + y * CELL + CELL / 2;
        const bg = s.add.image(cx, cy, 'pipe_bg');
        const pc = pieceOf(m);
        const spr = s.add.image(cx, cy, `pipe_${pc.name}`).setAngle(pc.r * 90).setTint(o.idle);
        const cell = { x, y, m, spr, bg };
        bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.rotateCell(cell));
        this.container.add([bg, spr]);
        this.cells[y].push(cell);
        bg.setScale(0); spr.setScale(0);
        s.tweens.add({ targets: [bg, spr], scale: 1, delay: (x + y) * 35, duration: 250, ease: 'Back.Out' });
      }
    }
    this.minMoves = minMoves;
    this.sourceObjs = o.sources.map((sy, i) => {
      const c = s.add.container(ox - 70, oy + sy * CELL + CELL / 2);
      c.add(s.add.rectangle(36, 0, 50, 18, o.flow).setStrokeStyle(4, HEX.ink));
      c.add(s.add.circle(0, 0, 40, 0xffffff).setStrokeStyle(4, HEX.ink));
      c.add(s.add.image(0, 0, 'icons', o.sourceIcons[i]).setDisplaySize(52, 52));
      if (o.sourceLabels) c.add(s.add.text(-50, 0, o.sourceLabels[i], textStyle(22, P.cream, { stroke: P.ink, strokeThickness: 5, align: 'right' })).setOrigin(1, 0.5));
      this.container.add(c);
      return c;
    });
    const tgt = s.add.container(ox + bw + 70, oy + o.target * CELL + CELL / 2);
    this.tgtPipe = s.add.rectangle(-36, 0, 50, 18, o.idle).setStrokeStyle(4, HEX.ink);
    tgt.add(this.tgtPipe);
    tgt.add(s.add.nineslice(0, 0, 'ui_card', undefined, 96, 110, 18, 18, 18, 18).setTint(0xeaf6ff));
    tgt.add(s.add.image(0, -12, 'icons', o.targetIcon).setDisplaySize(60, 60));
    tgt.add(s.add.text(0, 36, o.targetLabel, textStyle(19, P.ink, { stroke: '#ffffff', strokeThickness: 4 })).setOrigin(0.5));
    this.tgt = tgt;
    this.container.add(tgt);
  }

  rotateCell(cell) {
    if (!this.enabled || this.solved) return;
    cell.m = rot(cell.m);
    this.moves++;
    Audio.sfx('rotate');
    this.scene.tweens.add({ targets: cell.spr, angle: cell.spr.angle + 90, duration: 110, ease: 'Quad.Out', onComplete: () => this.updateFlow() });
  }

  bfs(starts) {
    const { w, h } = this.o;
    const seen = Array.from({ length: h }, () => Array(w).fill(false));
    const q = [];
    for (const [x, y] of starts) { seen[y][x] = true; q.push([x, y]); }
    while (q.length) {
      const [x, y] = q.shift();
      const m = this.cells[y][x].m;
      for (const [bit, dx, dy, opp] of DIRS) {
        if (!(m & bit)) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[ny][nx]) continue;
        if (this.cells[ny][nx].m & opp) { seen[ny][nx] = true; q.push([nx, ny]); }
      }
    }
    return seen;
  }

  updateFlow() {
    const { w, h, sources, target } = this.o;
    const flow = this.bfs(sources.filter((sy) => this.cells[sy][0].m & W).map((sy) => [0, sy]));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) this.cells[y][x].spr.setTint(flow[y][x] ? this.o.flow : this.o.idle);
    let ok = false, reach = null;
    if (this.cells[target][w - 1].m & E) {
      reach = this.bfs([[w - 1, target]]);
      ok = sources.every((sy) => reach[sy][0] && (this.cells[sy][0].m & W));
    }
    this.tgtPipe.setFillStyle(ok ? this.o.flow : this.o.idle);
    if (ok && !this.solved) this.onSolved(reach);
  }

  onSolved(reach) {
    this.solved = true;
    Audio.sfx('flow');
    for (let y = 0; y < this.o.h; y++) for (let x = 0; x < this.o.w; x++) {
      if (!reach[y][x]) continue;
      const c = this.cells[y][x];
      this.scene.time.delayedCall((x + Math.abs(y - this.o.target)) * 60, () => {
        burst(this.scene, c.spr.x, c.spr.y, 'splash', 4, { tint: [this.o.flow, 0xffffff] });
        this.scene.tweens.add({ targets: c.spr, scale: 1.15, duration: 120, yoyo: true });
      });
    }
    this.o.onSolved?.({ moves: this.moves, extra: Math.max(0, this.moves - this.minMoves) });
  }

  /** Voor tests/debug: los de puzzel direct op. */
  autoSolve() {
    for (let y = 0; y < this.o.h; y++) for (let x = 0; x < this.o.w; x++) {
      const c = this.cells[y][x];
      if (!this.inNet[y][x]) continue;
      let k = 0;
      while (c.m !== this.sol[y][x] && k < 4) { this.rotateCell(c); k++; }
    }
  }

  destroy() { this.container.destroy(); }
}
