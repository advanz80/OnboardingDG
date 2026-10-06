// Bootjes in Animal Crossing-stijl: zeilbootjes, een jacht en de piratensloep.
// Zelfde texture-namen en afmetingen als de oude versies, zodat de plaatsing gelijk blijft.
import { P, shade } from '../palette.js';
import { style, rrect, circle, ellipse, poly, makeTexture } from '../draw.js';

const L = P.line;

/** Schuimrandje en rimpels rond de waterlijn. */
function wake(c, cx, y, w) {
  c.fillStyle = 'rgba(255,255,255,0.55)'; ellipse(c, cx, y, w / 2 + 8, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2.4; c.lineCap = 'round';
  for (const [dx, dy, l] of [[-w / 2 - 6, 5, 16], [w / 2 - 4, 6, 18], [-w / 4, 10, 12], [w / 5, 11, 14]]) {
    c.beginPath(); c.moveTo(cx + dx, y + dy); c.quadraticCurveTo(cx + dx + l / 2, y + dy - 3, cx + dx + l, y + dy); c.stroke();
  }
}

/** Romp met verloop, streep, rand en patrijspoorten. */
function hull(c, pts, { col, stripe, rim = '#e9dcc4', ports = [] }) {
  const top = Math.min(...pts.map((p) => p[1])), bot = Math.max(...pts.map((p) => p[1]));
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[1][0], pts[1][1]);
  c.quadraticCurveTo(pts[2][0], pts[2][1], pts[3][0], pts[3][1]); c.lineTo(pts[4][0], pts[4][1]);
  c.quadraticCurveTo(pts[5][0], pts[5][1], pts[0][0], pts[0][1]); c.closePath();
  const g = c.createLinearGradient(0, top, 0, bot); g.addColorStop(0, shade(col, 0.06)); g.addColorStop(1, shade(col, -0.16));
  c.save(); c.fillStyle = g; c.fill();
  c.clip();
  if (stripe) { c.fillStyle = stripe; c.fillRect(0, top + (bot - top) * 0.38, 400, 6); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(0, top + (bot - top) * 0.38 + 8, 400, 2); }
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, top + 2, 400, 3);
  c.restore();
  c.strokeStyle = L; c.lineWidth = 3.2; c.stroke();
  // dekrand
  c.strokeStyle = rim; c.lineWidth = 4; c.beginPath(); c.moveTo(pts[0][0] + 2, pts[0][1] + 1); c.lineTo(pts[1][0] - 2, pts[1][1] + 1); c.stroke();
  for (const [x, y] of ports) { circle(c, x, y, 4.2); style(c, { fill: '#bfe8ff', stroke: '#c9a24a', lw: 2 }); c.fillStyle = 'rgba(255,255,255,0.8)'; circle(c, x - 1.4, y - 1.4, 1.3); c.fill(); }
}

/** Zeil met zacht verloop en naden. */
function sail(c, pts, col, { stripes = null, seams = 3 } = {}) {
  poly(c, pts);
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const g = c.createLinearGradient(Math.min(...xs), 0, Math.max(...xs), 0);
  g.addColorStop(0, shade(col, -0.08)); g.addColorStop(0.6, col); g.addColorStop(1, shade(col, 0.04));
  c.save(); c.fillStyle = g; c.fill(); c.clip();
  if (stripes) { c.fillStyle = stripes; const y0 = Math.min(...ys), y1 = Math.max(...ys); for (let y = y0 + 10; y < y1; y += 18) c.fillRect(0, y, 400, 8); }
  c.strokeStyle = 'rgba(80,70,90,0.18)'; c.lineWidth = 1.2;
  const y0 = Math.min(...ys), y1 = Math.max(...ys);
  for (let i = 1; i <= seams; i++) { const y = y0 + ((y1 - y0) * i) / (seams + 1); c.beginPath(); c.moveTo(0, y); c.lineTo(400, y + 3); c.stroke(); }
  c.restore();
  poly(c, pts); c.strokeStyle = L; c.lineWidth = 2.6; c.stroke();
}

function pennant(c, x, y, col) {
  poly(c, [[x, y], [x + 18, y + 5], [x, y + 10]]); style(c, { fill: col, lw: 1.6 });
}

function sailboat(scene, key, { hullCol, stripe, main, jib, mainStripes, flag, emblem }) {
  makeTexture(scene, key, 150, 120, (c) => {
    wake(c, 75, 101, 120);
    // mast + giek
    rrect(c, 68, 6, 5, 76, 2); style(c, { fill: '#d9c7a6', lw: 2 });
    rrect(c, 34, 72, 40, 4, 2); style(c, { fill: '#b98a52', lw: 1.6 });
    pennant(c, 72, 6, flag);
    sail(c, [[74, 14], [128, 72], [74, 72]], jib, { seams: 2 });
    sail(c, [[67, 16], [30, 70], [67, 70]], main, { stripes: mainStripes, seams: 3 });
    // embleem op het zeil (geen tekst: sommige bootjes worden gespiegeld)
    if (emblem) { circle(c, 54, 54, 6); style(c, { fill: emblem, stroke: 'rgba(60,60,90,0.5)', lw: 1.4 }); }
    // touwtje naar de boeg
    c.strokeStyle = 'rgba(80,60,40,0.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(72, 10); c.lineTo(136, 80); c.stroke();
    hull(c, [[10, 78], [140, 78], [130, 108], [100, 108], [36, 108], [16, 104]], { col: hullCol, stripe, ports: [[46, 91], [64, 92], [82, 92]] });
    // kleine stootkussens
    for (const x of [30, 118]) { rrect(c, x - 3, 80, 6, 11, 3); style(c, { fill: '#ffffff', lw: 1.4 }); }
  });
}

function yacht(scene) {
  makeTexture(scene, 'yacht', 240, 120, (c) => {
    wake(c, 120, 104, 200);
    // antennemast + vlag
    c.strokeStyle = L; c.lineWidth = 2.4; c.beginPath(); c.moveTo(112, 14); c.lineTo(112, 0); c.stroke();
    circle(c, 112, 2, 2.4); style(c, { fill: '#ffd23f', lw: 1.2 });
    c.beginPath(); c.moveTo(18, 62); c.lineTo(18, 40); c.stroke();
    poly(c, [[18, 40], [34, 44], [18, 49]]); style(c, { fill: P.red, lw: 1.4 });
    // bovenbouw
    rrect(c, 86, 12, 56, 24, 9); style(c, { fill: '#ffffff' });
    rrect(c, 94, 18, 40, 10, 4); style(c, { fill: '#2e5f8a', lw: 2 });
    c.fillStyle = 'rgba(255,255,255,0.6)'; poly(c, [[98, 19], [106, 19], [100, 27], [96, 27]]); c.fill();
    rrect(c, 52, 30, 128, 36, 11); style(c, { fill: '#ffffff' });
    rrect(c, 62, 38, 108, 16, 6); style(c, { fill: '#2e5f8a', lw: 2.4 });
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (const x of [70, 104, 138]) { poly(c, [[x, 39], [x + 12, 39], [x + 4, 53], [x - 6, 53]]); c.fill(); }
    // reling
    c.strokeStyle = '#9aa7b4'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(184, 52); c.lineTo(226, 50); c.stroke();
    for (let x = 188; x <= 224; x += 9) { c.beginPath(); c.moveTo(x, 51); c.lineTo(x, 61); c.stroke(); }
    hull(c, [[6, 64], [234, 60], [214, 110], [170, 110], [40, 110], [14, 100]], { col: '#ffffff', stripe: '#2b4f7a', ports: [[150, 86], [170, 85], [190, 84]] });
    // reddingsboei op de spiegel
    circle(c, 34, 78, 8); c.strokeStyle = '#fffaf0'; c.lineWidth = 5; c.stroke();
    c.strokeStyle = P.red; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(34, 78, 8, (i * Math.PI) / 2, (i * Math.PI) / 2 + 0.6); c.stroke(); }
    // golfjes-motief op de romp (geen tekst: het jacht wordt gespiegeld neergezet)
    c.strokeStyle = '#2b4f7a'; c.lineWidth = 2;
    for (const x of [86, 104, 122]) { c.beginPath(); c.moveTo(x, 96); c.quadraticCurveTo(x + 4.5, 91, x + 9, 96); c.quadraticCurveTo(x + 13.5, 101, x + 18, 96); c.stroke(); }
  });
}

function sloop(scene) {
  makeTexture(scene, 'sloop', 280, 210, (c) => {
    wake(c, 140, 196, 230);
    // mast, ra en touwwerk
    rrect(c, 135, 6, 10, 132, 3); style(c, { fill: '#8a5226', lw: 2.6 });
    rrect(c, 66, 22, 148, 7, 3); style(c, { fill: '#9a5e30', lw: 2 });
    c.strokeStyle = 'rgba(70,45,25,0.7)'; c.lineWidth = 1.4;
    for (const [x1, y1, x2, y2] of [[140, 8, 22, 140], [140, 8, 262, 134], [140, 30, 40, 140], [140, 30, 244, 136]]) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
    // zeil met lapjes
    c.beginPath(); c.moveTo(72, 28); c.quadraticCurveTo(140, 20, 208, 28); c.quadraticCurveTo(222, 72, 204, 114); c.quadraticCurveTo(140, 126, 76, 114); c.quadraticCurveTo(58, 72, 72, 28); c.closePath();
    const g = c.createLinearGradient(70, 0, 210, 0); g.addColorStop(0, '#e2d5bb'); g.addColorStop(0.5, '#f5ecda'); g.addColorStop(1, '#e8dcc4');
    c.fillStyle = g; c.fill(); c.strokeStyle = L; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(120,95,60,0.3)'; c.lineWidth = 1.4;
    for (const y of [52, 76, 98]) { c.beginPath(); c.moveTo(70, y); c.quadraticCurveTo(140, y + 6, 212, y); c.stroke(); }
    const patch = (x, y, w, h, col) => {
      rrect(c, x, y, w, h, 3); style(c, { fill: col, lw: 1.6 });
      c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1; c.setLineDash([3, 3]); rrect(c, x + 3, y + 3, w - 6, h - 6, 2); c.stroke(); c.setLineDash([]);
    };
    patch(162, 48, 26, 22, '#c7463a'); patch(92, 80, 22, 18, '#4a86c7');
    // doodshoofd-vlag
    rrect(c, 141, 0, 3, 10, 1); poly(c, [[144, 0], [170, 3], [166, 9], [170, 15], [144, 13]]); style(c, { fill: '#2d1e2f', lw: 1.4 });
    c.fillStyle = '#fff'; circle(c, 155, 6, 2.6); c.fill(); c.fillRect(151, 10, 8, 1.4);
    // romp van planken
    c.beginPath(); c.moveTo(12, 140); c.lineTo(268, 132); c.quadraticCurveTo(254, 196, 200, 200); c.lineTo(70, 200); c.quadraticCurveTo(24, 192, 12, 140); c.closePath();
    const hg = c.createLinearGradient(0, 132, 0, 200); hg.addColorStop(0, '#9a5e30'); hg.addColorStop(1, '#6b3a1c');
    c.save(); c.fillStyle = hg; c.fill(); c.clip();
    c.strokeStyle = 'rgba(40,20,10,0.4)'; c.lineWidth = 1.6;
    for (let y = 150; y < 200; y += 12) { c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(140, y + 6, 280, y - 6); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, 136, 280, 4);
    c.restore();
    c.beginPath(); c.moveTo(12, 140); c.lineTo(268, 132); c.quadraticCurveTo(254, 196, 200, 200); c.lineTo(70, 200); c.quadraticCurveTo(24, 192, 12, 140); c.closePath();
    c.strokeStyle = L; c.lineWidth = 4; c.stroke();
    // gouden bies + kanonsluikjes
    c.strokeStyle = '#e8b64a'; c.lineWidth = 4; c.beginPath(); c.moveTo(18, 154); c.quadraticCurveTo(140, 160, 262, 148); c.stroke();
    for (const x of [80, 140, 200]) { rrect(c, x - 9, 164, 18, 13, 3); style(c, { fill: '#2d1e2f', lw: 2 }); circle(c, x, 170, 3); c.fillStyle = '#555'; c.fill(); }
    // lantaarn op de achtersteven
    rrect(c, 18, 116, 12, 16, 3); style(c, { fill: '#ffd36e', lw: 2 });
    c.fillStyle = 'rgba(255,220,120,0.35)'; circle(c, 24, 124, 14); c.fill();
  });
}

export function makeACBoats(scene) {
  sailboat(scene, 'boat0', { hullCol: '#ffffff', stripe: '#3d8fe0', main: '#ffffff', jib: '#f4f8ff', mainStripes: 'rgba(61,143,224,0.55)', flag: P.red, emblem: '#ffd23f' });
  sailboat(scene, 'boat1', { hullCol: '#ffe066', stripe: '#e8504c', main: '#e8504c', jib: '#fffaf0', mainStripes: 'rgba(255,255,255,0.45)', flag: '#2ec4b6', emblem: null });
  sailboat(scene, 'boat2', { hullCol: '#2ec4b6', stripe: '#fffaf0', main: '#fffaf0', jib: '#ffd23f', mainStripes: null, flag: '#ff7aa8', emblem: '#3d8fe0' });
  yacht(scene);
  sloop(scene);
}
