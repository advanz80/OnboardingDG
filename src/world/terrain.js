// Tekent het parkterrein in chunks van 1024×1024 (canvas-textures).
import { P } from '../gfx/palette.js';
import { rng, circle, ellipse, rrect, star, makeTexture } from '../gfx/draw.js';
import { LAND, GRASS, PATHS, PLAZA, PIER, JETTIES, WORLD_W, WORLD_H, sampleSmooth } from './layout.js';

export const CHUNK = 1024;

function polyPath(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

function planks(ctx, x, y, w, h, vertical) {
  ctx.fillStyle = 'rgba(30,20,40,0.25)';
  ctx.fillRect(x + 6, y + 8, w, h);
  rrect(ctx, x, y, w, h, 4);
  ctx.fillStyle = P.woodLight; ctx.fill();
  ctx.strokeStyle = P.woodDark; ctx.lineWidth = 2;
  if (vertical) for (let yy = y + 16; yy < y + h; yy += 16) { ctx.beginPath(); ctx.moveTo(x + 2, yy); ctx.lineTo(x + w - 2, yy); ctx.stroke(); }
  else for (let xx = x + 16; xx < x + w; xx += 16) { ctx.beginPath(); ctx.moveTo(xx, y + 2); ctx.lineTo(xx, y + h - 2); ctx.stroke(); }
  rrect(ctx, x, y, w, h, 4); ctx.strokeStyle = P.line; ctx.lineWidth = 4; ctx.stroke();
  // palen
  const posts = vertical ? Math.floor(h / 90) : Math.floor(w / 90);
  for (let i = 0; i <= posts; i++) {
    const px = vertical ? [x - 4, x + w + 4] : [x + (i * w) / Math.max(1, posts)];
    const py = vertical ? [y + (i * h) / Math.max(1, posts)] : [y - 4, y + h + 4];
    for (const a of px) for (const b of py) { circle(ctx, a, b, 7); ctx.fillStyle = P.woodDark; ctx.fill(); ctx.strokeStyle = P.line; ctx.lineWidth = 3; ctx.stroke(); }
  }
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

export function drawTerrain(ctx) {
  const r = rng(42);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const densePaths = PATHS.map((p) => ({ ...p, dense: sampleSmooth(p.pts, false, 14) }));
  const nearPath = (x, y, m) => densePaths.some((p) => distToDense(x, y, p.dense) < p.w / 2 + m);

  // ondiep water, schuimbelletjes langs de kust
  polyPath(ctx, LAND);
  ctx.strokeStyle = 'rgba(128,212,242,0.5)'; ctx.lineWidth = 120; ctx.stroke();
  ctx.strokeStyle = 'rgba(160,226,248,0.6)'; ctx.lineWidth = 60; ctx.stroke();
  ctx.strokeStyle = 'rgba(239,252,255,0.75)'; ctx.lineWidth = 20; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < LAND.length; i += 2) {
    const [x, y] = LAND[i];
    if (y > WORLD_H - 10 || x < -40 || x > WORLD_W + 40) continue;
    circle(ctx, x + (r() - 0.5) * 16, y + (r() - 0.5) * 16, 3 + r() * 5); ctx.fill();
  }

  // zand: warme basis, ribbels, schelpjes en zeesterren
  polyPath(ctx, LAND); ctx.fillStyle = P.sand; ctx.fill();
  ctx.save(); polyPath(ctx, LAND); ctx.clip();
  for (let i = 0; i < 2400; i++) {
    const x = r() * WORLD_W, y = r() * WORLD_H;
    ctx.fillStyle = r() < 0.5 ? 'rgba(231,191,107,0.5)' : 'rgba(255,240,194,0.7)';
    circle(ctx, x, y, 1.5 + r() * 2.2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(214,170,90,0.45)'; ctx.lineWidth = 2.5;
  for (let i = 0; i < 420; i++) {
    const x = r() * WORLD_W, y = 580 + r() * 520, w = 14 + r() * 18;
    ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - 6, x + w, y); ctx.stroke();
  }
  for (let i = 0; i < 140; i++) {
    const x = r() * WORLD_W, y = 600 + r() * 480, k = r();
    if (k < 0.55) { // schelp
      ctx.fillStyle = r() < 0.5 ? '#fff4ea' : '#ffc9b8';
      ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.arc(x, y, 5, Math.PI * 0.9, Math.PI * 2.1); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(180,120,100,0.6)'; ctx.lineWidth = 1;
      for (const dx of [-2.5, 0, 2.5]) { ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + dx, y - 3.5); ctx.stroke(); }
    } else if (k < 0.75) { // zeester
      ctx.fillStyle = '#ff8a5b'; star(ctx, x, y, 7, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; circle(ctx, x, y, 1.2); ctx.fill();
    } else { // steentje
      ctx.fillStyle = '#d9cbb2'; ellipse(ctx, x, y, 4, 3, r() * 3); ctx.fill();
    }
  }
  ctx.restore();
  // natte rand + contour
  polyPath(ctx, LAND); ctx.strokeStyle = 'rgba(200,160,90,0.55)'; ctx.lineWidth = 16; ctx.stroke();
  polyPath(ctx, LAND); ctx.strokeStyle = P.line; ctx.lineWidth = 3.2; ctx.stroke();

  // gras
  ctx.save(); polyPath(ctx, LAND); ctx.clip();
  // schaduwrand richting strand (licht hoogteverschil)
  polyPath(ctx, GRASS); ctx.save(); ctx.translate(0, 8); ctx.fillStyle = '#c9a85e'; ctx.fill(); ctx.restore();
  polyPath(ctx, GRASS); ctx.fillStyle = P.grass; ctx.fill();
  ctx.save(); polyPath(ctx, GRASS); ctx.clip();
  // grote, zachte toonvlakken (AC heeft licht gevlekt gras)
  for (let i = 0; i < 160; i++) {
    const x = r() * WORLD_W, y = 650 + r() * (WORLD_H - 650);
    ctx.fillStyle = r() < 0.6 ? 'rgba(163,223,116,0.32)' : 'rgba(80,160,60,0.18)';
    ellipse(ctx, x, y, 50 + r() * 90, 26 + r() * 46, r() * 3); ctx.fill();
  }
  // grasplukjes in twee tinten (driehoekig AC-patroon)
  for (let i = 0; i < 4200; i++) {
    const x = r() * WORLD_W, y = 650 + r() * (WORLD_H - 650);
    const light = r() < 0.35;
    ctx.strokeStyle = light ? 'rgba(190,240,140,0.8)' : 'rgba(70,140,50,0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 5); ctx.lineTo(x, y); ctx.lineTo(x + 4, y - 6); ctx.stroke();
    if (!light && r() < 0.3) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 7); ctx.stroke(); }
  }
  // klavertjes en madeliefjes
  for (let i = 0; i < 500; i++) {
    const x = r() * WORLD_W, y = 650 + r() * (WORLD_H - 650);
    if (nearPath(x, y, 6)) continue;
    if (r() < 0.6) {
      ctx.fillStyle = 'rgba(70,150,60,0.85)';
      for (let k = 0; k < 3; k++) { const a = k * 2.1 - 1.6; circle(ctx, x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.8); ctx.fill(); }
    } else {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 6; k++) { const a = k * 1.05; circle(ctx, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 1.6); ctx.fill(); }
      ctx.fillStyle = '#ffd23f'; circle(ctx, x, y, 1.6); ctx.fill();
    }
  }
  // bloemperkjes (clusters)
  for (let i = 0; i < 70; i++) {
    const x = r() * WORLD_W, y = 760 + r() * (WORLD_H - 800);
    if (!inPoly(x, y, GRASS) || nearPath(x, y, 30) || Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + 40) continue;
    const col = FLOWER_COLS[Math.floor(r() * FLOWER_COLS.length)];
    const n = 3 + Math.floor(r() * 5);
    for (let k = 0; k < n; k++) flower(ctx, x + (r() - 0.5) * 46, y + (r() - 0.5) * 28, r() < 0.8 ? col : FLOWER_COLS[Math.floor(r() * FLOWER_COLS.length)], 5 + r() * 1.5);
  }
  ctx.restore();
  polyPath(ctx, GRASS); ctx.strokeStyle = '#4e9a3a'; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();

  // stenen paden: aarde-ondergrond met losse, ronde tegels
  for (const p of densePaths) {
    polyline(ctx, p.dense); ctx.strokeStyle = 'rgba(60,40,30,0.12)'; ctx.lineWidth = p.w + 16; ctx.stroke();
    polyline(ctx, p.dense); ctx.strokeStyle = '#cbb07a'; ctx.lineWidth = p.w + 8; ctx.stroke();
    polyline(ctx, p.dense); ctx.strokeStyle = '#dcc597'; ctx.lineWidth = p.w; ctx.stroke();
  }
  for (const p of densePaths) {
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
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; rrect(ctx, -w / 2 + 3, -h / 2 + 2, w * 0.45, 3, 1.5); ctx.fill();
          ctx.restore();
        }
      }
      acc = (acc - len) % 30; if (acc < 0) acc += 30;
    }
  }

  // plein met bakstenen ringen
  circle(ctx, PLAZA.x, PLAZA.y + 6, PLAZA.r + 10); ctx.fillStyle = 'rgba(60,40,30,0.15)'; ctx.fill();
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r + 8); ctx.fillStyle = '#c9ad7a'; ctx.fill();
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r); ctx.fillStyle = '#efe0c0'; ctx.fill();
  for (let ring = 0, rad = 52; rad < PLAZA.r - 6; ring++, rad += 26) {
    const n = Math.floor((2 * Math.PI * rad) / 34);
    for (let k = 0; k < n; k++) {
      const a0 = (k + (ring % 2) * 0.5) / n * Math.PI * 2, a1 = a0 + (Math.PI * 2) / n * 0.86;
      ctx.beginPath(); ctx.arc(PLAZA.x, PLAZA.y, rad + 11, a0, a1); ctx.arc(PLAZA.x, PLAZA.y, rad - 11, a1, a0, true); ctx.closePath();
      ctx.fillStyle = (ring + k) % 5 === 0 ? '#e3c99a' : ring % 2 ? '#f4e7cc' : '#ecdcb9'; ctx.fill();
      ctx.strokeStyle = '#cdb383'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  circle(ctx, PLAZA.x, PLAZA.y, 40); ctx.fillStyle = '#d9c49a'; ctx.fill();
  circle(ctx, PLAZA.x, PLAZA.y, PLAZA.r); ctx.strokeStyle = P.line; ctx.lineWidth = 3.2; ctx.stroke();

  // pier en steigers
  planks(ctx, PIER.x, PIER.y, PIER.w, PIER.h, true);
  for (const j of JETTIES) planks(ctx, j.x, j.y, j.w, j.h, j.h > j.w);
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
