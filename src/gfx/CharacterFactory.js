// Parametrische personages in "Animal Crossing"-stijl: groot rond hoofd, kleine ronde ogen,
// zachte gekleurde contouren, gedetailleerde kleding/haar en loopcycli in 4 richtingen.
// Frames (72×100): vooraanzicht idle/walk1/walk2/cheer/tired/talk/happy/surprised/sad/angry,
// achteraanzicht back_idle/back_walk1/back_walk2, zijaanzicht (naar rechts) side_idle/side_walk1/side_walk2.
import { P, shade } from './palette.js';
import { makeTexture } from './draw.js';

export const FW = 72;
export const FH = 100;
const SS = 2; // supersampling: tekenen op 2× en netjes verkleinen
export const FRAMES = ['idle', 'walk1', 'walk2', 'cheer', 'tired', 'talk', 'happy', 'surprised', 'sad', 'angry',
  'back_idle', 'back_walk1', 'back_walk2', 'side_idle', 'side_walk1', 'side_walk2'];

export const SKINS = ['#ffe0c2', '#f5c9a0', '#dca777', '#b57b4c', '#86553a', '#5e3b28'];
export const HAIRS = ['#2d1e14', '#5a3825', '#8c5a2b', '#d9a441', '#c8552d', '#9a9aa6', '#e9dcc5', '#3b4a8a'];
export const SHIRTS = ['#e8504c', '#3d8fe0', '#4cc764', '#f6c33b', '#8e5bd8', '#ff7aa8', '#2ec4b6', '#f59a3c', '#ffffff', '#3b3f55'];
export const BOTTOM_COLORS = ['#3a4a6b', '#5b4636', '#2d3a4a', '#7a7f93', '#3d6b8a', '#c9b48a', '#8a2d3b'];
export const HAIR_STYLES = ['short', 'long', 'bob', 'ponytail', 'bun', 'curly', 'spiky', 'bald', 'up', 'crew'];
export const HATS = [null, 'cap', 'straw', 'beanie', 'bandana', 'sunglasses'];
export const TOPS = ['tee', 'polo', 'hoodie', 'blouse', 'shirt'];
export const BOTTOMS = ['pants', 'shorts', 'skirt'];
export const EYES = ['dot', 'round', 'lashes', 'sleepy'];
export const ACCESSORIES = [null, 'glasses', 'earrings', 'scarf', 'badge'];
export const PATTERNS = [null, 'stripes', 'dots'];

const INK = '#3a2a33';
const pick = (r, a) => a[Math.floor(r() * a.length)];

export function randomLook(r = Math.random, extra = {}) {
  return {
    skin: pick(r, SKINS), hair: pick(r, HAIRS.slice(0, 7)), hairStyle: pick(r, HAIR_STYLES.slice(0, 7)),
    shirt: pick(r, SHIRTS), top: pick(r, TOPS), pattern: r() < 0.25 ? pick(r, ['stripes', 'dots']) : null,
    pants: pick(r, BOTTOM_COLORS), bottom: pick(r, BOTTOMS), shoes: pick(r, ['#5b4636', '#3b3f55', '#ffffff', '#e8504c']),
    eyes: pick(r, EYES), hat: r() < 0.25 ? pick(r, ['cap', 'straw', 'beanie', 'sunglasses']) : null,
    accessory: r() < 0.3 ? pick(r, ['glasses', 'earrings', 'scarf']) : null, ...extra,
  };
}

// Rovers zijn net zo divers als iedereen: vooral lichtere tinten, met een mix van donkere.
const ROVER_SKINS = ['#ffe0c2', '#f8d5b5', '#f5c9a0', '#ffe0c2', '#f5c9a0', '#dca777', '#f8d5b5', '#b57b4c', '#ffe0c2', '#86553a'];

/** Rover (tijdrovers van Rompslomp): gestreepte trui, maskertje, muts of pet. */
export function roverLook(r = Math.random, extra = {}) {
  const mc = pick(r, ['#26202c', '#26202c', '#3b2f3f']);
  return {
    skin: pick(r, ROVER_SKINS), hair: pick(r, HAIRS.slice(0, 7)), hairStyle: pick(r, ['short', 'curly', 'crew', 'ponytail', 'bun', 'long']),
    shirt: '#f4efe4', top: 'tee', pattern: 'stripes', patternColor: pick(r, ['#26202c', '#3b3f55', '#5b4636']),
    pants: pick(r, ['#26202c', '#3b3f55', '#5b4636']), bottom: 'pants', shoes: '#26202c',
    hat: pick(r, ['beanie', 'beanie', 'cap', null]), capColor: pick(r, ['#26202c', '#3b3f55', '#8a2d3b', '#4a3b2c']),
    beard: r() < 0.4 ? pick(r, HAIRS.slice(0, 6)) : null, mask: true, maskColor: mc, eyes: 'dot', ...extra,
  };
}

export function pirateLook(r = Math.random, extra = {}) {
  return {
    skin: pick(r, SKINS), hair: pick(r, HAIRS.slice(0, 6)), hairStyle: pick(r, ['short', 'long', 'curly', 'bald', 'ponytail']),
    shirt: '#f4efe4', top: 'tee', pattern: 'stripes', patternColor: pick(r, [P.pirateRed, '#2d4a8a', '#3b2f3f']),
    pants: pick(r, ['#3b2f3f', '#5b4636', '#2d3a4a']), bottom: r() < 0.5 ? 'pants' : 'shorts', shoes: '#3b2f3f',
    hat: pick(r, ['bandana', 'tricorn', 'bandana']), bandana: pick(r, [P.pirateRed, '#2d4a8a', '#3b2f3f']),
    beard: r() < 0.6 ? pick(r, HAIRS.slice(0, 6)) : null, eyepatch: r() < 0.4, eyes: 'dot',
    // kantoortwist: stropdas en soms een naambadge
    tie: pick(r, [P.pirateRed, '#2d4a8a', '#f6c33b', '#8e5bd8']), badge: r() < 0.4 ? '#ffffff' : null, ...extra,
  };
}

/** Oude looks (v1) en ontbrekende velden aanvullen. */
function normalize(look) {
  const L = {
    skin: '#f5c9a0', hair: '#5a3825', hairStyle: 'short', shirt: '#e8504c', top: 'tee', pattern: null,
    pants: '#3a4a6b', bottom: 'pants', shoes: '#5b4636', eyes: 'dot', hat: null, accessory: null, ...look,
  };
  if (L.stripes && !L.pattern) { L.pattern = 'stripes'; L.patternColor = L.stripes; }
  if (L.hairStyle === 'mohawk') L.hairStyle = 'spiky';
  if (L.accessory === 'glasses') L.glasses = true;
  if (L.accessory === 'badge' && !L.badge) L.badge = '#f6c33b';
  return L;
}

// ── tekenhulpjes ───────────────────────────────────────────────────────────
const line = (c) => shade(c, -0.42);
function paint(ctx, fill, lw = 1.5, stroke) {
  ctx.fillStyle = fill; ctx.fill();
  if (lw) { ctx.strokeStyle = stroke || line(fill); ctx.lineWidth = lw; ctx.stroke(); }
}
function ell(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
/** Vulling met verticaal verloop (licht boven, donker onder) en zachte contour. */
function soft(ctx, pathFn, fill, y0, y1, lw = 1.5) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(fill, 0.12)); g.addColorStop(0.55, fill); g.addColorStop(1, shade(fill, -0.14));
  pathFn(); ctx.fillStyle = g; ctx.fill();
  if (lw) { ctx.strokeStyle = line(fill); ctx.lineWidth = lw; ctx.stroke(); }
}

// ── onderdelen ─────────────────────────────────────────────────────────────
function drawLegs(ctx, L, cx, G, dir, pose, bob) {
  const walkA = pose === 'walk1', walkB = pose === 'walk2';
  const skinLeg = L.bottom !== 'pants';
  const legCol = skinLeg ? L.skin : L.pants;
  const legs = [];
  if (dir === 'side') {
    const s = walkA ? 5 : walkB ? -5 : 0;
    legs.push({ x: cx - 1 - s, lift: walkB ? 2 : 0, back: true }, { x: cx + 2 + s, lift: walkA ? 2 : 0 });
  } else {
    legs.push({ x: cx - 6, lift: walkA ? 2.5 : 0 }, { x: cx + 6, lift: walkB ? 2.5 : 0 });
  }
  for (const l of legs) {
    const top = 78 + bob, bottom = G - 3 - l.lift;
    rr(ctx, l.x - 3.6, top, 7.2, bottom - top + 1, 3.5);
    paint(ctx, l.back ? shade(legCol, -0.12) : legCol, 1.3);
    // sok-randje bij korte broek/rok
    if (skinLeg) { rr(ctx, l.x - 3.6, bottom - 3, 7.2, 3, 1.5); paint(ctx, '#ffffff', 1); }
    // schoen
    const sx = dir === 'side' ? l.x + 2 : l.x;
    ell(ctx, sx, bottom + 0.5, dir === 'side' ? 6.2 : 5.2, 3.4);
    soft(ctx, () => ell(ctx, sx, bottom + 0.5, dir === 'side' ? 6.2 : 5.2, 3.4), L.shoes, bottom - 3, bottom + 4, 1.3);
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ell(ctx, sx - 1.5, bottom - 0.8, 2, 0.9); ctx.fill();
  }
}

function drawBottom(ctx, L, cx, dir, bob) {
  const y = 70 + bob;
  const w = dir === 'side' ? 10 : 12.5;
  const c = L.pants;
  if (L.bottom === 'skirt') {
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - w + 1, y); ctx.lineTo(cx + w - 1, y); ctx.lineTo(cx + w + 3, y + 13); ctx.quadraticCurveTo(cx, y + 15.5, cx - w - 3, y + 13); ctx.closePath(); };
    soft(ctx, p, c, y, y + 14, 1.4);
    ctx.strokeStyle = line(c); ctx.lineWidth = 0.9;
    for (const dx of [-5, 0, 5]) { ctx.beginPath(); ctx.moveTo(cx + dx * 0.8, y + 3); ctx.lineTo(cx + dx * 1.15, y + 13); ctx.stroke(); }
  } else {
    const h = L.bottom === 'shorts' ? 10 : 11;
    const p = () => rr(ctx, cx - w, y, w * 2, h, 4);
    soft(ctx, p, c, y, y + h, 1.4);
    // naad tussen de pijpen
    if (dir !== 'side') { ctx.strokeStyle = line(c); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, y + 4); ctx.lineTo(cx, y + h); ctx.stroke(); }
    // riem
    ctx.fillStyle = shade(c, -0.25); ctx.fillRect(cx - w + 1, y + 0.5, w * 2 - 2, 2);
  }
}

function topPath(ctx, cx, y0, dir, slump) {
  const wt = dir === 'side' ? 8.5 : 10.5, wb = dir === 'side' ? 10 : 13, h = 21 - slump / 2;
  return () => {
    ctx.beginPath();
    ctx.moveTo(cx - wt, y0 + 2);
    ctx.quadraticCurveTo(cx - wt - 1, y0, cx - wt + 3, y0);
    ctx.lineTo(cx + wt - 3, y0);
    ctx.quadraticCurveTo(cx + wt + 1, y0, cx + wt, y0 + 2);
    ctx.lineTo(cx + wb, y0 + h - 3);
    ctx.quadraticCurveTo(cx + wb, y0 + h, cx + wb - 3, y0 + h);
    ctx.lineTo(cx - wb + 3, y0 + h);
    ctx.quadraticCurveTo(cx - wb, y0 + h, cx - wb, y0 + h - 3);
    ctx.closePath();
  };
}

function drawTorso(ctx, L, cx, y0, dir, slump) {
  const path = topPath(ctx, cx, y0, dir, slump);
  const c = L.coat ? L.shirt : L.shirt;
  soft(ctx, path, c, y0, y0 + 21, 1.5);
  // patroon
  if (L.pattern) {
    ctx.save(); path(); ctx.clip();
    const pc = L.patternColor || shade(c, c === '#ffffff' ? -0.35 : 0.45);
    ctx.fillStyle = pc;
    if (L.pattern === 'stripes') for (let i = 0; i < 5; i++) ctx.fillRect(cx - 16, y0 + 3 + i * 4.4, 32, 2);
    if (L.pattern === 'dots') for (let yy = 0; yy < 5; yy++) for (let xx = -3; xx <= 3; xx++) { ell(ctx, cx + xx * 4.5 + (yy % 2) * 2.2, y0 + 3 + yy * 4.5, 1.1, 1.1); ctx.fill(); }
    ctx.restore();
    path(); ctx.strokeStyle = line(c); ctx.lineWidth = 1.5; ctx.stroke();
  }
  const oc = line(c);
  if (L.coat && dir !== 'front') {
    soft(ctx, path, L.coat, y0, y0 + 21, 1.5);
    if (dir === 'side') { ctx.beginPath(); ctx.moveTo(cx + 3, y0 + 1); ctx.lineTo(cx + 9, y0 + 1); ctx.lineTo(cx + 9.5, y0 + 21); ctx.lineTo(cx + 4, y0 + 21); ctx.closePath(); paint(ctx, c, 1.1); ctx.fillStyle = P.gold; for (const yy of [7, 12, 17]) { ell(ctx, cx + 3, y0 + yy, 1.1, 1.1); ctx.fill(); } }
    return;
  }
  if (dir === 'back') {
    if (L.top === 'hoodie') { ell(ctx, cx, y0 + 4, 9, 5); paint(ctx, shade(c, -0.08), 1.2); }
    if (L.top === 'polo' || L.top === 'shirt') { ctx.beginPath(); ctx.moveTo(cx - 7, y0 + 1); ctx.quadraticCurveTo(cx, y0 + 5, cx + 7, y0 + 1); paint(ctx, shade(c, 0.1), 1.1); }
    return;
  }
  const nx = dir === 'side' ? cx + 3 : cx;
  switch (L.top) {
    case 'tee':
      ctx.beginPath(); ctx.arc(nx, y0 + 0.5, 4.5, 0.1 * Math.PI, 0.9 * Math.PI); ctx.strokeStyle = oc; ctx.lineWidth = 1.2; ctx.stroke();
      break;
    case 'polo':
      for (const s of dir === 'side' ? [1] : [-1, 1]) { ctx.beginPath(); ctx.moveTo(nx, y0 + 1); ctx.lineTo(nx + s * 6, y0); ctx.lineTo(nx + s * 3, y0 + 5); ctx.closePath(); paint(ctx, shade(c, 0.15), 1.1); }
      ctx.strokeStyle = oc; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nx, y0 + 2); ctx.lineTo(nx, y0 + 8); ctx.stroke();
      ctx.fillStyle = oc; for (const yy of [4, 7]) { ell(ctx, nx + 1, y0 + yy, 0.7, 0.7); ctx.fill(); }
      break;
    case 'shirt':
      for (const s of dir === 'side' ? [1] : [-1, 1]) { ctx.beginPath(); ctx.moveTo(nx, y0 + 2); ctx.lineTo(nx + s * 6.5, y0 - 0.5); ctx.lineTo(nx + s * 4, y0 + 5); ctx.closePath(); paint(ctx, '#ffffff', 1.1, line('#dddddd')); }
      if (!L.tie) { ctx.strokeStyle = oc; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nx, y0 + 3); ctx.lineTo(nx, y0 + 20); ctx.stroke(); ctx.fillStyle = oc; for (const yy of [8, 13, 18]) { ell(ctx, nx + 1.2, y0 + yy, 0.7, 0.7); ctx.fill(); } }
      break;
    case 'blouse':
      ctx.beginPath(); ctx.moveTo(nx - 7, y0 + 0.5); ctx.quadraticCurveTo(nx - 4, y0 + 6, nx, y0 + 3); ctx.quadraticCurveTo(nx + 4, y0 + 6, nx + 7, y0 + 0.5); ctx.quadraticCurveTo(nx, y0 + 2.5, nx - 7, y0 + 0.5);
      paint(ctx, '#ffffff', 1.1, '#c9c2cf');
      ctx.fillStyle = shade(c, -0.25); ell(ctx, nx, y0 + 6.5, 1.2, 1.2); ctx.fill();
      break;
    case 'hoodie':
      ctx.beginPath(); ctx.moveTo(nx - 8, y0 + 0.5); ctx.quadraticCurveTo(nx, y0 + 7, nx + 8, y0 + 0.5); ctx.strokeStyle = oc; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1;
      for (const s of dir === 'side' ? [1] : [-1, 1]) { ctx.beginPath(); ctx.moveTo(nx + s * 2.5, y0 + 4); ctx.lineTo(nx + s * 3, y0 + 10); ctx.stroke(); }
      if (dir !== 'side') { rr(ctx, cx - 7, y0 + 12, 14, 7, 3); ctx.strokeStyle = oc; ctx.lineWidth = 1; ctx.stroke(); }
      break;
    default: break;
  }
  if (L.tie) {
    ctx.beginPath(); ctx.moveTo(nx, y0 + 3); ctx.lineTo(nx - 2.2, y0 + 5); ctx.lineTo(nx - 1.5, y0 + 15); ctx.lineTo(nx, y0 + 17.5); ctx.lineTo(nx + 1.5, y0 + 15); ctx.lineTo(nx + 2.2, y0 + 5); ctx.closePath();
    paint(ctx, L.tie, 1);
  }
  if (L.coat) {
    for (const s of dir === 'side' ? [1] : [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * 3, y0 + 1); ctx.lineTo(cx + s * 11, y0 + 1); ctx.lineTo(cx + s * 13.5, y0 + 21); ctx.lineTo(cx + s * 2.5, y0 + 21); ctx.closePath();
      soft(ctx, () => { ctx.beginPath(); ctx.moveTo(cx + s * 3, y0 + 1); ctx.lineTo(cx + s * 11, y0 + 1); ctx.lineTo(cx + s * 13.5, y0 + 21); ctx.lineTo(cx + s * 2.5, y0 + 21); ctx.closePath(); }, L.coat, y0, y0 + 21, 1.3);
      ctx.fillStyle = P.gold; for (const yy of [7, 12, 17]) { ell(ctx, cx + s * 5, y0 + yy, 1.2, 1.2); ctx.fill(); }
    }
  }
  // naamkaartje (bedrijfskleur)
  if (L.badge && dir === 'front') {
    rr(ctx, cx + 3, y0 + 6, 7.5, 5.5, 1.2); paint(ctx, '#ffffff', 0.9, '#9a8f9a');
    ctx.fillStyle = L.badge; ctx.fillRect(cx + 3.5, y0 + 6.5, 6.5, 1.8);
    ctx.fillStyle = '#9a8f9a'; ctx.fillRect(cx + 4.5, y0 + 9.6, 4.5, 0.7);
  }
  // sjaal
  if (L.accessory === 'scarf') {
    ctx.beginPath(); ctx.moveTo(nx - 9, y0); ctx.quadraticCurveTo(nx, y0 + 6, nx + 9, y0); ctx.lineTo(nx + 9, y0 + 3.5); ctx.quadraticCurveTo(nx, y0 + 9, nx - 9, y0 + 3.5); ctx.closePath();
    paint(ctx, P.red, 1.1);
    if (dir !== 'side') { rr(ctx, nx + 2, y0 + 4, 4, 9, 1.5); paint(ctx, P.red, 1.1); }
  }
}

function drawArm(ctx, L, sx, sy, rot, longSleeve) {
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(rot);
  const len = 14;
  // mouw / arm
  if (longSleeve) { rr(ctx, -3.5, -2, 7, len, 3.5); soft(ctx, () => rr(ctx, -3.5, -2, 7, len, 3.5), L.coat || L.shirt, -2, len, 1.3); }
  else {
    rr(ctx, -3.2, 0, 6.4, len - 1, 3.2); paint(ctx, L.skin, 1.2);
    rr(ctx, -4, -2.5, 8, 7, 3); soft(ctx, () => rr(ctx, -4, -2.5, 8, 7, 3), L.shirt, -2.5, 4.5, 1.3);
  }
  // hand
  ell(ctx, 0, len, 3.6, 3.6); paint(ctx, L.skin, 1.2);
  ctx.restore();
}

function hairBack(ctx, L, cx, hy, dir) {
  const h = L.hair;
  if (L.hairStyle === 'long' && dir === 'side') {
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - 21, hy - 6); ctx.bezierCurveTo(cx - 28, hy + 12, cx - 25, hy + 28, cx - 17, hy + 36); ctx.quadraticCurveTo(cx - 12, hy + 31, cx - 8, hy + 37); ctx.quadraticCurveTo(cx - 3, hy + 31, cx + 1, hy + 33); ctx.bezierCurveTo(cx + 5, hy + 18, cx + 5, hy + 4, cx + 2, hy - 4); ctx.closePath(); };
    soft(ctx, p, h, hy - 4, hy + 37, 1.4);
  } else if (L.hairStyle === 'long' && dir === 'back') {
    // op de rug: lang tot over de schouders
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - 21, hy - 4); ctx.quadraticCurveTo(cx - 27, hy + 24, cx - 19, hy + 37); ctx.quadraticCurveTo(cx, hy + 41, cx + 19, hy + 37); ctx.quadraticCurveTo(cx + 27, hy + 24, cx + 21, hy - 4); ctx.closePath(); };
    soft(ctx, p, h, hy - 4, hy + 40, 1.4);
  } else if (L.hairStyle === 'long') {
    // vooraanzicht: alleen zichtbaar naast het gezicht (de lokken vooraan lopen door over de schouders)
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - 21, hy - 4); ctx.quadraticCurveTo(cx - 25, hy + 18, cx - 17, hy + 27); ctx.lineTo(cx + 17, hy + 27); ctx.quadraticCurveTo(cx + 25, hy + 18, cx + 21, hy - 4); ctx.closePath(); };
    soft(ctx, p, h, hy - 4, hy + 27, 1.4);
  }
  if (L.hairStyle === 'curly') {
    // volle krullenbos rond het hoofd (tot op de schouders)
    const puffs = dir === 'side'
      ? [[-19, -8], [-22, 2], [-20, 11], [-14, 17]]
      : dir === 'back'
        ? [[-21, -6], [-23, 4], [-21, 13], [-13, 19], [-4, 21], [4, 21], [13, 19], [21, 13], [23, 4], [21, -6]]
        : [[-21, -6], [-24, 3], [-22, 12], [-17, 19], [21, -6], [24, 3], [22, 12], [17, 19]];
    for (const [dx, dy] of puffs) { ell(ctx, cx + dx, hy + dy, 6.2, 6.2); paint(ctx, h, 1.1); ctx.fillStyle = shade(h, 0.28); ell(ctx, cx + dx - 1.6, hy + dy - 2, 1.8, 1.2); ctx.fill(); }
  }
  if (L.hairStyle === 'bob' && dir === 'side') {
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - 23, hy); ctx.quadraticCurveTo(cx - 25, hy + 15, cx - 15, hy + 17); ctx.lineTo(cx + 2, hy + 17); ctx.quadraticCurveTo(cx + 4, hy + 8, cx, hy); ctx.closePath(); };
    soft(ctx, p, h, hy, hy + 17, 1.4);
  } else if (L.hairStyle === 'bob') {
    const p = () => { ctx.beginPath(); ctx.moveTo(cx - 23, hy); ctx.quadraticCurveTo(cx - 25, hy + 15, cx - 15, hy + 17); ctx.lineTo(cx + 15, hy + 17); ctx.quadraticCurveTo(cx + 25, hy + 15, cx + 23, hy); ctx.closePath(); };
    soft(ctx, p, h, hy, hy + 17, 1.4);
  }
  if (L.hairStyle === 'ponytail' && dir !== 'side') {
    const x = dir === 'back' ? cx : cx + 14;
    const p = () => { ctx.beginPath(); ctx.moveTo(x - 4, hy - 8); ctx.quadraticCurveTo(x + 9, hy + 4, x + 3, hy + 22); ctx.quadraticCurveTo(x - 4, hy + 10, x - 4, hy - 8); ctx.closePath(); };
    soft(ctx, p, h, hy - 8, hy + 22, 1.3);
  }
  if (L.hairStyle === 'bun' && dir !== 'back') {
    ell(ctx, cx, hy - 23, 8, 7); soft(ctx, () => ell(ctx, cx, hy - 23, 8, 7), h, hy - 30, hy - 16, 1.4);
  }
}

function hairFront(ctx, L, cx, hy, dir) {
  const h = L.hair;
  const style = L.hairStyle;
  if (style === 'bald') {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ell(ctx, cx - 7, hy - 14, 5, 2.5, -0.4); ctx.fill();
    return;
  }
  const hl = shade(h, 0.32);
  const cap = (fringeY, locks) => {
    // haarkap met lokken langs de pony
    const p = () => {
      ctx.beginPath();
      ctx.moveTo(cx - 23, hy + 2);
      ctx.bezierCurveTo(cx - 25, hy - 31, cx + 25, hy - 31, cx + 23, hy + 2);
      const n = locks;
      for (let i = 0; i < n; i++) {
        const x1 = cx + 23 - ((i + 0.5) / n) * 46, x2 = cx + 23 - ((i + 1) / n) * 46;
        const yy = fringeY + (i % 2 ? 2 : 0);
        ctx.quadraticCurveTo(x1, yy + 3, x2, yy - (i === n - 1 ? -4 : 2));
      }
      ctx.closePath();
    };
    soft(ctx, p, h, hy - 22, hy + 2, 1.5);
    // glans
    ctx.strokeStyle = hl; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx - 3, hy - 4, 16, Math.PI * 1.15, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 3, hy - 4, 13, Math.PI * 1.2, Math.PI * 1.3); ctx.stroke();
  };
  if (dir === 'back') {
    // achterhoofd volledig haar
    const p = () => { ell(ctx, cx, hy - 1, 22.5, 21.5); };
    soft(ctx, p, h, hy - 22, hy + 20, 1.5);
    ctx.strokeStyle = shade(h, -0.2); ctx.lineWidth = 1;
    for (const dx of [-8, 0, 8]) { ctx.beginPath(); ctx.moveTo(cx + dx, hy - 18); ctx.quadraticCurveTo(cx + dx * 1.3, hy, cx + dx * 1.1, hy + 16); ctx.stroke(); }
    if (style === 'bun') { ell(ctx, cx, hy - 20, 8, 7); soft(ctx, () => ell(ctx, cx, hy - 20, 8, 7), h, hy - 27, hy - 13, 1.4); }
    if (style === 'curly') for (let i = -2; i <= 2; i++) { ell(ctx, cx + i * 8, hy - 17 + Math.abs(i) * 3, 6.5, 6.5); paint(ctx, h, 1.2); }
    if (style === 'spiky') for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 7 - 4, hy - 17); ctx.lineTo(cx + i * 7, hy - 27 + Math.abs(i) * 2); ctx.lineTo(cx + i * 7 + 4, hy - 17); ctx.closePath(); paint(ctx, h, 1.2); }
    if (style === 'up') tufts(ctx, h, cx - 19, hy - 14, cx + 19, [[cx - 13, hy - 26], [cx - 4, hy - 29], [cx + 5, hy - 29], [cx + 14, hy - 26]]);
    if (style === 'crew') tufts(ctx, h, cx - 17, hy - 16, cx + 17, [[cx - 11, hy - 23], [cx - 3, hy - 25], [cx + 5, hy - 25], [cx + 12, hy - 23]]);
    return;
  }
  if (dir === 'side') {
    // haar binnen de hoofdvorm: bedekt bovenkant en achterkant, pony boven het oog
    ctx.save();
    ell(ctx, cx, hy, 24, 23); ctx.clip();
    const p = () => {
      ctx.beginPath();
      ctx.moveTo(cx + 26, hy - 30);
      ctx.lineTo(cx + 21, hy - 9);
      ctx.quadraticCurveTo(cx + 15, hy - 5, cx + 9, hy - 9);
      ctx.quadraticCurveTo(cx + 3, hy - 3, cx - 2, hy - 8);
      ctx.quadraticCurveTo(cx - 6, hy + 2, cx - 9, hy + 12);
      ctx.lineTo(cx - 30, hy + 30);
      ctx.lineTo(cx - 30, hy - 30);
      ctx.closePath();
    };
    soft(ctx, p, h, hy - 24, hy + 20, 1.5);
    ctx.restore();
    ctx.strokeStyle = line(h); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, hy, 22.6, 21.6, 0, Math.PI * 0.62, Math.PI * 1.72); ctx.stroke();
    ctx.strokeStyle = hl; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(cx - 2, hy - 2, 16, Math.PI * 1.25, Math.PI * 1.5); ctx.stroke();
    if (style === 'bun') { ell(ctx, cx - 10, hy - 18, 7, 6.5); soft(ctx, () => ell(ctx, cx - 10, hy - 18, 7, 6.5), h, hy - 25, hy - 11, 1.3); }
    if (style === 'ponytail') { ctx.beginPath(); ctx.moveTo(cx - 18, hy - 8); ctx.quadraticCurveTo(cx - 32, hy + 4, cx - 26, hy + 20); ctx.quadraticCurveTo(cx - 22, hy + 6, cx - 16, hy - 2); ctx.closePath(); paint(ctx, h, 1.3); }
    if (style === 'spiky') for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(cx - 12 + i * 7, hy - 18); ctx.lineTo(cx - 14 + i * 7, hy - 28); ctx.lineTo(cx - 6 + i * 7, hy - 19); ctx.closePath(); paint(ctx, h, 1.1); }
    if (style === 'curly') for (let i = 0; i < 4; i++) { ell(ctx, cx - 14 + i * 8, hy - 18 + (i % 2) * 2, 6, 6); paint(ctx, h, 1.1); }
    if (style === 'up') {
      tufts(ctx, h, cx - 16, hy - 15, cx + 22, [[cx - 11, hy - 26], [cx - 2, hy - 30], [cx + 7, hy - 32], [cx + 16, hy - 31], [cx + 23, hy - 25]]);
    }
    if (style === 'crew') tufts(ctx, h, cx - 14, hy - 17, cx + 20, [[cx - 9, hy - 24], [cx - 1, hy - 26], [cx + 7, hy - 26], [cx + 15, hy - 24], [cx + 20, hy - 21]]);
    temples(ctx, L, cx, hy, dir);
    return;
  }
  // vooraanzicht
  switch (style) {
    case 'curly':
      cap(hy - 8, 5);
      for (let i = -3; i <= 3; i++) { ell(ctx, cx + i * 6.8, hy - 15 + Math.abs(i) * 2.6, 6, 6); paint(ctx, h, 1.2); ctx.fillStyle = hl; ell(ctx, cx + i * 6.8 - 1.5, hy - 17 + Math.abs(i) * 2.6, 1.8, 1.2); ctx.fill(); }
      break;
    case 'spiky':
      cap(hy - 10, 4);
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 8 - 5, hy - 17 + Math.abs(i) * 2); ctx.lineTo(cx + i * 8 + i, hy - 28 + Math.abs(i) * 3); ctx.lineTo(cx + i * 8 + 5, hy - 17 + Math.abs(i) * 2); ctx.closePath(); paint(ctx, h, 1.2); }
      break;
    case 'up': {
      // kort met opgekamde kuif
      cap(hy - 10, 4);
      tufts(ctx, h, cx - 21, hy - 15, cx + 21, [[cx - 16, hy - 27], [cx - 8, hy - 32], [cx, hy - 34], [cx + 8, hy - 32], [cx + 16, hy - 27]]);
      ctx.strokeStyle = hl; ctx.lineWidth = 1.3;
      for (const dx of [-9, -1, 7]) { ctx.beginPath(); ctx.moveTo(cx + dx, hy - 18); ctx.quadraticCurveTo(cx + dx + 1, hy - 25, cx + dx + 2, hy - 30); ctx.stroke(); }
      break;
    }
    case 'crew':
      // heel kort, licht omhoog geborsteld (stekeltjes van een paar mm)
      cap(hy - 13, 5);
      tufts(ctx, h, cx - 19, hy - 17, cx + 19, [[cx - 14, hy - 24], [cx - 7, hy - 26.5], [cx, hy - 27], [cx + 7, hy - 26.5], [cx + 14, hy - 24]]);
      break;
    case 'long':
      cap(hy - 7, 4);
      for (const s of [-1, 1]) {
        const p = () => { ctx.beginPath(); ctx.moveTo(cx + s * 22, hy - 4); ctx.quadraticCurveTo(cx + s * 26, hy + 18, cx + s * 19, hy + 34); ctx.quadraticCurveTo(cx + s * 16, hy + 14, cx + s * 15, hy - 2); ctx.closePath(); };
        soft(ctx, p, h, hy - 4, hy + 34, 1.3);
      }
      break;
    case 'bob':
      cap(hy - 8, 5);
      for (const s of [-1, 1]) {
        const p = () => { ctx.beginPath(); ctx.moveTo(cx + s * 23, hy - 4); ctx.quadraticCurveTo(cx + s * 25, hy + 12, cx + s * 17, hy + 15); ctx.quadraticCurveTo(cx + s * 16, hy + 6, cx + s * 15, hy - 3); ctx.closePath(); };
        soft(ctx, p, h, hy - 4, hy + 15, 1.3);
      }
      break;
    default:
      cap(style === 'short' ? hy - 9 : hy - 8, style === 'ponytail' || style === 'bun' ? 3 : 4);
  }
  if (style === 'ponytail') { ell(ctx, cx + 15, hy - 14, 3, 3); paint(ctx, P.pink, 1); }
  temples(ctx, L, cx, hy, dir);
}

/** Opgeborsteld haar: een rij zachte plukken die omhoog staan. pts = toppen [x, y]. */
function tufts(ctx, h, x0, base, x1, pts) {
  const top = Math.min(...pts.map((q) => q[1]));
  const p = () => {
    ctx.beginPath(); ctx.moveTo(x0, base);
    pts.forEach(([tx, ty], i) => {
      // ondiepe inkeping tussen twee plukken, ronde top
      const nx = i + 1 < pts.length ? pts[i + 1][0] : x1;
      const vy = ty + (base - ty) * 0.35;
      ctx.bezierCurveTo(tx - 6, ty + 6, tx - 4, ty, tx, ty);
      ctx.bezierCurveTo(tx + 4, ty, (tx + nx) / 2, vy - 2, (tx + nx) / 2, vy);
    });
    ctx.lineTo(x1, base);
    ctx.closePath();
  };
  soft(ctx, p, h, top, base, 1.3);
}

/** Grijze slapen (optie `temples`: kleur), voor wat oudere personages. */
function temples(ctx, L, cx, hy, dir) {
  if (!L.temples) return;
  ctx.fillStyle = L.temples;
  // klein grijs plukje bij de slaap, binnen de haarlijn
  if (dir === 'side') { ell(ctx, cx - 2, hy - 3, 2.4, 4); ctx.fill(); return; }
  for (const s of [-1, 1]) { ell(ctx, cx + s * 19.5, hy - 4, 1.8, 4); ctx.fill(); }
}

function drawFace(ctx, L, cx, hy, dir, pose) {
  const ink = INK;
  const skinLine = shade(L.skin, -0.3);
  if (dir === 'back') return;
  const side = dir === 'side';
  const ey = hy + 4;
  const eyeXs = side ? [cx + 11] : [cx - 8, cx + 8];
  // blosjes
  ctx.fillStyle = 'rgba(255,120,130,0.38)';
  for (const x of side ? [cx + 9] : [cx - 13, cx + 13]) { ell(ctx, x, ey + 7, 3.6, 2.2); ctx.fill(); }
  // lachrimpeltjes (optie `age` >= 40)
  if (L.age >= 40) {
    ctx.strokeStyle = 'rgba(150,90,70,0.45)'; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
    for (const [x, s] of side ? [[cx + 16, 1]] : [[cx - 14, -1], [cx + 14, 1]]) {
      ctx.beginPath(); ctx.moveTo(x, ey - 1.5); ctx.lineTo(x + s * 2.6, ey - 2.6); ctx.moveTo(x + s * 0.4, ey + 0.8); ctx.lineTo(x + s * 2.8, ey + 1.4); ctx.stroke();
    }
  }
  // ogen
  const happy = pose === 'happy' || pose === 'cheer';
  eyeXs.forEach((x, i) => {
    const s = side ? 1 : i === 0 ? -1 : 1;
    if (L.eyepatch && (side || i === 1)) return;
    if (pose === 'tired' || (L.eyes === 'sleepy' && !happy && pose !== 'surprised')) {
      ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, ey - 1, 3.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else if (happy) {
      ctx.strokeStyle = ink; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, ey + 1.5, 3.2, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    } else if (pose === 'surprised' || L.eyes === 'round') {
      const r = pose === 'surprised' ? 4.2 : 3.6;
      ell(ctx, x, ey, r, r + 0.6); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = ink; ctx.lineWidth = 1.1; ctx.stroke();
      ell(ctx, x + (side ? 1 : 0.4 * s), ey + 0.4, 2.2, 2.6); ctx.fillStyle = ink; ctx.fill();
      ell(ctx, x - 0.6, ey - 1, 0.9, 0.9); ctx.fillStyle = '#ffffff'; ctx.fill();
    } else {
      // klassieke AC-stip met glimlichtjes
      ell(ctx, x, ey, 2.6, 3.4); ctx.fillStyle = ink; ctx.fill();
      ell(ctx, x - 0.8, ey - 1.3, 0.95, 0.95); ctx.fillStyle = '#ffffff'; ctx.fill();
      ell(ctx, x + 0.9, ey + 1.4, 0.45, 0.45); ctx.fill();
      if (L.eyes === 'lashes') {
        ctx.strokeStyle = ink; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x + s * 2.2, ey - 2.4); ctx.lineTo(x + s * 4, ey - 3.6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + s * 2.7, ey - 1.2); ctx.lineTo(x + s * 4.5, ey - 1.8); ctx.stroke();
      }
    }
  });
  // wenkbrauwen
  ctx.strokeStyle = shade(L.hair, -0.15); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  const angry = pose === 'angry' || L.angry;
  eyeXs.forEach((x, i) => {
    const s = side ? 1 : i === 0 ? -1 : 1;
    if (L.eyepatch && (side || i === 1)) return;
    ctx.beginPath();
    if (angry) { ctx.moveTo(x - s * 3.5, ey - 7.5); ctx.lineTo(x + s * 3, ey - 5); }
    else if (pose === 'sad' || pose === 'tired') { ctx.moveTo(x - s * 3.5, ey - 5); ctx.lineTo(x + s * 3, ey - 7.5); }
    else if (pose === 'surprised') { ctx.arc(x, ey - 6, 3.4, 1.15 * Math.PI, 1.85 * Math.PI); }
    else { ctx.arc(x, ey - 4.5, 3.4, 1.25 * Math.PI, 1.75 * Math.PI); }
    ctx.stroke();
  });
  // roversmasker: zwarte band met oogjes erdoor
  if (L.mask) {
    const mc = L.maskColor || '#26202c';
    ctx.save();
    ctx.beginPath();
    const x0 = side ? cx - 6 : cx - 15.5, x1 = side ? cx + 22 : cx + 15.5;
    ctx.moveTo(x0, ey - 4.5);
    ctx.quadraticCurveTo((x0 + x1) / 2, ey - 7.5, x1, ey - 4.5);
    ctx.quadraticCurveTo(x1 + 1, ey + 1, x1 - 1, ey + 4);
    ctx.quadraticCurveTo((x0 + x1) / 2, ey + 1.5, x0 + 1, ey + 4);
    ctx.quadraticCurveTo(x0 - 1, ey + 1, x0, ey - 4.5);
    ctx.closePath();
    eyeXs.forEach((x) => { ctx.moveTo(x + 3.6, ey); ctx.ellipse(x, ey, 3.6, 3, 0, 0, Math.PI * 2); });
    ctx.fillStyle = mc; ctx.fill('evenodd');
    ctx.strokeStyle = shade(mc, 0.25); ctx.lineWidth = 0.8; ctx.stroke();
    // knoopje van de band opzij
    if (!side) { ctx.strokeStyle = mc; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x0, ey - 2); ctx.lineTo(x0 - 4, ey - 4); ctx.moveTo(x1, ey - 2); ctx.lineTo(x1 + 4, ey - 4); ctx.stroke(); }
    ctx.restore();
  }
  // ooglapje
  if (L.eyepatch) {
    const x = side ? cx + 11 : cx + 8;
    ell(ctx, x, ey, 4.4, 4); ctx.fillStyle = '#2b2230'; ctx.fill();
    ctx.strokeStyle = '#2b2230'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(cx - 20, hy - 6); ctx.lineTo(x + 4, ey - 2); ctx.stroke();
  }
  // neus
  ctx.strokeStyle = skinLine; ctx.lineWidth = 1.2;
  if (side) { ctx.beginPath(); ctx.moveTo(cx + 20.5, ey + 1); ctx.quadraticCurveTo(cx + 23.5, ey + 4, cx + 20, ey + 5); ctx.stroke(); }
  else { ell(ctx, cx, ey + 4.5, 1.6, 1.1); ctx.fillStyle = shade(L.skin, -0.12); ctx.fill(); }
  // mond
  const mx = side ? cx + 15 : cx, my = ey + 9;
  ctx.strokeStyle = ink; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  if (pose === 'cheer' || pose === 'talk' || pose === 'happy') {
    ctx.beginPath(); ctx.moveTo(mx - 3.5, my - 1); ctx.quadraticCurveTo(mx, my - 0.3, mx + 3.5, my - 1); ctx.quadraticCurveTo(mx + 3, my + 4.5, mx, my + 4.5); ctx.quadraticCurveTo(mx - 3, my + 4.5, mx - 3.5, my - 1); ctx.closePath();
    ctx.fillStyle = '#8c2f3c'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.clip(); ell(ctx, mx, my + 4.2, 2.6, 1.8); ctx.fillStyle = '#ef7d8a'; ctx.fill(); ctx.restore();
  } else if (pose === 'surprised') {
    ell(ctx, mx, my + 1, 1.8, 2.3); ctx.fillStyle = '#8c2f3c'; ctx.fill(); ctx.stroke();
  } else if (pose === 'sad' || angry) {
    ctx.beginPath(); ctx.arc(mx, my + 3.5, 3, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke();
  } else if (pose === 'tired') {
    ctx.beginPath(); ctx.moveTo(mx - 3, my + 1); ctx.quadraticCurveTo(mx - 1.5, my - 0.5, mx, my + 1); ctx.quadraticCurveTo(mx + 1.5, my + 2.5, mx + 3, my + 1); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(mx, my - 1, 3, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  // zweetdruppel / tranen
  if (pose === 'tired') {
    const x = cx + 17, y = hy - 9;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 4, y + 6, x, y + 7); ctx.quadraticCurveTo(x - 4, y + 6, x, y); ctx.fillStyle = '#9fdcf7'; ctx.fill(); ctx.strokeStyle = '#5aa9cf'; ctx.lineWidth = 1; ctx.stroke();
  }
  if (pose === 'sad' && !side) { ctx.fillStyle = '#9fdcf7'; ell(ctx, cx - 9, ey + 6, 1.2, 2); ctx.fill(); }
  // baard
  if (L.beard) {
    const bx = side ? cx + 10 : cx;
    const p = () => { ctx.beginPath(); ctx.moveTo(bx - (side ? 10 : 16), hy + 6); ctx.quadraticCurveTo(bx - 10, hy + 26, bx, hy + 25); ctx.quadraticCurveTo(bx + 10, hy + 26, bx + (side ? 9 : 16), hy + 6); ctx.quadraticCurveTo(bx + 6, hy + 11, bx, hy + 15); ctx.quadraticCurveTo(bx - 6, hy + 11, bx - (side ? 10 : 16), hy + 6); ctx.closePath(); };
    soft(ctx, p, L.beard, hy + 6, hy + 25, 1.3);
    // snor
    ctx.beginPath(); ctx.moveTo(mx - 6, my); ctx.quadraticCurveTo(mx - 3, my - 3.5, mx, my - 1.2); ctx.quadraticCurveTo(mx + 3, my - 3.5, mx + 6, my); ctx.quadraticCurveTo(mx, my + 0.5, mx - 6, my); paint(ctx, L.beard, 1);
  }
}

function drawAccessories(ctx, L, cx, hy, dir) {
  const ey = hy + 4;
  if (dir !== 'back' && (L.glasses || L.accessory === 'glasses')) {
    ctx.strokeStyle = '#3a3340'; ctx.lineWidth = 1.2;
    const xs = dir === 'side' ? [cx + 11] : [cx - 8, cx + 8];
    // glasses: true = rond, 'rect' = rechthoekig montuur
    const rect = L.glasses === 'rect';
    if (rect) ctx.lineWidth = 1.5;
    xs.forEach((x) => {
      if (rect) { ctx.beginPath(); ctx.roundRect(x - 5.2, ey - 3.6, 10.4, 7.2, 1.6); } else ell(ctx, x, ey, 4.8, 4.4);
      ctx.stroke(); ctx.fillStyle = 'rgba(200,235,255,0.25)'; ctx.fill();
    });
    if (xs.length === 2) { ctx.beginPath(); ctx.moveTo(cx - 3.2, ey - 0.5); ctx.quadraticCurveTo(cx, ey - 2, cx + 3.2, ey - 0.5); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(cx + 6.2, ey - 1); ctx.lineTo(cx - 3, ey - 2); ctx.stroke(); }
  }
  if (L.accessory === 'earrings' && dir === 'front') {
    for (const x of [cx - 21.5, cx + 21.5]) { ell(ctx, x, hy + 10, 1.6, 1.6); paint(ctx, P.gold, 0.8); }
  }
}

function drawHat(ctx, L, cx, hy, dir) {
  const ey = hy + 4;
  const side = dir === 'side';
  const hx = side ? cx - 2 : cx;
  switch (L.hat) {
    case 'cap': {
      const c = L.capColor || L.shirt;
      const p = () => { ctx.beginPath(); ctx.arc(hx, hy - 4, 22.5, Math.PI, Math.PI * 2); ctx.quadraticCurveTo(hx, hy - 8, hx - 22.5, hy - 4); ctx.closePath(); };
      soft(ctx, p, c, hy - 27, hy - 4, 1.5);
      if (dir === 'front') { ell(ctx, hx, hy - 4, 17, 5); soft(ctx, () => ell(ctx, hx, hy - 4, 17, 5), shade(c, -0.12), hy - 9, hy + 1, 1.3); }
      else if (side) { ell(ctx, hx + 20, hy - 5, 11, 3.5); paint(ctx, shade(c, -0.12), 1.3); }
      ell(ctx, hx, hy - 26, 2.2, 1.5); paint(ctx, shade(c, -0.2), 0.8);
      break;
    }
    case 'beanie': {
      const c = L.capColor || shade(L.shirt, -0.1);
      const p = () => { ctx.beginPath(); ctx.arc(hx, hy - 2, 23, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); };
      soft(ctx, p, c, hy - 25, hy - 2, 1.5);
      rr(ctx, hx - 23.5, hy - 7, 47, 7, 3); paint(ctx, shade(c, -0.1), 1.3);
      ctx.strokeStyle = shade(c, -0.25); ctx.lineWidth = 0.9; for (let x = -20; x <= 20; x += 4) { ctx.beginPath(); ctx.moveTo(hx + x, hy - 6); ctx.lineTo(hx + x, hy - 1); ctx.stroke(); }
      ell(ctx, hx, hy - 26, 4.5, 4.5); paint(ctx, '#ffffff', 1.1, '#c9c2cf');
      break;
    }
    case 'straw': {
      const c = '#f0d07a';
      ell(ctx, hx, hy - 9, 31, 8.5); soft(ctx, () => ell(ctx, hx, hy - 9, 31, 8.5), c, hy - 17, hy - 1, 1.4);
      const p = () => { ctx.beginPath(); ctx.ellipse(hx, hy - 12, 15, 13, 0, Math.PI, Math.PI * 2); ctx.closePath(); };
      soft(ctx, p, c, hy - 25, hy - 12, 1.4);
      ctx.fillStyle = P.red; ctx.fillRect(hx - 15, hy - 16, 30, 3.5);
      ctx.strokeStyle = shade(c, -0.18); ctx.lineWidth = 0.8; for (let r = 18; r < 31; r += 4) { ctx.beginPath(); ctx.ellipse(hx, hy - 9, r, r * 0.27, 0, 0, Math.PI); ctx.stroke(); }
      break;
    }
    case 'bandana': {
      const c = L.bandana || P.pirateRed;
      const p = () => { ctx.beginPath(); ctx.arc(hx, hy - 2, 23, Math.PI * 1.03, Math.PI * 1.97); ctx.quadraticCurveTo(hx, hy - 7, hx - 23, hy - 3); ctx.closePath(); };
      soft(ctx, p, c, hy - 25, hy - 3, 1.5);
      ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-10, -14], [0, -18], [10, -14], [-4, -9], [6, -9]]) { ell(ctx, hx + x, hy + y, 1.4, 1.4); ctx.fill(); }
      {
        const kx = side ? hx - 22 : hx + 21;
        ctx.beginPath(); ctx.moveTo(kx, hy - 7); ctx.lineTo(kx + (side ? -9 : 9), hy - 2); ctx.lineTo(kx + (side ? -5 : 6), hy + 5); ctx.closePath(); paint(ctx, c, 1.2);
      }
      break;
    }
    case 'tricorn':
    case 'captain': {
      const w = L.hat === 'captain' ? 33 : 28;
      const p = () => { ctx.beginPath(); ctx.moveTo(hx - w, hy - 8); ctx.quadraticCurveTo(hx - w / 2, hy - 40, hx, hy - 31); ctx.quadraticCurveTo(hx + w / 2, hy - 40, hx + w, hy - 8); ctx.quadraticCurveTo(hx, hy - 17, hx - w, hy - 8); ctx.closePath(); };
      soft(ctx, p, '#3b2f3f', hy - 38, hy - 8, 1.6);
      ctx.strokeStyle = P.gold; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(hx - w + 5, hy - 11); ctx.quadraticCurveTo(hx, hy - 19.5, hx + w - 5, hy - 11); ctx.stroke();
      if (dir !== 'back') {
        ell(ctx, hx, hy - 25, 4.2, 3.8); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.fillStyle = '#3b2f3f'; ell(ctx, hx - 1.5, hy - 25.5, 1, 1); ctx.fill(); ell(ctx, hx + 1.5, hy - 25.5, 1, 1); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(hx - 4, hy - 19.5); ctx.lineTo(hx + 4, hy - 22); ctx.moveTo(hx + 4, hy - 19.5); ctx.lineTo(hx - 4, hy - 22); ctx.stroke();
      }
      if (L.hat === 'captain') { ctx.beginPath(); ctx.moveTo(hx + 7, hy - 31); ctx.quadraticCurveTo(hx + 30, hy - 52, hx + 22, hy - 24); ctx.quadraticCurveTo(hx + 18, hy - 33, hx + 7, hy - 31); paint(ctx, P.red, 1.2); }
      break;
    }
    case 'rover': {
      // brede vilten roovershoed met een veer
      const c = L.hatColor || '#4a3b2c';
      ell(ctx, hx, hy - 9, 32, 8.5); soft(ctx, () => ell(ctx, hx, hy - 9, 32, 8.5), c, hy - 17, hy - 1, 1.5);
      const p = () => { ctx.beginPath(); ctx.moveTo(hx - 16, hy - 10); ctx.quadraticCurveTo(hx - 17, hy - 34, hx, hy - 33); ctx.quadraticCurveTo(hx + 17, hy - 34, hx + 16, hy - 10); ctx.closePath(); };
      soft(ctx, p, shade(c, 0.08), hy - 34, hy - 10, 1.5);
      ctx.fillStyle = shade(c, -0.3); ctx.fillRect(hx - 16, hy - 16, 32, 4.5);
      if (dir !== 'back') {
        const fx = side ? hx - 10 : hx + 12;
        ctx.beginPath(); ctx.moveTo(fx, hy - 14); ctx.quadraticCurveTo(fx + 14, hy - 40, fx + 4, hy - 52); ctx.quadraticCurveTo(fx + 2, hy - 34, fx - 3, hy - 16); ctx.closePath();
        paint(ctx, L.feather || '#e8504c', 1.1);
        ctx.strokeStyle = shade(L.feather || '#e8504c', -0.35); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(fx, hy - 15); ctx.quadraticCurveTo(fx + 8, hy - 34, fx + 4, hy - 50); ctx.stroke();
      }
      break;
    }
    case 'crown': {
      const p = () => { ctx.beginPath(); ctx.moveTo(hx - 16, hy - 14); ctx.lineTo(hx - 18, hy - 34); ctx.lineTo(hx - 9, hy - 24); ctx.lineTo(hx, hy - 38); ctx.lineTo(hx + 9, hy - 24); ctx.lineTo(hx + 18, hy - 34); ctx.lineTo(hx + 16, hy - 14); ctx.closePath(); };
      soft(ctx, p, P.gold, hy - 38, hy - 14, 1.4);
      if (dir !== 'back') for (const [x, col] of [[-8, P.red], [0, '#8e5bd8'], [8, P.teal]]) { ell(ctx, hx + x, hy - 18, 2.4, 2.4); paint(ctx, col, 0.8); }
      for (const x of [-18, 0, 18]) { ell(ctx, hx + x, hy + (x ? -34 : -38), 2, 2); paint(ctx, '#ffffff', 0.8); }
      break;
    }
    case 'sunglasses': {
      if (dir === 'back') break;
      ctx.fillStyle = '#2b2230';
      const xs = side ? [cx + 11] : [cx - 8, cx + 8];
      xs.forEach((x) => { rr(ctx, x - 5.5, ey - 4, 11, 7.5, 3); ctx.fill(); });
      ctx.fillRect(side ? cx - 3 : cx - 3, ey - 2.5, side ? 10 : 6, 1.5);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; xs.forEach((x) => ctx.fillRect(x - 3.5, ey - 2.5, 2.5, 1.5));
      break;
    }
    case 'headset': {
      ctx.strokeStyle = '#3a3340'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.arc(hx, hy - 1, 24, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      if (dir !== 'back') {
        const ex = side ? cx - 3 : cx - 23;
        rr(ctx, ex - 3.5, hy - 1, 7, 10, 3); paint(ctx, '#4a3a4d', 1);
        ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(ex, hy + 8); ctx.quadraticCurveTo(side ? cx + 6 : cx - 14, hy + 16, side ? cx + 13 : cx - 5, hy + 13); ctx.stroke();
        ell(ctx, side ? cx + 13 : cx - 5, hy + 13, 1.8, 1.4); ctx.fillStyle = '#4a3a4d'; ctx.fill();
      }
      break;
    }
    default: break;
  }
}

// ── één frame ───────────────────────────────────────────────────────────────
function drawFrame(ctx, look, frame) {
  const L = look;
  const dir = frame.startsWith('back') ? 'back' : frame.startsWith('side') ? 'side' : 'front';
  const pose = frame.replace(/^(back|side)_/, '');
  const walkA = pose === 'walk1', walkB = pose === 'walk2';
  const cheer = pose === 'cheer';
  const tired = pose === 'tired';
  const cx = FW / 2;
  const G = FH - 5;
  const bob = walkA || walkB ? -1.5 : 0;
  const slump = tired ? 3 : 0;
  const longSleeve = ['hoodie', 'shirt', 'blouse'].includes(L.top) || !!L.coat;

  // schaduw
  ctx.fillStyle = 'rgba(40,25,45,0.2)'; ell(ctx, cx, G + 1, 17, 4.5); ctx.fill();

  const shoulderY = 57 + bob + slump;
  const torsoY = 53 + bob + slump;
  const hy = 32 + bob + slump * 1.3;

  // armen-rotaties (positief = met de klok mee; arm wijst standaard omlaag)
  const armRot = (s) => {
    if (cheer) return -s * 2.5;
    if (tired) return -s * 0.04;
    if (pose === 'talk' && s > 0) return -1.2;
    let r = -s * 0.14;
    if (walkA) r += s > 0 ? 0.35 : 0.25;
    if (walkB) r -= s > 0 ? 0.25 : 0.35;
    return r;
  };

  if (dir === 'side') {
    // achterarm, benen, onderkant, romp, voorarm, hoofd
    drawArm(ctx, { ...L, shirt: shade(L.shirt, -0.12), skin: shade(L.skin, -0.1), coat: L.coat && shade(L.coat, -0.12) }, cx - 1, shoulderY, walkA ? -0.5 : walkB ? 0.5 : 0.08, longSleeve);
    drawLegs(ctx, L, cx, G, dir, pose, bob);
    drawBottom(ctx, L, cx, dir, bob);
    drawTorso(ctx, L, cx, torsoY, dir, slump);
    drawArm(ctx, L, cx + 1, shoulderY, walkA ? 0.5 : walkB ? -0.5 : -0.08, longSleeve);
  } else {
    if (!cheer) { drawArm(ctx, L, cx - 12.5, shoulderY, armRot(-1), longSleeve); drawArm(ctx, L, cx + 12.5, shoulderY, armRot(1), longSleeve); }
    drawLegs(ctx, L, cx, G, dir, pose, bob);
    drawBottom(ctx, L, cx, dir, bob);
    if (L.top === 'hoodie' && dir === 'front') { ell(ctx, cx, torsoY + 1, 12, 5); paint(ctx, shade(L.shirt, -0.12), 1.2); }
    drawTorso(ctx, L, cx, torsoY, dir, slump);
    if (cheer) { drawArm(ctx, L, cx - 12.5, shoulderY, armRot(-1), longSleeve); drawArm(ctx, L, cx + 12.5, shoulderY, armRot(1), longSleeve); }
  }
  if (L.hook && dir !== 'back') {
    const hx = dir === 'side' ? cx + 4 : cx + 15, hyy = shoulderY + 17;
    ctx.strokeStyle = '#c9c9d6'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hyy + 3, 3, 0, Math.PI); ctx.stroke();
  }

  // hoofd
  hairBack(ctx, L, cx, hy, dir);
  const headX = dir === 'side' ? cx + 1 : cx;
  // oren
  if (dir !== 'side') for (const s of [-1, 1]) { ell(ctx, cx + s * 21.5, hy + 4, 3.8, 4.6); paint(ctx, L.skin, 1.2, shade(L.skin, -0.3)); }
  else { ell(ctx, cx - 3, hy + 4, 3.6, 4.4); paint(ctx, L.skin, 1.2, shade(L.skin, -0.3)); }
  const face = () => ell(ctx, headX, hy, 22.5, 21.5);
  const g = ctx.createRadialGradient(headX - 6, hy - 8, 3, headX, hy + 2, 26);
  g.addColorStop(0, shade(L.skin, 0.1)); g.addColorStop(0.75, L.skin); g.addColorStop(1, shade(L.skin, -0.1));
  face(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = shade(L.skin, -0.35); ctx.lineWidth = 1.5; ctx.stroke();
  if (dir === 'side') {
    // neusje uitsteken aan de rechterkant
    ell(ctx, headX + 20.5, hy + 5, 2.6, 2.2); ctx.fillStyle = L.skin; ctx.fill();
  }
  drawFace(ctx, L, headX, hy, dir, pose);
  hairFront(ctx, L, headX, hy, dir);
  drawAccessories(ctx, L, headX, hy, dir);
  drawHat(ctx, L, headX, hy, dir);
}

/** Genereer een karakter-spritesheet (16 frames). */
export function makeCharacter(scene, key, look) {
  const L = normalize(look);
  // supersample-canvas
  const big = document.createElement('canvas');
  big.width = FW * SS * FRAMES.length; big.height = FH * SS;
  const b = big.getContext('2d');
  b.lineJoin = 'round'; b.lineCap = 'round';
  FRAMES.forEach((f, i) => {
    b.save();
    b.setTransform(SS, 0, 0, SS, i * FW * SS, 0);
    b.beginPath(); b.rect(0, 0, FW, FH); b.clip();
    drawFrame(b, L, f);
    b.restore();
  });
  const tex = makeTexture(scene, key, FW * FRAMES.length, FH, (ctx) => {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(big, 0, 0, FW * FRAMES.length, FH);
  });
  FRAMES.forEach((f, i) => tex.add(f, 0, i * FW, 0, FW, FH));
  return key;
}

/** Maakt loopanimaties voor alle richtingen; retourneert de vooraanzicht-loopanimatie. */
export function ensureAnims(scene, key) {
  const mk = (name, prefix) => {
    const a = `${key}_${name}`;
    if (scene.anims.exists(a)) scene.anims.remove(a);
    scene.anims.create({
      key: a, frameRate: 9, repeat: -1,
      frames: [`${prefix}walk1`, `${prefix}idle`, `${prefix}walk2`, `${prefix}idle`].map((frame) => ({ key, frame })),
    });
    return a;
  };
  mk('walk_up', 'back_');
  mk('walk_side', 'side_');
  return mk('walk', '');
}

/**
 * Laat een sprite lopen of stilstaan in de juiste richting.
 * vx/vy = bewegingsrichting (0,0 = stilstaan). Onthoudt de laatste richting op de sprite.
 */
export function faceMove(sprite, key, vx, vy) {
  const moving = Math.abs(vx) + Math.abs(vy) > 0.05;
  if (moving) {
    if (Math.abs(vx) > Math.abs(vy) * 1.1) { sprite.facing = 'side'; sprite.setFlipX(vx < 0); }
    else { sprite.facing = vy < 0 ? 'up' : 'down'; sprite.setFlipX(false); }
    const anim = sprite.facing === 'side' ? `${key}_walk_side` : sprite.facing === 'up' ? `${key}_walk_up` : `${key}_walk`;
    if (sprite.anims.currentAnim?.key !== anim || !sprite.anims.isPlaying) sprite.play(anim, true);
  } else {
    if (sprite.anims.isPlaying) sprite.anims.stop();
    const idle = sprite.facing === 'side' ? 'side_idle' : sprite.facing === 'up' ? 'back_idle' : 'idle';
    if (sprite.frame.name !== idle) sprite.setFrame(idle);
  }
}
