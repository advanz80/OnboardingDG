// Plattegrond van het park. Coördinaten in wereld-pixels.
export const WORLD_W = 3072;
export const WORLD_H = 2048;

/** Catmull-Rom → dicht polygoon (voor tekenen én botsing). */
export function sampleSmooth(pts, closed = true, seg = 10) {
  const out = [];
  const n = pts.length;
  const count = closed ? n : n - 1;
  for (let i = 0; i < count; i++) {
    const p0 = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[closed ? (i + 2) % n : Math.min(n - 1, i + 2)];
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

// Kustlijn (land ligt "onder" deze lijn). Water: noorden + jachthaven-inham.
const COAST_RAW = [
  [-80, 1080], [110, 920], [320, 740], [600, 650], [900, 618], [1200, 640], [1500, 628], [1800, 650],
  [2100, 624], [2330, 676], [2420, 770], [2480, 900], [2700, 946], [2850, 870], [2910, 720], [2990, 610],
  [3160, 570], [3160, 2140], [-80, 2140],
];
export const LAND = sampleSmooth(COAST_RAW, true, 12);

// Gras ligt iets landinwaarts (strand ertussen).
const GRASS_RAW = [
  [-80, 1300], [160, 1090], [380, 930], [620, 880], [900, 860], [1200, 830], [1400, 790], [1800, 760],
  [2100, 740], [2300, 790], [2380, 900], [2460, 1010], [2700, 1050], [2930, 950], [3020, 760],
  [3160, 720], [3160, 2140], [-80, 2140],
];
export const GRASS = sampleSmooth(GRASS_RAW, true, 12);

// Paden: [punten], breedte
export const PATHS = [
  { pts: [[1550, 2100], [1550, 1850], [1550, 1680]], w: 90 },                        // ingang → plein
  { pts: [[1550, 1250], [1520, 1000], [1500, 800], [1500, 690]], w: 76 },             // plein → pier
  { pts: [[1330, 1450], [1100, 1380], [800, 1200], [560, 1030], [520, 820]], w: 70 },  // plein → bouwplaats
  { pts: [[1770, 1450], [2000, 1440], [2200, 1520]], w: 70 },                         // plein → zwembad
  { pts: [[2200, 1520], [2450, 1300], [2600, 1110], [2630, 980]], w: 66 },            // zwembad → jachthaven
  { pts: [[1100, 1380], [1000, 1600], [800, 1780], [500, 1850]], w: 56 },             // bungalows west
  { pts: [[2000, 1440], [2100, 1700], [2400, 1820], [2800, 1760]], w: 56 },            // bungalows oost
  { pts: [[1400, 1250], [1100, 1050], [900, 960]], w: 56 },                           // naar het strand
];

export const PLAZA = { x: 1550, y: 1460, r: 240 };

// Pier & steigers (begaanbaar water)
export const PIER = { x: 1460, y: 330, w: 84, h: 380 };              // pier naar het noorden
export const JETTIES = [
  { x: 2530, y: 700, w: 46, h: 260 },
  { x: 2690, y: 680, w: 46, h: 280 },
  { x: 2480, y: 760, w: 260, h: 40 },
];
export const BRIDGE = { x: 520, y: 380, w: 96, h: 330 };              // verschijnt na BHC
export const SHIP = { x: 610, y: 400 };                                // onderkant-midden van het piratenschip

export const SPAWN = { x: 1550, y: 1820 };
export const GATE = { x: 1550, y: 2030 };

// Missiepunten: kraam + NPC
export const STATIONS = {
  bhc: { x: 360, y: 1010, npc: { x: 430, y: 1070 } },
  driessen: { x: 1250, y: 1560, npc: { x: 1330, y: 1620 } },
  bloeij: { x: 930, y: 1000, npc: { x: 1000, y: 1060 } },
  ijk: { x: 2080, y: 1330, npc: { x: 2150, y: 1390 } },
  haert: { x: 2830, y: 1110, npc: { x: 2760, y: 1160 } },
  reijn: { x: 1700, y: 830, npc: { x: 1620, y: 880 } },
};

export const PETRA = { x: 1660, y: 1850 };
export const GUARD = { x: 568, y: 420 };
export const BRIDGE_SIGN = { x: 600, y: 760 };

// Vaste gebouwen (x,y = onderkant midden) + botsrechthoek
export const BUILDINGS = [
  { key: 'reception', x: 1550, y: 1235, col: { w: 300, h: 70 } },
  { key: 'dome', x: 2380, y: 1290, col: { w: 360, h: 90 } },
];

export const BUNGALOWS = [
  [380, 1350, 0], [640, 1300, 1], [300, 1620, 2], [620, 1560, 3], [880, 1500, 0], [420, 1900, 1], [700, 1920, 2], [1000, 1880, 3],
  [2200, 1960, 0], [2480, 1990, 2], [2700, 1600, 1], [2950, 1560, 3], [2950, 1880, 0], [2350, 1700, 3], [1950, 1930, 1],
];

// Strand-decor
export const UMBRELLAS = [[420, 860, 0], [620, 780, 1], [840, 760, 2], [1080, 770, 3], [1280, 740, 0], [720, 860, 3]];
export const TOWELS = [[470, 880], [680, 800], [900, 780], [1140, 790], [1320, 770]];
export const LIFEGUARD = { x: 1000, y: 720 };

// Badges voor de BHC-zoektocht
export const BADGE_SPOTS = [
  [250, 1500], [760, 1700], [1150, 1960], [1900, 1640], [2600, 1450], [2960, 1300], [2320, 1000], [1880, 900], [1180, 920],
  [520, 1250], [2050, 2000], [1200, 1200], [2780, 1880],
];
