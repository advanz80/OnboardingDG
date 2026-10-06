// Objecten in het park: palmen, bungalows, gebouwen, boten, piratenschip…
// Conventie: origin (0.5, 1) = onderkant midden (voor diepte-sortering op y).
import { P, shade } from '../palette.js';
import { style, rrect, circle, ellipse, poly, star, softShadow, makeTexture, rng } from '../draw.js';
import { makeACProps } from './acprops.js';
import { makeACProps2 } from './acprops2.js';
import { makeACBoats } from './acboats.js';

function palm(scene) {
  makeTexture(scene, 'palm_trunk', 50, 130, (c) => {
    softShadow(c, 25, 122, 22, 7);
    const pts = [];
    for (let i = 0; i <= 7; i++) pts.push([25 + Math.sin(i * 0.5) * 4 - i * 0.6, 120 - i * 15]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x, y] = pts[i];
      const w = 13 - i * 0.6;
      c.beginPath();
      c.moveTo(x - w, y); c.lineTo(x - w + 2, y - 17); c.lineTo(x + w - 2, y - 17); c.lineTo(x + w, y); c.closePath();
      style(c, { fill: i % 2 ? P.wood : P.woodLight, lw: 3 });
    }
  });
  makeTexture(scene, 'palm_crown', 170, 110, (c) => {
    const cx = 85, cy = 55;
    const leaves = [-2.9, -2.3, -1.6, -0.9, -0.25, 0.4, 2.6];
    for (const [i, a] of leaves.entries()) {
      const len = 70 - (i % 2) * 8;
      c.save(); c.translate(cx, cy); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0);
      c.quadraticCurveTo(len * 0.5, -22, len, 6);
      c.quadraticCurveTo(len * 0.5, 4, 0, 0);
      style(c, { fill: i % 2 ? P.grassDark : P.green, lw: 3.5 });
      c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(len * 0.5, -8, len - 6, 4); c.stroke();
      c.restore();
    }
    for (const [x, y] of [[-8, 4], [6, 6], [-1, 12]]) { circle(c, cx + x, cy + y, 7); style(c, { fill: '#7a4a2a', lw: 3 }); }
  });
}

function bush(scene) {
  makeTexture(scene, 'bush', 90, 60, (c) => {
    softShadow(c, 45, 52, 40, 8);
    for (const [x, y, r] of [[26, 36, 18], [64, 36, 18], [45, 26, 22]]) { circle(c, x, y, r); style(c, { fill: P.grassDark, lw: 3.5 }); }
    for (const [x, y, r] of [[26, 36, 15], [64, 36, 15], [45, 26, 19]]) { circle(c, x, y, r); c.fillStyle = P.grassDark; c.fill(); }
    c.fillStyle = 'rgba(255,255,255,0.25)'; for (const [x, y] of [[38, 18], [58, 30], [20, 30]]) { ellipse(c, x, y, 6, 4, -0.5); c.fill(); }
    c.fillStyle = P.pink; for (const [x, y] of [[30, 30], [52, 22], [66, 40]]) { circle(c, x, y, 3); c.fill(); }
  });
  makeTexture(scene, 'flowers', 50, 34, (c) => {
    const cols = [P.pink, P.yellow, '#fff', P.orange];
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 9, y = 14 + (i % 2) * 10;
      c.strokeStyle = P.grassDark; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 10); c.stroke();
      circle(c, x, y, 4); style(c, { fill: cols[i % 4], lw: 2 });
      circle(c, x, y, 1.5); c.fillStyle = P.gold; c.fill();
    }
  });
  makeTexture(scene, 'rock', 70, 46, (c) => {
    softShadow(c, 35, 40, 30, 6);
    c.beginPath(); c.moveTo(6, 38); c.quadraticCurveTo(8, 12, 28, 8); c.quadraticCurveTo(52, 4, 62, 24); c.quadraticCurveTo(66, 36, 60, 40); c.closePath();
    style(c, { fill: P.stone });
    c.fillStyle = 'rgba(255,255,255,0.35)'; ellipse(c, 26, 16, 9, 4, -0.3); c.fill();
  });
}

function bungalow(scene, key, roof) {
  makeTexture(scene, key, 200, 190, (c) => {
    softShadow(c, 100, 178, 92, 12);
    rrect(c, 22, 82, 156, 94, 6); style(c, { fill: '#fbeed3' });
    c.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 92; y < 176; y += 14) c.fillRect(24, y, 152, 2);
    // dak
    c.beginPath(); c.moveTo(8, 90); c.lineTo(100, 18); c.lineTo(192, 90); c.closePath(); style(c, { fill: roof, lw: 4.5 });
    c.strokeStyle = shade(roof, -0.2); c.lineWidth = 3;
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(100 - i * 18.4, 18 + i * 14.4); c.lineTo(100 + i * 18.4, 18 + i * 14.4); c.stroke(); }
    c.beginPath(); c.moveTo(8, 90); c.lineTo(100, 18); c.lineTo(192, 90); c.closePath(); style(c, { lw: 4.5 });
    // deur + ramen
    rrect(c, 86, 120, 30, 56, 4); style(c, { fill: P.wood });
    circle(c, 109, 150, 2.5); c.fillStyle = P.gold; c.fill();
    for (const x of [38, 140]) {
      rrect(c, x, 108, 30, 30, 4); style(c, { fill: P.waterLight });
      c.strokeStyle = P.line; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 15, 108); c.lineTo(x + 15, 138); c.moveTo(x, 123); c.lineTo(x + 30, 123); c.stroke();
      rrect(c, x - 4, 138, 38, 8, 3); style(c, { fill: P.woodLight, lw: 3 });
      c.fillStyle = P.pink; for (let i = 0; i < 4; i++) { circle(c, x + 2 + i * 9, 136, 3); c.fill(); }
    }
    // schoorsteen
    rrect(c, 140, 32, 16, 30, 2); style(c, { fill: P.red });
  });
}

function bigBuildings(scene) {
  // Receptie / centrum
  makeTexture(scene, 'reception', 340, 250, (c) => {
    softShadow(c, 170, 238, 160, 14);
    rrect(c, 20, 96, 300, 140, 10); style(c, { fill: '#fdf3df' });
    // groot glazen front
    rrect(c, 40, 130, 260, 80, 6); style(c, { fill: P.waterLight });
    c.strokeStyle = P.line; c.lineWidth = 3; for (let x = 92; x < 300; x += 52) { c.beginPath(); c.moveTo(x, 130); c.lineTo(x, 210); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.45)'; for (let x = 48; x < 300; x += 52) poly(c, [[x, 136], [x + 16, 136], [x + 4, 204], [x - 2, 204]]), c.fill();
    rrect(c, 140, 160, 60, 76, 4); style(c, { fill: P.wood });
    // dak
    c.beginPath(); c.moveTo(4, 104); c.quadraticCurveTo(170, 10, 336, 104); c.closePath(); style(c, { fill: '#5ab0d6', lw: 5 });
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(40, 90); c.quadraticCurveTo(170, 30, 300, 90); c.stroke();
    // luifel
    for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(30 + i * 28, 112); c.lineTo(58 + i * 28, 112); c.lineTo(58 + i * 28, 124); c.quadraticCurveTo(44 + i * 28, 132, 30 + i * 28, 124); c.closePath(); style(c, { fill: i % 2 ? '#fff' : P.red, lw: 3 }); }
  });
  // Subtropisch zwembad (koepel)
  makeTexture(scene, 'dome', 400, 290, (c) => {
    softShadow(c, 200, 276, 190, 16);
    rrect(c, 20, 200, 360, 70, 8); style(c, { fill: '#fdf3df' });
    c.beginPath(); c.moveTo(30, 206); c.bezierCurveTo(40, 20, 360, 20, 370, 206); c.closePath();
    const g = c.createLinearGradient(0, 40, 0, 206); g.addColorStop(0, '#bff0ff'); g.addColorStop(1, '#5cc8ef');
    style(c, { fill: g, lw: 5 });
    c.save(); c.beginPath(); c.moveTo(30, 206); c.bezierCurveTo(40, 20, 360, 20, 370, 206); c.closePath(); c.clip();
    c.strokeStyle = 'rgba(45,30,47,0.5)'; c.lineWidth = 3;
    for (let i = 1; i < 8; i++) { c.beginPath(); c.moveTo(30 + i * 42, 206); c.quadraticCurveTo(200, -40 + i * 2, 200, 40); c.stroke(); }
    for (let y = 70; y < 206; y += 34) { c.beginPath(); c.moveTo(0, y); c.lineTo(400, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.5)'; poly(c, [[90, 70], [130, 60], [80, 180], [60, 180]]); c.fill();
    // palmen binnen
    c.fillStyle = 'rgba(76,199,100,0.55)'; for (const x of [120, 250, 310]) { circle(c, x, 170, 26); c.fill(); }
    c.restore();
    // glijbaan
    c.strokeStyle = P.line; c.lineWidth = 18; c.beginPath(); c.moveTo(352, 120); c.bezierCurveTo(420, 140, 330, 200, 392, 250); c.stroke();
    c.strokeStyle = P.orange; c.lineWidth = 12; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 3; c.stroke();
    rrect(c, 160, 214, 80, 56, 4); style(c, { fill: P.waterLight });
    c.strokeStyle = P.line; c.lineWidth = 3; c.beginPath(); c.moveTo(200, 214); c.lineTo(200, 270); c.stroke();
    for (const x of [44, 96, 268, 320]) { rrect(c, x, 222, 36, 26, 4); style(c, { fill: P.waterLight, lw: 3 }); }
  });
  // Kraampje (per bedrijf ingekleurd)
}

export function makeStall(scene, key, color) {
  makeTexture(scene, key, 190, 170, (c) => {
    softShadow(c, 95, 160, 86, 10);
    rrect(c, 20, 90, 150, 66, 6); style(c, { fill: P.woodLight });
    c.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 100; y < 156; y += 12) c.fillRect(22, y, 146, 2);
    rrect(c, 12, 84, 166, 16, 4); style(c, { fill: P.wood });
    for (const x of [22, 160]) { rrect(c, x, 34, 8, 56, 3); style(c, { fill: P.wood, lw: 3 }); }
    // luifel
    for (let i = 0; i < 7; i++) {
      c.beginPath(); c.moveTo(10 + i * 24.3, 30); c.lineTo(34 + i * 24.3, 30); c.lineTo(34 + i * 24.3, 52);
      c.quadraticCurveTo(22 + i * 24.3, 62, 10 + i * 24.3, 52); c.closePath();
      style(c, { fill: i % 2 ? '#fff' : color, lw: 3.5 });
    }
    c.beginPath(); c.moveTo(4, 32); c.lineTo(40, 6); c.lineTo(150, 6); c.lineTo(186, 32); c.closePath(); style(c, { fill: color, lw: 4 });
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(44, 10, 100, 4);
  });
}

function beachStuff(scene) {
  const cols = [[P.red, '#fff'], [P.blue, P.yellow], [P.teal, '#fff'], [P.orange, P.pink]];
  cols.forEach(([a, b], idx) => {
    makeTexture(scene, `umbrella${idx}`, 130, 140, (c) => {
      softShadow(c, 65, 130, 40, 8);
      c.strokeStyle = P.line; c.lineWidth = 6; c.beginPath(); c.moveTo(65, 50); c.lineTo(65, 130); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      for (let i = 0; i < 6; i++) {
        const a0 = Math.PI + (i * Math.PI) / 6, a1 = Math.PI + ((i + 1) * Math.PI) / 6;
        c.beginPath(); c.moveTo(65, 56); c.arc(65, 56, 58, a0, a1); c.closePath();
        style(c, { fill: i % 2 ? b : a, lw: 3 });
      }
      c.beginPath(); c.arc(65, 56, 58, Math.PI, 0); style(c, { lw: 4 });
      circle(c, 65, 0 + 0, 0);
    });
  });
  makeTexture(scene, 'towel', 70, 110, (c) => {
    rrect(c, 6, 6, 58, 98, 6); style(c, { fill: P.pink });
    c.fillStyle = '#fff'; for (let y = 16; y < 100; y += 18) c.fillRect(8, y, 54, 7);
    rrect(c, 6, 6, 58, 98, 6); style(c, {});
  });
  makeTexture(scene, 'lifeguard', 110, 190, (c) => {
    softShadow(c, 55, 182, 46, 8);
    c.strokeStyle = P.line; c.lineWidth = 8;
    c.beginPath(); c.moveTo(22, 182); c.lineTo(34, 90); c.moveTo(88, 182); c.lineTo(76, 90); c.moveTo(28, 140); c.lineTo(82, 140); c.stroke();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.stroke();
    rrect(c, 18, 52, 74, 44, 6); style(c, { fill: P.red });
    c.fillStyle = '#fff'; c.fillRect(20, 66, 70, 8);
    poly(c, [[10, 56], [55, 22], [100, 56]]); style(c, { fill: P.yellow });
    c.strokeStyle = P.line; c.lineWidth = 3; c.beginPath(); c.moveTo(55, 22); c.lineTo(55, 4); c.stroke();
    poly(c, [[55, 4], [76, 10], [55, 16]]); style(c, { fill: P.red, lw: 2 });
  });
  makeTexture(scene, 'beachball', 34, 34, (c) => {
    circle(c, 17, 17, 14); style(c, { fill: '#fff', lw: 3 });
    c.save(); circle(c, 17, 17, 13); c.clip();
    c.fillStyle = P.red; c.beginPath(); c.moveTo(17, 17); c.arc(17, 17, 14, 0, 1.2); c.fill();
    c.fillStyle = P.blue; c.beginPath(); c.moveTo(17, 17); c.arc(17, 17, 14, 2.1, 3.3); c.fill();
    c.fillStyle = P.yellow; c.beginPath(); c.moveTo(17, 17); c.arc(17, 17, 14, 4.2, 5.4); c.fill();
    c.restore(); circle(c, 17, 17, 14); style(c, { lw: 3 });
  });
}

function boats(scene) {
  const smallCols = ['#fff', P.yellow, P.teal];
  smallCols.forEach((col, i) => {
    makeTexture(scene, `boat${i}`, 150, 120, (c) => {
      c.beginPath(); c.moveTo(10, 78); c.lineTo(140, 78); c.quadraticCurveTo(130, 108, 100, 108); c.lineTo(36, 108); c.quadraticCurveTo(16, 104, 10, 78); c.closePath();
      style(c, { fill: col });
      c.fillStyle = P.blue; c.fillRect(14, 86, 122, 5);
      c.strokeStyle = P.line; c.lineWidth = 4; c.beginPath(); c.moveTo(70, 78); c.lineTo(70, 8); c.stroke();
      poly(c, [[74, 10], [126, 72], [74, 72]]); style(c, { fill: '#fff' });
      poly(c, [[66, 18], [26, 72], [66, 72]]); style(c, { fill: i === 1 ? P.red : '#eef7ff' });
    });
  });
  makeTexture(scene, 'yacht', 240, 120, (c) => {
    c.beginPath(); c.moveTo(6, 64); c.lineTo(234, 60); c.quadraticCurveTo(214, 110, 170, 110); c.lineTo(40, 110); c.quadraticCurveTo(14, 100, 6, 64); c.closePath();
    style(c, { fill: '#fff' });
    c.fillStyle = P.blue; c.fillRect(14, 74, 210, 6);
    rrect(c, 54, 30, 120, 36, 10); style(c, { fill: '#fff' });
    rrect(c, 66, 38, 96, 16, 6); style(c, { fill: P.waterDeep, lw: 3 });
    rrect(c, 88, 12, 50, 22, 8); style(c, { fill: '#fff' });
  });
  // Piratenschip (groot)
  makeTexture(scene, 'pirateship', 560, 440, (c) => {
    // romp
    c.beginPath();
    c.moveTo(20, 270); c.lineTo(540, 250); c.quadraticCurveTo(520, 360, 430, 380); c.lineTo(120, 380); c.quadraticCurveTo(50, 360, 20, 270); c.closePath();
    style(c, { fill: '#7a4524', lw: 5 });
    c.save(); c.clip();
    c.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 286; y < 380; y += 18) c.fillRect(0, y, 560, 4);
    c.fillStyle = P.gold; c.fillRect(0, 300, 560, 6);
    c.restore();
    for (const x of [140, 220, 300, 380]) { circle(c, x, 330, 13); style(c, { fill: P.line, lw: 3 }); circle(c, x, 330, 8); c.fillStyle = '#000'; c.fill(); }
    // achterkasteel
    rrect(c, 420, 190, 120, 72, 6); style(c, { fill: '#8a5226' });
    for (const x of [436, 476, 512]) { rrect(c, x, 206, 20, 22, 3); style(c, { fill: P.yellow, lw: 3 }); }
    rrect(c, 410, 182, 140, 14, 4); style(c, { fill: P.woodDark });
    // reling
    c.strokeStyle = P.line; c.lineWidth = 4; c.beginPath(); c.moveTo(30, 268); c.lineTo(420, 254); c.stroke();
    // masten
    for (const [x, h] of [[170, 30], [320, 10]]) {
      c.strokeStyle = P.line; c.lineWidth = 12; c.beginPath(); c.moveTo(x, 264); c.lineTo(x, h); c.stroke();
      c.strokeStyle = P.woodDark; c.lineWidth = 7; c.stroke();
      // zeilen
      for (const [y0, w] of [[h + 30, 90], [h + 120, 110]]) {
        c.beginPath(); c.moveTo(x - w, y0); c.quadraticCurveTo(x, y0 - 14, x + w, y0); c.quadraticCurveTo(x + w + 12, y0 + 50, x + w - 6, y0 + 80);
        c.quadraticCurveTo(x, y0 + 96, x - w + 6, y0 + 80); c.quadraticCurveTo(x - w - 12, y0 + 50, x - w, y0); c.closePath();
        style(c, { fill: '#efe6d2', lw: 4 });
        c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(x - w + 10, y0 + 40, w * 2 - 20, 6);
      }
    }
    // doodshoofd op grootzeil
    circle(c, 170, 180, 22); style(c, { fill: P.line, lw: 2 });
    circle(c, 170, 176, 12); c.fillStyle = '#fff'; c.fill();
    c.fillStyle = P.line; circle(c, 165, 175, 3.5); c.fill(); circle(c, 175, 175, 3.5); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(156, 186); c.lineTo(184, 198); c.moveTo(184, 186); c.lineTo(156, 198); c.stroke();
    // vlag
    c.strokeStyle = P.line; c.lineWidth = 3; c.beginPath(); c.moveTo(320, 10); c.lineTo(320, 0); c.stroke();
    poly(c, [[322, 2], [370, 10], [360, 20], [372, 30], [322, 30]]); style(c, { fill: P.line, lw: 3 });
    // boegspriet
    c.strokeStyle = P.line; c.lineWidth = 8; c.beginPath(); c.moveTo(40, 262); c.lineTo(-10, 220); c.stroke();
    c.strokeStyle = P.woodDark; c.lineWidth = 4; c.stroke();
  });
  makeTexture(scene, 'sloop', 280, 210, (c) => {
    c.beginPath(); c.moveTo(12, 140); c.lineTo(268, 132); c.quadraticCurveTo(254, 196, 200, 200); c.lineTo(70, 200); c.quadraticCurveTo(24, 192, 12, 140); c.closePath();
    style(c, { fill: '#7a4524', lw: 5 });
    c.fillStyle = P.gold; c.fillRect(20, 156, 240, 5);
    c.strokeStyle = P.line; c.lineWidth = 9; c.beginPath(); c.moveTo(140, 136); c.lineTo(140, 8); c.stroke();
    c.strokeStyle = P.woodDark; c.lineWidth = 5; c.stroke();
    c.beginPath(); c.moveTo(70, 26); c.quadraticCurveTo(140, 14, 210, 26); c.quadraticCurveTo(220, 70, 206, 112); c.quadraticCurveTo(140, 124, 74, 112); c.quadraticCurveTo(60, 70, 70, 26); c.closePath();
    style(c, { fill: '#efe6d2', lw: 4 });
    // gelapt
    rrect(c, 160, 50, 26, 22, 3); style(c, { fill: P.pirateRed, lw: 2 });
    rrect(c, 90, 80, 22, 18, 3); style(c, { fill: P.blue, lw: 2 });
  });
}

function pirateProps(scene) {
  makeTexture(scene, 'barrel', 50, 60, (c) => {
    softShadow(c, 25, 54, 20, 5);
    c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(2, 32, 8, 54); c.lineTo(42, 54); c.quadraticCurveTo(48, 32, 42, 10); c.closePath(); style(c, { fill: P.wood });
    c.strokeStyle = P.line; c.lineWidth = 3; for (const y of [18, 46]) { c.beginPath(); c.moveTo(5, y); c.lineTo(45, y); c.stroke(); }
    ellipse(c, 25, 10, 17, 5); style(c, { fill: P.woodLight, lw: 3 });
  });
  makeTexture(scene, 'crate', 56, 60, (c) => {
    softShadow(c, 28, 54, 24, 5);
    rrect(c, 4, 6, 48, 48, 4); style(c, { fill: P.woodLight });
    c.strokeStyle = P.woodDark; c.lineWidth = 4; c.beginPath(); c.moveTo(8, 10); c.lineTo(48, 50); c.moveTo(48, 10); c.lineTo(8, 50); c.stroke();
    rrect(c, 4, 6, 48, 48, 4); style(c, {});
  });
  makeTexture(scene, 'chest', 74, 62, (c) => {
    softShadow(c, 37, 56, 32, 5);
    rrect(c, 6, 26, 62, 30, 4); style(c, { fill: P.wood });
    c.beginPath(); c.moveTo(6, 30); c.quadraticCurveTo(37, 0, 68, 30); c.closePath(); style(c, { fill: P.woodLight });
    c.fillStyle = P.gold; c.fillRect(30, 18, 14, 38); c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(30, 18, 14, 38);
    rrect(c, 32, 30, 10, 10, 2); style(c, { fill: P.line, lw: 0 });
  });
  makeTexture(scene, 'cannon', 100, 70, (c) => {
    softShadow(c, 50, 62, 40, 6);
    c.save(); c.translate(50, 34); c.rotate(-0.18);
    rrect(c, -40, -12, 80, 24, 10); style(c, { fill: '#4a4458' });
    ellipse(c, 40, 0, 5, 12); style(c, { fill: P.line, lw: 2 });
    c.restore();
    for (const x of [30, 64]) { circle(c, x, 50, 12); style(c, { fill: P.wood }); circle(c, x, 50, 4); c.fillStyle = P.line; c.fill(); }
  });
  makeTexture(scene, 'tent', 150, 130, (c) => {
    softShadow(c, 75, 122, 68, 9);
    poly(c, [[75, 8], [140, 120], [10, 120]]); style(c, { fill: '#efe6d2' });
    c.save(); poly(c, [[75, 8], [140, 120], [10, 120]]); c.clip();
    c.fillStyle = P.pirateRed; for (let x = -40; x < 160; x += 30) poly(c, [[75, 8], [x, 130], [x + 15, 130]]), c.fill();
    c.restore();
    poly(c, [[75, 8], [140, 120], [10, 120]]); style(c, { lw: 4 });
    poly(c, [[75, 60], [98, 120], [52, 120]]); style(c, { fill: P.line, lw: 3 });
    c.strokeStyle = P.line; c.lineWidth = 3; c.beginPath(); c.moveTo(75, 8); c.lineTo(75, -2); c.stroke();
  });
  makeTexture(scene, 'cage', 140, 170, (c) => {
    softShadow(c, 70, 162, 60, 8);
    rrect(c, 10, 140, 120, 20, 5); style(c, { fill: '#4a4458' });
    c.beginPath(); c.moveTo(14, 140); c.lineTo(14, 50); c.quadraticCurveTo(70, -6, 126, 50); c.lineTo(126, 140); style(c, { lw: 5 });
    c.strokeStyle = '#6a6478'; c.lineWidth = 5;
    for (let x = 30; x <= 110; x += 16) { c.beginPath(); c.moveTo(x, 140); c.lineTo(x, 50 - Math.sin(((x - 14) / 112) * Math.PI) * 28); c.stroke(); }
    c.strokeStyle = P.line; c.lineWidth = 2;
    for (let x = 30; x <= 110; x += 16) { c.beginPath(); c.moveTo(x + 2.5, 140); c.lineTo(x + 2.5, 50 - Math.sin(((x - 14) / 112) * Math.PI) * 28); c.stroke(); }
    c.strokeStyle = '#4a4458'; c.lineWidth = 8; c.beginPath(); c.moveTo(14, 90); c.lineTo(126, 90); c.stroke();
    circle(c, 70, 8, 8); style(c, { lw: 4 });
    rrect(c, 58, 82, 24, 22, 4); style(c, { fill: P.gold, lw: 3 });
  });
}

function campusStuff(scene) {
  makeTexture(scene, 'flagpole', 30, 170, (c) => {
    softShadow(c, 15, 164, 12, 4);
    c.strokeStyle = P.line; c.lineWidth = 8; c.beginPath(); c.moveTo(15, 166); c.lineTo(15, 10); c.stroke();
    c.strokeStyle = '#d8d8e2'; c.lineWidth = 4; c.stroke();
    circle(c, 15, 8, 6); style(c, { fill: P.gold, lw: 3 });
  });
  makeTexture(scene, 'flagcloth', 90, 60, (c) => {
    c.beginPath(); c.moveTo(4, 4); c.quadraticCurveTo(46, -4, 86, 6); c.quadraticCurveTo(80, 30, 86, 54); c.quadraticCurveTo(46, 46, 4, 54); c.closePath();
    style(c, { fill: '#ffffff', lw: 4 });
  });
  makeTexture(scene, 'sign', 110, 100, (c) => {
    softShadow(c, 55, 94, 24, 5);
    rrect(c, 49, 40, 12, 56, 3); style(c, { fill: P.wood, lw: 3 });
    rrect(c, 6, 8, 98, 46, 8); style(c, { fill: P.woodLight });
    rrect(c, 12, 14, 86, 34, 5); style(c, { fill: P.paper, lw: 2 });
  });
  makeTexture(scene, 'lamp', 34, 110, (c) => {
    softShadow(c, 17, 104, 10, 3);
    c.strokeStyle = P.line; c.lineWidth = 7; c.beginPath(); c.moveTo(17, 106); c.lineTo(17, 26); c.stroke();
    c.strokeStyle = '#4a4458'; c.lineWidth = 3; c.stroke();
    rrect(c, 5, 6, 24, 24, 6); style(c, { fill: P.yellow });
    rrect(c, 2, 2, 30, 8, 3); style(c, { fill: '#4a4458', lw: 3 });
  });
  makeTexture(scene, 'plank', 120, 40, (c) => {
    rrect(c, 4, 6, 112, 28, 4); style(c, { fill: P.woodLight });
    c.strokeStyle = P.woodDark; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 20); c.lineTo(110, 20); c.stroke();
    for (const x of [14, 106]) { circle(c, x, 13, 2); c.fillStyle = P.line; c.fill(); circle(c, x, 27, 2); c.fill(); }
  });
  makeTexture(scene, 'pillar', 60, 120, (c) => {
    rrect(c, 8, 10, 44, 104, 6); style(c, { fill: P.stone });
    c.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 26; y < 110; y += 20) c.fillRect(10, y, 40, 3);
    rrect(c, 2, 4, 56, 14, 4); style(c, { fill: P.stoneDark });
  });
}

function critters(scene) {
  // papegaai: 2 frames (vleugels op/neer)
  const tex = makeTexture(scene, 'parrot', 140, 70, (c) => {
    for (let f = 0; f < 2; f++) {
      const o = f * 70;
      c.save(); c.translate(o, 0);
      ellipse(c, 35, 40, 16, 20); style(c, { fill: P.red });
      // vleugel
      c.save(); c.translate(30, 36); c.rotate(f ? -0.9 : 0.4);
      ellipse(c, -10, 0, 16, 8); style(c, { fill: P.blue, lw: 3 });
      c.restore();
      c.save(); c.translate(42, 36); c.rotate(f ? 0.9 : -0.4);
      ellipse(c, 10, 0, 16, 8); style(c, { fill: P.blue, lw: 3 });
      c.restore();
      circle(c, 35, 22, 12); style(c, { fill: P.red });
      poly(c, [[40, 20], [52, 26], [42, 32]]); style(c, { fill: P.yellow, lw: 3 });
      circle(c, 34, 19, 4); c.fillStyle = '#fff'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2; c.stroke();
      circle(c, 35, 19, 2); c.fillStyle = P.line; c.fill();
      poly(c, [[30, 58], [35, 68], [40, 58]]); style(c, { fill: P.green, lw: 3 });
      // mini-bandana
      c.beginPath(); c.arc(35, 18, 12, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); style(c, { fill: P.line, lw: 2 });
      c.restore();
    }
  });
  tex.add('f0', 0, 0, 0, 70, 70); tex.add('f1', 0, 70, 0, 70, 70);
  const gull = makeTexture(scene, 'gull', 100, 40, (c) => {
    for (let f = 0; f < 2; f++) {
      c.save(); c.translate(f * 50, 0);
      c.strokeStyle = P.line; c.lineWidth = 3;
      c.beginPath();
      if (f === 0) { c.moveTo(5, 16); c.quadraticCurveTo(15, 4, 25, 18); c.quadraticCurveTo(35, 4, 45, 16); }
      else { c.moveTo(5, 24); c.quadraticCurveTo(15, 26, 25, 18); c.quadraticCurveTo(35, 26, 45, 24); }
      c.stroke();
      ellipse(c, 25, 19, 6, 4); style(c, { fill: '#fff', lw: 2 });
      c.restore();
    }
  });
  gull.add('f0', 0, 0, 0, 50, 40); gull.add('f1', 0, 50, 0, 50, 40);
}

function collectibles(scene) {
  makeTexture(scene, 'badge', 76, 76, (c) => {
    // lint
    poly(c, [[24, 50], [16, 74], [28, 68], [34, 76], [38, 54]]); style(c, { fill: P.red, lw: 3 });
    poly(c, [[52, 50], [60, 74], [48, 68], [42, 76], [38, 54]]); style(c, { fill: P.blue, lw: 3 });
    star(c, 38, 36, 32, 26, 12); style(c, { fill: '#ffffff', lw: 4 });
    circle(c, 38, 36, 22); style(c, { fill: '#ffffff', lw: 3 });
    c.fillStyle = 'rgba(255,255,255,0.6)'; ellipse(c, 30, 26, 6, 3, -0.6); c.fill();
  });
  makeTexture(scene, 'fragment', 90, 90, (c) => {
    c.save(); c.translate(45, 45); c.rotate(-0.12);
    poly(c, [[-34, -30], [-6, -36], [10, -28], [34, -34], [30, -6], [36, 20], [28, 34], [0, 30], [-20, 36], [-36, 26], [-30, 0]]);
    const g = c.createLinearGradient(-30, -30, 30, 30); g.addColorStop(0, '#fff3cf'); g.addColorStop(1, '#f0cf86');
    style(c, { fill: g, lw: 4 });
    c.setLineDash([5, 5]); c.strokeStyle = P.red; c.lineWidth = 3; c.beginPath(); c.moveTo(-24, 20); c.quadraticCurveTo(-10, -20, 14, -4); c.stroke(); c.setLineDash([]);
    c.strokeStyle = P.red; c.lineWidth = 5; c.beginPath(); c.moveTo(10, -12); c.lineTo(22, 0); c.moveTo(22, -12); c.lineTo(10, 0); c.stroke();
    c.restore();
  });
}

function particlesAndUi(scene) {
  makeTexture(scene, 'px_dot', 16, 16, (c) => { circle(c, 8, 8, 7); c.fillStyle = '#fff'; c.fill(); });
  makeTexture(scene, 'px_star', 28, 28, (c) => { star(c, 14, 15, 13, 6); c.fillStyle = '#fff'; c.fill(); });
  makeTexture(scene, 'px_confetti', 14, 8, (c) => { c.fillStyle = '#fff'; c.fillRect(0, 0, 14, 8); });
  makeTexture(scene, 'px_drop', 14, 18, (c) => { c.beginPath(); c.moveTo(7, 0); c.quadraticCurveTo(14, 10, 12, 13); c.arc(7, 12, 5.5, 0, Math.PI); c.quadraticCurveTo(0, 10, 7, 0); c.fillStyle = '#fff'; c.fill(); });
  makeTexture(scene, 'px_coin', 26, 26, (c) => { circle(c, 13, 13, 10); style(c, { fill: P.gold, lw: 3 }); c.fillStyle = 'rgba(255,255,255,0.7)'; ellipse(c, 10, 9, 3, 2, -0.5); c.fill(); });
  makeTexture(scene, 'px_ring', 64, 64, (c) => { circle(c, 32, 32, 28); c.strokeStyle = '#fff'; c.lineWidth = 5; c.stroke(); });
  makeTexture(scene, 'px_smoke', 48, 48, (c) => {
    const g = c.createRadialGradient(24, 24, 2, 24, 24, 24); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 48, 48);
  });
  makeTexture(scene, 'glow', 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  makeTexture(scene, 'rays', 512, 512, (c) => {
    c.translate(256, 256);
    for (let i = 0; i < 16; i++) {
      c.rotate(Math.PI / 8);
      const g = c.createLinearGradient(0, 0, 0, -256); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -256); c.lineTo(30, -256); c.closePath(); c.fill();
    }
  });
  makeTexture(scene, 'shadow', 64, 24, (c) => { ellipse(c, 32, 12, 30, 10); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill(); });
  // UI: nine-slice panelen
  makeTexture(scene, 'ui_panel', 96, 96, (c) => {
    rrect(c, 4, 8, 88, 84, 22); c.fillStyle = 'rgba(30,20,40,0.3)'; c.fill();
    rrect(c, 3, 3, 88, 84, 22); style(c, { fill: P.cream, lw: 5 });
  });
  makeTexture(scene, 'ui_btn', 64, 64, (c) => {
    rrect(c, 3, 3, 58, 56, 16); style(c, { fill: '#c9c9c9', lw: 4 });
    rrect(c, 3, 3, 58, 48, 16); style(c, { fill: '#ffffff', lw: 4 });
    c.fillStyle = 'rgba(255,255,255,0.7)'; rrect(c, 12, 9, 40, 6, 3); c.fill();
  });
  makeTexture(scene, 'ui_card', 64, 64, (c) => {
    rrect(c, 4, 6, 56, 56, 12); c.fillStyle = 'rgba(30,20,40,0.25)'; c.fill();
    rrect(c, 3, 3, 56, 54, 12); style(c, { fill: '#ffffff', lw: 3.5 });
  });
  makeTexture(scene, 'ui_bar', 32, 32, (c) => { rrect(c, 2, 2, 28, 28, 12); style(c, { fill: '#ffffff', lw: 3 }); });
  makeTexture(scene, 'ui_fill', 32, 32, (c) => { rrect(c, 0, 0, 32, 32, 11); c.fillStyle = '#fff'; c.fill(); c.fillStyle = 'rgba(255,255,255,0.0)'; });
  makeTexture(scene, 'ui_round', 96, 96, (c) => {
    circle(c, 48, 52, 42); c.fillStyle = 'rgba(30,20,40,0.3)'; c.fill();
    circle(c, 48, 47, 42); style(c, { fill: '#ffffff', lw: 5 });
    c.fillStyle = 'rgba(255,255,255,0.6)'; ellipse(c, 34, 28, 12, 6, -0.6); c.fill();
  });
}

function water(scene) {
  const r = rng(7);
  makeTexture(scene, 'water', 256, 256, (c) => {
    c.fillStyle = P.water; c.fillRect(0, 0, 256, 256);
    // zachte vlekken
    for (let i = 0; i < 14; i++) {
      const x = r() * 256, y = r() * 256, rad = 20 + r() * 40;
      for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
        const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
        g.addColorStop(0, 'rgba(26,127,184,0.25)'); g.addColorStop(1, 'rgba(26,127,184,0)');
        c.fillStyle = g; c.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      }
    }
  });
  makeTexture(scene, 'waves', 256, 256, (c) => {
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3; c.lineCap = 'round';
    const rr = rng(11);
    for (let i = 0; i < 22; i++) {
      const x = rr() * 256, y = rr() * 256, w = 12 + rr() * 18;
      for (const [dx, dy] of [[0, 0], [256, 0], [-256, 0], [0, 256], [0, -256]]) {
        c.beginPath(); c.moveTo(x + dx - w, y + dy); c.quadraticCurveTo(x + dx - w / 2, y + dy - 5, x + dx, y + dy); c.quadraticCurveTo(x + dx + w / 2, y + dy - 5, x + dx + w, y + dy); c.stroke();
      }
    }
  });
}

export function makeProps(scene) {
  palm(scene);
  bush(scene);
  bungalow(scene, 'bungalow0', P.red);
  bungalow(scene, 'bungalow1', '#4a9fd0');
  bungalow(scene, 'bungalow2', '#58b45a');
  bungalow(scene, 'bungalow3', P.orange);
  bigBuildings(scene);
  beachStuff(scene);
  boats(scene);
  pirateProps(scene);
  campusStuff(scene);
  critters(scene);
  collectibles(scene);
  particlesAndUi(scene);
  water(scene);
  makeACProps(scene); // AC-stijl: overschrijft palmen, struiken en bungalows met meer detail
  makeACBoats(scene); // AC-stijl: zeilbootjes, jacht en piratensloep
  makeACProps2(scene); // AC-stijl: gebouwen, strandspullen, piratenkamp, lantaarns en bordjes
}
