// Volledig scherm: adresbalk en tabbladen weg tijdens het spelen.
// Android/desktop: Fullscreen API (moet vanuit een tik/klik). iPhone kent die niet
// voor webpagina's; daar werkt alleen 'Zet op beginscherm' (manifest: display fullscreen).
const doc = document;
const root = doc.documentElement;

export const isIOS = /iP(hone|od|ad)/.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches
  || navigator.standalone === true;
export const canFullscreen = !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled) && !isIOS;

export function isFullscreen() {
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export function enterFullscreen() {
  if (!canFullscreen || isFullscreen()) return;
  try {
    const req = root.requestFullscreen ? root.requestFullscreen({ navigationUI: 'hide' }) : root.webkitRequestFullscreen?.();
    Promise.resolve(req)
      .then(() => screen.orientation?.lock?.('landscape').catch(() => {}))
      .catch(() => {});
  } catch { /* niet toegestaan: gewoon doorspelen */ }
}

export function exitFullscreen() {
  if (!isFullscreen()) return;
  try { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc)?.catch?.(() => {}); } catch { /* */ }
}

export function toggleFullscreen() {
  if (isFullscreen()) exitFullscreen(); else enterFullscreen();
}
