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

function brickWall(c, x, y, w, h, col = BRICK) {
  c.fillStyle = col; c.fillRect(x, y, w, h);
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

function drawDriessenPart(c, w, h, H, { front, entrance, kind, logoImg }) {
  const fy = h - H;
  if (kind === 'roof' || kind === 'atriumroof') {
    // van bovenaf alleen pannendak (de gevels van deze delen zie je in dit aanzicht niet)
    hipRoof(c, w, h - 4);
    if (kind === 'atriumroof') {
      const gw = w * 0.36, gx = w / 2 - gw / 2, gy = h * 0.1, gh = h * 0.8;
      const g = c.createLinearGradient(gx, gy, gx + gw, gy + gh); g.addColorStop(0, '#d9f1fb'); g.addColorStop(1, '#86bfdb');
      c.fillStyle = g; c.fillRect(gx, gy, gw, gh);
      c.strokeStyle = '#8a8f99'; c.lineWidth = 2;
      for (let y = gy + 16; y < gy + gh; y += 16) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx + gw, y); c.stroke(); }
      c.beginPath(); c.moveTo(w / 2, gy); c.lineTo(w / 2, gy + gh); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.45)'; for (let y = gy + 6; y < gy + gh; y += 64) c.fillRect(gx + 6, y, gw / 2 - 12, 8);
      c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.strokeRect(gx, gy, gw, gh);
      c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(gx - 2, gy - 2, gw + 4, gh + 4);
    }
    if (entrance) {
      // rechthoekig Driessen-logobord op de noordrand, boven de ingang (dak loopt door)
      const bw = 96, bh = 30, bx = w / 2 - bw / 2;
      c.fillStyle = '#ffffff'; c.fillRect(bx, 0, bw, bh); c.strokeStyle = P.line; c.lineWidth = 2.4; c.strokeRect(bx, 0, bw, bh);
      if (logoImg) {
        const sc = Math.min((bw - 10) / logoImg.width, (bh - 6) / logoImg.height);
        const lw = logoImg.width * sc, lh = logoImg.height * sc;
        c.drawImage(logoImg, w / 2 - lw / 2, bh / 2 - lh / 2, lw, lh);
      } else {
        c.fillStyle = BRICK; c.font = '700 16px Fredoka, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('driessen', w / 2, bh / 2);
      }
    }
    return;
  }
  if (kind === 'atrium') {
    // glazen dak over het atrium
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d9f1fb'); g.addColorStop(1, '#86bfdb');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#8a8f99'; c.lineWidth = 2;
    for (let y = 16; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.45)'; for (let y = 6; y < h; y += 64) c.fillRect(6, y, w / 2 - 12, 8);
    c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
    return;
  }
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

// ── IJk: donkere baksteen, platte daken, smalle donkere ramen, glazen entree ──
const IJK_BRICK = '#7a3a2e';

function flatRoof(c, w, rh, col = '#5a5e66') {
  rrect(c, 2, 2, w - 4, rh, 3); c.fillStyle = col; c.fill();
  c.fillStyle = shade(col, 0.1); c.fillRect(8, 8, w - 16, rh - 12);
  c.strokeStyle = shade(col, -0.3); c.lineWidth = 4; c.strokeRect(5, 5, w - 10, rh - 6);   // dakrand
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, rh);
}

function drawIjkPart(c, w, h, H, { kind, label }) {
  const fy = h - H;
  if (kind === 'glassroof') {
    // glazen dakstrook tussen het noord- en zuidblok, met de entree aan de westkant
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d9f1fb'); g.addColorStop(1, '#8cc3dc');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#6d7782'; c.lineWidth = 2;
    for (let x = 18; x < w; x += 18) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.5)'; for (let x = 6; x < w; x += 54) c.fillRect(x, 4, 8, h - 8);
    rrect(c, 0, 2, 26, h - 4, 3); c.fillStyle = '#5d6b78'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2; c.stroke();
    c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(0, 0, w, h);
    return;
  }
  if (kind === 'glass') {
    // glazen entreehal: glazen dak en volledig glazen gevel met stalen stijlen
    rrect(c, 2, 2, w - 4, fy, 3); c.fillStyle = '#a9d6ea'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 3; c.stroke();
    c.strokeStyle = '#6d7782'; c.lineWidth = 2; for (let y = 10; y < fy; y += 14) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
    const g = c.createLinearGradient(0, fy, w, h); g.addColorStop(0, '#d9f1fb'); g.addColorStop(1, '#79b4d1');
    c.fillStyle = g; c.fillRect(2, fy, w - 4, H - 2);
    c.strokeStyle = '#5d6670'; c.lineWidth = 2.4;
    for (let x = 2 + (w - 4) / 3; x < w - 4; x += (w - 4) / 3) { c.beginPath(); c.moveTo(x, fy); c.lineTo(x, h); c.stroke(); }
    for (let y = fy + 26; y < h; y += 26) { c.beginPath(); c.moveTo(2, y); c.lineTo(w - 2, y); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(8, fy + 6); c.lineTo(22, fy + 6); c.lineTo(10, h - 8); c.lineTo(4, h - 8); c.closePath(); c.fill();
    // deur
    rrect(c, w / 2 - 14, h - 40, 28, 38, 2); c.fillStyle = 'rgba(70,90,110,0.55)'; c.fill();
    c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
    return;
  }
  flatRoof(c, w, fy);
  brickWall(c, 2, fy, w - 4, H - 2, IJK_BRICK);
  if (kind === 'tall') {
    // smalle staande ramen in rijen, plus het uitstekende vierkante raam met wit kader
    const rows = Math.max(2, Math.floor((H - 16) / 34));
    const rh = (H - 16) / rows;
    for (let r = 0; r < rows; r++) for (let x = 14; x + 12 < w - 10; x += 30) {
      if (r === 0 && x > w - 70) continue;
      darkWindow(c, x, fy + 10 + r * rh, 12, rh - 12);
    }
    c.fillStyle = '#ffffff'; c.fillRect(w - 62, fy + 6, 48, 40); c.fillStyle = '#4a4f5a'; c.fillRect(w - 56, fy + 12, 36, 28);
    c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(w - 62, fy + 6, 48, 40);
    // groot raam beneden met een kleurige wandschildering erachter
    c.fillStyle = '#ffffff'; c.fillRect(10, h - 46, 46, 40);
    const mg = c.createLinearGradient(14, h - 42, 52, h - 10); mg.addColorStop(0, '#a6dccb'); mg.addColorStop(1, '#66A48B');
    c.fillStyle = mg; c.fillRect(14, h - 42, 38, 32);
    c.fillStyle = '#f59a3c'; c.beginPath(); c.arc(26, h - 26, 7, 0, Math.PI * 2); c.fill();
  } else {
    // lagere vleugel: lange lichtstrook bovenin en losse ramen onder
    c.fillStyle = '#4a4f5a'; c.fillRect(12, fy + 10, w - 24, 18);
    c.fillStyle = '#a9d6ea'; for (let x = 14; x + 20 < w - 12; x += 24) c.fillRect(x, fy + 12, 20, 14);
    for (let x = 16; x + 12 < w - 10; x += 32) darkWindow(c, x, fy + 40, 12, H - 52);
  }
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
  if (label) {
    c.font = '700 20px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 22;
    rrect(c, w / 2 - tw / 2, fy - 16, tw, 28, 7); style(c, { fill: '#66A48B', stroke: P.line, lw: 2.4 });
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, w / 2, fy - 1);
  }
}

function darkWindow(c, x, y, w, h) {
  c.fillStyle = '#3b3f48'; c.fillRect(x - 2, y - 2, w + 4, h + 4);
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#9cc7dc'); g.addColorStop(1, '#4f7790');
  c.fillStyle = g; c.fillRect(x, y, w, h);
}

// ── Het Atelier: schoon beton, zonnepanelen, eikenhouten glasdoos en uitkragend afdak ──
const CONCRETE = '#cdcac4', OAK = '#c8964f';

function concreteWall(c, x, y, w, h) {
  c.fillStyle = CONCRETE; c.fillRect(x, y, w, h);
  const pw = 46, ph = 30;
  c.strokeStyle = 'rgba(110,105,98,0.45)'; c.lineWidth = 1.2;
  for (let yy = y + ph; yy < y + h; yy += ph) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + w, yy); c.stroke(); }
  for (let xx = x + pw; xx < x + w; xx += pw) { c.beginPath(); c.moveTo(xx, y); c.lineTo(xx, y + h); c.stroke(); }
  c.fillStyle = 'rgba(90,85,80,0.45)';
  for (let yy = y + ph / 2; yy < y + h; yy += ph) for (let xx = x + pw / 4; xx < x + w; xx += pw / 2) { c.beginPath(); c.arc(xx, yy, 1.3, 0, Math.PI * 2); c.fill(); }
}

function solarPanels(c, x, y, w, h) {
  for (let yy = y; yy + 22 <= y + h; yy += 28) for (let xx = x; xx + 34 <= x + w; xx += 38) {
    c.fillStyle = '#2b3a5c'; c.fillRect(xx, yy, 34, 22);
    c.strokeStyle = '#7d8db0'; c.lineWidth = 0.8;
    for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(xx + k * 8.5, yy); c.lineTo(xx + k * 8.5, yy + 22); c.stroke(); }
    c.beginPath(); c.moveTo(xx, yy + 11); c.lineTo(xx + 34, yy + 11); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(xx + 2, yy + 2, 10, 4);
  }
}

function drawAtelierPart(c, w, h, H, { label }) {
  const fy = h - H;
  // plat dak met zonnepanelen en een opbouw
  rrect(c, 2, 2, w - 4, fy, 3); c.fillStyle = '#b7b3ad'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 3; c.stroke();
  c.strokeStyle = '#9a958e'; c.lineWidth = 4; c.strokeRect(6, 6, w - 12, fy - 8);
  solarPanels(c, 14, 14, w * 0.58 - 14, fy - 24);
  rrect(c, w * 0.62, 12, w * 0.3, fy * 0.42, 3); c.fillStyle = '#9b9893'; c.fill(); c.strokeStyle = P.line; c.lineWidth = 2; c.stroke();
  // glazen doos met eiken kozijnen (rechts), steekt boven het dak uit
  const gx = w * 0.6, gw = w * 0.34, gTop = fy - 46;
  c.fillStyle = OAK; c.fillRect(gx - 6, gTop - 8, gw + 12, 12);                         // houten dakrand met lamellen
  c.strokeStyle = shade(OAK, -0.35); c.lineWidth = 1; for (let x = gx - 4; x < gx + gw + 6; x += 6) { c.beginPath(); c.moveTo(x, gTop - 8); c.lineTo(x, gTop + 4); c.stroke(); }
  c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(gx - 6, gTop - 8, gw + 12, 12);
  // beton
  concreteWall(c, 2, fy, w - 4, H - 2);
  // glasdoos over de volle hoogte
  const g = c.createLinearGradient(gx, gTop, gx + gw, h); g.addColorStop(0, '#e2f5ff'); g.addColorStop(1, '#7fb6d4');
  c.fillStyle = g; c.fillRect(gx, gTop + 4, gw, h - gTop - 6);
  c.strokeStyle = OAK; c.lineWidth = 4;
  for (let x = gx; x <= gx + gw + 1; x += gw / 5) { c.beginPath(); c.moveTo(x, gTop + 4); c.lineTo(x, h - 2); c.stroke(); }
  c.beginPath(); c.moveTo(gx, fy + H * 0.45); c.lineTo(gx + gw, fy + H * 0.45); c.stroke();
  c.fillStyle = 'rgba(246,195,59,0.5)'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(gx + gw * (0.2 + k * 0.3), fy + H * 0.6, 3, 0, Math.PI * 2); c.fill(); }
  c.strokeStyle = P.line; c.lineWidth = 2.4; c.strokeRect(gx, gTop + 4, gw, h - gTop - 6);
  // uitkragend afdak links met slanke kolommen en een groot raam eronder
  const ax = 2, aw = w * 0.34;
  c.fillStyle = 'rgba(40,40,50,0.18)'; c.fillRect(ax, fy + 12, aw, H - 14);
  const wg = c.createLinearGradient(ax, fy, ax + aw, h); wg.addColorStop(0, '#d9f1fb'); wg.addColorStop(1, '#86bfdb');
  c.fillStyle = wg; c.fillRect(ax + 10, fy + 20, aw - 20, H - 26);
  c.strokeStyle = '#6d7782'; c.lineWidth = 2; c.strokeRect(ax + 10, fy + 20, aw - 20, H - 26);
  c.fillStyle = '#f4f2ee'; c.fillRect(ax - 2, fy + 2, aw + 8, 10); c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(ax - 2, fy + 2, aw + 8, 10);
  c.fillStyle = '#f4f2ee'; for (const x of [ax + 3, ax + aw - 4]) { c.fillRect(x, fy + 12, 5, H - 14); c.strokeRect(x, fy + 12, 5, H - 14); }
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
  if (label) {
    c.font = '700 18px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 20, lx = w * 0.47 - tw / 2;
    rrect(c, lx, fy + 16, tw, 26, 6); style(c, { fill: '#f6c33b', stroke: P.line, lw: 2.2 });
    c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, lx + tw / 2, fy + 30);
  }
}

// ── Bloeij: lichtgroene gevel met muurschildering van bloemen; Loods: grijze golfplaat ──
function tulip(c, x, y, s, col) {
  c.strokeStyle = '#3f7a34'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 4 * s, y + 18 * s, x + 2 * s, y + 34 * s); c.stroke();
  c.fillStyle = '#4f9a3a'; c.beginPath(); c.ellipse(x + 8 * s, y + 22 * s, 4 * s, 11 * s, 0.6, 0, Math.PI * 2); c.fill();
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x - 10 * s, y - 4 * s); c.quadraticCurveTo(x - 12 * s, y - 22 * s, x - 4 * s, y - 24 * s); c.lineTo(x, y - 14 * s); c.lineTo(x + 4 * s, y - 24 * s);
  c.quadraticCurveTo(x + 12 * s, y - 22 * s, x + 10 * s, y - 4 * s); c.quadraticCurveTo(x, y + 4 * s, x - 10 * s, y - 4 * s); c.fill();
  c.strokeStyle = shade(col, -0.35); c.lineWidth = 1.2; c.stroke();
}
function daffodil(c, x, y, s) {
  c.fillStyle = '#ffd23f';
  for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3; c.beginPath(); c.ellipse(x + Math.cos(an) * 7 * s, y + Math.sin(an) * 7 * s, 6 * s, 3.5 * s, an, 0, Math.PI * 2); c.fill(); }
  c.fillStyle = '#f59a3c'; c.beginPath(); c.arc(x, y, 4.5 * s, 0, Math.PI * 2); c.fill();
}

function drawBloeijPart(c, w, h, H, { label }) {
  const fy = h - H;
  flatRoof(c, w, fy, '#8f949c');
  c.fillStyle = '#f4f2ee'; c.fillRect(0, fy - 5, w, 7); c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(0, fy - 5, w, 7);
  // lichtgroene tegelgevel
  c.fillStyle = '#a9d58a'; c.fillRect(2, fy + 2, w - 4, H - 4);
  c.strokeStyle = 'rgba(70,120,60,0.25)'; c.lineWidth = 1;
  for (let y = fy + 10; y < h; y += 8) { c.beginPath(); c.moveTo(2, y); c.lineTo(w - 2, y); c.stroke(); }
  for (let x = 10; x < w; x += 16) for (let y = fy + 2, r = 0; y < h; y += 8, r++) { c.beginPath(); c.moveTo(x + (r % 2) * 8, y); c.lineTo(x + (r % 2) * 8, y + 8); c.stroke(); }
  // muurschildering: vrouw met bloemen in het midden-links, tulpen en narcissen eromheen
  const mx = w * 0.62, my = fy + H * 0.52;
  c.fillStyle = '#c8552d'; c.beginPath(); c.ellipse(mx - 6, my - 6, 20, 24, 0.2, 0, Math.PI * 2); c.fill();             // haar
  c.fillStyle = '#f5c9a0'; c.beginPath(); c.ellipse(mx, my - 4, 12, 15, 0, 0, Math.PI * 2); c.fill();                  // gezicht
  c.fillStyle = '#2d1e14'; c.beginPath(); c.arc(mx - 4, my - 7, 1.4, 0, Math.PI * 2); c.arc(mx + 5, my - 7, 1.4, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#8a2d3b'; c.lineWidth = 1.6; c.beginPath(); c.arc(mx + 1, my + 2, 5, 0.2, Math.PI - 0.2); c.stroke();
  c.fillStyle = '#e9e6e0'; c.beginPath(); c.ellipse(mx + 2, my + 26, 22, 14, 0, Math.PI, 0); c.fill();                 // blouse
  tulip(c, mx + 34, my - 10, 1.3, '#e8504c'); tulip(c, mx - 40, my + 6, 1.1, '#f59a3c'); tulip(c, w * 0.36, fy + H * 0.45, 1, '#e8504c');
  tulip(c, w * 0.9, fy + H * 0.4, 1.2, '#ff7aa8'); daffodil(c, mx - 22, my + 24, 1.4); daffodil(c, mx + 22, my + 30, 1.2);
  daffodil(c, w * 0.42, fy + H * 0.3, 1.1); daffodil(c, w * 0.84, fy + H * 0.72, 1.3);
  // zwarte ramen en deur
  for (const fx of [0.08, 0.2, 0.32, 0.5, 0.78]) {
    const x = w * fx - 9;
    c.fillStyle = '#23262d'; c.fillRect(x, fy + 16, 18, 24); c.fillStyle = '#4f6e82'; c.fillRect(x + 3, fy + 19, 12, 18);
    if (fx < 0.4) { c.fillStyle = '#23262d'; c.fillRect(x, fy + H - 40, 18, 26); c.fillStyle = '#4f6e82'; c.fillRect(x + 3, fy + H - 37, 12, 20); }
  }
  c.fillStyle = '#23262d'; c.fillRect(w * 0.44, h - 42, 22, 40);
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
  if (label) {
    c.font = '700 18px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 20, lx = w * 0.84 - tw / 2;
    rrect(c, lx, fy - 30, tw, 24, 6); style(c, { fill: '#EDB23E', stroke: P.line, lw: 2.2 });
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, lx + tw / 2, fy - 18);
  }
}

function drawLoodsPart(c, w, h, H, { label }) {
  const fy = h - H;
  // licht gebogen dak van golfplaat
  c.fillStyle = '#c3c7cc'; rrect(c, 2, 2, w - 4, fy, 3); c.fill();
  c.strokeStyle = '#a3a8ae'; c.lineWidth = 2; for (let y = 8; y < fy; y += 8) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, 2, w - 4, fy);
  // golfplaat-gevel met verticale ribbels en een grote roldeur
  c.fillStyle = '#d3d6da'; c.fillRect(2, fy, w - 4, H - 2);
  for (let x = 4; x < w - 2; x += 6) { c.fillStyle = (x / 6) % 2 ? '#bfc3c8' : '#e2e4e7'; c.fillRect(x, fy, 3, H - 2); }
  const dw = w * 0.32, dx = w * 0.55;
  c.fillStyle = '#9aa0a8'; c.fillRect(dx, h - H * 0.78, dw, H * 0.78 - 2);
  c.strokeStyle = '#7a8088'; c.lineWidth = 1.4; for (let y = h - H * 0.78 + 6; y < h; y += 6) { c.beginPath(); c.moveTo(dx, y); c.lineTo(dx + dw, y); c.stroke(); }
  c.strokeStyle = P.line; c.lineWidth = 2.2; c.strokeRect(dx, h - H * 0.78, dw, H * 0.78 - 2);
  c.fillStyle = '#5d6b78'; c.fillRect(w * 0.2, h - 40, 22, 38);
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
  if (label) {
    c.font = '700 16px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 18, lx = w * 0.2 - tw / 2 + 11;
    rrect(c, lx, fy + 10, tw, 22, 5); style(c, { fill: P.cream, stroke: P.line, lw: 2 });
    c.fillStyle = P.ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, lx + tw / 2, fy + 21);
  }
}

// ── BHC: roodbruine baksteen, doorlopende raamstrook boven, glazen entree in het midden ──
function drawBhcPart(c, w, h, H, { label }) {
  const fy = h - H;
  flatRoof(c, w, fy, '#4f535b');
  // dunne donkere dakrand die iets uitsteekt
  c.fillStyle = '#2f3238'; c.fillRect(-2, fy - 6, w + 4, 9); c.strokeStyle = P.line; c.lineWidth = 2; c.strokeRect(-2, fy - 6, w + 4, 9);
  brickWall(c, 2, fy + 3, w - 4, H - 5, '#8e4a38');
  const ex = w / 2 - 22, ew = 44;
  // verdieping: doorlopende raamstrook met donkere stijlen
  const uy = fy + 10, uh = H * 0.32;
  c.fillStyle = '#2f3238'; c.fillRect(8, uy - 2, w - 16, uh + 4);
  const g = c.createLinearGradient(0, uy, 0, uy + uh); g.addColorStop(0, '#cfe8f4'); g.addColorStop(1, '#6f9fb8');
  c.fillStyle = g; c.fillRect(10, uy, w - 20, uh);
  c.strokeStyle = '#2f3238'; c.lineWidth = 2.4; for (let x = 10 + 22; x < w - 10; x += 22) { c.beginPath(); c.moveTo(x, uy); c.lineTo(x, uy + uh); c.stroke(); }
  // begane grond: donkere ramen in paren
  const ly = fy + H * 0.52, lh = H * 0.36;
  for (let x = 12; x + 16 < w - 10; x += 26) {
    if (x + 16 > ex - 4 && x < ex + ew + 4) continue;
    c.fillStyle = '#2f3238'; c.fillRect(x - 2, ly - 2, 18, lh + 4); c.fillStyle = '#4f6e82'; c.fillRect(x, ly, 14, lh);
  }
  // glazen entree over twee verdiepingen
  c.fillStyle = '#2f3238'; c.fillRect(ex - 3, fy + 4, ew + 6, H - 6);
  const eg = c.createLinearGradient(ex, fy, ex + ew, h); eg.addColorStop(0, '#d9f1fb'); eg.addColorStop(1, '#7fa9c0');
  c.fillStyle = eg; c.fillRect(ex, fy + 7, ew, H - 10);
  c.strokeStyle = '#2f3238'; c.lineWidth = 2; c.beginPath(); c.moveTo(ex + ew / 2, fy + 7); c.lineTo(ex + ew / 2, h - 3); c.moveTo(ex, fy + H * 0.48); c.lineTo(ex + ew, fy + H * 0.48); c.stroke();
  c.strokeStyle = P.line; c.lineWidth = 3; c.strokeRect(2, fy, w - 4, H - 2);
  if (label) {
    c.font = '700 16px Fredoka, sans-serif';
    const tw = c.measureText(label).width + 18, lx = w * 0.8 - tw / 2;
    rrect(c, lx, fy - 30, tw, 22, 5); style(c, { fill: '#3D2152', stroke: P.line, lw: 2 });
    c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(label, lx + tw / 2, fy - 19);
  }
}

/** Maakt textures `bld_<id>_<i>` voor alle delen. Het voorste deel krijgt het naambord. */
export function makeCampusBuildings(scene, buildings, neighbour = false) {
  buildings.forEach((b, bi) => {
    const front = b.parts.reduce((m, p, i) => (p.y + p.h > b.parts[m].y + b.parts[m].h ? i : m), 0);
    b.parts.forEach((p, i) => {
      const H = Math.min(b.Hs?.[i] ?? b.H, Math.round(p.h * 0.7));
      const bands = brandColors(b);
      if (!bands.length && b.color) bands.push(b.color);
      const wall = neighbour ? '#d9d4ca' : '#f1ece2';
      const roof = neighbour ? '#b9b6b0' : '#cfcac2';
      makeTexture(scene, `bld_${b.id}_${i}`, p.w, p.h, (c, w, h) => (b.style === 'driessen'
        ? drawDriessenPart(c, w, h, H, { front: i === front, entrance: i === b.entrance, kind: b.kinds?.[i], logoImg: scene.textures.exists('logo_driessen') ? scene.textures.get('logo_driessen').getSourceImage() : null })
        : b.style === 'bhc' ? drawBhcPart(c, w, h, H, { label: b.name })
        : b.style === 'bloeij' ? drawBloeijPart(c, w, h, H, { label: b.name })
        : b.style === 'loods' ? drawLoodsPart(c, w, h, H, { label: b.name })
        : b.style === 'atelier' ? drawAtelierPart(c, w, h, H, { label: b.name })
        : b.style === 'ijk' ? drawIjkPart(c, w, h, H, { kind: b.kinds[i], label: i === b.labelPart ? b.name : '' })
        : drawPart(c, w, h, H, { wall, roof, bands, label: !neighbour && i === front ? b.name : '', seed: 7 + bi * 31 + i })));
    });
  });
}
