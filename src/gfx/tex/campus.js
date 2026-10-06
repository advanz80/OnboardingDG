// Gebouwen van Brainport Human Campus als eenvoudige blokken (grijze versie).
// Elk deel van een gebouw is één texture ter grootte van de plattegrond-rechthoek:
// bovenin het platte dak, onderin de gevel (H pixels hoog), zodat de kaart klopt
// met de plattegrond en de speler er netjes achter kan lopen.
import { P, shade } from '../palette.js';
import { style, rrect, makeTexture, rng } from '../draw.js';
import { BRANDS } from '../../config/brands.js';

const brandColors = (b) => (Array.isArray(b.brand) ? b.brand : b.brand ? [b.brand] : []).map((id) => BRANDS[id].css);

function drawPart(c, w, h, H, { wall, roof, bands, label, seed }) {
  const r = rng(seed);
  const fy = h - H; // bovenkant gevel
  // dak
  rrect(c, 2, 2, w - 4, fy + 4, 6); style(c, { fill: roof, lw: 3 });
  rrect(c, 10, 10, w - 20, fy - 12, 4); c.fillStyle = shade(roof, 0.12); c.fill();
  // installaties op het dak
  const n = Math.floor((w * fy) / 9000);
  for (let i = 0; i < n; i++) {
    const bw = 16 + r() * 22, bh = 12 + r() * 14;
    const x = 18 + r() * Math.max(1, w - 36 - bw), y = 16 + r() * Math.max(1, fy - 28 - bh);
    rrect(c, x, y, bw, bh, 3); style(c, { fill: shade(roof, -0.12), stroke: shade(roof, -0.4), lw: 1.6 });
  }
  // gevel
  rrect(c, 2, fy, w - 4, H - 2, 4); style(c, { fill: wall, lw: 3 });
  // huisstijlband
  if (bands.length) {
    const bw = (w - 10) / bands.length;
    bands.forEach((col, i) => { c.fillStyle = col; c.fillRect(5 + i * bw, fy + 3, bw, 9); });
  }
  // ramen per verdieping
  const floors = Math.max(1, Math.floor((H - 22) / 30));
  const fh = (H - 20) / floors;
  for (let f = 0; f < floors; f++) {
    const y = fy + 16 + f * fh;
    for (let x = 14; x + 18 < w - 10; x += 30) {
      rrect(c, x, y, 18, fh - 10, 2);
      const g = c.createLinearGradient(x, y, x + 18, y + fh); g.addColorStop(0, '#e2f5ff'); g.addColorStop(1, '#86bfdc');
      c.fillStyle = g; c.fill(); c.strokeStyle = shade(wall, -0.45); c.lineWidth = 1.6; c.stroke();
    }
  }
  if (label) {
    c.font = '700 22px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 28;
    const x = w / 2 - tw / 2, y = fy + 14;
    rrect(c, x, y, tw, 34, 8); style(c, { fill: P.cream, stroke: P.line, lw: 2.6 });
    c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(label, w / 2, y + 18);
    // entree
    rrect(c, w / 2 - 22, h - 40, 44, 36, 3); style(c, { fill: '#5d6b78', stroke: P.line, lw: 2.4 });
    c.fillStyle = 'rgba(190,230,250,0.8)'; c.fillRect(w / 2 - 17, h - 35, 15, 29); c.fillRect(w / 2 + 2, h - 35, 15, 29);
  }
}

// ── Driessen: rode baksteen, antraciet schilddak met witte dakrand, witte kozijnen ──
const BRICK = '#9c4a3a', ROOF = '#4a4f5a', ROOF_D = '#363a43';

function hipRoof(c, w, rh) {
  // schilddak van bovenaf: buitenrand, nok in het midden, graten naar de hoeken
  const inset = Math.min(rh * 0.42, w * 0.3);
  c.beginPath(); c.rect(2, 2, w - 4, rh); c.fillStyle = ROOF; c.fill();
  // dakvlakken iets verschillend van tint (licht van linksboven)
  c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.moveTo(2, 2); c.lineTo(w - 2, 2); c.lineTo(w - 2 - inset, rh / 2); c.lineTo(2 + inset, rh / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.moveTo(2, rh + 2); c.lineTo(w - 2, rh + 2); c.lineTo(w - 2 - inset, rh / 2); c.lineTo(2 + inset, rh / 2); c.closePath(); c.fill();
  // pannenrijen
  c.strokeStyle = ROOF_D; c.lineWidth = 1.2;
  for (let y = 8; y < rh; y += 7) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
  // nok en graten
  c.strokeStyle = '#2b2e35'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(2, 2); c.lineTo(2 + inset, rh / 2); c.lineTo(w - 2 - inset, rh / 2); c.lineTo(w - 2, 2);
  c.moveTo(2, rh + 2); c.lineTo(2 + inset, rh / 2); c.moveTo(w - 2, rh + 2); c.lineTo(w - 2 - inset, rh / 2); c.stroke();
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, rh);
}

function brickWall(c, x, y, w, h) {
  c.fillStyle = BRICK; c.fillRect(x, y, w, h);
  c.strokeStyle = 'rgba(60,25,18,0.35)'; c.lineWidth = 1;
  for (let yy = y + 5, row = 0; yy < y + h; yy += 5, row++) {
    c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke();
    for (let xx = x + (row % 2) * 6; xx < x + w; xx += 12) { c.beginPath(); c.moveTo(xx, yy - 5); c.lineTo(xx, yy); c.stroke(); }
  }
}

function whiteWindow(c, x, y, w, h) {
  c.fillStyle = '#ffffff'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#dff3ff'); g.addColorStop(1, '#7fb6d4');
  c.fillStyle = g; c.fillRect(x, y, w, h);
  c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.35); c.lineTo(x + w, y + h * 0.35); c.stroke();
  c.strokeStyle = 'rgba(60,40,40,0.5)'; c.lineWidth = 1; c.strokeRect(x - 2, y - 2, w + 4, h + 4);
}

function drawDriessenPart(c, w, h, H, { front, entrance }) {
  const fy = h - H;
  hipRoof(c, w, fy - 2);
  // witte dakrand (goot) en lichtband onder het dak
  c.fillStyle = '#ffffff'; c.fillRect(0, fy - 6, w, 8); c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(0, fy - 6, w, 8);
  brickWall(c, 2, fy + 2, w - 4, H - 4);
  const band = 16;
  c.fillStyle = '#ffffff'; c.fillRect(2, fy + 2, w - 4, band);
  for (let x = 8; x + 14 < w - 6; x += 18) { c.fillStyle = '#9fd0ea'; c.fillRect(x, fy + 5, 14, band - 6); }
  // ramen of deuren
  const top = fy + band + 10, wh = H - band - 18;
  if (front) {
    // vijf witte glazen dubbele deuren met bovenlicht, plus de letters erboven
    const n = 5, dw = 26, gap = 10, total = n * dw + (n - 1) * gap, x0 = w / 2 - total / 2;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (dw + gap);
      whiteWindow(c, x, top + 22, dw, wh - 24);
      c.fillStyle = 'rgba(246,195,59,0.6)'; c.beginPath(); c.arc(x + dw / 2, top + 34, 3, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#e9e6e0'; c.font = '600 22px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.strokeStyle = 'rgba(40,30,30,0.5)'; c.lineWidth = 3; c.strokeText('driessen', w / 2, top + 9); c.fillText('driessen', w / 2, top + 9);
    for (let x = 14; x < x0 - 28; x += 34) whiteWindow(c, x, top + 6, 22, wh - 10);
    for (let x = w - 36; x > x0 + total + 6; x -= 34) whiteWindow(c, x, top + 6, 22, wh - 10);
  } else {
    for (let x = 12; x + 22 < w - 8; x += 34) whiteWindow(c, x, top, 22, wh - 4);
  }
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy + 2, w - 4, H - 4);
  if (entrance) {
    // voordeur aan de noordkant: witte luifel met de naam op de dakrand
    const lw = Math.min(170, w - 40), lx = w / 2 - lw / 2;
    c.fillStyle = '#ffffff'; c.fillRect(lx, 0, lw, 22); c.strokeStyle = P.line; c.lineWidth = 2.4; c.strokeRect(lx, 0, lw, 22);
    c.fillStyle = BRICK; c.font = '700 16px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('driessen', w / 2, 12);
  }
}

/** Maakt textures `bld_<id>_<i>` voor alle delen. Het voorste deel krijgt het naambord. */
export function makeCampusBuildings(scene, buildings, neighbour = false) {
  buildings.forEach((b, bi) => {
    const front = b.parts.reduce((m, p, i) => (p.y + p.h > b.parts[m].y + b.parts[m].h ? i : m), 0);
    b.parts.forEach((p, i) => {
      const H = Math.min(b.H, Math.round(p.h * 0.7));
      const bands = brandColors(b);
      if (!bands.length && b.color) bands.push(b.color);
      const wall = neighbour ? '#d9d4ca' : '#f1ece2';
      const roof = neighbour ? '#b9b6b0' : '#cfcac2';
      makeTexture(scene, `bld_${b.id}_${i}`, p.w, p.h, (c, w, h) => (b.style === 'driessen'
        ? drawDriessenPart(c, w, h, H, { front: i === front, entrance: i === b.entrance })
        : drawPart(c, w, h, H, { wall, roof, bands, label: !neighbour && i === front ? b.name : '', seed: 7 + bi * 31 + i })));
    });
  });
}
