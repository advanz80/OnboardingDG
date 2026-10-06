// Centraal, zomers palet. Dikke contour + zachte schaduwen = de huisstijl van het spel.
export const P = {
  ink: '#2d1e2f',
  line: '#4a3646', // zachtere contour voor wereld-objecten (AC-stijl)
  inkSoft: '#4a3a4d',
  cream: '#fff8e7',
  paper: '#fdf0d2',
  shadow: 'rgba(30, 20, 40, 0.22)',
  grass: '#7cc95a', grassDark: '#5aa843', grassLight: '#a3df74',
  sand: '#f7dc93', sandDark: '#e7bf6b', sandLight: '#fff0c2',
  water: '#2ea6d9', waterDeep: '#1a7fb8', waterLight: '#80d4f2', foam: '#effcff',
  path: '#f3e4c2', pathEdge: '#d6bd8c',
  wood: '#c07c41', woodDark: '#8a5226', woodLight: '#dda066',
  stone: '#c9c2b8', stoneDark: '#9c9389',
  red: '#e8504c', orange: '#f59a3c', gold: '#f6c33b', yellow: '#ffe066',
  blue: '#3d8fe0', teal: '#2ec4b6', purple: '#8e5bd8', pink: '#ff7aa8',
  green: '#4cc764', white: '#ffffff', black: '#1a1220',
  pirate: '#3b2f3f', pirateRed: '#b8302c',
};

export const HEX = Object.fromEntries(Object.entries(P).filter(([, v]) => v.startsWith('#')).map(([k, v]) => [k, parseInt(v.slice(1), 16)]));

export const FONT = {
  ui: '"Fredoka", "Trebuchet MS", system-ui, sans-serif',
  title: '"Pirata One", "Fredoka", Georgia, serif',
};

export const OUTLINE = 3.2;

/** Standaard tekststijl voor Phaser Text. */
export function textStyle(size = 24, color = P.ink, extra = {}) {
  return { fontFamily: FONT.ui, fontSize: `${size}px`, color, fontStyle: '600', ...extra };
}

export function titleStyle(size = 48, color = P.cream, extra = {}) {
  return {
    fontFamily: FONT.title, fontSize: `${size}px`, color,
    stroke: P.ink, strokeThickness: Math.max(4, Math.round(size / 7)),
    shadow: { offsetX: 0, offsetY: Math.round(size / 12), color: 'rgba(0,0,0,0.35)', blur: 0, fill: true, stroke: true },
    ...extra,
  };
}

export function shade(hexStr, amt) {
  // amt -1..1: donkerder/lichter
  const n = parseInt(hexStr.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Leesbare tekstkleur (donker of licht) op een achtergrondkleur 0xRRGGBB. */
export function textOn(color) {
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5 ? P.cream : P.ink;
}
