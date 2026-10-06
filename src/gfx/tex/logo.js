// Spellogo "Driessen Groep / Campus Crossing" in Animal Crossing-stijl: ronde, bolle letters,
// crème vulling met een dikke bruine rand, licht dansende letters en een blaadje.
// drawGameLogo werkt op elk canvas (ook buiten Phaser, voor iconen en de deelafbeelding).
import { makeTexture } from '../draw.js';

const BROWN = '#6b3f1d', CREAM = '#fffbea', LEAF = '#5fb044', LEAF_D = '#3f7a34';
const LETTER_TINTS = ['#fffbea', '#fff3c4', '#e9ffd9', '#fff3c4'];

function leaf(c, x, y, s, rot) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 18); c.bezierCurveTo(-22, 4, -16, -22, 0, -26); c.bezierCurveTo(16, -22, 22, 4, 0, 18); c.closePath();
  c.lineJoin = 'round'; c.lineWidth = 7; c.strokeStyle = BROWN; c.stroke();
  c.fillStyle = LEAF; c.fill();
  c.strokeStyle = LEAF_D; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, 14); c.lineTo(0, -20); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-6, -8, 4, 8, -0.4, 0, Math.PI * 2); c.fill();
  c.restore();
}

/**
 * Tekent het logo gecentreerd rond (cx, cy). size = hoogte van de grote letters in px.
 * Geeft de totale breedte terug.
 */
export function drawGameLogo(c, cx, cy, size, { font = 'Fredoka, "Trebuchet MS", sans-serif' } = {}) {
  const big = size, small = size * 0.42;
  c.save();
  c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  // grote regel: letter voor letter, met kleine sprongetjes en draaiingen
  const text = 'Campus Crossing';
  c.font = `700 ${big}px ${font}`;
  const widths = [...text].map((ch) => c.measureText(ch).width * 0.96);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = cx - total / 2;
  const by = cy + small * 0.55;
  const pos = [...text].map((ch, i) => {
    const w = widths[i], px = x + w / 2; x += w;
    return { ch, x: px, y: by + Math.sin(i * 1.3) * big * 0.05, r: Math.sin(i * 2.1) * 0.06 };
  });
  // schaduw
  c.fillStyle = 'rgba(60,30,10,0.35)';
  for (const p of pos) { c.save(); c.translate(p.x + big * 0.03, p.y + big * 0.07); c.rotate(p.r); c.lineWidth = big * 0.24; c.strokeStyle = 'rgba(60,30,10,0.35)'; c.strokeText(p.ch, 0, 0); c.restore(); }
  // dikke bruine rand, dan crème letters
  for (const p of pos) { c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.lineWidth = big * 0.22; c.strokeStyle = BROWN; c.strokeText(p.ch, 0, 0); c.restore(); }
  pos.forEach((p, i) => {
    c.save(); c.translate(p.x, p.y); c.rotate(p.r);
    c.fillStyle = LETTER_TINTS[i % LETTER_TINTS.length]; c.fillText(p.ch, 0, 0);
    // glimmetje
    c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(-big * 0.12, -big * 0.2, big * 0.05, big * 0.03, -0.5, 0, Math.PI * 2); c.fill();
    c.restore();
  });
  // blaadje op de "C" van Campus
  leaf(c, pos[0].x - big * 0.12, pos[0].y - big * 0.62, big / 70, -0.5);
  // kleine regel erboven
  c.font = `700 ${small}px ${font}`;
  const sy = cy - big * 0.42;
  c.lineWidth = small * 0.28; c.strokeStyle = BROWN; c.strokeText('Driessen Groep', cx, sy);
  c.fillStyle = CREAM; c.fillText('Driessen Groep', cx, sy);
  c.restore();
  return total;
}

/** Phaser-texture 'game_logo' (origin midden). */
export function makeLogoTexture(scene, size = 100) {
  const w = Math.round(size * 9.5), h = Math.round(size * 2.3);
  makeTexture(scene, 'game_logo', w, h, (c) => drawGameLogo(c, w / 2, h * 0.5, size));
  return 'game_logo';
}
