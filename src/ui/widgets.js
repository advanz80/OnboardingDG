// Herbruikbare UI-bouwstenen in cartoonstijl.
import { P, HEX, textStyle, titleStyle, textOn } from '../gfx/palette.js';
import { Audio } from '../core/AudioEngine.js';

/** Paneel (nine-slice) */
export function panel(scene, x, y, w, h, tint = 0xffffff) {
  return scene.add.nineslice(x, y, 'ui_panel', undefined, w, h, 30, 30, 30, 30).setTint(tint);
}

export function card(scene, x, y, w, h, tint = 0xffffff) {
  return scene.add.nineslice(x, y, 'ui_card', undefined, w, h, 18, 18, 18, 18).setTint(tint);
}

/**
 * Knop met hover/press-animatie. Retourneert een Container met .setEnabled().
 * opts: { color, textColor, size, icon, width, height }
 */
export function button(scene, x, y, label, onClick, opts = {}) {
  const w = opts.width || Math.max(180, label.length * (opts.size || 26) * 0.6 + 60);
  const h = opts.height || 68;
  const color = opts.color ?? HEX.gold;
  const c = scene.add.container(x, y);
  const bg = scene.add.nineslice(0, 0, 'ui_btn', undefined, w, h, 20, 20, 20, 24).setTint(color);
  const txt = scene.add.text(0, -4, label, textStyle(opts.size || 26, opts.textColor || (opts.color !== undefined ? textOn(opts.color) : P.ink))).setOrigin(0.5);
  c.add([bg, txt]);
  if (opts.icon) {
    const big = h > 80;
    const ic = scene.add.image(-w / 2 + (big ? 44 : 34), -4, 'icons', opts.icon).setScale(big ? 0.8 : 0.6);
    c.add(ic);
    txt.x += big ? 22 : 18;
  }
  c.setSize(w, h);
  c.bg = bg; c.label = txt;
  c.setInteractive({ useHandCursor: true });
  let enabled = true;
  c.on('pointerover', () => enabled && scene.tweens.add({ targets: c, scale: 1.05, duration: 100 }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 100 }));
  c.on('pointerdown', () => { if (enabled) { c.setScale(0.94); } });
  c.on('pointerup', () => {
    if (!enabled) return;
    scene.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Back.Out' });
    Audio.sfx('click');
    onClick && onClick();
  });
  c.setEnabled = (v) => { enabled = v; c.setAlpha(v ? 1 : 0.5); return c; };
  return c;
}

/** Ronde icoonknop (mute, pauze, sluiten). */
export function roundButton(scene, x, y, icon, onClick, size = 64, tint = 0xffffff) {
  const c = scene.add.container(x, y);
  const bg = scene.add.image(0, 0, 'ui_round').setDisplaySize(size, size).setTint(tint);
  const ic = typeof icon === 'string' && icon.length > 2
    ? scene.add.image(0, -2, 'icons', icon).setDisplaySize(size * 0.62, size * 0.62)
    : scene.add.text(0, -2, icon, textStyle(size * 0.45)).setOrigin(0.5);
  c.add([bg, ic]);
  c.icon = ic;
  c.setSize(size, size).setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => c.setScale(0.9));
  c.on('pointerup', () => { scene.tweens.add({ targets: c, scale: 1, duration: 140, ease: 'Back.Out' }); Audio.sfx('click'); onClick(); });
  c.on('pointerout', () => c.setScale(1));
  return c;
}

/** Voortgangsbalk. setValue(0..1) animeert. */
export function meter(scene, x, y, w, h, color = HEX.green, label = '') {
  const c = scene.add.container(x, y);
  const bg = scene.add.nineslice(0, 0, 'ui_bar', undefined, w, h, 12, 12, 12, 12).setOrigin(0, 0.5).setTint(0x4a3a4d);
  const fill = scene.add.nineslice(4, 0, 'ui_fill', undefined, w - 8, h - 8, 10, 10, 10, 10).setOrigin(0, 0.5).setTint(color);
  const shine = scene.add.rectangle(10, -h / 4 + 1, w - 20, 3, 0xffffff, 0.35).setOrigin(0, 0.5);
  c.add([bg, fill, shine]);
  if (label) c.add(scene.add.text(w / 2, 0, label, textStyle(Math.round(h * 0.5), P.cream, { stroke: P.ink, strokeThickness: 4 })).setOrigin(0.5));
  c.value = 1;
  c.fill = fill;
  c.setValue = (v, instant = false) => {
    v = Phaser.Math.Clamp(v, 0, 1);
    c.value = v;
    const target = Math.max(0.0001, (w - 8) * v);
    fill.setVisible(v > 0.01);
    if (instant) fill.width = target;
    else scene.tweens.add({ targets: fill, width: target, duration: 250, ease: 'Cubic.Out' });
    shine.width = Math.max(0, (w - 20) * v);
  };
  c.setColor = (col) => fill.setTint(col);
  return c;
}

export function title(scene, x, y, text, size = 64, color = P.gold) {
  return scene.add.text(x, y, text, titleStyle(size, color)).setOrigin(0.5);
}

/** Logo van een bedrijf, met fallback-badge als het bestand ontbreekt. */
export function logo(scene, brand, x, y, size = 96) {
  const key = scene.textures.exists(`logobadge_${brand.id}`) ? `logobadge_${brand.id}` : `logofb_${brand.id}`;
  return scene.add.image(x, y, key).setDisplaySize(size, size);
}

/** Zachte fade naar een andere scène. */
export function transitionTo(scene, key, data, opts = {}) {
  const cam = scene.cameras.main;
  Audio.sfx('whoosh');
  cam.fadeOut(opts.duration || 350, 15, 61, 92);
  cam.once('camerafadeoutcomplete', () => {
    if (opts.stopSelf === false) scene.scene.launch(key, data);
    else scene.scene.start(key, data);
  });
}

/** Overlay om de achterliggende scène te dimmen. */
export function dim(scene, alpha = 0.55, depth = 0) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(width / 2, height / 2, width, height, 0x0f1a2a, alpha).setDepth(depth).setScrollFactor(0).setInteractive();
}

export function iconImg(scene, x, y, name, size = 48) {
  return scene.add.image(x, y, 'icons', name).setDisplaySize(size, size);
}

/**
 * Bak een statische Graphics éénmalig naar een texture (Graphics worden anders
 * elk frame opnieuw opgebouwd — duur op telefoons).
 */
export function bake(scene, g, key, x, y, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const dt = scene.textures.addDynamicTexture(key, w, h);
  dt.draw(g, -x, -y);
  const depth = g.depth;
  g.destroy();
  return scene.add.image(x, y, key).setOrigin(0).setDepth(depth);
}
