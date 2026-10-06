// Icon-atlas (64×64 per icoon), cartoon-stijl met contour.
import { P } from '../palette.js';
import { style, rrect, circle, ellipse, poly, star, makeTexture } from '../draw.js';

const S = 64;
const ICONS = {
  lifebuoy(c) {
    circle(c, 32, 32, 24); style(c, { fill: P.red });
    c.save(); c.beginPath(); c.arc(32, 32, 24, 0, Math.PI * 2); c.clip();
    c.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { c.save(); c.translate(32, 32); c.rotate(i * Math.PI / 2 + Math.PI / 4); c.fillRect(-7, -26, 14, 26); c.restore(); }
    c.restore();
    circle(c, 32, 32, 24); style(c, {});
    circle(c, 32, 32, 11); style(c, { fill: P.waterLight });
  },
  chefhat(c) {
    circle(c, 20, 26, 11); style(c, { fill: '#fff' }); circle(c, 44, 26, 11); style(c, { fill: '#fff' });
    circle(c, 32, 20, 14); style(c, { fill: '#fff' });
    rrect(c, 18, 28, 28, 22, 4); style(c, { fill: '#fff' });
    c.fillStyle = '#fff'; c.fillRect(20, 24, 24, 8);
    c.strokeStyle = '#ddd'; c.lineWidth = 2; c.beginPath(); c.moveTo(18, 42); c.lineTo(46, 42); c.stroke();
  },
  wrench(c) {
    c.save(); c.translate(32, 32); c.rotate(-Math.PI / 4);
    rrect(c, -6, -8, 12, 36, 5); style(c, { fill: '#b8c0cc' });
    circle(c, 0, -16, 13); style(c, { fill: '#b8c0cc' });
    rrect(c, -5, -32, 10, 16, 2); c.fillStyle = '#000'; c.globalCompositeOperation = 'destination-out'; c.fill(); c.globalCompositeOperation = 'source-over';
    c.restore();
  },
  coffee(c) {
    rrect(c, 14, 22, 30, 30, 8); style(c, { fill: '#fff' });
    c.beginPath(); c.arc(46, 36, 7, -Math.PI / 2, Math.PI / 2); style(c, { lw: 5 });
    rrect(c, 18, 26, 22, 6, 3); c.fillStyle = '#8a5226'; c.fill();
    c.strokeStyle = P.inkSoft; c.lineWidth = 3;
    for (const x of [22, 30, 38]) { c.beginPath(); c.moveTo(x, 16); c.quadraticCurveTo(x + 4, 12, x, 8); c.stroke(); }
  },
  music(c) {
    c.lineWidth = 5; c.strokeStyle = P.ink;
    poly(c, [[24, 44], [24, 14], [48, 8], [48, 38]], false); style(c, { lw: 5 });
    ellipse(c, 19, 45, 8, 6, -0.4); style(c, { fill: P.purple });
    ellipse(c, 43, 39, 8, 6, -0.4); style(c, { fill: P.purple });
  },
  broom(c) {
    c.save(); c.translate(32, 32); c.rotate(0.5);
    rrect(c, -3, -30, 6, 34, 3); style(c, { fill: P.woodLight });
    poly(c, [[-12, 4], [12, 4], [16, 26], [-16, 26]]); style(c, { fill: P.gold });
    c.strokeStyle = P.sandDark; c.lineWidth = 2;
    for (let i = -10; i <= 10; i += 5) { c.beginPath(); c.moveTo(i, 8); c.lineTo(i * 1.3, 24); c.stroke(); }
    c.restore();
  },
  sun(c) {
    c.strokeStyle = P.ink; c.lineWidth = 4;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(32 + Math.cos(a) * 18, 32 + Math.sin(a) * 18); c.lineTo(32 + Math.cos(a) * 28, 32 + Math.sin(a) * 28); c.stroke(); }
    circle(c, 32, 32, 14); style(c, { fill: P.gold });
  },
  moon(c) {
    c.beginPath(); c.arc(32, 32, 22, Math.PI * 0.35, Math.PI * 1.65); c.quadraticCurveTo(18, 32, 32 + 22 * Math.cos(Math.PI * 0.35), 32 + 22 * Math.sin(Math.PI * 0.35));
    style(c, { fill: '#c9b8ff' });
    star(c, 46, 18, 6, 2.5); style(c, { fill: P.yellow, lw: 2 });
  },
  weekend(c) {
    rrect(c, 10, 14, 44, 40, 6); style(c, { fill: '#fff' });
    rrect(c, 10, 14, 44, 12, 6); style(c, { fill: P.red });
    c.fillStyle = P.ink; c.font = 'bold 20px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('ZA', 32, 48);
    for (const x of [20, 44]) { rrect(c, x - 2, 8, 4, 10, 2); style(c, { fill: P.stone, lw: 2 }); }
  },
  bed(c) {
    rrect(c, 8, 30, 48, 16, 4); style(c, { fill: P.blue });
    rrect(c, 10, 22, 16, 10, 5); style(c, { fill: '#fff' });
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(8, 18); c.lineTo(8, 52); c.moveTo(56, 34); c.lineTo(56, 52); c.stroke();
    c.fillStyle = P.ink; c.font = 'bold 16px Fredoka, sans-serif'; c.fillText('z', 38, 22); c.font = 'bold 12px Fredoka, sans-serif'; c.fillText('z', 48, 14);
  },
  chat(c) {
    rrect(c, 6, 10, 36, 26, 10); style(c, { fill: '#fff' });
    poly(c, [[14, 34], [12, 44], [24, 35]]); style(c, { fill: '#fff' });
    rrect(c, 24, 26, 34, 24, 10); style(c, { fill: P.teal });
    poly(c, [[48, 48], [52, 58], [40, 49]]); style(c, { fill: P.teal });
    c.fillStyle = P.ink; for (const x of [16, 24, 32]) { circle(c, x, 23, 2.5); c.fill(); }
  },
  adjust(c) {
    rrect(c, 14, 10, 36, 46, 5); style(c, { fill: P.paper });
    rrect(c, 24, 6, 16, 9, 3); style(c, { fill: P.stone });
    c.strokeStyle = P.green; c.lineWidth = 5;
    c.beginPath(); c.moveTo(21, 30); c.lineTo(28, 37); c.lineTo(43, 22); c.stroke();
    c.strokeStyle = P.stoneDark; c.lineWidth = 3; c.beginPath(); c.moveTo(21, 46); c.lineTo(43, 46); c.stroke();
  },
  shoe(c) {
    c.beginPath(); c.moveTo(8, 44); c.lineTo(10, 24); c.lineTo(24, 22); c.quadraticCurveTo(30, 34, 44, 34); c.quadraticCurveTo(58, 36, 58, 46); c.lineTo(8, 46); c.closePath();
    style(c, { fill: P.orange });
    rrect(c, 6, 44, 54, 8, 4); style(c, { fill: '#fff' });
    c.strokeStyle = P.ink; c.lineWidth = 2; for (const x of [26, 32, 38]) { c.beginPath(); c.moveTo(x, 30); c.lineTo(x + 4, 26); c.stroke(); }
    c.strokeStyle = P.inkSoft; c.lineWidth = 3; c.beginPath(); c.moveTo(2, 28); c.lineTo(-4, 28); c.moveTo(4, 36); c.lineTo(-2, 36); c.stroke();
  },
  zzz(c) {
    c.fillStyle = P.blue; c.strokeStyle = P.ink; c.lineWidth = 4; c.font = 'bold 30px Fredoka, sans-serif';
    c.strokeText('Z', 8, 54); c.fillText('Z', 8, 54);
    c.font = 'bold 22px Fredoka, sans-serif'; c.strokeText('Z', 30, 36); c.fillText('Z', 30, 36);
    c.font = 'bold 16px Fredoka, sans-serif'; c.strokeText('z', 46, 20); c.fillText('z', 46, 20);
  },
  bolt(c) {
    poly(c, [[36, 4], [14, 36], [30, 36], [24, 60], [50, 24], [34, 24], [42, 4]]); style(c, { fill: P.yellow });
  },
  storm(c) {
    circle(c, 22, 30, 12); style(c, { fill: '#8a8fa8' }); circle(c, 38, 24, 15); style(c, { fill: '#8a8fa8' }); circle(c, 48, 34, 10); style(c, { fill: '#8a8fa8' });
    rrect(c, 12, 30, 44, 12, 6); c.fillStyle = '#8a8fa8'; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(12, 42); c.lineTo(56, 42); c.stroke();
    poly(c, [[32, 44], [24, 56], [32, 56], [28, 64], [40, 50], [32, 50], [36, 44]]); style(c, { fill: P.yellow, lw: 2 });
  },
  sadcloud(c) {
    circle(c, 22, 28, 12); style(c, { fill: '#b8c4dc' }); circle(c, 38, 22, 15); style(c, { fill: '#b8c4dc' }); circle(c, 48, 32, 10); style(c, { fill: '#b8c4dc' });
    rrect(c, 12, 28, 44, 12, 6); c.fillStyle = '#b8c4dc'; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(12, 40); c.lineTo(56, 40); c.stroke();
    c.fillStyle = P.blue; for (const [x, y] of [[22, 50], [34, 56], [46, 50]]) { ellipse(c, x, y, 3, 5); style(c, { fill: P.waterLight, lw: 2 }); }
  },
  star(c) { star(c, 32, 34, 26, 12); style(c, { fill: P.gold }); },
  starEmpty(c) { star(c, 32, 34, 26, 12); style(c, { fill: '#d8cdb8' }); },
  coin(c) {
    circle(c, 32, 32, 24); style(c, { fill: P.gold });
    circle(c, 32, 32, 16); style(c, { stroke: '#d49b1a', lw: 3 });
    c.fillStyle = '#d49b1a'; c.font = 'bold 22px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('€', 32, 40);
  },
  clock(c) {
    circle(c, 32, 32, 24); style(c, { fill: '#fff' });
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(32, 32); c.lineTo(32, 16); c.moveTo(32, 32); c.lineTo(42, 38); c.stroke();
  },
  check(c) {
    circle(c, 32, 32, 26); style(c, { fill: P.green });
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(19, 33); c.lineTo(28, 42); c.lineTo(45, 22); c.stroke();
  },
  cross(c) {
    circle(c, 32, 32, 26); style(c, { fill: P.red });
    c.strokeStyle = '#fff'; c.lineWidth = 7; c.beginPath(); c.moveTo(22, 22); c.lineTo(42, 42); c.moveTo(42, 22); c.lineTo(22, 42); c.stroke();
  },
  heart(c) {
    c.beginPath(); c.moveTo(32, 54); c.bezierCurveTo(4, 36, 8, 10, 32, 20); c.bezierCurveTo(56, 10, 60, 36, 32, 54); style(c, { fill: P.red });
    c.fillStyle = 'rgba(255,255,255,0.6)'; ellipse(c, 21, 24, 4, 3, -0.6); c.fill();
  },
  warning(c) {
    poly(c, [[32, 6], [58, 54], [6, 54]]); style(c, { fill: P.yellow });
    c.fillStyle = P.ink; rrect(c, 29, 22, 6, 18, 3); c.fill(); circle(c, 32, 47, 3.5); c.fill();
  },
  key(c) {
    circle(c, 20, 32, 13); style(c, { fill: P.gold }); circle(c, 20, 32, 5); style(c, { fill: P.cream, lw: 3 });
    rrect(c, 30, 28, 28, 8, 3); style(c, { fill: P.gold });
    rrect(c, 46, 34, 5, 10, 2); style(c, { fill: P.gold, lw: 3 }); rrect(c, 53, 34, 5, 7, 2); style(c, { fill: P.gold, lw: 3 });
  },
  map(c) {
    poly(c, [[8, 14], [24, 8], [40, 14], [56, 8], [56, 50], [40, 56], [24, 50], [8, 56]]); style(c, { fill: P.paper });
    c.strokeStyle = P.sandDark; c.lineWidth = 2; c.beginPath(); c.moveTo(24, 8); c.lineTo(24, 50); c.moveTo(40, 14); c.lineTo(40, 56); c.stroke();
    c.setLineDash([4, 4]); c.strokeStyle = P.red; c.lineWidth = 3; c.beginPath(); c.moveTo(14, 44); c.quadraticCurveTo(30, 20, 44, 28); c.stroke(); c.setLineDash([]);
    c.strokeStyle = P.red; c.lineWidth = 4; c.beginPath(); c.moveTo(42, 22); c.lineTo(50, 30); c.moveTo(50, 22); c.lineTo(42, 30); c.stroke();
  },
  skull(c) {
    circle(c, 32, 28, 20); style(c, { fill: '#fff' });
    rrect(c, 22, 38, 20, 14, 4); style(c, { fill: '#fff' });
    c.fillStyle = '#fff'; c.fillRect(24, 34, 16, 8);
    c.fillStyle = P.ink; circle(c, 24, 28, 6); c.fill(); circle(c, 40, 28, 6); c.fill();
    poly(c, [[32, 34], [29, 40], [35, 40]]); c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2; for (const x of [28, 32, 36]) { c.beginPath(); c.moveTo(x, 44); c.lineTo(x, 52); c.stroke(); }
  },
  megaphone(c) {
    poly(c, [[12, 26], [40, 12], [40, 52], [12, 38]]); style(c, { fill: P.red });
    rrect(c, 6, 24, 10, 16, 3); style(c, { fill: P.stone });
    rrect(c, 18, 38, 8, 14, 3); style(c, { fill: P.inkSoft });
    c.strokeStyle = P.ink; c.lineWidth = 3; for (const r of [8, 14]) { c.beginPath(); c.arc(42, 32, r, -0.6, 0.6); c.stroke(); }
  },
  euro(c) {
    circle(c, 32, 32, 26); style(c, { fill: P.green });
    c.fillStyle = '#fff'; c.font = 'bold 34px Fredoka, sans-serif'; c.textAlign = 'center'; c.fillText('€', 32, 44);
  },
  payslip(c) {
    rrect(c, 12, 6, 40, 52, 4); style(c, { fill: '#fff' });
    c.fillStyle = P.blue; c.fillRect(16, 10, 32, 8);
    c.strokeStyle = P.stone; c.lineWidth = 3; for (const y of [26, 34, 42]) { c.beginPath(); c.moveTo(18, y); c.lineTo(46, y); c.stroke(); }
    c.fillStyle = P.green; c.font = 'bold 12px Fredoka, sans-serif'; c.fillText('€€€', 26, 54);
  },
  gear(c) {
    c.save(); c.translate(32, 32);
    c.beginPath();
    for (let i = 0; i < 16; i++) { const r = i % 2 ? 18 : 25; const a = (i / 16) * Math.PI * 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); style(c, { fill: P.stone });
    circle(c, 0, 0, 7); style(c, { fill: P.cream, lw: 3 });
    c.restore();
  },
  database(c) {
    for (const y of [42, 30, 18]) {
      ellipse(c, 32, y + 8, 20, 7); style(c, { fill: P.blue });
      c.fillStyle = P.blue; c.fillRect(12, y, 40, 8);
      c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(12, y); c.lineTo(12, y + 8); c.moveTo(52, y); c.lineTo(52, y + 8); c.stroke();
      ellipse(c, 32, y, 20, 7); style(c, { fill: P.waterLight });
    }
  },
  people(c) {
    circle(c, 22, 22, 9); style(c, { fill: P.orange }); rrect(c, 10, 32, 24, 20, 10); style(c, { fill: P.orange });
    circle(c, 42, 22, 9); style(c, { fill: P.teal }); rrect(c, 30, 32, 24, 20, 10); style(c, { fill: P.teal });
  },
  notebook(c) {
    rrect(c, 12, 8, 42, 50, 5); style(c, { fill: P.gold });
    rrect(c, 18, 14, 30, 38, 3); style(c, { fill: P.paper, lw: 2 });
    c.strokeStyle = P.stoneDark; c.lineWidth = 2; for (const y of [22, 30, 38, 46]) { c.beginPath(); c.moveTo(22, y); c.lineTo(44, y); c.stroke(); }
    for (const y of [16, 28, 40, 52]) { circle(c, 12, y, 3); style(c, { fill: P.stone, lw: 2 }); }
  },
  magnifier(c) {
    c.save(); c.translate(32, 32); c.rotate(Math.PI / 4);
    rrect(c, -5, 12, 10, 22, 4); style(c, { fill: P.wood });
    c.restore();
    circle(c, 27, 27, 17); style(c, { fill: P.waterLight, lw: 5 });
    c.fillStyle = 'rgba(255,255,255,0.7)'; ellipse(c, 21, 21, 5, 3, -0.7); c.fill();
  },
  handshake(c) {
    rrect(c, 4, 26, 26, 14, 6); style(c, { fill: P.blue });
    rrect(c, 34, 26, 26, 14, 6); style(c, { fill: P.orange });
    ellipse(c, 32, 33, 12, 9); style(c, { fill: '#f2c29b' });
    c.strokeStyle = P.ink; c.lineWidth = 2; for (const x of [27, 32, 37]) { c.beginPath(); c.moveTo(x, 27); c.lineTo(x, 38); c.stroke(); }
  },
  bulb(c) {
    circle(c, 32, 26, 18); style(c, { fill: P.yellow });
    rrect(c, 24, 40, 16, 14, 3); style(c, { fill: P.stone });
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(24, 46); c.lineTo(40, 46); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.7)'; ellipse(c, 25, 20, 4, 6, -0.4); c.fill();
  },
  briefcase(c) {
    rrect(c, 22, 10, 20, 12, 4); style(c, { fill: 'rgba(0,0,0,0)', lw: 5 });
    rrect(c, 8, 18, 48, 34, 7); style(c, { fill: P.woodLight });
    c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(8, 32); c.lineTo(56, 32); c.stroke();
    rrect(c, 28, 28, 8, 8, 2); style(c, { fill: P.gold, lw: 2 });
  },
  gradcap(c) {
    rrect(c, 20, 28, 24, 16, 4); style(c, { fill: P.inkSoft });
    poly(c, [[32, 12], [60, 24], [32, 36], [4, 24]]); style(c, { fill: P.ink, stroke: P.ink });
    c.strokeStyle = P.gold; c.lineWidth = 3; c.beginPath(); c.moveTo(32, 24); c.lineTo(52, 30); c.lineTo(52, 44); c.stroke();
    circle(c, 52, 46, 4); style(c, { fill: P.gold, lw: 2 });
  },
  townhall(c) {
    poly(c, [[32, 6], [58, 22], [6, 22]]); style(c, { fill: P.red });
    rrect(c, 8, 22, 48, 6, 2); style(c, { fill: P.cream, lw: 3 });
    for (const x of [14, 26, 38, 50]) { rrect(c, x - 3, 28, 6, 20, 2); style(c, { fill: P.cream, lw: 3 }); }
    rrect(c, 6, 48, 52, 8, 2); style(c, { fill: P.cream, lw: 3 });
  },
  speaker(c) {
    poly(c, [[10, 24], [22, 24], [36, 10], [36, 54], [22, 40], [10, 40]]); style(c, { fill: P.cream });
    c.strokeStyle = P.ink; c.lineWidth = 4;
    c.beginPath(); c.arc(38, 32, 10, -0.9, 0.9); c.stroke();
    c.beginPath(); c.arc(38, 32, 20, -0.9, 0.9); c.stroke();
  },
  speakerOff(c) {
    poly(c, [[10, 24], [22, 24], [36, 10], [36, 54], [22, 40], [10, 40]]); style(c, { fill: P.cream });
    c.strokeStyle = P.red; c.lineWidth = 6;
    c.beginPath(); c.moveTo(42, 22); c.lineTo(58, 42); c.moveTo(58, 22); c.lineTo(42, 42); c.stroke();
  },
  pause(c) {
    rrect(c, 16, 12, 12, 40, 4); style(c, { fill: P.cream }); rrect(c, 36, 12, 12, 40, 4); style(c, { fill: P.cream });
  },
  home(c) {
    poly(c, [[32, 8], [58, 30], [50, 30], [50, 56], [14, 56], [14, 30], [6, 30]]); style(c, { fill: P.cream });
    rrect(c, 26, 38, 12, 18, 3); style(c, { fill: P.wood, lw: 3 });
  },
  trash(c) {
    rrect(c, 14, 18, 36, 40, 5); style(c, { fill: P.stone });
    rrect(c, 10, 10, 44, 9, 3); style(c, { fill: P.stoneDark });
    rrect(c, 26, 4, 12, 7, 2); style(c, { fill: P.stoneDark, lw: 3 });
    c.strokeStyle = P.ink; c.lineWidth = 3; for (const x of [24, 32, 40]) { c.beginPath(); c.moveTo(x, 26); c.lineTo(x, 50); c.stroke(); }
  },
  arrow(c) {
    poly(c, [[8, 22], [36, 22], [36, 8], [58, 32], [36, 56], [36, 42], [8, 42]]); style(c, { fill: P.cream });
  },
  exclaim(c) {
    circle(c, 32, 32, 26); style(c, { fill: P.gold });
    c.fillStyle = P.ink; rrect(c, 28, 14, 8, 24, 4); c.fill(); circle(c, 32, 47, 4.5); c.fill();
  },
  pipe(c) { rrect(c, 4, 24, 56, 16, 4); style(c, { fill: P.stone }); },
  ship(c) {
    c.beginPath(); c.moveTo(6, 36); c.lineTo(58, 36); c.lineTo(50, 52); c.lineTo(14, 52); c.closePath(); style(c, { fill: P.wood });
    c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(32, 36); c.lineTo(32, 6); c.stroke();
    poly(c, [[34, 8], [54, 30], [34, 30]]); style(c, { fill: P.cream, lw: 3 });
    poly(c, [[30, 10], [14, 30], [30, 30]]); style(c, { fill: P.cream, lw: 3 });
  },
  lock(c) {
    c.beginPath(); c.arc(32, 26, 12, Math.PI, 0); style(c, { lw: 6 });
    rrect(c, 14, 26, 36, 28, 6); style(c, { fill: P.gold });
    circle(c, 32, 38, 4); c.fillStyle = P.ink; c.fill(); c.fillRect(30, 38, 4, 9);
  },
  hourglass(c) {
    poly(c, [[16, 8], [48, 8], [34, 32], [48, 56], [16, 56], [30, 32]]); style(c, { fill: P.paper });
    poly(c, [[24, 50], [40, 50], [32, 40]]); c.fillStyle = P.sandDark; c.fill();
    rrect(c, 12, 4, 40, 6, 3); style(c, { fill: P.wood, lw: 3 }); rrect(c, 12, 54, 40, 6, 3); style(c, { fill: P.wood, lw: 3 });
  },
  flag(c) {
    c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(14, 6); c.lineTo(14, 58); c.stroke();
    c.beginPath(); c.moveTo(16, 8); c.quadraticCurveTo(32, 2, 52, 10); c.lineTo(46, 22); c.lineTo(52, 34); c.quadraticCurveTo(32, 28, 16, 32); c.closePath(); style(c, { fill: P.red });
  },
  palm(c) {
    c.strokeStyle = P.ink; c.lineWidth = 5; c.beginPath(); c.moveTo(30, 58); c.quadraticCurveTo(28, 40, 34, 22); c.stroke();
    c.strokeStyle = P.woodDark; c.lineWidth = 3; c.stroke();
    for (const a of [-2.6, -1.9, -1.2, -0.5]) { ellipse(c, 34 + Math.cos(a) * 12, 22 + Math.sin(a) * 8, 14, 5, a); style(c, { fill: P.green, lw: 3 }); }
  },
};

export const ICON_NAMES = Object.keys(ICONS);

export function makeIcons(scene) {
  const names = ICON_NAMES;
  const cols = 8;
  const rows = Math.ceil(names.length / cols);
  const tex = makeTexture(scene, 'icons', cols * S, rows * S, (ctx) => {
    names.forEach((n, i) => {
      ctx.save();
      ctx.translate((i % cols) * S, Math.floor(i / cols) * S);
      ctx.beginPath(); ctx.rect(0, 0, S, S); ctx.clip();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.textAlign = 'left';
      ICONS[n](ctx);
      ctx.restore();
    });
  });
  names.forEach((n, i) => tex.add(n, 0, (i % cols) * S, Math.floor(i / cols) * S, S, S));
}
