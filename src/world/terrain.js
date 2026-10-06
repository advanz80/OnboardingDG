// Tekent de campus in chunks van 1024×1024 (canvas-textures).
import { P } from '../gfx/palette.js';
import { rng, circle, ellipse, rrect, makeTexture } from '../gfx/draw.js';
import { LAND, MOAT, BIGPOND, ROADS, ROUNDABOUT, PATHS, PARKINGS, PLAZA, POND, BUILDINGS, NEIGHBOURS, WORLD_W, WORLD_H, sampleSmooth } from './layout.js';

export const CHUNK = 1024;

function polyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

// ── Animal Crossing-achtige ondergrond ────────────────────────────────────
const STONE = ['#efe4cb', '#e8dbbd', '#f4ead5', '#e2d3b2'];
const FLOWER_COLS = ['#ff6b6b', '#ffd23f', '#ffffff', '#ff9ecf', '#b48cff', '#ff9f43', '#6ec6ff'];

function distToDense(x, y, dense) {
  let d = Infinity;
  for (let i = 0; i < dense.length - 1; i++) {
    const [x1, y1] = dense[i], [x2, y2] = dense[i + 1];
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
    let t = ((x - x1) * dx + (y - y1) * dy) / l2; t = Math.max(0, Math.min(1, t));
    d = Math.min(d, Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)));
  }
  return d;
}

function polyline(ctx, pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
}

/** Klein bloemetje van bovenaf (AC-stijl): blaadjes, hartje, twee groene blaadjes. */
export function flower(ctx, x, y, col, r) {
  ctx.fillStyle = '#4f9a3a';
  ellipse(ctx, x - r * 1.1, y + r * 0.9, r * 0.9, r * 0.45, -0.5); ctx.fill();
  ellipse(ctx, x + r * 1.1, y + r * 0.9, r * 0.9, r * 0.45, 0.5); ctx.fill();
  ctx.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    circle(ctx, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, r * 0.6); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(80,40,60,0.35)'; ctx.lineWidth = 0.8;
  circle(ctx, x, y, r * 1.35); ctx.stroke();
  ctx.fillStyle = col === '#ffd23f' ? '#ff9f43' : '#ffd23f';
  circle(ctx, x, y, r * 0.42); ctx.fill();
}

/** Ligt (x, y) op een weg, pad, parkeerplaats, terras, vijver of gebouw (plus marge)? */
export function onInfrastructure(x, y, m = 0) {
  if (DENSE_ROADS.some((p) => distToDense(x, y, p.dense) < p.w / 2 + m)) return true;
  if (DENSE_PATHS.some((p) => distToDense(x, y, p.dense) < p.w / 2 + m)) return true;
  if (Math.hypot(x - ROUNDABOUT.x, y - ROUNDABOUT.y) < ROUNDABOUT.r + m) return true;
  if ([...PARKINGS, PLAZA, BIGPOND, MOAT.outer].some((r) => inRect(x, y, r, m))) return true;
  if (((x - POND.x) / (POND.rx + m)) ** 2 + ((y - POND.y) / (POND.ry + m)) ** 2 < 1) return true;
  for (const b of [...BUILDINGS, ...NEIGHBOURS]) if (b.parts.some((r) => inRect(x, y, r, m))) return true;
  return false;
}

const DENSE_ROADS = ROADS.map((p) => ({ ...p, dense: sampleSmooth(p.pts, false, 10) }));
const DENSE_PATHS = PATHS.map((p) => ({ ...p, dense: sampleSmooth(p.pts, false, 14) }));

function stonePath(ctx, p, r) {
  polyline(ctx, p.dense); ctx.strokeStyle = 'rgba(60,40,30,0.12)'; ctx.lineWidth = p.w + 16; ctx.stroke();
  polyline(ctx, p.dense); ctx.strokeStyle = '#cbb07a'; ctx.lineWidth = p.w + 8; ctx.stroke();
  polyline(ctx, p.dense); ctx.strokeStyle = '#dcc597'; ctx.lineWidth = p.w; ctx.stroke();
  const pts = p.dense;
  let acc = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1); if (!len) continue;
    const ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
    for (let d = acc; d < len; d += 30) {
      const cx = x1 + ux * d, cy = y1 + uy * d;
      const across = Math.max(2, Math.round(p.w / 30));
      for (let k = 0; k < across; k++) {
        const off = ((k + 0.5) / across - 0.5) * (p.w - 14) + (r() - 0.5) * 5;
        const sx = cx + nx * off + (r() - 0.5) * 4, sy = cy + ny * off + (r() - 0.5) * 4;
        const w = 20 + r() * 6, h = 15 + r() * 5, rot = Math.atan2(uy, ux) + (r() - 0.5) * 0.4;
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
        ctx.fillStyle = 'rgba(120,90,50,0.25)'; rrect(ctx, -w / 2 + 1, -h / 2 + 2, w, h, 6); ctx.fill();
        ctx.fillStyle = STONE[Math.floor(r() * STONE.length)]; rrect(ctx, -w / 2, -h / 2, w, h, 6); ctx.fill();
        ctx.strokeStyle = '#c4ab7c'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
      }
    }
    acc = (acc - len) % 30; if (acc < 0) acc += 30;
  }
}

const ASPHALT = '#868a93', ASPHALT_EDGE = '#5f626b';
const CAR_COLS = ['#e8504c', '#3d8fe0', '#f6f2ea', '#2d3a4a', '#9c9389', '#f6c33b', '#4cc764', '#c9c2b8'];

function parking(ctx, pk, r) {
  rrect(ctx, pk.x - 4, pk.y - 4, pk.w + 8, pk.h + 8, 8); ctx.fillStyle = ASPHALT_EDGE; ctx.fill();
  rrect(ctx, pk.x, pk.y, pk.w, pk.h, 6); ctx.fillStyle = ASPHALT; ctx.fill();
  // vakken langs de lange zijde, in één of twee rijen
  const horiz = pk.w >= pk.h;
  const len = horiz ? pk.w : pk.h, depth = horiz ? pk.h : pk.w;
  const rows = depth > 150 ? 2 : 1;
  const sd = Math.min(depth / rows, 90);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
  for (let row = 0; row < rows; row++) {
    const d0 = row === 0 ? 0 : depth - sd;
    for (let a = 10; a + 44 < len; a += 46) {
      const seg = horiz ? [[pk.x + a, pk.y + d0], [pk.x + a, pk.y + d0 + sd]] : [[pk.x + d0, pk.y + a], [pk.x + d0 + sd, pk.y + a]];
      ctx.beginPath(); ctx.moveTo(...seg[0]); ctx.lineTo(...seg[1]); ctx.stroke();
      if (r() < 0.45) { // geparkeerde auto (van bovenaf)
        const cw = horiz ? 32 : sd - 22, ch = horiz ? sd - 22 : 32;
        const cx = horiz ? pk.x + a + 7 : pk.x + d0 + 11, cy = horiz ? pk.y + d0 + 11 : pk.y + a + 7;
        ctx.fillStyle = 'rgba(30,20,40,0.25)'; rrect(ctx, cx + 3, cy + 4, cw, ch, 9); ctx.fill();
        rrect(ctx, cx, cy, cw, ch, 9); ctx.fillStyle = CAR_COLS[Math.floor(r() * CAR_COLS.length)]; ctx.fill();
        ctx.strokeStyle = P.line; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(40,60,80,0.55)';
        if (horiz) rrect(ctx, cx + 5, cy + ch * 0.28, cw - 10, ch * 0.44, 4); else rrect(ctx, cx + cw * 0.28, cy + 5, cw * 0.44, ch - 10, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
      }
    }
  }
  // bord
  if (pk.label) {
    const sx = pk.x + 8, sy = pk.y + 8;
    rrect(ctx, sx, sy, 44, 30, 6); ctx.fillStyle = '#2b2350'; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.font = '700 18px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(pk.label, sx + 22, sy + 16);
  }
}

export function drawTerrain(ctx) {
  const r = rng(42);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';

  // gras
  polyPath(ctx, LAND); ctx.fillStyle = P.grass; ctx.fill();
  ctx.save(); polyPath(ctx, LAND); ctx.clip();
  for (let i = 0; i < 220; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    ctx.fillStyle = r() < 0.6 ? 'rgba(163,223,116,0.32)' : 'rgba(80,160,60,0.18)';
    ellipse(ctx, x, y, 50 + r() * 90, 26 + r() * 46, r() * 3); ctx.fill();
  }
  for (let i = 0; i < 5200; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    const light = r() < 0.35;
    ctx.strokeStyle = light ? 'rgba(190,240,140,0.8)' : 'rgba(70,140,50,0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + 4, y - 6); ctx.stroke();
  }
  for (let i = 0; i < 600; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    if (onInfrastructure(x, y, 6)) continue;
    ctx.fillStyle = '#ffffff';
    for (let k = 0; k < 6; k++) { const a = k * 1.05; circle(ctx, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 1.6); ctx.fill(); }
    ctx.fillStyle = '#ffd23f'; circle(ctx, x, y, 1.6); ctx.fill();
  }
  for (let i = 0; i < 60; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    if (onInfrastructure(x, y, 40) || !inPoly(x, y, LAND)) continue;
    const col = FLOWER_COLS[Math.floor(r() * FLOWER_COLS.length)];
    const n = 3 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) flower(ctx, x + (r() - 0.5) * 46, y + (r() - 0.5) * 28, col, 5 + r() * 1.5);
  }
  ctx.restore();

  // grote vijver ten oosten van Driessen
  rrect(ctx, BIGPOND.x - 12, BIGPOND.y - 12, BIGPOND.w + 24, BIGPOND.h + 24, 26); ctx.fillStyle = '#4e9a3a'; ctx.fill();
  rrect(ctx, BIGPOND.x, BIGPOND.y, BIGPOND.w, BIGPOND.h, 18); ctx.fillStyle = P.water; ctx.fill();
  rrect(ctx, BIGPOND.x + 14, BIGPOND.y + 14, BIGPOND.w * 0.5, BIGPOND.h - 28, 12); ctx.fillStyle = 'rgba(128,212,242,0.6)'; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2.4;
  for (let i = 0; i < 40; i++) { const x = BIGPOND.x + 12 + r() * (BIGPOND.w - 40), y = BIGPOND.y + 12 + r() * (BIGPOND.h - 24); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 3, x + 16, y); ctx.stroke(); }
  for (let i = 0; i < 6; i++) { // waterlelies
    const x = BIGPOND.x + 24 + r() * (BIGPOND.w - 48), y = BIGPOND.y + 30 + r() * (BIGPOND.h - 60);
    ctx.fillStyle = '#5fb044'; ctx.beginPath(); ctx.arc(x, y, 12, 0.3, Math.PI * 2 - 0.3); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    if (r() < 0.5) { ctx.fillStyle = '#ff9ecf'; circle(ctx, x + 3, y - 2, 4); ctx.fill(); }
  }
  rrect(ctx, BIGPOND.x, BIGPOND.y, BIGPOND.w, BIGPOND.h, 18); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke();

  // gracht vol formulieren rond de Toren van Paperassen
  const mo = MOAT.outer, mi = MOAT.inner;
  rrect(ctx, mo.x - 10, mo.y - 10, mo.w + 20, mo.h + 20, 16); ctx.fillStyle = '#9c9389'; ctx.fill();
  rrect(ctx, mo.x, mo.y, mo.w, mo.h, 12); ctx.fillStyle = '#e9e4d8'; ctx.fill();
  ctx.save(); rrect(ctx, mo.x, mo.y, mo.w, mo.h, 12); ctx.clip();
  const binderCols = ['#e8504c', '#3d8fe0', '#f6c33b', '#4cc764', '#8e5bd8'];
  for (let i = 0; i < 420; i++) {
    const x = mo.x + r() * mo.w, y = mo.y + r() * mo.h;
    ctx.save(); ctx.translate(x, y); ctx.rotate(r() * Math.PI);
    if (r() < 0.8) { ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#f4efe4'; ctx.fillRect(-11, -14, 22, 28); ctx.strokeStyle = '#b9b3a8'; ctx.lineWidth = 1; ctx.strokeRect(-11, -14, 22, 28); }
    else { ctx.fillStyle = binderCols[Math.floor(r() * binderCols.length)]; ctx.fillRect(-8, -18, 16, 36); ctx.strokeStyle = P.line; ctx.lineWidth = 1.4; ctx.strokeRect(-8, -18, 16, 36); }
    ctx.restore();
  }
  ctx.restore();
  rrect(ctx, mo.x, mo.y, mo.w, mo.h, 12); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke();
  // het eiland binnen de gracht
  rrect(ctx, mi.x, mi.y, mi.w, mi.h, 10); ctx.fillStyle = '#c9c2b8'; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke();

  // wegen
  for (const p of DENSE_ROADS) { polyline(ctx, p.dense); ctx.strokeStyle = ASPHALT_EDGE; ctx.lineWidth = p.w + 12; ctx.stroke(); }
  circle(ctx, ROUNDABOUT.x, ROUNDABOUT.y, ROUNDABOUT.r + 6); ctx.fillStyle = ASPHALT_EDGE; ctx.fill();
  for (const p of DENSE_ROADS) { polyline(ctx, p.dense); ctx.strokeStyle = ASPHALT; ctx.lineWidth = p.w; ctx.stroke(); }
  circle(ctx, ROUNDABOUT.x, ROUNDABOUT.y, ROUNDABOUT.r); ctx.fillStyle = ASPHALT; ctx.fill();
  ctx.setLineDash([26, 22]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4;
  for (const p of DENSE_ROADS) if (p.w >= 80) { polyline(ctx, p.dense); ctx.stroke(); }
  ctx.setLineDash([]);
  circle(ctx, ROUNDABOUT.x, ROUNDABOUT.y, ROUNDABOUT.r * 0.5); ctx.fillStyle = P.grassDark; ctx.fill();
  ctx.strokeStyle = '#f1ece2'; ctx.lineWidth = 8; ctx.stroke();

  // parkeerplaatsen
  for (const pk of PARKINGS) parking(ctx, pk, r);

  // voetpaden
  for (const p of DENSE_PATHS) stonePath(ctx, p, r);

  // terras (houten vlonder met tegelrand)
  rrect(ctx, PLAZA.x - 8, PLAZA.y - 8, PLAZA.w + 16, PLAZA.h + 16, 14); ctx.fillStyle = '#c9ad7a'; ctx.fill();
  rrect(ctx, PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h, 10); ctx.fillStyle = '#e3c99a'; ctx.fill();
  ctx.strokeStyle = '#c4a26e'; ctx.lineWidth = 2;
  for (let x = PLAZA.x + 22; x < PLAZA.x + PLAZA.w; x += 22) { ctx.beginPath(); ctx.moveTo(x, PLAZA.y + 4); ctx.lineTo(x, PLAZA.y + PLAZA.h - 4); ctx.stroke(); }
  rrect(ctx, PLAZA.x, PLAZA.y, PLAZA.w, PLAZA.h, 10); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke();

  // vijver bij Het Atelier
  ellipse(ctx, POND.x, POND.y, POND.rx + 10, POND.ry + 10); ctx.fillStyle = '#4e9a3a'; ctx.fill();
  ellipse(ctx, POND.x, POND.y, POND.rx, POND.ry); ctx.fillStyle = P.water; ctx.fill();
  ellipse(ctx, POND.x - 6, POND.y - 10, POND.rx * 0.6, POND.ry * 0.7); ctx.fillStyle = P.waterLight; ctx.fill();
  ellipse(ctx, POND.x, POND.y, POND.rx, POND.ry); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke();

  // schaduw onder de gebouwen
  ctx.fillStyle = 'rgba(30,20,40,0.2)';
  for (const b of [...BUILDINGS, ...NEIGHBOURS]) for (const p of b.parts) { rrect(ctx, p.x + 10, p.y + 12, p.w, p.h, 8); ctx.fill(); }
}

export function buildTerrainChunks(scene) {
  const cols = Math.ceil(WORLD_W / CHUNK), rows = Math.ceil(WORLD_H / CHUNK);
  const imgs = [];
  let full = null;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const key = `terrain_${cx}_${cy}`;
      if (!scene.textures.exists(key)) {
        // eenmalig de hele wereld tekenen, daarna in stukken knippen
        if (!full) {
          full = document.createElement('canvas');
          full.width = WORLD_W; full.height = WORLD_H;
          drawTerrain(full.getContext('2d'));
        }
        makeTexture(scene, key, CHUNK, CHUNK, (ctx) => ctx.drawImage(full, cx * CHUNK, cy * CHUNK, CHUNK, CHUNK, 0, 0, CHUNK, CHUNK));
      }
      imgs.push(scene.add.image(cx * CHUNK, cy * CHUNK, key).setOrigin(0).setDepth(-1000));
    }
  }
  if (full) { full.width = 1; full.height = 1; }
  return imgs;
}

export function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function inRect(x, y, r, pad = 0) {
  return x >= r.x - pad && x <= r.x + r.w + pad && y >= r.y - pad && y <= r.y + r.h + pad;
}
