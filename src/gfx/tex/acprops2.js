// Animal Crossing-stijl voor gebouwen en losse objecten: kraampjes, receptie, zwembad,
// strandspullen, piratenkamp, lantaarns en bordjes. Overschrijft de eenvoudige versies.
import { P, shade } from '../palette.js';
import { style, rrect, circle, ellipse, poly, softShadow, makeTexture, rng } from '../draw.js';

const L = P.line;
const WOOD = '#c98d4f', WOOD_D = '#7a4a22', WOOD_L = '#e3b47a';

/** Houten vlak met planken, nerf en spijkers. */
export function woodPanel(c, x, y, w, h, { vertical = false, col = WOOD, plank = 14, seed = 1 } = {}) {
  const r = rng(seed);
  c.save(); rrect(c, x, y, w, h, 4); c.clip();
  const n = Math.ceil((vertical ? w : h) / plank);
  for (let i = 0; i < n; i++) {
    const k = 0.9 + r() * 0.16;
    c.fillStyle = shade(col, (k - 1) * 1.2);
    if (vertical) c.fillRect(x + i * plank, y, plank, h); else c.fillRect(x, y + i * plank, w, plank);
    c.strokeStyle = shade(col, -0.32); c.lineWidth = 1.4;
    c.beginPath();
    if (vertical) { c.moveTo(x + i * plank, y); c.lineTo(x + i * plank, y + h); } else { c.moveTo(x, y + i * plank); c.lineTo(x + w, y + i * plank); }
    c.stroke();
    // nerf
    c.strokeStyle = shade(col, -0.16); c.lineWidth = 1;
    for (let g = 0; g < 2; g++) {
      c.beginPath();
      if (vertical) { const gx = x + i * plank + 3 + r() * (plank - 6); c.moveTo(gx, y + 2); c.bezierCurveTo(gx + 2, y + h * 0.3, gx - 2, y + h * 0.6, gx + 1, y + h - 2); }
      else { const gy = y + i * plank + 3 + r() * (plank - 6); c.moveTo(x + 2, gy); c.bezierCurveTo(x + w * 0.3, gy + 2, x + w * 0.6, gy - 2, x + w - 2, gy + 1); }
      c.stroke();
    }
  }
  c.restore();
  rrect(c, x, y, w, h, 4); c.strokeStyle = shade(col, -0.45); c.lineWidth = 2.6; c.stroke();
}

function scallopAwning(c, x, y, w, n, color, depth = 22) {
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    const col = i % 2 ? '#fffaf0' : color;
    c.beginPath(); c.moveTo(x + i * sw, y); c.lineTo(x + (i + 1) * sw, y); c.lineTo(x + (i + 1) * sw, y + depth);
    c.quadraticCurveTo(x + (i + 0.5) * sw, y + depth + 11, x + i * sw, y + depth); c.closePath();
    const g = c.createLinearGradient(0, y, 0, y + depth + 10); g.addColorStop(0, shade(col, 0.08)); g.addColorStop(1, shade(col, -0.12));
    c.fillStyle = g; c.fill(); c.strokeStyle = shade(color, -0.45); c.lineWidth = 2.2; c.stroke();
  }
}

/** Marktkraampje in bedrijfskleur. */
export function makeACStall(scene, key, color) {
  makeTexture(scene, key, 190, 170, (c) => {
    softShadow(c, 95, 160, 86, 10);
    // palen
    for (const x of [20, 162]) woodPanel(c, x, 34, 9, 120, { vertical: true, plank: 9, seed: x });
    // toonbank
    woodPanel(c, 18, 96, 154, 60, { seed: 3 });
    rrect(c, 10, 88, 170, 13, 4); style(c, { fill: WOOD_L, stroke: WOOD_D, lw: 2.4 });
    // waren op de toonbank
    const items = [[34, '#ff9f2e'], [58, '#e8504c'], [82, '#ffd23f'], [118, '#7ac36a'], [142, '#b48cff']];
    for (const [x, col] of items) {
      rrect(c, x - 10, 74, 20, 16, 3); style(c, { fill: WOOD_L, stroke: WOOD_D, lw: 1.8 });
      for (const [dx, dy] of [[-4, 0], [4, 0], [0, -5]]) { circle(c, x + dx, 74 + dy, 4.5); style(c, { fill: col, stroke: shade(col, -0.4), lw: 1.4 }); c.fillStyle = 'rgba(255,255,255,0.6)'; circle(c, x + dx - 1.5, 72 + dy, 1.3); c.fill(); }
    }
    // krijtbordje
    rrect(c, 70, 112, 50, 30, 4); style(c, { fill: '#3e4a45', stroke: WOOD_D, lw: 2.5 });
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(78, 122); c.lineTo(108, 122); c.moveTo(78, 130); c.lineTo(100, 130); c.stroke();
    // luifel + dak
    scallopAwning(c, 8, 30, 174, 7, color);
    c.beginPath(); c.moveTo(2, 33); c.quadraticCurveTo(20, 10, 44, 5); c.lineTo(146, 5); c.quadraticCurveTo(170, 10, 188, 33); c.closePath();
    const g = c.createLinearGradient(0, 5, 0, 33); g.addColorStop(0, shade(color, 0.15)); g.addColorStop(1, shade(color, -0.1));
    c.fillStyle = g; c.fill(); c.strokeStyle = shade(color, -0.45); c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.35)'; rrect(c, 46, 9, 98, 4, 2); c.fill();
    // vlaggetjeslijn
    c.strokeStyle = L; c.lineWidth = 1.2; c.beginPath(); c.moveTo(26, 64); c.quadraticCurveTo(95, 80, 164, 64); c.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, x = 26 + 138 * t, y = 64 + Math.sin(t * Math.PI) * 8; poly(c, [[x - 4, y], [x + 4, y], [x, y + 8]]); c.fillStyle = ['#ffd23f', '#ff9ecf', '#6ec6ff', '#7ac36a'][i % 4]; c.fill(); }
  });
}



function beach(scene) {
  const cols = [['#e8504c', '#fffaf0'], ['#3d8fe0', '#ffe066'], ['#2ec4b6', '#fffaf0'], ['#f59a3c', '#ff9ecf']];
  cols.forEach(([a, b], idx) => {
    makeTexture(scene, `umbrella${idx}`, 130, 140, (c) => {
      softShadow(c, 65, 130, 46, 9);
      rrect(c, 62, 46, 6, 86, 3); style(c, { fill: '#e3d5c0', stroke: L, lw: 2 });
      const cx = 65, cy = 58, R = 58;
      for (let i = 0; i < 8; i++) {
        const a0 = Math.PI + (i * Math.PI) / 8, a1 = Math.PI + ((i + 1) * Math.PI) / 8;
        c.beginPath(); c.moveTo(cx, cy - 4); c.arc(cx, cy, R, a0, a1); c.closePath();
        const col = i % 2 ? b : a;
        const g = c.createRadialGradient(cx - 10, cy - 30, 4, cx, cy, R); g.addColorStop(0, shade(col, 0.15)); g.addColorStop(1, shade(col, -0.1));
        c.fillStyle = g; c.fill(); c.strokeStyle = shade(a, -0.4); c.lineWidth = 1.6; c.stroke();
      }
      // gegolfde rand
      for (let i = 0; i < 8; i++) {
        const ang = Math.PI + ((i + 0.5) * Math.PI) / 8;
        c.beginPath(); c.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 7.5, 0, Math.PI); c.fillStyle = i % 2 ? b : a; c.fill();
        c.strokeStyle = shade(a, -0.4); c.lineWidth = 1.4; c.stroke();
      }
      c.beginPath(); c.arc(cx, cy, R, Math.PI, 0); c.strokeStyle = shade(a, -0.45); c.lineWidth = 2.8; c.stroke();
      circle(c, cx, cy - R + 1, 5); style(c, { fill: '#ffd23f', stroke: '#9a7a1a', lw: 1.6 });
    });
  });
  makeTexture(scene, 'towel', 70, 110, (c) => {
    rrect(c, 6, 8, 58, 94, 6); c.fillStyle = '#ff9ecf'; c.fill();
    c.save(); rrect(c, 6, 8, 58, 94, 6); c.clip();
    c.fillStyle = '#ffffff'; for (let y = 18; y < 100; y += 18) c.fillRect(6, y, 58, 7);
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(6, 8, 10, 94);
    c.restore();
    rrect(c, 6, 8, 58, 94, 6); c.strokeStyle = '#b5577f'; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; for (let x = 10; x < 62; x += 5) { c.beginPath(); c.moveTo(x, 8); c.lineTo(x, 3); c.moveTo(x, 102); c.lineTo(x, 107); c.stroke(); }
  });
  makeTexture(scene, 'lifeguard', 110, 190, (c) => {
    softShadow(c, 55, 182, 46, 8);
    for (const [x1, x2] of [[22, 34], [88, 76]]) { c.strokeStyle = WOOD_D; c.lineWidth = 9; c.beginPath(); c.moveTo(x1, 182); c.lineTo(x2, 92); c.stroke(); c.strokeStyle = '#f2e6d4'; c.lineWidth = 5; c.stroke(); }
    // ladder
    c.strokeStyle = '#f2e6d4'; c.lineWidth = 3; for (let y = 108; y < 180; y += 12) { c.beginPath(); c.moveTo(34 - (y - 92) * 0.13, y); c.lineTo(76 + (y - 92) * 0.13, y); c.stroke(); }
    // cabine
    woodPanel(c, 16, 54, 78, 42, { col: '#e8504c', plank: 10, seed: 5 });
    c.fillStyle = '#ffffff'; c.fillRect(17, 68, 76, 9);
    rrect(c, 40, 60, 30, 14, 3); style(c, { fill: '#cfeffd', stroke: L, lw: 2 });
    rrect(c, 12, 92, 86, 8, 3); style(c, { fill: WOOD_L, stroke: WOOD_D, lw: 2 });
    poly(c, [[8, 58], [55, 22], [102, 58]]); style(c, { fill: '#ffe066', stroke: '#9a7a1a', lw: 2.8 });
    c.strokeStyle = '#9a7a1a'; c.lineWidth = 1.2; for (const t of [0.33, 0.66]) { c.beginPath(); c.moveTo(55, 22); c.lineTo(8 + 94 * t, 58); c.stroke(); }
    c.strokeStyle = L; c.lineWidth = 2.5; c.beginPath(); c.moveTo(55, 22); c.lineTo(55, 4); c.stroke();
    poly(c, [[55, 4], [78, 10], [55, 17]]); style(c, { fill: '#e8504c', stroke: '#8e2a28', lw: 1.8 });
    // reddingsboei aan de zijkant
    circle(c, 92, 80, 9); style(c, { fill: '#ffffff', stroke: '#e8504c', lw: 5 });
  });
}

function camp(scene) {
  makeTexture(scene, 'barrel', 50, 60, (c) => {
    softShadow(c, 25, 54, 20, 5);
    const body = () => { c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(2, 32, 8, 54); c.lineTo(42, 54); c.quadraticCurveTo(48, 32, 42, 10); c.closePath(); };
    body(); const g = c.createLinearGradient(4, 0, 46, 0); g.addColorStop(0, '#9a6a3c'); g.addColorStop(0.45, '#d29a5e'); g.addColorStop(1, '#7a4a22');
    c.fillStyle = g; c.fill();
    c.save(); body(); c.clip(); c.strokeStyle = 'rgba(80,45,20,0.4)'; c.lineWidth = 1.2; for (const x of [14, 22, 30, 38]) { c.beginPath(); c.moveTo(x, 8); c.quadraticCurveTo(x + (x - 25) * 0.15, 32, x, 56); c.stroke(); } c.restore();
    body(); c.strokeStyle = WOOD_D; c.lineWidth = 2.6; c.stroke();
    for (const y of [18, 46]) { c.beginPath(); c.moveTo(5, y); c.lineTo(45, y); c.strokeStyle = '#5e5a6b'; c.lineWidth = 3.5; c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, y - 1); c.lineTo(44, y - 1); c.stroke(); }
    ellipse(c, 25, 10, 17, 5); style(c, { fill: '#e3b47a', stroke: WOOD_D, lw: 2.4 });
    c.strokeStyle = '#b98650'; c.lineWidth = 1; for (const r of [5, 10]) { ellipse(c, 25, 10, r, r * 0.3); c.stroke(); }
  });
  makeTexture(scene, 'crate', 56, 60, (c) => {
    softShadow(c, 28, 54, 24, 5);
    woodPanel(c, 4, 6, 48, 48, { col: WOOD_L, plank: 12, seed: 9 });
    c.strokeStyle = shade(WOOD_L, -0.3); c.lineWidth = 5; c.beginPath(); c.moveTo(9, 11); c.lineTo(47, 49); c.stroke();
    c.strokeStyle = shade(WOOD_L, -0.05); c.lineWidth = 3; c.stroke();
    c.fillStyle = '#5e5a6b'; for (const [x, y] of [[9, 11], [47, 11], [9, 49], [47, 49]]) { circle(c, x, y, 1.8); c.fill(); }
  });
}

function streetStuff(scene) {
  makeTexture(scene, 'lamp', 34, 110, (c) => {
    softShadow(c, 17, 104, 11, 3);
    rrect(c, 9, 96, 16, 8, 3); style(c, { fill: '#4a4458', stroke: '#2b2733', lw: 2 });
    rrect(c, 14, 30, 6, 68, 3); style(c, { fill: '#4a4458', stroke: '#2b2733', lw: 2 });
    c.strokeStyle = '#2b2733'; c.lineWidth = 2; c.beginPath(); c.moveTo(17, 34); c.quadraticCurveTo(27, 30, 25, 40); c.stroke();
    // lantaarn
    const g = c.createRadialGradient(17, 18, 2, 17, 18, 13); g.addColorStop(0, '#fffbe0'); g.addColorStop(1, '#ffd25a');
    poly(c, [[8, 10], [26, 10], [24, 28], [10, 28]]); c.fillStyle = g; c.fill(); c.strokeStyle = '#2b2733'; c.lineWidth = 2.2; c.stroke();
    c.strokeStyle = '#2b2733'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(17, 10); c.lineTo(17, 28); c.stroke();
    poly(c, [[5, 11], [17, 2], [29, 11]]); style(c, { fill: '#4a4458', stroke: '#2b2733', lw: 2 });
    rrect(c, 9, 27, 16, 4, 2); style(c, { fill: '#4a4458', stroke: '#2b2733', lw: 1.6 });
  });
  makeTexture(scene, 'sign', 110, 100, (c) => {
    softShadow(c, 55, 94, 24, 5);
    woodPanel(c, 49, 40, 12, 56, { vertical: true, plank: 12, seed: 4 });
    woodPanel(c, 6, 8, 98, 46, { col: WOOD_L, plank: 15, seed: 8 });
    rrect(c, 12, 14, 86, 34, 5); style(c, { fill: '#fff7e3', stroke: '#c9a46a', lw: 1.6 });
    for (const [x, y] of [[10, 12], [100, 12], [10, 50], [100, 50]]) { circle(c, x, y, 1.8); c.fillStyle = '#5e5a6b'; c.fill(); }
  });
}

export function makeACProps2(scene) {
  beach(scene);
  camp(scene);
  streetStuff(scene);
}
