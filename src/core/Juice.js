// Juice: screen shake, particles, zwevende teksten, pop-tweens.
import { HEX, P, textStyle } from '../gfx/palette.js';

export const CONFETTI = [HEX.red, HEX.gold, HEX.blue, HEX.green, HEX.pink, HEX.teal, HEX.orange];

export function shake(scene, intensity = 0.006, duration = 180) {
  scene.cameras.main.shake(duration, intensity);
}

export function flash(scene, color = 0xffffff, duration = 120) {
  const c = Phaser.Display.Color.IntegerToColor(color);
  scene.cameras.main.flash(duration, c.red, c.green, c.blue);
}

/** Eenmalige burst. type: 'confetti' | 'coins' | 'stars' | 'splash' | 'smoke' | 'sparkle' */
export function burst(scene, x, y, type = 'sparkle', count = 16, opts = {}) {
  const cfg = {
    confetti: { tex: 'px_confetti', speed: { min: 200, max: 520 }, gravityY: 600, lifespan: 1600, rotate: { start: 0, end: 720 }, scale: { start: 1, end: 0.6 }, tint: CONFETTI, angle: { min: 200, max: 340 } },
    coins: { tex: 'px_coin', speed: { min: 180, max: 380 }, gravityY: 800, lifespan: 900, scale: { start: 1, end: 0.6 }, angle: { min: 220, max: 320 } },
    stars: { tex: 'px_star', speed: { min: 80, max: 260 }, lifespan: 700, scale: { start: 0.9, end: 0 }, tint: [HEX.gold, 0xffffff, HEX.yellow], rotate: { start: 0, end: 180 } },
    splash: { tex: 'px_drop', speed: { min: 80, max: 220 }, gravityY: 500, lifespan: 600, scale: { start: 0.9, end: 0.2 }, tint: [0xffffff, HEX.waterLight], angle: { min: 220, max: 320 } },
    smoke: { tex: 'px_smoke', speed: { min: 20, max: 90 }, lifespan: 900, scale: { start: 0.6, end: 1.6 }, alpha: { start: 0.8, end: 0 }, tint: [0xffffff, 0xdddddd] },
    sparkle: { tex: 'px_dot', speed: { min: 60, max: 220 }, lifespan: 500, scale: { start: 0.8, end: 0 }, tint: [0xffffff, HEX.yellow] },
    hearts: { tex: 'px_dot', speed: { min: 60, max: 160 }, lifespan: 700, scale: { start: 0.9, end: 0 }, tint: [HEX.pink, HEX.red] },
  }[type];
  const { tex, ...rest } = cfg;
  const em = scene.add.particles(0, 0, tex, { ...rest, ...opts, emitting: false });
  em.setDepth(opts.depth ?? 10000);
  if (opts.scrollFactor !== undefined) em.setScrollFactor(opts.scrollFactor);
  em.explode(count, x, y);
  scene.time.delayedCall((rest.lifespan?.max || rest.lifespan || 1000) + 200, () => em.destroy());
  return em;
}

export function confettiRain(scene, duration = 2500) {
  const { width } = scene.scale;
  const em = scene.add.particles(0, 0, 'px_confetti', {
    x: { min: 0, max: width }, y: -20, speedY: { min: 150, max: 320 }, speedX: { min: -60, max: 60 },
    rotate: { start: 0, end: 540 }, lifespan: 3500, tint: CONFETTI, quantity: 3, frequency: 30,
  });
  em.setDepth(20000).setScrollFactor(0);
  scene.time.delayedCall(duration, () => em.stop());
  scene.time.delayedCall(duration + 3600, () => em.destroy());
  return em;
}

export function floatText(scene, x, y, text, color = P.gold, size = 30) {
  // Rode tekst (fout/uitleg) blijft langer staan en is iets groter, zodat je hem kunt lezen.
  const warn = color === P.red;
  const fs = warn ? Math.max(size, 26) : size;
  const t = scene.add.text(x, y, text, textStyle(fs, color, { stroke: warn ? P.cream : P.ink, strokeThickness: warn ? 7 : 6, align: 'center', wordWrap: { width: 520 } })).setOrigin(0.5).setDepth(15000);
  t.setScale(0.4);
  scene.tweens.add({ targets: t, scale: 1, duration: 220, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, y: y - (warn ? 30 : 70), alpha: 0, delay: warn ? 2200 : 350, duration: warn ? 600 : 700, ease: 'Cubic.In', onComplete: () => t.destroy() });
  return t;
}

export function popIn(scene, target, delay = 0, scale = 1) {
  target.setScale(0);
  return scene.tweens.add({ targets: target, scale, duration: 380, delay, ease: 'Back.Out' });
}

export function pulse(scene, target, amount = 1.12, duration = 120) {
  const sx = target.scaleX, sy = target.scaleY;
  scene.tweens.add({ targets: target, scaleX: sx * amount, scaleY: sy * amount, duration, yoyo: true, ease: 'Quad.Out', onComplete: () => target.setScale(sx, sy) });
}

export function wobble(scene, target) {
  scene.tweens.add({ targets: target, angle: { from: -8, to: 8 }, duration: 60, yoyo: true, repeat: 3, onComplete: () => target.setAngle(0) });
}

/** Korte bevriezing voor impact. */
export function hitstop(scene, ms = 60) {
  scene.tweens.timeScale = 0.05; scene.time.timeScale = 0.05;
  setTimeout(() => { scene.tweens.timeScale = 1; scene.time.timeScale = 1; }, ms);
}
