// Uiterlijk van de vaste personages. Opties: zie src/gfx/CharacterFactory.js
// (top: tee/polo/hoodie/blouse/shirt, bottom: pants/shorts/skirt, eyes: dot/round/lashes/sleepy,
//  hairStyle: short/long/bob/ponytail/bun/curly/spiky/bald/up (kuif)/crew (heel kort), temples (kleur grijze slapen), age (>= 40: lachrimpeltjes), hat, accessory, badge = kleur naamkaartje).
import { P } from '../gfx/palette.js';
import { BRANDS } from './brands.js';

export const NPC_LOOKS = {
  petra: { skin: '#f8d5b5', hair: '#e8c46a', hairStyle: 'long', shirt: P.teal, top: 'polo', pants: '#2d3a4a', bottom: 'skirt', eyes: 'lashes', hat: 'headset', glasses: true, badge: P.gold, shoes: '#3b3f55' },
  // Judith (BHC)
  bhc: { skin: '#f8d5b5', hair: '#d9b45a', hairStyle: 'bob', shirt: BRANDS.bhc.css, top: 'blouse', pants: '#3a4a6b', bottom: 'skirt', eyes: 'lashes', glasses: true, badge: '#c9a85a', shoes: '#8a2d3b' },
  // Kieran (Driessen)
  driessen: { skin: '#ffe0c2', hair: '#2d1e14', hairStyle: 'spiky', shirt: BRANDS.driessen.css, top: 'polo', pants: '#2d3a4a', bottom: 'pants', eyes: 'dot', badge: '#ffffff', shoes: '#3b3f55' },
  // Anne (Bloeij)
  bloeij: { skin: '#f8d5b5', hair: '#f0d27a', hairStyle: 'long', shirt: BRANDS.bloeij.css, top: 'tee', pants: '#3d6b8a', bottom: 'shorts', eyes: 'lashes', badge: '#ffffff', shoes: '#ffffff' },
  // Bart (IJk)
  ijk: { skin: '#f8d5b5', hair: '#5f5f69', hairStyle: 'spiky', temples: '#a9a9b3', age: 42, shirt: BRANDS.ijk.css, top: 'hoodie', pants: '#3a4a6b', bottom: 'pants', eyes: 'round', shoes: '#e8504c' },
  // Roel (Haert)
  haert: { skin: '#f8d5b5', hair: '#6e6e78', hairStyle: 'crew', temples: '#c4c4cc', age: 48, shirt: BRANDS.haert.css, top: 'shirt', pants: '#5b4636', bottom: 'pants', eyes: 'dot', glasses: 'rect', badge: '#ffffff', beard: null, shoes: '#5b4636' },
  // Wendy (Reijn)
  reijn: { skin: '#f8d5b5', hair: '#5a3825', hairStyle: 'curly', shirt: '#f4efe4', top: 'tee', pattern: 'stripes', patternColor: BRANDS.reijn.css, pants: '#3b2f3f', bottom: 'shorts', eyes: 'lashes', accessory: 'earrings', shoes: '#3b2f3f' },
  // Prinses Mensenmens (sleutel blijft 'jan' zodat bestaande code werkt)
  jan: { skin: '#f5c9a0', hair: '#e8c46a', hairStyle: 'long', shirt: '#ff9ecf', top: 'blouse', pattern: 'dots', patternColor: '#ffffff', pants: '#8e5bd8', bottom: 'skirt', eyes: 'lashes', hat: 'crown', accessory: 'earrings', shoes: '#f6c33b' },
  // Kapitein Rompslomp: grijs pak, stropdas van rode tape, leesbril
  captain: { skin: '#f5c9a0', hair: '#9a9aa6', hairStyle: 'short', shirt: '#f4efe4', top: 'shirt', coat: '#5b5f6b', tie: P.pirateRed, pants: '#3b3f55', bottom: 'pants', hat: 'captain', beard: '#9a9aa6', eyepatch: true, glasses: 'rect', hook: true, angry: true, badge: '#ffffff', shoes: '#3b2f3f' },
  guard: { skin: '#b57b4c', hair: '#2d1e14', hairStyle: 'bald', shirt: '#f4efe4', top: 'tee', pattern: 'stripes', patternColor: P.pirateRed, pants: '#3b2f3f', bottom: 'shorts', hat: 'bandana', bandana: '#3b2f3f', beard: '#2d1e14', eyepatch: true, shoes: '#3b2f3f' },
};
