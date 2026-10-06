// Extra objecten in Animal Crossing-stijl: loofbomen, fruitbomen, bloeiende struiken,
// hekjes, bankjes, brievenbussen, boomstronken, bloempotten en gedetailleerdere palmen/bungalows.
// Conventie: origin (0.5, 1) = onderkant midden.
import { P, shade } from '../palette.js';
import { style, rrect, circle, ellipse, poly, softShadow, makeTexture, rng } from '../draw.js';

const L = P.line;

function blob(c, x, y, r, col, lw = 3) {
  circle(c, x, y, r);
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.15, x, y, r);
  g.addColorStop(0, shade(col, 0.18)); g.addColorStop(0.7, col); g.addColorStop(1, shade(col, -0.12));
  c.fillStyle = g; c.fill();
  if (lw) { c.strokeStyle = shade(col, -0.45); c.lineWidth = lw; c.stroke(); }
}

/** Ronde AC-loofboom (optioneel met fruit). */
function roundTree(scene, key, leaf, fruit) {
  makeTexture(scene, key, 150, 190, (c) => {
    softShadow(c, 75, 180, 46, 11);
    // stam met wortels
    c.beginPath(); c.moveTo(62, 182); c.quadraticCurveTo(66, 150, 64, 118); c.lineTo(86, 118); c.quadraticCurveTo(84, 150, 90, 182);
    c.quadraticCurveTo(80, 176, 75, 182); c.quadraticCurveTo(70, 176, 62, 182); c.closePath();
    style(c, { fill: '#9a6a3c', stroke: '#5e3d22', lw: 3 });
    c.strokeStyle = 'rgba(70,40,20,0.35)'; c.lineWidth = 2;
    for (const y of [140, 158]) { c.beginPath(); c.moveTo(70, y); c.quadraticCurveTo(75, y + 3, 80, y); c.stroke(); }
    // kruin: overlappende bollen
    const r = rng(key.length * 13);
    const lumps = [[75, 62, 50], [42, 82, 34], [108, 82, 34], [56, 44, 32], [96, 46, 32], [75, 96, 34]];
    c.save(); c.translate(0, 6); c.fillStyle = 'rgba(30,60,30,0.25)';
    for (const [x, y, rad] of lumps) { circle(c, x, y, rad); c.fill(); }
    c.restore();
    for (const [x, y, rad] of lumps) blob(c, x, y, rad, leaf);
    // binnenlijnen wegpoetsen voor één zachte vorm
    for (const [x, y, rad] of lumps) { circle(c, x, y, rad - 2.5); c.fillStyle = leaf; c.globalAlpha = 0.55; c.fill(); c.globalAlpha = 1; }
    // bladtextuur: kleine boogjes
    c.strokeStyle = shade(leaf, -0.28); c.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const [x, y, rad] = lumps[Math.floor(r() * lumps.length)];
      const a = r() * Math.PI * 2, d = r() * rad * 0.7;
      const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      c.beginPath(); c.arc(px, py, 5, Math.PI * 0.1, Math.PI * 0.9); c.stroke();
    }
    c.fillStyle = 'rgba(255,255,255,0.35)';
    for (const [x, y] of [[60, 40], [92, 38], [40, 72]]) { ellipse(c, x, y, 9, 5, -0.5); c.fill(); }
    if (fruit) {
      for (const [x, y] of [[50, 70], [96, 66], [74, 92], [104, 92], [62, 40]]) {
        circle(c, x, y, 7); style(c, { fill: fruit, stroke: shade(fruit, -0.45), lw: 2 });
        c.fillStyle = 'rgba(255,255,255,0.6)'; circle(c, x - 2, y - 2.5, 2); c.fill();
        c.fillStyle = '#4f9a3a'; ellipse(c, x + 2, y - 7, 3, 1.6, 0.6); c.fill();
      }
    }
  });
}

/** Palm met geringde stam, bladeren met inkepingen en kokosnoten. */
function palm(scene) {
  makeTexture(scene, 'palm_trunk', 50, 130, (c) => {
    softShadow(c, 25, 122, 22, 7);
    for (let i = 0; i < 8; i++) {
      const y = 120 - i * 14.5, x = 25 + Math.sin(i * 0.5) * 4 - i * 0.6, w = 12.5 - i * 0.55;
      c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w - 1, y - 9, x - w + 2, y - 16);
      c.lineTo(x + w - 2, y - 16); c.quadraticCurveTo(x + w + 1, y - 9, x + w, y); c.closePath();
      const g = c.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#d9a066'); g.addColorStop(0.6, '#c07c41'); g.addColorStop(1, '#8a5226');
      c.fillStyle = g; c.fill(); c.strokeStyle = '#6b3f1d'; c.lineWidth = 2.5; c.stroke();
      c.strokeStyle = 'rgba(80,40,15,0.45)'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(x - w + 3, y - 4); c.quadraticCurveTo(x, y - 1, x + w - 3, y - 4); c.stroke();
    }
  });
  makeTexture(scene, 'palm_crown', 180, 120, (c) => {
    const cx = 90, cy = 58;
    const leaves = [-3.0, -2.45, -1.85, -1.25, -0.65, -0.1, 0.45, 2.7];
    leaves.forEach((a, i) => {
      const len = 74 - (i % 2) * 10;
      const col = i % 2 ? '#3f9a4a' : '#55b85a';
      c.save(); c.translate(cx, cy); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0);
      // zaagtand-blad
      const n = 7;
      c.quadraticCurveTo(len * 0.5, -24, len, 8);
      for (let k = n; k >= 0; k--) {
        const t = k / n, bx = len * t, by = 8 * t + 2;
        c.lineTo(bx - 3, by + 5); c.lineTo(bx - 6, by);
      }
      c.closePath();
      style(c, { fill: col, stroke: '#2d6b33', lw: 2.5 });
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(6, -2); c.quadraticCurveTo(len * 0.5, -12, len - 8, 4); c.stroke();
      c.restore();
    });
    for (const [x, y] of [[-8, 5], [6, 7], [-1, 13]]) {
      circle(c, cx + x, cy + y, 7.5); style(c, { fill: '#7a4a2a', stroke: '#4a2a14', lw: 2.5 });
      c.fillStyle = 'rgba(255,255,255,0.35)'; circle(c, cx + x - 2, cy + y - 2.5, 2); c.fill();
    }
  });
}

/** Bloeiende struik (azalea) in drie kleuren. */
function bushes(scene) {
  [['bush', '#5aa843', '#ff9ecf'], ['bush_white', '#4f9a3a', '#ffffff'], ['bush_red', '#5aa843', '#ff6b6b']].forEach(([key, leaf, bloom]) => {
    makeTexture(scene, key, 96, 66, (c) => {
      softShadow(c, 48, 58, 42, 8);
      const lumps = [[26, 40, 19], [70, 40, 19], [48, 28, 23], [48, 44, 20]];
      for (const [x, y, r] of lumps) blob(c, x, y, r, leaf, 3);
      for (const [x, y, r] of lumps) { circle(c, x, y, r - 2.5); c.fillStyle = leaf; c.globalAlpha = 0.6; c.fill(); c.globalAlpha = 1; }
      const r = rng(key.length * 7);
      for (let i = 0; i < 9; i++) {
        const x = 18 + r() * 60, y = 18 + r() * 32;
        c.fillStyle = bloom;
        for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(c, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 2.4); c.fill(); }
        c.fillStyle = '#ffd23f'; circle(c, x, y, 1.4); c.fill();
      }
      c.fillStyle = 'rgba(255,255,255,0.35)'; for (const [x, y] of [[40, 16], [62, 26]]) { ellipse(c, x, y, 6, 3, -0.5); c.fill(); }
    });
  });
}

function furniture(scene) {
  // houten hekje (los segment, 2 palen)
  makeTexture(scene, 'fence', 84, 56, (c) => {
    softShadow(c, 42, 50, 38, 4, 0.15);
    for (const y of [20, 34]) { rrect(c, 4, y, 76, 7, 3); style(c, { fill: '#e7c79a', stroke: '#9a7046', lw: 2.2 }); }
    for (const x of [12, 72]) {
      c.beginPath(); c.moveTo(x - 5, 52); c.lineTo(x - 5, 12); c.lineTo(x, 6); c.lineTo(x + 5, 12); c.lineTo(x + 5, 52); c.closePath();
      style(c, { fill: '#f2d9b0', stroke: '#9a7046', lw: 2.4 });
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x - 3, 14, 2, 34);
    }
  });
  // bankje
  makeTexture(scene, 'bench', 110, 70, (c) => {
    softShadow(c, 55, 64, 48, 6);
    for (const x of [18, 92]) { rrect(c, x - 4, 34, 8, 30, 3); style(c, { fill: '#5e5a6b', stroke: '#3a3644', lw: 2 }); }
    for (const y of [10, 22]) { rrect(c, 8, y, 94, 9, 4); style(c, { fill: '#c98d4f', stroke: '#7a4a22', lw: 2.2 }); }
    rrect(c, 6, 36, 98, 11, 4); style(c, { fill: '#d99a5a', stroke: '#7a4a22', lw: 2.2 });
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(12, 38, 86, 2.5);
  });
  // brievenbus
  makeTexture(scene, 'mailbox', 40, 70, (c) => {
    softShadow(c, 20, 64, 14, 4);
    rrect(c, 17, 30, 6, 36, 2); style(c, { fill: '#c98d4f', stroke: '#7a4a22', lw: 2 });
    c.beginPath(); c.moveTo(6, 32); c.lineTo(6, 16); c.arc(20, 16, 14, Math.PI, 0); c.lineTo(34, 32); c.closePath();
    style(c, { fill: '#e8504c', stroke: '#8e2a28', lw: 2.4 });
    rrect(c, 31, 10, 5, 12, 1.5); style(c, { fill: '#f6c33b', stroke: '#9a7a1a', lw: 1.5 });
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.fillRect(9, 15, 3, 12);
  });
  // boomstronk
  makeTexture(scene, 'stump', 60, 46, (c) => {
    softShadow(c, 30, 40, 26, 5);
    c.beginPath(); c.moveTo(10, 22); c.lineTo(12, 38); c.quadraticCurveTo(30, 44, 48, 38); c.lineTo(50, 22); c.closePath();
    style(c, { fill: '#9a6a3c', stroke: '#5e3d22', lw: 2.5 });
    ellipse(c, 30, 22, 20, 8); style(c, { fill: '#e8c48f', stroke: '#5e3d22', lw: 2.5 });
    c.strokeStyle = '#c99a5f'; c.lineWidth = 1.2; for (const rr of [4, 9, 14]) { ellipse(c, 30, 22, rr, rr * 0.4); c.stroke(); }
  });
  // bloempot
  makeTexture(scene, 'flowerpot', 44, 52, (c) => {
    softShadow(c, 22, 48, 16, 4);
    poly(c, [[9, 26], [35, 26], [31, 46], [13, 46]]); style(c, { fill: '#d9774b', stroke: '#8a4126', lw: 2.2 });
    rrect(c, 7, 22, 30, 7, 2.5); style(c, { fill: '#e8895a', stroke: '#8a4126', lw: 2.2 });
    for (const [x, y, col] of [[15, 14, '#ff6b6b'], [27, 12, '#ffd23f'], [21, 6, '#ff9ecf']]) {
      c.fillStyle = '#4f9a3a'; ellipse(c, x, y + 7, 4, 2, 0.4); c.fill();
      c.fillStyle = col; for (let k = 0; k < 5; k++) { const a = k * 1.256; circle(c, x + Math.cos(a) * 3, y + Math.sin(a) * 3, 2.6); c.fill(); }
      c.fillStyle = '#fff3b0'; circle(c, x, y, 1.6); c.fill();
    }
  });
  // vlinder (2 frames)
  const tex = makeTexture(scene, 'butterfly', 48, 24, (c) => {
    for (let f = 0; f < 2; f++) {
      const ox = f * 24 + 12, w = f ? 4 : 9;
      c.fillStyle = '#ffffff'; c.strokeStyle = '#4a3646'; c.lineWidth = 1.2;
      for (const s of [-1, 1]) { ellipse(c, ox + s * w * 0.9, 9, w, 6, s * 0.3); c.fill(); c.stroke(); ellipse(c, ox + s * w * 0.6, 16, w * 0.65, 4, -s * 0.4); c.fill(); c.stroke(); }
      c.fillStyle = '#4a3646'; rrect(c, ox - 1.2, 6, 2.4, 13, 1.2); c.fill();
    }
  });
  tex.add('f0', 0, 0, 0, 24, 24); tex.add('f1', 0, 24, 0, 24, 24);
}

/** Bungalow met dakpannen, luiken, bloembakken, veranda en lampje. */
function bungalow(scene, key, roof, wall) {
  makeTexture(scene, key, 210, 200, (c) => {
    softShadow(c, 105, 188, 96, 13);
    // muur met planken
    rrect(c, 24, 86, 162, 98, 6);
    const g = c.createLinearGradient(0, 86, 0, 184); g.addColorStop(0, shade(wall, 0.08)); g.addColorStop(1, shade(wall, -0.08));
    c.fillStyle = g; c.fill(); c.strokeStyle = L; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(120,90,60,0.18)'; c.lineWidth = 1.5;
    for (let y = 98; y < 182; y += 12) { c.beginPath(); c.moveTo(27, y); c.lineTo(183, y); c.stroke(); }
    // fundering
    rrect(c, 20, 176, 170, 10, 3); style(c, { fill: '#b7aea2', stroke: L, lw: 2.5 });
    // dak met pannen
    const roofPath = () => { c.beginPath(); c.moveTo(8, 94); c.lineTo(105, 16); c.lineTo(202, 94); c.closePath(); };
    roofPath(); c.fillStyle = roof; c.fill();
    c.save(); roofPath(); c.clip();
    for (let row = 0; row < 7; row++) {
      const y = 26 + row * 11.5;
      for (let x = -10 + (row % 2) * 9; x < 220; x += 18) {
        c.beginPath(); c.arc(x, y, 9, 0, Math.PI); c.fillStyle = row % 2 ? shade(roof, -0.08) : shade(roof, 0.04); c.fill();
        c.strokeStyle = shade(roof, -0.3); c.lineWidth = 1.3; c.stroke();
      }
    }
    c.fillStyle = 'rgba(255,255,255,0.18)'; poly(c, [[105, 16], [60, 52], [80, 52]]); c.fill();
    c.restore();
    roofPath(); c.strokeStyle = shade(roof, -0.45); c.lineWidth = 3.2; c.stroke();
    rrect(c, 4, 90, 202, 8, 3); style(c, { fill: shade(roof, -0.2), stroke: shade(roof, -0.45), lw: 2.4 });
    // schoorsteen + rookgat
    rrect(c, 146, 30, 18, 30, 2); style(c, { fill: '#c9735a', stroke: L, lw: 2.5 });
    rrect(c, 143, 27, 24, 7, 2); style(c, { fill: '#a9584a', stroke: L, lw: 2.2 });
    // veranda-afdakje + deur
    rrect(c, 84, 116, 40, 66, 5); style(c, { fill: '#a8673a', stroke: '#5e3d22', lw: 2.6 });
    rrect(c, 89, 122, 13, 22, 3); style(c, { fill: '#c98d4f', stroke: '#5e3d22', lw: 1.6 });
    rrect(c, 106, 122, 13, 22, 3); style(c, { fill: '#c98d4f', stroke: '#5e3d22', lw: 1.6 });
    circle(c, 116, 152, 2.6); style(c, { fill: P.gold, stroke: '#9a7a1a', lw: 1 });
    rrect(c, 78, 108, 52, 8, 3); style(c, { fill: shade(roof, -0.15), stroke: shade(roof, -0.45), lw: 2 });
    circle(c, 134, 118, 4.5); style(c, { fill: '#fff3b0', stroke: '#9a7a1a', lw: 1.5 });
    // ramen met luiken en bloembakken
    for (const x of [38, 140]) {
      rrect(c, x, 108, 32, 30, 4);
      const wg = c.createLinearGradient(x, 108, x + 32, 138); wg.addColorStop(0, '#d8f4ff'); wg.addColorStop(1, '#7ec8ea');
      c.fillStyle = wg; c.fill(); c.strokeStyle = L; c.lineWidth = 2.6; c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x + 16, 109); c.lineTo(x + 16, 137); c.moveTo(x + 1, 123); c.lineTo(x + 31, 123); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.6)'; poly(c, [[x + 4, 112], [x + 10, 112], [x + 4, 120]]); c.fill();
      for (const sx of [x - 9, x + 33]) { rrect(c, sx, 106, 8, 34, 2); style(c, { fill: shade(roof, -0.05), stroke: shade(roof, -0.45), lw: 1.8 }); c.strokeStyle = shade(roof, -0.3); c.lineWidth = 1; for (let y = 111; y < 138; y += 5) { c.beginPath(); c.moveTo(sx + 1.5, y); c.lineTo(sx + 6.5, y); c.stroke(); } }
      rrect(c, x - 4, 138, 40, 9, 3); style(c, { fill: '#a8673a', stroke: '#5e3d22', lw: 2 });
      for (let i = 0; i < 5; i++) {
        c.fillStyle = '#4f9a3a'; circle(c, x + 1 + i * 7.5, 137, 3.4); c.fill();
        c.fillStyle = ['#ff6b6b', '#ffd23f', '#ff9ecf', '#ffffff', '#b48cff'][(i + x) % 5]; circle(c, x + 1 + i * 7.5, 134, 2.6); c.fill();
      }
    }
  });
}

export function makeACProps(scene) {
  palm(scene);
  bushes(scene);
  roundTree(scene, 'tree_round', '#5cb85a');
  roundTree(scene, 'tree_round2', '#4aa34f');
  roundTree(scene, 'tree_orange', '#5cb85a', '#ff9f2e');
  roundTree(scene, 'tree_apple', '#55b04f', '#e8504c');
  furniture(scene);
  bungalow(scene, 'bungalow0', '#e0645a', '#fbeed3');
  bungalow(scene, 'bungalow1', '#4f9fd0', '#f4f0e6');
  bungalow(scene, 'bungalow2', '#5bb15e', '#fff4dc');
  bungalow(scene, 'bungalow3', '#f08d4a', '#f6eadb');
}
