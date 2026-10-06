// Plattegrond van Brainport Human Campus (Helmond). Coördinaten in wereld-pixels.
//
// Alles is overgenomen van de officiële plattegrond (docs: "HC Plattegrond 2026 A3").
// Met `pt(px, py)` schrijf je punten in pixels van die plattegrond (gerenderd op
// 80 dpi, 1323×935); ze worden hier omgerekend naar de spelwereld. Zo kun je een
// gebouw of weg verschuiven door de plattegrond ernaast te leggen.
const S = 4;            // 1 px plattegrond = 4 px in het spel
const OX = 375, OY = 290;
export const pt = (px, py) => [(px - OX) * S, (py - OY) * S];
const rect = (x0, y0, x1, y1) => { const [ax, ay] = pt(x0, y0), [bx, by] = pt(x1, y1); return { x: ax, y: ay, w: bx - ax, h: by - ay }; };

export const WORLD_W = 3712;
export const WORLD_H = 2368;

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

// Land: de hele wereld (geen open water rond de campus).
export const LAND = [[-80, -80], [WORLD_W + 80, -80], [WORLD_W + 80, WORLD_H + 80], [-80, WORLD_H + 80]];
export const GRASS = LAND;

// Wegen (asfalt, begaanbaar). w = breedte in wereld-pixels.
const road = (w, ...pts) => ({ w, pts: pts.map(([x, y]) => pt(x, y)) });
export const ROADS = [
  road(84, [330, 470], [404, 430]),                                                   // Schootense Dreef (west)
  road(84, [466, 412], [700, 416], [985, 425], [1150, 372], [1330, 305]),              // Schootense Dreef
  road(84, [340, 770], [560, 790], [800, 808], [1000, 806], [1120, 772], [1270, 692], [1330, 662]), // Vlamovenweg
  road(72, [575, 422], [575, 650], [573, 790]),                                        // west: langs Bloeij
  road(72, [575, 652], [700, 655], [870, 658], [1000, 662], [1090, 664], [1240, 676], [1280, 690]), // Tunnelovenweg
];
export const ROUNDABOUT = { x: pt(430, 415)[0], y: pt(430, 415)[1], r: 150 };

// Voetpaden (stenen tegels)
export const PATHS = [
  { pts: [pt(422, 450), pt(432, 600), pt(440, 775)], w: 48 },     // Schootensepad
  { pts: [pt(990, 428), pt(992, 540), pt(995, 662)], w: 64 },     // ingang campus vanaf de Dreef
  { pts: [pt(1000, 560), pt(1030, 585)], w: 52 },                 // binnenterrein → terras
  { pts: [pt(985, 672), pt(988, 790)], w: 48 },                   // langs de vijver
  { pts: [pt(784, 664), pt(787, 717), pt(796, 717)], w: 40 },      // fietsenstalling → entree IJk (westkant)
  { pts: [pt(520, 528), pt(520, 545), pt(568, 545)], w: 44 },     // Bloeij
  { pts: [pt(560, 718), pt(575, 718)], w: 44 },                   // BHC
];

// Parkeerplaatsen (asfalt met vakken). P1–P6 en de B/H/G-vakken van de plattegrond.
export const PARKINGS = [
  { ...rect(975, 312, 1100, 352), label: 'P1' },
  { ...rect(1005, 435, 1085, 470), label: 'P2' },
  { ...rect(1095, 398, 1150, 450), label: 'B' },
  { ...rect(1150, 690, 1205, 715), label: 'H' },
  { ...rect(708, 690, 790, 788), label: 'P4' },
  { ...rect(880, 765, 960, 795), label: 'B' },
  { ...rect(478, 612, 565, 628), label: 'P6' },
];

// Terras op het binnenterrein (tussen ROVC en Driessen)
export const PLAZA = rect(1005, 585, 1082, 650);
// Vijver bij Het Atelier
export const POND = { x: pt(1005, 722)[0], y: pt(1005, 722)[1], rx: 34, ry: 96 };
// Grote rechthoekige vijver ten oosten van Driessen (ongeveer even lang als het pand)
export const BIGPOND = rect(1218, 490, 1262, 648);

// Gebouwen. rects = plattegrond-rechthoeken [x0, y0, x1, y1]; H = gevelhoogte (wereld-px).
// mission: welk station hoort erbij (alleen voor de huisstijlkleur van de gevel).
const bld = (id, name, rects, opts = {}) => ({ id, name, parts: rects.map((r) => rect(...r)), H: 90, ...opts });
export const BUILDINGS = [
  // Driessen (rechtgezet): entreevleugel noord, twee even brede dwarsvleugels, daartussen een iets smaller middenblok met glazen atrium
  bld('driessen', 'Driessen', [[1127, 471, 1163, 487], [1085, 487, 1205, 530], [1091, 530, 1199, 605], [1085, 605, 1205, 650]],
    { H: 110, brand: 'driessen', style: 'driessen', entrance: 0, kinds: ['roof', 'roof', 'atriumroof', 'wing'] }),
  bld('rovc', 'ROVC', [[875, 597, 970, 650]], { color: '#3D2152' }),
  // IJk: twee langgerekte blokken (noord hoog, zuid lager) met een glazen dakstrook ertussen; entree aan de westkant
  bld('ijk', 'IJk', [[795, 678, 932, 712], [795, 712, 960, 722], [818, 722, 975, 760]], { H: 120, brand: 'ijk', style: 'ijk', kinds: ['tall', 'glassroof', 'low'], Hs: [120, 0, 100], labelPart: 2 }),
  bld('atelier', 'Het Atelier', [[1018, 676, 1082, 748]], { H: 120, brand: ['haert', 'reijn'], style: 'atelier' }),
  bld('bloeij', 'Bloeij', [[478, 462, 562, 518]], { H: 110, brand: 'bloeij', style: 'bloeij' }),
  bld('loods', 'Loods', [[478, 560, 562, 605]], { H: 90, color: '#8a8f99', style: 'loods' }),
  bld('bhc', 'BHC', [[455, 634, 560, 700]], { H: 110, brand: 'bhc', style: 'bhc' }),
];
// Gebouwen van buren (niet van de campus): alleen decor.
export const NEIGHBOURS = [
  bld('n3', '', [[905, 500, 970, 570]]),
  bld('n8', '', [[605, 672, 670, 750]], { H: 80 }),
];

// Missiepunten: kraam + NPC, voor de ingang van het eigen gebouw
const station = (px, py, dx = 70, dy = 56) => { const [x, y] = pt(px, py); return { x, y, npc: { x: x + dx, y: y + dy } }; };
export const STATIONS = {
  bhc: station(500, 756),
  driessen: station(1145, 465, 110, 4),   // bij de voordeur aan de noordkant
  bloeij: { ...station(489, 542), flagLeft: true },   // vlag links, zodat de muurschildering zichtbaar blijft
  ijk: station(835, 780),
  haert: station(996, 770),
  reijn: station(1112, 735),
};

export const SPAWN = { x: pt(992, 490)[0], y: pt(992, 490)[1] };
export const GATE = { x: pt(990, 455)[0], y: pt(990, 455)[1] };
export const PETRA = { x: pt(1022, 495)[0], y: pt(1022, 495)[1] };

// De Toren van Paperassen van Kapitein Rompslomp, op een eilandje in de Schootense Loop.
// Staat op het grote terrein tussen Bloeij en ROVC, omringd door een gracht vol formulieren.
export const MOAT = { outer: rect(670, 480, 775, 600), inner: rect(688, 498, 757, 583) };
export const TOWER = { x: pt(722, 580)[0], y: pt(722, 580)[1] };
export const BRIDGE = { x: pt(722, 0)[0] - 48, y: pt(0, 581)[1], w: 96, h: pt(0, 602)[1] - pt(0, 581)[1] };   // verschijnt na BHC
export const GUARD = { x: pt(722, 0)[0], y: pt(0, 588)[1] };
export const BRIDGE_SIGN = { x: pt(740, 0)[0], y: pt(0, 612)[1] };
export const FINALE_RETURN = { x: pt(722, 0)[0], y: pt(0, 616)[1] };

// Bomen (rijen van de plattegrond + langs de wegen)
export const TREES = [
  ...[485, 500, 515, 530, 545, 560, 575, 590, 605].map((y) => pt(855 + (y % 2) * 4, y)),
  pt(995, 690), pt(975, 705),
  pt(1040, 610), pt(1075, 612), pt(1045, 520), pt(1015, 515),
  ...[420, 480, 540, 620, 680, 760, 880, 940].map((x) => pt(x, 830)),
  ...[620, 700, 780, 860, 940].map((x) => pt(x, 385)),
  pt(1200, 470), pt(1285, 560), pt(1280, 640),
];

// Badges voor de BHC-zoektocht (verspreid over de campus)
export const BADGE_SPOTS = [
  pt(440, 620), pt(590, 700), pt(640, 480), pt(820, 470), pt(872, 560), pt(940, 480), pt(1140, 462),
  pt(1285, 610), pt(1125, 690), pt(985, 760), pt(760, 730), pt(650, 790), pt(900, 425),
];
