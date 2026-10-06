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
      makeTexture(scene, `bld_${b.id}_${i}`, p.w, p.h, (c, w, h) =>
        drawPart(c, w, h, H, { wall, roof, bands, label: !neighbour && i === front ? b.name : '', seed: 7 + bi * 31 + i }));
    });
  });
}
