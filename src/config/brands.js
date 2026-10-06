// Huisstijl per bedrijf. De kleuren zijn een schatting — vervang ze door de
// officiële hex-codes. `color` gebruik je in Phaser (0xRRGGBB), `css` in tekst.
// `logo` wordt geladen uit public/assets/logos/. Ontbreekt een logo, dan tekent
// het spel automatisch een badge met `initials` in de huisstijlkleur.

const hex = (s) => ({ color: parseInt(s.slice(1), 16), css: s });

export const BRANDS = {
  bhc: {
    id: 'bhc', name: 'Brainport Human Campus', short: 'BHC', initials: 'BHC',
    ...hex('#3D2152'), dark: '#24102F', logo: 'bhc.png', scene: 'BhcMission',
  },
  driessen: {
    id: 'driessen', name: 'Driessen', short: 'Driessen', initials: 'D',
    ...hex('#E2001A'), dark: '#9E0012', logo: 'driessen.png', scene: 'DriessenMission',
  },
  bloeij: {
    id: 'bloeij', name: 'Bloeij', short: 'Bloeij', initials: 'B',
    ...hex('#EDB23E'), dark: '#B07F1C', logo: 'bloeij.png', scene: 'BloeijMission',
  },
  ijk: {
    id: 'ijk', name: 'IJk', short: 'IJk', initials: 'IJk',
    ...hex('#66A48B'), dark: '#437563', logo: 'ijk.png', scene: 'IjkMission',
  },
  haert: {
    id: 'haert', name: 'Haert', short: 'Haert', initials: 'H',
    ...hex('#EC6A54'), dark: '#B0402E', logo: 'haert.png', scene: 'HaertMission',
  },
  reijn: {
    id: 'reijn', name: 'Reijn', short: 'Reijn', initials: 'R',
    ...hex('#A84F27'), dark: '#6E3015', logo: 'reijn.png', scene: 'ReijnMission',
  },
};

export const MISSION_IDS = ['bhc', 'driessen', 'bloeij', 'ijk', 'haert', 'reijn'];
