import nl from '../content/nl.json';

const lookup = (key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), nl);

let vars = {};
/** Globale variabelen die in elke tekst beschikbaar zijn, bv. {naam}. */
export function setTextVars(v) { vars = { ...vars, ...v }; }

function fill(str, local) {
  const all = { ...vars, ...local };
  return str.replace(/\{(\w+)\}/g, (m, k) => (all[k] !== undefined ? all[k] : m));
}

function deepFill(v, local) {
  if (typeof v === 'string') return fill(v, local);
  if (Array.isArray(v)) return v.map((x) => deepFill(x, local));
  if (v && typeof v === 'object') {
    const out = {};
    for (const k in v) out[k] = deepFill(v[k], local);
    return out;
  }
  return v;
}

/** Tekst ophalen uit src/content/nl.json, bv. t('menu.newGame'). */
export function t(key, local = {}) {
  const v = lookup(key);
  if (v === undefined) {
    console.warn('[i18n] ontbrekende tekst:', key);
    return key;
  }
  return deepFill(v, local);
}

export function has(key) { return lookup(key) !== undefined; }
