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

// ── Missies ─────────────────────────────────────────────────────────────────

/** BHC: lucht met eilandjes op de horizon + strandje linksonder. */
export function makeBhcBg(scene) {
  makeTexture(scene, 'bhc_sky', W, 300, (c) => {
    sky(c, W, 300, 11, { clouds: 5 });
    // eilandjes in de verte
    for (const [x, w, h] of [[180, 260, 34], [620, 180, 22], [930, 300, 40]]) {
      c.fillStyle = '#8fc7a8'; c.beginPath(); c.ellipse(x, 300, w / 2, h, 0, Math.PI, 0); c.fill();
      c.fillStyle = '#7bb898';
      for (let i = 0; i < 5; i++) { circle(c, x - w / 3 + (i * w) / 7.5, 300 - h * 0.7, 9 + (i % 2) * 4); c.fill(); }
    }
  });
  makeTexture(scene, 'bhc_beach', 210, 350, (c) => {
    c.save();
    c.beginPath(); c.moveTo(0, 10); c.lineTo(150, 50); c.quadraticCurveTo(185, 200, 200, 350); c.lineTo(0, 350); c.closePath();
    c.clip(); sand(c, 0, 0, 210, 350, 12, { shells: 7 });
    c.restore();
    c.strokeStyle = P.foam; c.lineWidth = 7;
    c.beginPath(); c.moveTo(0, 10); c.lineTo(150, 50); c.quadraticCurveTo(185, 200, 200, 350); c.stroke();
    c.strokeStyle = 'rgba(231,191,107,0.7)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 18); c.lineTo(144, 57); c.quadraticCurveTo(177, 200, 192, 350); c.stroke();
    for (const [x, y] of [[30, 300], [60, 330], [120, 320]]) tuft(c, x, y, 1.1);
  });
}

/** Driessen: gezellig plein met kasseien, haag en bloembakken. */
export function makeDriessenBg(scene) {
  makeTexture(scene, 'dr_bg', W, H, (c) => {
    cobbles(c, 0, 0, W, H, 21);
    // zachte middenvlek zodat de kaarten goed leesbaar blijven
    const g = c.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 700);
    g.addColorStop(0, 'rgba(255,248,231,0.45)'); g.addColorStop(1, 'rgba(255,248,231,0)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    hedge(c, -20, H - 46, W + 40, 60, 22);
    // bloembakken in de hoeken
    for (const x of [24, W - 124]) {
      rrect(c, x, H - 96, 100, 40, 8); c.fillStyle = '#c98d4f'; c.fill(); c.strokeStyle = '#7a4a22'; c.lineWidth = 2.6; c.stroke();
      c.fillStyle = '#6bbd4b'; for (let i = 0; i < 6; i++) { circle(c, x + 12 + i * 15, H - 98, 10); c.fill(); }
      const r = rng(x);
      for (let i = 0; i < 7; i++) flower(c, x + 10 + i * 13, H - 104 + r() * 8, FLOWER_COLS[i % FLOWER_COLS.length], 4);
    }
  });
}

/** Bloeij: strand met ribbels, schelpjes, zeesterren en voetstapjes. */
export function makeBloeijBg(scene) {
  makeTexture(scene, 'bl_bg', W, H, (c) => {
    sand(c, 0, 0, W, H, 5, { shells: 34 });
    // natte rand langs het water
    const g = c.createLinearGradient(0, 150, 0, 205); g.addColorStop(0, 'rgba(201,160,85,0.75)'); g.addColorStop(1, 'rgba(201,160,85,0)');
    c.fillStyle = g; c.fillRect(0, 150, W, 55);
    // voetstapjes
    const r = rng(6);
    c.fillStyle = 'rgba(190,145,70,0.35)';
    for (let i = 0; i < 14; i++) { const x = 300 + i * 48, y = 560 - Math.sin(i * 0.5) * 40 + (i % 2) * 14; ellipse(c, x, y, 7, 4, 0.2); c.fill(); circle(c, x + 8, y - 1, 2.4); c.fill(); }
    // duinrand met helmgras onderin
    c.fillStyle = '#f2cf7c'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H - 28);
    for (let x = 0; x <= W; x += 80) c.quadraticCurveTo(x + 40, H - 46 - r() * 10, x + 80, H - 28);
    c.lineTo(W, H); c.closePath(); c.fill();
    for (let x = 20; x < W; x += 34 + r() * 30) tuft(c, x, H - 18 - r() * 12, 1.2);
  });
}

/** IJk: knusse technische ruimte onder het zwembad: tegelwand, buizen, kranen en meters. */
export function makeIjkBg(scene, brandCss = '#2b8fd6') {
  makeTexture(scene, 'ijk_bg', W, H, (c) => {
    // tegelwand
    c.fillStyle = '#d9eef4'; c.fillRect(0, 0, W, H);
    const r = rng(31);
    for (let y = 0; y < H; y += 40) for (let x = 0; x < W; x += 40) {
      rrect(c, x + 2, y + 2, 36, 36, 6); c.fillStyle = shade('#e8f6fa', r() * 0.06 - 0.04); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.6)'; rrect(c, x + 6, y + 5, 14, 4, 2); c.fill();
    }
    // band in bedrijfskleur
    c.fillStyle = brandCss; c.fillRect(0, 96, W, 14); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(0, 98, W, 3);
    // vloer
    const fg = c.createLinearGradient(0, 640, 0, H); fg.addColorStop(0, '#9fb7c2'); fg.addColorStop(1, '#7f98a6');
    c.fillStyle = fg; c.fillRect(0, 640, W, 80);
    c.strokeStyle = 'rgba(60,80,95,0.35)'; c.lineWidth = 2;
    for (let x = 0; x < W; x += 80) { c.beginPath(); c.moveTo(x, 640); c.lineTo(x - 20, H); c.stroke(); }
    // buizen
    const pipe = (x1, y1, x2, y2, col) => {
      const t = 22;
      c.lineCap = 'butt';
      c.strokeStyle = shade(col, -0.35); c.lineWidth = t + 5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
      c.strokeStyle = col; c.lineWidth = t; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 4;
      const vert = x1 === x2;
      c.beginPath(); c.moveTo(x1 + (vert ? -5 : 0), y1 + (vert ? 0 : -5)); c.lineTo(x2 + (vert ? -5 : 0), y2 + (vert ? 0 : -5)); c.stroke();
      // flenzen
      const len = Math.hypot(x2 - x1, y2 - y1);
      for (let d = 60; d < len; d += 180) {
        const fx = x1 + ((x2 - x1) * d) / len, fy = y1 + ((y2 - y1) * d) / len;
        if (vert) rrect(c, fx - 17, fy - 5, 34, 10, 3); else rrect(c, fx - 5, fy - 17, 10, 34, 3);
        c.fillStyle = shade(col, -0.15); c.fill(); c.strokeStyle = shade(col, -0.45); c.lineWidth = 1.6; c.stroke();
      }
      c.lineCap = 'round';
    };
    pipe(0, 132, W, 132, '#e8a33d');
    pipe(0, 676, W, 676, '#4aa3d8');
    pipe(34, 110, 34, 676, '#6cc08a');
    pipe(W - 34, 110, W - 34, 676, '#6cc08a');
    // kraanwielen
    for (const [x, y] of [[34, 300], [W - 34, 470], [640, 132]]) {
      circle(c, x, y, 18); c.strokeStyle = '#b8302c'; c.lineWidth = 5; c.stroke();
      for (let i = 0; i < 4; i++) { const a = (i * Math.PI) / 2 + 0.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 17, y + Math.sin(a) * 17); c.lineWidth = 3; c.stroke(); }
      circle(c, x, y, 5); c.fillStyle = '#e8504c'; c.fill();
    }
    // drukmeters
    for (const [x, y] of [[300, 132], [980, 132], [W - 34, 220]]) {
      circle(c, x, y - 2, 15); c.fillStyle = '#fffaf0'; c.fill(); c.strokeStyle = '#4a3646'; c.lineWidth = 3; c.stroke();
      c.strokeStyle = '#e8504c'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x + 8, y - 9); c.stroke();
    }
  });
}

/** Haert: steiger van planken met bolders, touw en een reddingsboei. */
export function makeHaertBg(scene) {
  makeTexture(scene, 'haert_bg', W, H, (c) => {
    planks(c, 0, 0, W, H, 3, { col: '#c48a52', ph: 40, pl: 180 });
    // prikbord: houten lijst met kurk
    ellipse(c, 266, 706, 230, 14); c.fillStyle = 'rgba(30,20,40,0.22)'; c.fill();
    rrect(c, 40, 100, 440, 600, 14); c.fillStyle = '#8a5226'; c.fill(); c.strokeStyle = '#4a2a14'; c.lineWidth = 4; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)'; rrect(c, 46, 106, 428, 6, 3); c.fill();
    rrect(c, 58, 118, 404, 564, 8); c.fillStyle = '#c99a62'; c.fill();
    const r = rng(4);
    for (let i = 0; i < 900; i++) { c.fillStyle = r() < 0.5 ? 'rgba(140,95,50,0.35)' : 'rgba(240,205,150,0.4)'; circle(c, 62 + r() * 396, 122 + r() * 556, 0.8 + r() * 1.6); c.fill(); }
    c.strokeStyle = 'rgba(90,55,25,0.4)'; c.lineWidth = 3; rrect(c, 58, 118, 404, 564, 8); c.stroke();
    // bolders + touw (in de zichtbare strook rechts)
    const bollard = (x, y) => {
      ellipse(c, x, y + 8, 22, 8); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill();
      rrect(c, x - 14, y - 22, 28, 30, 6); c.fillStyle = '#5a6470'; c.fill(); c.strokeStyle = '#2f353d'; c.lineWidth = 2.4; c.stroke();
      ellipse(c, x, y - 22, 18, 7); c.fillStyle = '#717c89'; c.fill(); c.stroke();
    };
    bollard(1228, 560);
    for (let i = 0; i < 4; i++) { ellipse(c, 1228, 680, 30 - i * 6, 12 - i * 2.4); c.strokeStyle = i % 2 ? '#d8b77a' : '#c49a58'; c.lineWidth = 5; c.stroke(); }
    // reddingsboei
    circle(c, 1228, 300, 26); c.strokeStyle = '#fffaf0'; c.lineWidth = 14; c.stroke();
    c.strokeStyle = '#e8504c';
    for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(1228, 300, 26, (i * Math.PI) / 2, (i * Math.PI) / 2 + 0.6); c.stroke(); }
  });
}

/** Scheepsdek (Reijn + finale): lucht, zee, reling met spijlen en dekplanken. */
export function makeDeckBg(scene) {
  makeTexture(scene, 'deck_bg', W, H, (c) => {
    sky(c, W, 180, 41, { clouds: 4 });
    c.fillStyle = '#86bfa0'; c.beginPath(); c.ellipse(260, 180, 170, 22, 0, Math.PI, 0); c.fill();
    sea(c, 0, 170, W, 64, 42);
    planks(c, 0, 230, W, H - 230, 9, { col: '#b07444', ph: 36, pl: 210 });
    // schaduw van de reling op het dek
    const sg = c.createLinearGradient(0, 234, 0, 270); sg.addColorStop(0, 'rgba(40,20,10,0.35)'); sg.addColorStop(1, 'rgba(40,20,10,0)');
    c.fillStyle = sg; c.fillRect(0, 234, W, 36);
    // reling: spijlen, bovenregel en dikke onderrand
    for (let x = 20; x < W; x += 70) {
      rrect(c, x, 148, 18, 60, 5); c.fillStyle = '#9a5e30'; c.fill(); c.strokeStyle = '#5a3418'; c.lineWidth = 2.4; c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 3, 152, 4, 52);
    }
    const rail = (y, h, col) => {
      c.fillStyle = col; c.fillRect(0, y, W, h);
      c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(0, y + 2, W, 3);
      c.strokeStyle = '#4a2a14'; c.lineWidth = 3; c.strokeRect(-4, y, W + 8, h);
      c.strokeStyle = shade(col, -0.2); c.lineWidth = 1.2;
      for (let x = 0; x < W; x += 140) { c.beginPath(); c.moveTo(x, y + h / 2); c.bezierCurveTo(x + 40, y + h / 2 - 2, x + 90, y + h / 2 + 2, x + 140, y + h / 2); c.stroke(); }
    };
    rail(138, 16, '#a96a38');
    rail(200, 34, '#7a4524');
    c.fillStyle = '#d9b35a'; for (let x = 50; x < W; x += 140) { circle(c, x, 217, 3.2); c.fill(); }
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
