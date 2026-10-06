// Kapitein Rompslomp & co: de paarse krokodil (Kroko Paragraaf), de Toren van
// Paperassen, losse vellen papier en de achtergrond van de finale.
import { P, shade } from '../palette.js';
import { style, rrect, circle, ellipse, poly, softShadow, makeTexture, rng } from '../draw.js';
import { FRAMES, FW, FH } from '../CharacterFactory.js';

const CROC = '#8e5bd8', CROC_D = '#5f3a9e', BELLY = '#e6d6fa', L = P.line;

function crocFrame(c, frame) {
  const dir = frame.startsWith('back') ? 'back' : frame.startsWith('side') ? 'side' : 'front';
  const pose = frame.replace(/^(back|side)_/, '');
  const walk = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  const cx = FW / 2, G = FH - 5;
  const bob = walk ? -1.5 : 0, slump = pose === 'tired' ? 3 : 0;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(40,25,45,0.2)'; ellipse(c, cx, G + 1, 19, 4.5); c.fill();
  // staart
  if (dir !== 'front' || true) {
    c.beginPath(); c.moveTo(cx + 6, G - 14); c.quadraticCurveTo(cx + 30, G - 10, cx + 33, G - 2); c.quadraticCurveTo(cx + 22, G - 2, cx + 4, G - 6); c.closePath();
    style(c, { fill: shade(CROC, -0.08), stroke: CROC_D, lw: 1.6 });
  }
  // benen
  for (const s of [-1, 1]) {
    const ly = G - 12 + (walk * s > 0 ? -2 : 0);
    rrect(c, cx + s * 7 - 5, ly, 10, 13, 4); style(c, { fill: CROC, stroke: CROC_D, lw: 1.6 });
    rrect(c, cx + s * 7 - 6, G - 3 + (walk * s > 0 ? -2 : 0), 12, 4, 2); style(c, { fill: shade(CROC, -0.15), stroke: CROC_D, lw: 1.2 });
  }
  // lijf
  const by = 66 + bob + slump;
  ellipse(c, cx, by, 16, 19); style(c, { fill: CROC, stroke: CROC_D, lw: 1.8 });
  if (dir !== 'back') {
    ellipse(c, cx, by + 3, 10, 13); c.fillStyle = BELLY; c.fill();
    c.strokeStyle = shade(BELLY, -0.2); c.lineWidth = 1; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(cx - 8, by + 3 + k * 4.5); c.lineTo(cx + 8, by + 3 + k * 4.5); c.stroke(); }
    // stropdas van rode tape
    c.beginPath(); c.moveTo(cx, by - 17); c.lineTo(cx - 3, by - 14); c.lineTo(cx - 2, by - 2); c.lineTo(cx, by + 1); c.lineTo(cx + 2, by - 2); c.lineTo(cx + 3, by - 14); c.closePath();
    style(c, { fill: P.pirateRed, stroke: '#6e1c1a', lw: 1 });
  } else {
    c.fillStyle = CROC_D; for (let k = 0; k < 4; k++) { poly(c, [[cx - 3, by - 12 + k * 7], [cx, by - 17 + k * 7], [cx + 3, by - 12 + k * 7]]); c.fill(); }
  }
  // armen (+ klembord)
  const up = pose === 'cheer';
  for (const s of [-1, 1]) {
    c.save(); c.translate(cx + s * 14, by - 10); c.rotate(up ? -s * 2.4 : -s * 0.25 + walk * s * 0.2);
    rrect(c, -3.5, 0, 7, 15, 3.5); style(c, { fill: CROC, stroke: CROC_D, lw: 1.5 });
    c.restore();
  }
  if (dir === 'front' && !up) {
    rrect(c, cx - 24, by - 4, 13, 17, 2); style(c, { fill: '#c9a46a', stroke: L, lw: 1.4 });
    c.fillStyle = '#ffffff'; c.fillRect(cx - 22.5, by - 1, 10, 12);
    c.strokeStyle = '#9c9389'; c.lineWidth = 0.8; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - 21, by + 2 + k * 2.6); c.lineTo(cx - 14, by + 2 + k * 2.6); c.stroke(); }
  }
  // kop
  const hy = 32 + bob + slump * 1.3;
  if (dir === 'side') {
    rrect(c, cx - 12, hy - 10, 42, 20, 9); style(c, { fill: CROC, stroke: CROC_D, lw: 1.8 });
    c.strokeStyle = CROC_D; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 4, hy + 3); c.lineTo(cx + 28, hy + 3); c.stroke();
    c.fillStyle = '#ffffff'; for (let x = cx + 2; x < cx + 28; x += 5) { poly(c, [[x, hy + 3], [x + 2, hy + 6.5], [x + 4, hy + 3]]); c.fill(); }
    circle(c, cx - 2, hy - 11, 6); style(c, { fill: CROC, stroke: CROC_D, lw: 1.5 });
    circle(c, cx - 1, hy - 12, 3.4); c.fillStyle = '#fff'; c.fill(); circle(c, cx, hy - 12, 1.7); c.fillStyle = L; c.fill();
    circle(c, cx + 26, hy - 6, 1.2); c.fillStyle = CROC_D; c.fill();
    return;
  }
  ellipse(c, cx, hy - 2, 18, 14); style(c, { fill: CROC, stroke: CROC_D, lw: 1.8 });
  if (dir === 'back') return;
  // snuit naar voren + bek
  const open = pose === 'talk' || pose === 'surprised' || up;
  rrect(c, cx - 12, hy + 2, 24, open ? 16 : 13, 7); style(c, { fill: shade(CROC, 0.12), stroke: CROC_D, lw: 1.6 });
  if (open) { rrect(c, cx - 8, hy + 8, 16, 7, 3); c.fillStyle = '#7a2e48'; c.fill(); }
  else { c.strokeStyle = CROC_D; c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx - 10, hy + 9); c.quadraticCurveTo(cx, pose === 'sad' || pose === 'tired' ? hy + 7 : hy + 11, cx + 10, hy + 9); c.stroke(); }
  c.fillStyle = '#ffffff';
  for (const x of [-9, -4, 4, 9]) { poly(c, [[cx + x - 1.8, hy + 8.5], [cx + x, hy + 12], [cx + x + 1.8, hy + 8.5]]); c.fill(); }
  c.fillStyle = CROC_D; circle(c, cx - 4, hy + 4.5, 1.2); c.fill(); circle(c, cx + 4, hy + 4.5, 1.2); c.fill();
  // ogen op bultjes
  for (const s of [-1, 1]) {
    circle(c, cx + s * 8, hy - 13, 6.5); style(c, { fill: CROC, stroke: CROC_D, lw: 1.5 });
    if (pose === 'tired') { c.strokeStyle = L; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx + s * 8 - 3, hy - 13); c.lineTo(cx + s * 8 + 3, hy - 13); c.stroke(); continue; }
    circle(c, cx + s * 8, hy - 13, 4); c.fillStyle = '#fff8d0'; c.fill();
    circle(c, cx + s * 8, hy - 12.5, 2); c.fillStyle = L; c.fill();
    if (pose === 'angry') { c.strokeStyle = CROC_D; c.lineWidth = 1.8; c.beginPath(); c.moveTo(cx + s * 12, hy - 20); c.lineTo(cx + s * 4, hy - 17); c.stroke(); }
  }
  // leesbrilletje
  c.strokeStyle = L; c.lineWidth = 1; for (const s of [-1, 1]) { circle(c, cx + s * 8, hy - 12.5, 5); c.stroke(); }
}

/** Kroko Paragraaf als personage-spritesheet met dezelfde frames als makeCharacter. */
export function makeCroc(scene, key) {
  const SS = 2;
  const big = document.createElement('canvas');
  big.width = FW * SS * FRAMES.length; big.height = FH * SS;
  const b = big.getContext('2d');
  FRAMES.forEach((f, i) => {
    b.save(); b.setTransform(SS, 0, 0, SS, i * FW * SS, 0);
    b.beginPath(); b.rect(0, 0, FW, FH); b.clip();
    crocFrame(b, f);
    b.restore();
  });
  const tex = makeTexture(scene, key, FW * FRAMES.length, FH, (ctx) => {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(big, 0, 0, FW * FRAMES.length, FH);
  });
  FRAMES.forEach((f, i) => tex.add(f, 0, i * FW, 0, FW, FH));
  return key;
}

const BINDERS = ['#e8504c', '#3d8fe0', '#f6c33b', '#4cc764', '#8e5bd8', '#f59a3c', '#2d3a4a'];

function paperStack(c, x, y, w, h, r) {
  for (let k = 0; k < h; k += 5) {
    const dx = (r() - 0.5) * 6;
    rrect(c, x + dx, y + h - k - 5, w, 5, 1.5); c.fillStyle = k % 10 ? '#ffffff' : '#f2ecdf'; c.fill();
    c.strokeStyle = '#c9c2b8'; c.lineWidth = 1; c.stroke();
  }
}
function binderRow(c, x, y, w, h, r) {
  for (let bx = x; bx < x + w - 10; bx += 16 + Math.floor(r() * 6)) {
    const bw = 14 + Math.floor(r() * 5), col = BINDERS[Math.floor(r() * BINDERS.length)], tilt = (r() - 0.5) * 0.08;
    c.save(); c.translate(bx + bw / 2, y + h); c.rotate(tilt);
    rrect(c, -bw / 2, -h, bw, h, 2); style(c, { fill: col, stroke: shade(col, -0.45), lw: 1.6 });
    rrect(c, -bw / 2 + 3, -h + 10, bw - 6, 14, 2); c.fillStyle = '#ffffff'; c.fill();
    circle(c, 0, -14, 3); c.fillStyle = shade(col, -0.35); c.fill();
    c.restore();
  }
}
function boxRow(c, x, y, w, h, r) {
  for (let bx = x; bx < x + w - 20; bx += 52 + Math.floor(r() * 8)) {
    rrect(c, bx, y, 50, h, 3); style(c, { fill: '#c9955a', stroke: '#7a5530', lw: 2 });
    c.fillStyle = '#ffffff'; rrect(c, bx + 12, y + h / 2 - 7, 26, 14, 2); c.fill();
    c.fillStyle = P.ink; c.font = '700 9px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText(['ARCHIEF', 'DOSSIER', '2019', 'B-27'][Math.floor(r() * 4)], bx + 25, y + h / 2 + 3);
  }
}

/** De Toren van Paperassen (origin onderkant-midden). Bovenop een plateau voor de kapitein en de kooi. */
export function makePaperTower(scene) {
  makeTexture(scene, 'papertower', 420, 720, (c) => {
    const r = rng(77);
    softShadow(c, 210, 708, 170, 14);
    // lagen van onder naar boven, steeds iets smaller en scheef
    let y = 704, w = 330, x0 = 45;
    const kinds = ['box', 'binder', 'paper', 'binder', 'box', 'paper', 'binder', 'paper', 'binder', 'paper'];
    kinds.forEach((k, i) => {
      const h = k === 'paper' ? 40 : k === 'box' ? 46 : 60;
      y -= h;
      const sx = x0 + (r() - 0.5) * 18;
      if (k === 'paper') paperStack(c, sx, y, w, h, r);
      else if (k === 'box') boxRow(c, sx, y, w, h, r);
      else binderRow(c, sx, y, w, h, r);
      if (i % 2) { w -= 14; x0 += 7; }
    });
    // plateau bovenop
    rrect(c, x0 - 18, y - 16, w + 36, 18, 5); style(c, { fill: '#f2ecdf', stroke: L, lw: 3 });
    c.strokeStyle = '#c9c2b8'; c.lineWidth = 1.2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x0 - 12, y - 12 + k * 3.5); c.lineTo(x0 + w + 12, y - 12 + k * 3.5); c.stroke(); }
    // vlag met paragraafteken
    const fx = x0 + w + 6;
    c.strokeStyle = L; c.lineWidth = 5; c.beginPath(); c.moveTo(fx, y - 14); c.lineTo(fx, y - 110); c.stroke();
    c.beginPath(); c.moveTo(fx, y - 108); c.quadraticCurveTo(fx + 30, y - 116, fx + 56, y - 104); c.quadraticCurveTo(fx + 50, y - 90, fx + 56, y - 74); c.quadraticCurveTo(fx + 30, y - 82, fx, y - 76); c.closePath();
    style(c, { fill: CROC, lw: 3 });
    c.fillStyle = '#ffffff'; c.font = '700 26px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('§', fx + 27, y - 92);
    // spandoek
    const sy = 430;
    c.save(); c.translate(210, sy); c.rotate(-0.04);
    rrect(c, -130, -24, 260, 48, 8); style(c, { fill: '#3b2f3f', lw: 3 });
    c.fillStyle = P.cream; c.font = '700 26px Fredoka, sans-serif'; c.fillText('ROMPSLOMP', 0, 2);
    c.restore();
    // losse vellen
    for (let k = 0; k < 10; k++) {
      c.save(); c.translate(40 + r() * 340, 250 + r() * 440); c.rotate((r() - 0.5) * 1.4);
      rrect(c, -11, -14, 22, 28, 2); style(c, { fill: '#ffffff', stroke: '#9c9389', lw: 1.2 });
      c.restore();
    }
  });
  // vel papier voor deeltjes
  makeTexture(scene, 'paper_sheet', 26, 32, (c) => {
    rrect(c, 2, 2, 22, 28, 2); style(c, { fill: '#ffffff', stroke: '#9c9389', lw: 1.4 });
    c.strokeStyle = '#c9c2b8'; c.lineWidth = 1; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(6, 8 + k * 4); c.lineTo(20, 8 + k * 4); c.stroke(); }
  });
}

/** Hoogte (vanaf de onderkant) van het plateau bovenop de toren, voor het plaatsen van personages. */
export const TOWER_TOP = 524;

/** Achtergrond van de finale: bovenop de toren, met stapels ordners als muren. */
export function makeTowerTopBg(scene, width = 1280, height = 720) {
  makeTexture(scene, 'tower_bg', width, height, (c) => {
    const r = rng(5);
    const g = c.createLinearGradient(0, 0, 0, height); g.addColorStop(0, '#9fd8ff'); g.addColorStop(0.6, '#d9f1ff'); g.addColorStop(1, '#ffffff');
    c.fillStyle = g; c.fillRect(0, 0, width, height);
    // wolken
    c.fillStyle = 'rgba(255,255,255,0.9)';
    for (let k = 0; k < 6; k++) { const x = r() * width, y = 40 + r() * 160; for (let j = 0; j < 4; j++) { circle(c, x + j * 30, y + (j % 2) * 8, 26); c.fill(); } }
    // stapels ordners links en rechts
    for (const [x, w] of [[0, 220], [width - 220, 220]]) for (let y = height; y > 140; y -= 70) binderRow(c, x + (r() - 0.5) * 20, y - 66, w, 64, r);
    // vloer van papier
    const fy = 470;
    rrect(c, -10, fy, width + 20, height - fy + 10, 0); c.fillStyle = '#f2ecdf'; c.fill();
    c.strokeStyle = '#d6cfc2'; c.lineWidth = 2; for (let y = fy + 14; y < height; y += 14) { c.beginPath(); c.moveTo(0, y); c.lineTo(width, y); c.stroke(); }
    c.strokeStyle = L; c.lineWidth = 4; c.beginPath(); c.moveTo(0, fy); c.lineTo(width, fy); c.stroke();
    for (let k = 0; k < 24; k++) {
      c.save(); c.translate(r() * width, fy + 20 + r() * (height - fy - 30)); c.rotate((r() - 0.5) * 1.6);
      rrect(c, -14, -18, 28, 36, 2); style(c, { fill: '#ffffff', stroke: '#9c9389', lw: 1.4 });
      c.restore();
    }
  });
}

/** Vervangt de papegaaien: papieren vliegtuigjes van Rompslomp die badges jatten (2 frames). */
export function makePaperPlanes(scene) {
  const tex = makeTexture(scene, 'parrot', 140, 70, (c) => {
    for (let f = 0; f < 2; f++) {
      c.save(); c.translate(f * 70 + 35, 35 + (f ? -2 : 2)); c.rotate(f ? -0.08 : 0.08);
      poly(c, [[-28, -4], [28, 0], [-20, 14]]); style(c, { fill: '#ffffff', stroke: L, lw: 2.4 });
      poly(c, [[-28, -4], [28, 0], [-14, -16]]); style(c, { fill: '#f2ecdf', stroke: L, lw: 2.4 });
      c.strokeStyle = '#9c9389'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-26, -2); c.lineTo(26, 0); c.stroke();
      c.fillStyle = CROC; c.font = '700 12px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('§', -6, 8);
      c.restore();
    }
  });
  tex.add('f0', 0, 0, 0, 70, 70); tex.add('f1', 0, 70, 0, 70, 70);
}
