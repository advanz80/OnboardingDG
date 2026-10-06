// Buddy: het groene, pluizige maatje met de koraalrode bril dat de speler begeleidt.
// Zelfde frames als makeCharacter, zodat hij kan lopen, praten en juichen.
import { P, shade } from '../palette.js';
import { ellipse, circle, makeTexture } from '../draw.js';
import { FRAMES, FW, FH } from '../CharacterFactory.js';

const FUR = '#4cb35a', FUR_D = '#2c8a5e', FUR_L = '#7fd36a', GLASSES = '#f07a5a';

/** Pluizige vorm: ellips met een rand van kleine plukjes. */
function fuzz(c, x, y, rx, ry, col, edge, seed = 1) {
  const n = Math.round((rx + ry) * 0.9);
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const out = i % 2 ? 1.12 + ((i * seed) % 3) * 0.03 : 0.96;
    const px = x + Math.cos(a) * rx * out, py = y + Math.sin(a) * ry * out;
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = col; c.fill();
  c.strokeStyle = edge; c.lineWidth = 1.4; c.stroke();
}

function buddyFrame(c, frame) {
  const dir = frame.startsWith('back') ? 'back' : frame.startsWith('side') ? 'side' : 'front';
  const pose = frame.replace(/^(back|side)_/, '');
  const walk = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  const cx = FW / 2, G = FH - 5;
  const bob = walk ? -1.5 : 0, slump = pose === 'tired' ? 3 : 0;
  c.lineJoin = 'round'; c.lineCap = 'round';
  c.fillStyle = 'rgba(40,25,45,0.2)'; ellipse(c, cx, G + 1, 20, 4.5); c.fill();
  // voetjes met nageltjes
  for (const s of [-1, 1]) {
    const fy = G - 3 + (walk * s > 0 ? -2 : 0);
    fuzz(c, cx + s * 9, fy, 8, 4, FUR_D, shade(FUR_D, -0.3), 3);
    if (dir !== 'back') { c.fillStyle = '#2d2a33'; for (const k of [-3, 0, 3]) { circle(c, cx + s * 9 + k, fy + 2.5, 1); c.fill(); } }
  }
  // lijf (één grote pluizige bol, hoofd zit eraan vast)
  const by = 58 + bob + slump;
  fuzz(c, cx, by, 24, 33, FUR, FUR_D, 2);
  // donkerdere vlekken in de vacht
  c.fillStyle = 'rgba(44,138,94,0.45)';
  ellipse(c, cx - 8, by + 14, 9, 7, 0.3); c.fill(); ellipse(c, cx + 10, by + 4, 8, 6, -0.4); c.fill(); ellipse(c, cx + 2, by + 24, 10, 5); c.fill();
  c.fillStyle = 'rgba(127,211,106,0.5)'; ellipse(c, cx - 6, by - 18, 10, 6, -0.2); c.fill();
  // wilde plukjes bovenop
  c.strokeStyle = FUR_D; c.lineWidth = 1.6;
  for (const [dx, h] of [[-8, 7], [-3, 9], [2, 10], [7, 8], [11, 6]]) { c.beginPath(); c.moveTo(cx + dx, by - 31); c.quadraticCurveTo(cx + dx + 2, by - 31 - h, cx + dx + (dx > 0 ? 4 : -3), by - 33 - h); c.stroke(); }
  // armpjes
  const up = pose === 'cheer';
  for (const s of [-1, 1]) {
    c.save(); c.translate(cx + s * 21, by + 2); c.rotate(up ? -s * 2.5 : -s * 0.15 + walk * s * 0.2);
    fuzz(c, 0, 9, 6, 11, s < 0 ? FUR : shade(FUR, -0.05), FUR_D, 4);
    c.restore();
  }
  if (dir === 'back') return;
  // gezicht
  const fx = dir === 'side' ? cx + 8 : cx, fy = by - 14;
  const eyes = dir === 'side' ? [fx + 4] : [fx - 8, fx + 8];
  for (const ex of eyes) {
    if (pose === 'tired' || pose === 'happy') {
      c.strokeStyle = '#2d2a33'; c.lineWidth = 1.6; c.beginPath(); c.arc(ex, fy + 1, 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    } else {
      ellipse(c, ex, fy, 5.5, pose === 'surprised' ? 6.5 : 5); c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = 'rgba(45,42,51,0.4)'; c.lineWidth = 0.8; c.stroke();
      circle(c, ex + (dir === 'side' ? 1.5 : ex < fx ? 1 : -1), fy + 0.5, 2.6); c.fillStyle = '#3b2a1e'; c.fill();
      circle(c, ex + (ex < fx ? 1.8 : -0.2), fy - 0.6, 0.9); c.fillStyle = '#ffffff'; c.fill();
    }
    // ronde koraalrode bril
    circle(c, ex, fy, 8); c.strokeStyle = GLASSES; c.lineWidth = 2.4; c.stroke();
  }
  if (dir === 'front') { c.strokeStyle = GLASSES; c.lineWidth = 2; c.beginPath(); c.moveTo(fx - 0.5, fy - 1); c.lineTo(fx + 0.5, fy - 1); c.stroke(); }
  // neusje
  ellipse(c, dir === 'side' ? fx + 11 : fx, fy + 7, 2.4, 1.6); c.fillStyle = '#2d2a33'; c.fill();
  // brede glimlach (of open mond bij praten)
  if (pose === 'talk' || up || pose === 'surprised') {
    ellipse(c, dir === 'side' ? fx + 6 : fx, fy + 13, dir === 'side' ? 5 : 7, 3.5); c.fillStyle = '#7a2e48'; c.fill();
  } else {
    const sad = pose === 'sad' || pose === 'tired';
    c.strokeStyle = '#2d2a33'; c.lineWidth = 1.4; c.beginPath();
    if (dir === 'side') { c.moveTo(fx, fy + 11); c.quadraticCurveTo(fx + 5, sad ? fy + 10 : fy + 14, fx + 9, fy + 11); }
    else { c.moveTo(fx - 12, fy + 10); c.quadraticCurveTo(fx, sad ? fy + 9 : fy + 16, fx + 12, fy + 10); }
    c.stroke();
  }
  if (pose === 'angry') { c.strokeStyle = FUR_D; c.lineWidth = 2; for (const s of [-1, 1]) { c.beginPath(); c.moveTo(fx + s * 12, fy - 11); c.lineTo(fx + s * 4, fy - 8); c.stroke(); } }
}

export function makeBuddy(scene, key = 'npc_buddy') {
  const SS = 2;
  const big = document.createElement('canvas');
  big.width = FW * SS * FRAMES.length; big.height = FH * SS;
  const b = big.getContext('2d');
  FRAMES.forEach((f, i) => {
    b.save(); b.setTransform(SS, 0, 0, SS, i * FW * SS, 0);
    b.beginPath(); b.rect(0, 0, FW, FH); b.clip();
    buddyFrame(b, f);
    b.restore();
  });
  const tex = makeTexture(scene, key, FW * FRAMES.length, FH, (ctx) => {
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(big, 0, 0, FW * FRAMES.length, FH);
  });
  FRAMES.forEach((f, i) => tex.add(f, 0, i * FW, 0, FW, FH));
  return key;
}

export const BUDDY_COLOR = 0x4cb35a;
