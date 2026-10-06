// Achtergronden voor missies, finale, menu en aftiteling in Animal Crossing-stijl:
// zachte wolken, kasseien, zand met ribbels en schelpjes, houten planken met nerf.
// Alles wordt éénmalig op een canvas getekend (goedkoop op telefoons).
import { P, shade } from '../palette.js';
import { rrect, circle, ellipse, star, makeTexture, rng } from '../draw.js';
import { flower } from '../../world/terrain.js';

const W = 1280, H = 720;
const FLOWER_COLS = ['#ff8fb1', '#ffffff', '#ffd23f', '#b48cff', '#ff6b6b'];

// ── Bouwstenen ──────────────────────────────────────────────────────────────

/** Bolle AC-wolk zonder harde contour, met zachte schaduwkant. */
export function cloud(c, x, y, s = 1, tint = '#ffffff', under = 'rgba(150,190,225,0.55)') {
  const puffs = [[-46, 8, 24], [-20, -8, 32], [14, -16, 34], [44, -2, 28], [66, 10, 20], [8, 10, 30]];
  c.fillStyle = under;
  for (const [px, py, r] of puffs) { circle(c, x + px * s, y + (py + 7) * s, r * s); c.fill(); }
  c.fillStyle = tint;
  for (const [px, py, r] of puffs) { circle(c, x + px * s, y + py * s, r * s); c.fill(); }
  c.fillStyle = 'rgba(255,255,255,0.7)';
  circle(c, x - 4 * s, y - 22 * s, 10 * s); c.fill();
}

/** Lucht met verloop en wolken. */
function sky(c, w, h, seed, { top = '#74cdf5', bottom = '#d4f3ff', clouds = 4 } = {}) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bottom);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < clouds; i++) cloud(c, (i + 0.2 + r() * 0.6) * (w / clouds), h * (0.2 + r() * 0.45), 0.55 + r() * 0.45);
}

/** Zee met diepte-verloop, glinsteringen en een schuimrand bovenaan. */
function sea(c, x, y, w, h, seed) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#5cc4ec'); g.addColorStop(1, P.waterDeep);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const r = rng(seed);
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 2.4; c.lineCap = 'round';
  for (let i = 0; i < w / 18; i++) {
    const sx = x + r() * w, sy = y + 6 + r() * (h - 10), l = 6 + r() * 14;
    c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + l / 2, sy - 3, sx + l, sy); c.stroke();
  }
}

/** Schelpje (waaiervorm). */
function shell(c, x, y, s, col) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 6); c.arc(0, 0, 7, Math.PI * 1.05, Math.PI * 1.95); c.closePath();
  c.fillStyle = col; c.fill(); c.strokeStyle = shade(col, -0.35); c.lineWidth = 1; c.stroke();
  for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(0, 5); c.lineTo(i * 2.6, -5.5); c.stroke(); }
  c.restore();
}

function starfish(c, x, y, s, rot) {
  star(c, x, y, 8 * s, 3.6 * s, 5, rot); c.fillStyle = '#ff9a5c'; c.fill();
  c.strokeStyle = '#d8673a'; c.lineWidth = 1.2; c.stroke();
  c.fillStyle = 'rgba(255,240,200,0.8)'; circle(c, x, y, 1.4 * s); c.fill();
}

/** Zandvlak met ribbels, korrels, schelpjes en zeesterren. */
function sand(c, x, y, w, h, seed, { shells = 20 } = {}) {
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f9e2a2'); g.addColorStop(1, P.sand);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const r = rng(seed);
  // vlekken
  for (let i = 0; i < (w * h) / 40000; i++) { c.fillStyle = r() < 0.5 ? 'rgba(231,191,107,0.14)' : 'rgba(255,246,214,0.28)'; ellipse(c, x + r() * w, y + r() * h, 40 + r() * 60, 14 + r() * 16, r() * 0.3); c.fill(); }
  // ribbels
  c.strokeStyle = 'rgba(214,170,90,0.4)'; c.lineWidth = 2;
  for (let i = 0; i < (w * h) / 5500; i++) {
    const sx = x + r() * w, sy = y + r() * h, l = 18 + r() * 30;
    c.beginPath(); c.moveTo(sx, sy); c.bezierCurveTo(sx + l * 0.3, sy - 4, sx + l * 0.6, sy + 4, sx + l, sy); c.stroke();
  }
  // korrels
  for (let i = 0; i < (w * h) / 700; i++) { c.fillStyle = r() < 0.5 ? 'rgba(200,150,70,0.35)' : 'rgba(255,255,240,0.6)'; circle(c, x + r() * w, y + r() * h, 0.8 + r() * 1.4); c.fill(); }
  for (let i = 0; i < shells; i++) {
    const sx = x + 10 + r() * (w - 20), sy = y + 10 + r() * (h - 20);
    if (r() < 0.25) starfish(c, sx, sy, 0.8 + r() * 0.5, r() * 6);
    else shell(c, sx, sy, 0.8 + r() * 0.6, ['#ffe1d6', '#fff6ea', '#ffc6b8', '#f7d7ff'][Math.floor(r() * 4)]);
  }
}

/** Grasplukje. */
function tuft(c, x, y, s = 1) {
  c.strokeStyle = '#5aa843'; c.lineWidth = 2.2 * s; c.lineCap = 'round';
  for (const [dx, h] of [[-4, 9], [0, 13], [4, 10]]) { c.beginPath(); c.moveTo(x + dx * s, y); c.quadraticCurveTo(x + dx * 1.6 * s, y - h * 0.6 * s, x + dx * 2 * s, y - h * s); c.stroke(); }
}

/** Pleinvloer: grote, onregelmatige ronde stenen in zachte tinten (zoals de paden in het park). */
function cobbles(c, x, y, w, h, seed, { base = '#f1e3c4', mortar = '#e2cfa6', size = 58 } = {}) {
  const r = rng(seed);
  c.fillStyle = mortar; c.fillRect(x, y, w, h);
  const tints = [0, 0.03, -0.03, 0.05, -0.05];
  for (let row = 0, yy = y - 10; yy < y + h; row++, yy += size * 0.62) {
    for (let xx = x - (row % 2) * size * 0.5 - 10; xx < x + w + 10; xx += size * (0.8 + r() * 0.3)) {
      const rx = size * (0.36 + r() * 0.06), ry = size * (0.26 + r() * 0.05);
      const cx = xx + r() * 6, cy = yy + r() * 6;
      c.fillStyle = 'rgba(160,125,70,0.18)'; ellipse(c, cx, cy + 2.5, rx, ry, (r() - 0.5) * 0.3); c.fill();
      c.fillStyle = shade(base, tints[Math.floor(r() * tints.length)]); ellipse(c, cx, cy, rx, ry, (r() - 0.5) * 0.3); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.32)'; ellipse(c, cx - rx * 0.25, cy - ry * 0.4, rx * 0.45, ry * 0.25); c.fill();
    }
  }
}

/** Planken met verspringende naden, nerf, knoesten en spijkers. */
function planks(c, x, y, w, h, seed, { col = '#c98d4f', ph = 38, pl = 200 } = {}) {
  const r = rng(seed);
  for (let row = 0, yy = y; yy < y + h; row++, yy += ph) {
    for (let xx = x - r() * pl; xx < x + w; xx += pl) {
      const k = r() * 0.16 - 0.08, cc = shade(col, k);
      c.fillStyle = cc; c.fillRect(xx, yy, pl, ph);
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(xx, yy + 2, pl, 3);
      // nerf
      c.strokeStyle = shade(cc, -0.14); c.lineWidth = 1.2;
      for (let g = 0; g < 3; g++) {
        const gy = yy + 7 + r() * (ph - 14);
        c.beginPath(); c.moveTo(xx + 4, gy); c.bezierCurveTo(xx + pl * 0.3, gy + 3 * (r() - 0.5), xx + pl * 0.7, gy + 3 * (r() - 0.5), xx + pl - 4, gy); c.stroke();
      }
      if (r() < 0.3) { c.strokeStyle = shade(cc, -0.25); c.lineWidth = 1.4; ellipse(c, xx + 30 + r() * (pl - 60), yy + ph / 2, 7, 3.5); c.stroke(); }
      // naad + spijkers
      c.fillStyle = shade(col, -0.45); c.fillRect(xx + pl - 2, yy, 3, ph);
      c.fillStyle = shade(col, -0.5);
      for (const nx of [xx + 9, xx + pl - 11]) for (const ny of [yy + 9, yy + ph - 9]) { circle(c, nx, ny, 1.9); c.fill(); }
    }
    c.fillStyle = shade(col, -0.45); c.fillRect(x, yy + ph - 3, w, 3);
  }
}

/** Groene haag met bolletjes en bloemetjes. */
function hedge(c, x, y, w, h, seed) {
  const r = rng(seed);
  c.fillStyle = '#4f9a3a'; rrect(c, x, y, w, h, h / 2); c.fill();
  for (let xx = x + 10; xx < x + w - 6; xx += 16 + r() * 8) {
    c.fillStyle = r() < 0.5 ? '#6bbd4b' : '#5fb044'; circle(c, xx, y + 8 + r() * (h - 18), 10 + r() * 6); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; circle(c, xx - 3, y + 6 + r() * 6, 4); c.fill();
  }
  for (let i = 0; i < w / 40; i++) flower(c, x + 8 + r() * (w - 16), y + 6 + r() * (h - 12), FLOWER_COLS[Math.floor(r() * FLOWER_COLS.length)], 3.2);
}

// ── Human Campus-bouwstenen ─────────────────────────────────────────────────

const CAMPUS_BANDS = { driessen: '#E2001A', ijk: '#66A48B', atelier: '#f6c33b', rovc: '#3D2152', bloeij: '#EDB23E', bhc: '#3D2152' };

/** Gevel van een kantoorgebouw (vooraanzicht): wand, band in huisstijlkleur, rijen ramen. */
function facade(c, x, y, w, h, { wall = '#f1ece2', band = null, rows = 2, door = false, seed = 1 } = {}) {
  const r = rng(seed);
  rrect(c, x, y, w, h, 6); c.fillStyle = wall; c.fill(); c.strokeStyle = P.line; c.lineWidth = 3; c.stroke();
  rrect(c, x - 6, y - 10, w + 12, 14, 4); c.fillStyle = shade(wall, -0.18); c.fill(); c.stroke();
  if (band) { c.fillStyle = band; c.fillRect(x + 3, y + 6, w - 6, 10); }
  const rh = (h - 34) / rows;
  for (let row = 0; row < rows; row++) {
    for (let wx = x + 14; wx + 26 < x + w - 8; wx += 36) {
      const wy = y + 24 + row * rh;
      rrect(c, wx, wy, 26, rh - 12, 3);
      const g = c.createLinearGradient(wx, wy, wx + 26, wy + rh); g.addColorStop(0, '#e4f6ff'); g.addColorStop(1, '#8cc6e2');
      c.fillStyle = g; c.fill(); c.strokeStyle = shade(wall, -0.45); c.lineWidth = 1.6; c.stroke();
      if (r() < 0.3) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(wx + 4, wy + 3, 5, rh - 20); }
    }
  }
  if (door) {
    const dx = x + w / 2 - 30, dy = y + h - 64;
    rrect(c, dx, dy, 60, 62, 3); c.fillStyle = '#5d6b78'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2.4; c.stroke();
    c.fillStyle = 'rgba(190,230,250,0.85)'; c.fillRect(dx + 5, dy + 5, 23, 54); c.fillRect(dx + 32, dy + 5, 23, 54);
  }
}

/** Silhouet van de campus aan de horizon (Driessen, ROVC, IJk, Het Atelier). */
function campusSkyline(c, baseY, w, seed) {
  const r = rng(seed);
  const blds = [[0.04, 150, 70, 'bloeij'], [0.17, 260, 95, 'driessen'], [0.4, 120, 60, 'rovc'], [0.52, 210, 80, 'ijk'], [0.72, 110, 100, 'atelier']];
  for (const [fx, bw, bh, id] of blds) {
    const x = fx * w;
    c.fillStyle = '#c7d6dc'; rrect(c, x, baseY - bh, bw, bh, 4); c.fill();
    c.fillStyle = CAMPUS_BANDS[id]; c.globalAlpha = 0.7; c.fillRect(x + 3, baseY - bh + 4, bw - 6, 7); c.globalAlpha = 1;
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (let wy = baseY - bh + 18; wy < baseY - 12; wy += 18) for (let wx = x + 8; wx < x + bw - 12; wx += 16) c.fillRect(wx, wy, 8, 10);
  }
  // bomen ervoor
  for (let x = 0; x < w; x += 34 + r() * 30) {
    c.fillStyle = r() < 0.5 ? '#7bb898' : '#8fc7a8';
    circle(c, x, baseY - 8 - r() * 8, 14 + r() * 10); c.fill();
  }
}

/** Tegelvloer (betontegels in twee tinten), van bovenaf. */
function tiles(c, x, y, w, h, seed, { a = '#d9d4ca', b = '#cfc9bd', size = 64 } = {}) {
  const r = rng(seed);
  for (let ty = y; ty < y + h; ty += size) for (let tx = x; tx < x + w; tx += size) {
    c.fillStyle = shade((tx / size + ty / size) % 2 ? a : b, r() * 0.04 - 0.02); c.fillRect(tx, ty, size, size);
    c.strokeStyle = 'rgba(120,110,100,0.35)'; c.lineWidth = 1.5; c.strokeRect(tx + 0.5, ty + 0.5, size - 1, size - 1);
  }
}

/** Grasveld met plukjes en madeliefjes. */
function lawn(c, x, y, w, h, seed) {
  const r = rng(seed);
  c.fillStyle = P.grass; c.fillRect(x, y, w, h);
  for (let i = 0; i < (w * h) / 9000; i++) { c.fillStyle = r() < 0.6 ? 'rgba(163,223,116,0.35)' : 'rgba(80,160,60,0.18)'; ellipse(c, x + r() * w, y + r() * h, 40 + r() * 70, 20 + r() * 30, r() * 3); c.fill(); }
  for (let i = 0; i < (w * h) / 900; i++) tuft(c, x + r() * w, y + r() * h, 0.8);
  for (let i = 0; i < (w * h) / 6000; i++) { const fx = x + r() * w, fy = y + r() * h; c.fillStyle = '#fff'; for (let k = 0; k < 5; k++) { const an = k * 1.26; circle(c, fx + Math.cos(an) * 2.4, fy + Math.sin(an) * 2.4, 1.6); c.fill(); } c.fillStyle = '#ffd23f'; circle(c, fx, fy, 1.5); c.fill(); }
}

function plant(c, x, y, s = 1) {
  ellipse(c, x, y + 4, 26 * s, 7 * s); c.fillStyle = 'rgba(30,20,40,0.2)'; c.fill();
  rrect(c, x - 18 * s, y - 34 * s, 36 * s, 36 * s, 6 * s); c.fillStyle = '#e8e2d6'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2.4; c.stroke();
  c.fillStyle = '#5fb044';
  for (const [dx, dy, rr] of [[0, -58, 18], [-16, -46, 14], [16, -46, 14], [-8, -70, 12], [10, -68, 12]]) { circle(c, x + dx * s, y + dy * s, rr * s); c.fill(); }
  c.strokeStyle = '#3f8a34'; c.lineWidth = 2; for (const [dx, dy, rr] of [[0, -58, 18], [-16, -46, 14], [16, -46, 14]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, rr * s, Math.PI * 1.1, Math.PI * 1.6); c.stroke(); }
}

// ── Missies ─────────────────────────────────────────────────────────────────

/** BHC: de Schootense Loop, met aan de overkant de campus. */
export function makeBhcBg(scene) {
  makeTexture(scene, 'bhc_sky', W, 300, (c) => {
    sky(c, W, 300, 11, { clouds: 4 });
    // overkant: grasoever met de campus
    campusSkyline(c, 286, W, 12);
    c.fillStyle = '#86c46a'; c.fillRect(0, 282, W, 18);
    c.fillStyle = '#6aae55'; c.fillRect(0, 294, W, 6);
  });
  makeTexture(scene, 'bhc_beach', 210, 350, (c) => {
    // grasoever met riet aan deze kant
    c.save();
    c.beginPath(); c.moveTo(0, 10); c.lineTo(150, 50); c.quadraticCurveTo(185, 200, 200, 350); c.lineTo(0, 350); c.closePath();
    c.clip(); lawn(c, 0, 0, 210, 350, 12);
    c.restore();
    c.strokeStyle = '#4e9a3a'; c.lineWidth = 7;
    c.beginPath(); c.moveTo(0, 10); c.lineTo(150, 50); c.quadraticCurveTo(185, 200, 200, 350); c.stroke();
    c.strokeStyle = '#4e8a3a'; c.lineWidth = 3;
    const r = rng(13);
    for (let i = 0; i < 26; i++) { const t = i / 26, x = 150 + 50 * t * t - 6, y = 50 + 300 * t; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.3) * 10, y - 22 - r() * 12); c.stroke(); }
  });
}

/** Driessen: voor de voordeur. Gevel met glazen deuren bovenin, tegelplein, haag onderin. */
export function makeDriessenBg(scene) {
  makeTexture(scene, 'dr_bg', W, H, (c) => {
    tiles(c, 0, 0, W, H, 21, { a: '#e6e1d7', b: '#dcd6ca' });
    facade(c, -10, -20, W + 20, 96, { band: CAMPUS_BANDS.driessen, rows: 1, seed: 22 });
    // zachte middenvlek zodat de kaarten goed leesbaar blijven
    const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700);
    g.addColorStop(0, 'rgba(255,248,231,0.45)'); g.addColorStop(1, 'rgba(255,248,231,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    hedge(c, -20, H - 46, W + 40, 60, 22);
    // betonnen plantenbakken in de hoeken
    for (const x of [24, W - 124]) {
      rrect(c, x, H - 96, 100, 40, 6); c.fillStyle = '#b9b3a8'; c.fill(); c.strokeStyle = '#7d776d'; c.lineWidth = 2.6; c.stroke();
      c.fillStyle = '#6bbd4b'; for (let i = 0; i < 6; i++) { circle(c, x + 12 + i * 15, H - 98, 10); c.fill(); }
      const r = rng(x);
      for (let i = 0; i < 7; i++) flower(c, x + 10 + i * 13, H - 104 + r() * 8, FLOWER_COLS[i % FLOWER_COLS.length], 4);
    }
  });
}

/** Bloeij: het terras op het binnenterrein, met bovenin de gevel van Driessen. */
export function makeBloeijBg(scene) {
  makeTexture(scene, 'bl_bg', W, H, (c) => {
    lawn(c, 0, 0, W, H, 5);
    // houten terras in het midden
    rrect(c, 230, 250, 820, 330, 18); c.fillStyle = '#c9ad7a'; c.fill();
    c.save(); rrect(c, 238, 258, 804, 314, 14); c.clip(); planks(c, 238, 258, 804, 314, 7, { col: '#d8b07a', ph: 30, pl: 160 }); c.restore();
    rrect(c, 238, 258, 804, 314, 14); c.strokeStyle = P.line; c.lineWidth = 3; c.stroke();
    // tegelpad naar beneden
    tiles(c, 580, 572, 120, H - 572, 6, { size: 40 });
    // gevel bovenin
    facade(c, -10, -10, W + 20, 170, { band: CAMPUS_BANDS.driessen, rows: 2, door: true, seed: 8 });
    // bloemenrand langs de gevel
    hedge(c, -20, 158, W + 40, 26, 9);
  });
}

/** IJk: serverruimte. Kabelgoten in kleuren, serverkasten met lampjes, verhoogde vloer. */
export function makeIjkBg(scene, brandCss = '#66A48B') {
  makeTexture(scene, 'ijk_bg', W, H, (c) => {
    c.fillStyle = '#e9eef0'; c.fillRect(0, 0, W, H);
    const r = rng(31);
    // wandpanelen
    for (let x = 0; x < W; x += 160) { c.fillStyle = shade('#eef3f5', r() * 0.04 - 0.02); c.fillRect(x + 2, 0, 156, 640); c.strokeStyle = 'rgba(120,140,150,0.35)'; c.lineWidth = 2; c.strokeRect(x + 2, 0, 156, 640); }
    // band in bedrijfskleur
    c.fillStyle = brandCss; c.fillRect(0, 96, W, 14); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(0, 98, W, 3);
    // serverkasten links en rechts
    const rack = (x, y, w, h) => {
      rrect(c, x, y, w, h, 6); c.fillStyle = '#3b3f55'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 3; c.stroke();
      for (let yy = y + 12; yy < y + h - 14; yy += 22) {
        rrect(c, x + 8, yy, w - 16, 16, 3); c.fillStyle = '#4c5168'; c.fill();
        for (let k = 0; k < 3; k++) { circle(c, x + 18 + k * 9, yy + 8, 2.6); c.fillStyle = ['#4cc764', '#f6c33b', '#3d8fe0', '#4cc764'][Math.floor(r() * 4)]; c.fill(); }
        c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(x + w - 40, yy + 5, 26, 6);
      }
    };
    rack(10, 150, 90, 480); rack(W - 100, 150, 90, 480);
    // verhoogde vloer
    const fg = c.createLinearGradient(0, 640, 0, H); fg.addColorStop(0, '#c3ccd2'); fg.addColorStop(1, '#a9b4bb');
    c.fillStyle = fg; c.fillRect(0, 640, W, 80);
    c.strokeStyle = 'rgba(60,80,95,0.35)'; c.lineWidth = 2;
    for (let x = 0; x < W; x += 80) { c.beginPath(); c.moveTo(x, 640); c.lineTo(x, H); c.stroke(); }
    c.beginPath(); c.moveTo(0, 680); c.lineTo(W, 680); c.stroke();
    // kabelgoten
    const duct = (x1, y1, x2, y2, col) => {
      c.lineCap = 'butt';
      c.strokeStyle = shade(col, -0.35); c.lineWidth = 24; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = col; c.lineWidth = 19; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.4)'; c.lineWidth = 3; c.setLineDash([14, 10]); c.stroke(); c.setLineDash([]);
      c.lineCap = 'round';
    };
    duct(0, 132, W, 132, '#e8a33d');
    duct(0, 676, W, 676, '#4aa3d8');
  });
}

/** Haert: werkplaats in Het Atelier. Lichte houten vloer, prikbord, plant en koffie. */
export function makeHaertBg(scene) {
  makeTexture(scene, 'haert_bg', W, H, (c) => {
    planks(c, 0, 0, W, H, 3, { col: '#dcb886', ph: 40, pl: 180 });
    // prikbord: houten lijst met kurk
    ellipse(c, 266, 706, 230, 14); c.fillStyle = 'rgba(30,20,40,0.22)'; c.fill();
    rrect(c, 40, 100, 440, 600, 14); c.fillStyle = '#8a5226'; c.fill(); c.strokeStyle = '#4a2a14'; c.lineWidth = 4; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)'; rrect(c, 46, 106, 428, 6, 3); c.fill();
    rrect(c, 58, 118, 404, 564, 8); c.fillStyle = '#c99a62'; c.fill();
    const r = rng(4);
    for (let i = 0; i < 900; i++) { c.fillStyle = r() < 0.5 ? 'rgba(140,95,50,0.35)' : 'rgba(240,205,150,0.4)'; circle(c, 62 + r() * 396, 122 + r() * 556, 0.8 + r() * 1.6); c.fill(); }
    c.strokeStyle = 'rgba(90,55,25,0.4)'; c.lineWidth = 3; rrect(c, 58, 118, 404, 564, 8); c.stroke();
    // rechts: plant, koffie en een vloerkleed in Atelier-geel
    rrect(c, 1196, 330, 76, 220, 10); c.fillStyle = CAMPUS_BANDS.atelier; c.fill(); c.strokeStyle = shade(CAMPUS_BANDS.atelier, -0.4); c.lineWidth = 2; c.stroke();
    plant(c, 1230, 640, 1);
    rrect(c, 1212, 230, 36, 40, 6); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.arc(1252, 250, 9, -Math.PI / 2, Math.PI / 2); c.stroke();
    ellipse(c, 1230, 236, 14, 4); c.fillStyle = '#7a4a22'; c.fill();
  });
}

/** Reijn (en oude finale): vergaderzaal in Het Atelier, met door het raam zicht op de toren. */
export function makeDeckBg(scene) {
  makeTexture(scene, 'deck_bg', W, H, (c) => {
    // raampartij met uitzicht
    sky(c, W, 230, 41, { clouds: 3 });
    campusSkyline(c, 230, W, 43);
    // de toren in de verte
    const tx = 1040;
    for (let k = 0; k < 7; k++) { c.fillStyle = ['#e8504c', '#3d8fe0', '#f6c33b', '#f2ecdf', '#4cc764', '#f2ecdf', '#8e5bd8'][k]; c.fillRect(tx - 40 + (k % 2) * 4, 230 - (k + 1) * 26, 80 - k * 4, 26); }
    // kozijnen
    c.strokeStyle = '#5d6b78'; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, 225);
    c.lineWidth = 6; for (let x = 0; x < W; x += 213) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 230); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = 20; x < W; x += 213) { c.beginPath(); c.moveTo(x, 10); c.lineTo(x + 60, 10); c.lineTo(x + 10, 220); c.lineTo(x - 30, 220); c.closePath(); c.fill(); }
    // vloer
    planks(c, 0, 230, W, H - 230, 9, { col: '#d2ab78', ph: 36, pl: 210 });
    const sg = c.createLinearGradient(0, 234, 0, 270); sg.addColorStop(0, 'rgba(40,20,10,0.3)'); sg.addColorStop(1, 'rgba(40,20,10,0)');
    c.fillStyle = sg; c.fillRect(0, 234, W, 36);
    // vensterbank in Atelier-geel
    c.fillStyle = CAMPUS_BANDS.atelier; c.fillRect(0, 222, W, 14); c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(-4, 222, W + 8, 14);
  });
}

/** Menu: lucht met wolken (wolken komen los als sprites). */
export function makeMenuClouds(scene) {
  for (let i = 0; i < 3; i++) {
    makeTexture(scene, `ac_cloud${i}`, 200, 110, (c) => cloud(c, 80, 62, 1 - i * 0.12));
  }
}

/** Strand voor het menu (breedte variabel). */
export function makeMenuBeach(scene, width) {
  makeTexture(scene, 'menu_beach', width, 160, (c) => {
    const left = [[0, 160], [0, 40], [220, 70], [380, 120], [420, 160]];
    const right = [[width, 160], [width, 20], [width - 240, 80], [width - 380, 130], [width - 400, 160]];
    for (const pts of [left, right]) {
      c.save(); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      c.lineTo(pts[1][0], pts[1][1]); c.quadraticCurveTo(pts[2][0], pts[2][1] - 10, pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.closePath();
      c.clip(); sand(c, 0, 0, width, 160, pts[1][0] + 7, { shells: 10 }); c.restore();
      c.strokeStyle = P.foam; c.lineWidth = 6;
      c.beginPath(); c.moveTo(pts[1][0], pts[1][1]); c.quadraticCurveTo(pts[2][0], pts[2][1] - 10, pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]); c.stroke();
    }
  });
}

/** Aftiteling: zonsondergang met roze wolken, glinsterende zee en strand. */
export function makeSunsetBg(scene, width = W, height = H) {
  makeTexture(scene, 'sunset_bg', width, height, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 420);
    g.addColorStop(0, '#5b4b9e'); g.addColorStop(0.45, '#f08a5d'); g.addColorStop(1, '#ffd36e');
    c.fillStyle = g; c.fillRect(0, 0, width, 420);
    const r = rng(77);
    for (let i = 0; i < 5; i++) cloud(c, (i + 0.3 + r() * 0.4) * (width / 5), 70 + r() * 200, 0.5 + r() * 0.4, '#ffc3b0', 'rgba(170,90,130,0.45)');
    c.fillStyle = 'rgba(255,233,168,0.35)'; circle(c, width / 2, 400, 140); c.fill();
    c.fillStyle = '#ffe9a8'; circle(c, width / 2, 400, 110); c.fill();
    const s = c.createLinearGradient(0, 400, 0, 560); s.addColorStop(0, '#3f6fb5'); s.addColorStop(1, '#2a4d86');
    c.fillStyle = s; c.fillRect(0, 400, width, 160);
    c.fillStyle = 'rgba(255,233,168,0.6)';
    for (let i = 0; i < 14; i++) c.fillRect(width / 2 - 90 + r() * 180 - i * 4, 410 + i * 10, 180 - i * 10, 3);
    c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const x = r() * width, y = 420 + r() * 120; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 + r() * 14, y); c.stroke(); }
    c.save(); c.beginPath(); c.moveTo(0, 540); c.quadraticCurveTo(width / 2, 500, width, 540); c.lineTo(width, height); c.lineTo(0, height); c.closePath();
    c.clip(); sand(c, 0, 500, width, height - 500, 78, { shells: 14 });
    c.fillStyle = 'rgba(120,60,90,0.12)'; c.fillRect(0, 500, width, height - 500);
    c.restore();
    c.strokeStyle = '#ffe1c4'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 540); c.quadraticCurveTo(width / 2, 500, width, 540); c.stroke();
  });
}
