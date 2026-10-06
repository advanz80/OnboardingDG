// Besturing: toetsenbord (WASD/pijlen + spatie/E/Enter) én touch (virtuele joystick + actieknop).
import { HEX, P, textStyle } from '../gfx/palette.js';
import { t } from './i18n.js';

export function isTouch(scene) {
  return scene.sys.game.device.input.touch && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
}

export class Controls {
  constructor(scene, { actionLabel = '!', showAction = true } = {}) {
    this.scene = scene;
    const kb = scene.input.keyboard;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,E,ENTER');
    this._action = false;
    // Event-gebaseerd i.p.v. JustDown: ook een héél korte tik telt.
    const hit = () => { if (this.enabled) this._action = true; };
    kb.on('keydown-SPACE', hit); kb.on('keydown-E', hit); kb.on('keydown-ENTER', hit);
    this.joy = { x: 0, y: 0, active: false, id: -1 };
    this.touch = isTouch(scene);
    this.enabled = true;
    if (this.touch) this._buildTouch(actionLabel, showAction);
  }

  _buildTouch(actionLabel, showAction) {
    const s = this.scene;
    s.input.addPointer(2);
    const { width, height } = s.scale;
    this.base = s.add.circle(0, 0, 70, 0xffffff, 0.18).setStrokeStyle(5, 0xffffff, 0.5).setScrollFactor(0).setDepth(30000).setVisible(false);
    this.knob = s.add.circle(0, 0, 34, 0xffffff, 0.55).setStrokeStyle(4, HEX.ink, 0.6).setScrollFactor(0).setDepth(30001).setVisible(false);
    // duidelijke stuurcirkel op vaste plek: ring, knopje, pijltjes en (tot de eerste keer lopen) een label
    const hx = 150, hy = height - 150;
    this.hintPos = { x: hx, y: hy };
    this.hint = s.add.container(hx, hy).setScrollFactor(0).setDepth(29999);
    const ring = s.add.circle(0, 0, 74, 0xffffff, 0.22).setStrokeStyle(6, 0xffffff, 0.85);
    const knob = s.add.circle(0, 0, 30, 0xffffff, 0.8).setStrokeStyle(4, HEX.ink, 0.6);
    this.hint.add([ring, knob]);
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2, r = 54;
      const tri = s.add.triangle(Math.cos(a) * r, Math.sin(a) * r, 0, -11, 0, 11, 14, 0, 0xffffff, 0.95).setStrokeStyle(2, HEX.ink, 0.5).setRotation(a);
      this.hint.add(tri);
    }
    s.tweens.add({ targets: knob, scale: 1.15, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.hintLabel = s.add.text(0, -104, t('hud.dragToWalk'), textStyle(22, P.ink, { backgroundColor: '#fff8e7', padding: { x: 10, y: 5 } })).setOrigin(0.5);
    this.hint.add(this.hintLabel);
    this.moved = false;
    if (showAction) {
      this.btn = s.add.container(width - 135, height - 145).setScrollFactor(0).setDepth(30000);
      const bg = s.add.image(0, 0, 'ui_round').setDisplaySize(160, 160).setTint(HEX.gold).setAlpha(0.92);
      const tx = s.add.text(0, -4, actionLabel, textStyle(56, P.ink)).setOrigin(0.5);
      this.btn.add([bg, tx]);
      this.btn.setSize(210, 210).setInteractive();
      this.btn.on('pointerdown', () => { this._action = true; this.btn.setScale(0.9); });
      this.btn.on('pointerup', () => this.btn.setScale(1));
      this.btn.on('pointerout', () => this.btn.setScale(1));
    }
    s.input.on('pointerdown', (p, over) => {
      if (!this.enabled || this.joy.active || over.length || p.x > width * 0.55) return;
      this.joy.active = true; this.joy.id = p.id;
      this.joy.ox = p.x; this.joy.oy = p.y;
      this.base.setPosition(p.x, p.y).setVisible(true);
      this.knob.setPosition(p.x, p.y).setVisible(true);
      this.hint.setVisible(false);
    });
    s.input.on('pointermove', (p) => {
      if (!this.joy.active || p.id !== this.joy.id) return;
      const dx = p.x - this.joy.ox, dy = p.y - this.joy.oy;
      const len = Math.hypot(dx, dy), max = 70;
      const k = len > max ? max / len : 1;
      this.knob.setPosition(this.joy.ox + dx * k, this.joy.oy + dy * k);
      const m = Math.min(1, len / max);
      this.joy.x = len > 8 ? (dx / len) * m : 0;
      this.joy.y = len > 8 ? (dy / len) * m : 0;
      if (len > 20 && !this.moved) { this.moved = true; this.hintLabel.setVisible(false); this.onFirstMove?.(); }
    });
    const end = (p) => {
      if (p.id !== this.joy.id) return;
      this.joy.active = false; this.joy.x = 0; this.joy.y = 0; this.joy.id = -1;
      this.base.setVisible(false); this.knob.setVisible(false); this.hint.setVisible(true);
    };
    s.input.on('pointerup', end);
    s.input.on('pointerupoutside', end);
  }

  /**
   * Uitleg bij de eerste keer spelen op een telefoon/tablet: pijl + bewegende duim naar de
   * stuurcirkel en een pijl naar de actieknop. Verdwijnt zodra je loopt of op "Begrepen" tikt.
   */
  showCoach(onDone) {
    if (!this.touch || this.coach) return;
    const s = this.scene, { width, height } = s.scale, { x: hx, y: hy } = this.hintPos;
    const c = s.add.container(0, 0).setScrollFactor(0).setDepth(29990);
    this.coach = c;
    c.add(s.add.rectangle(0, 0, width, height, 0x0f1e2e, 0.55).setOrigin(0));
    // uitleg-kaart
    const card = s.add.container(width * 0.42, height * 0.4);
    const tx = s.add.text(0, -22, t('hud.coachMove'), textStyle(30, P.ink, { align: 'center', wordWrap: { width: 560 } })).setOrigin(0.5);
    const bg = s.add.nineslice(0, 0, 'ui_card', undefined, 620, tx.height + 130, 18, 18, 18, 18);
    const ok = s.add.text(0, tx.height / 2 + 18, t('hud.coachOk'), textStyle(26, P.ink, { backgroundColor: '#f6c33b', padding: { x: 22, y: 10 } })).setOrigin(0.5).setInteractive({ useHandCursor: true });
    card.add([bg, tx, ok]);
    c.add(card);
    // pijl van de kaart naar de stuurcirkel
    const arrow = s.add.graphics();
    const ax0 = card.x - 200, ay0 = card.y + bg.height / 2 + 10, ax1 = hx + 40, ay1 = hy - 95;
    arrow.lineStyle(10, 0xf6c33b, 1).beginPath().moveTo(ax0, ay0).lineTo(ax1, ay1).strokePath();
    const ang = Math.atan2(ay1 - ay0, ax1 - ax0);
    arrow.fillStyle(0xf6c33b, 1).fillTriangle(ax1 + Math.cos(ang) * 22, ay1 + Math.sin(ang) * 22, ax1 + Math.cos(ang + 2.4) * 26, ay1 + Math.sin(ang + 2.4) * 26, ax1 + Math.cos(ang - 2.4) * 26, ay1 + Math.sin(ang - 2.4) * 26);
    c.add(arrow);
    // pulserende ring + duim die een rondje schuift
    const glow = s.add.circle(hx, hy, 90, 0xf6c33b, 0).setStrokeStyle(8, 0xf6c33b, 0.9);
    s.tweens.add({ targets: glow, scale: 1.25, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });
    const thumb = s.add.container(hx, hy);
    thumb.add([s.add.ellipse(0, 0, 46, 58, 0xf5c9a0).setStrokeStyle(4, HEX.ink), s.add.ellipse(0, -14, 26, 20, 0xffe7d4).setStrokeStyle(2, HEX.ink, 0.5)]);
    const path = { a: 0 };
    s.tweens.add({ targets: path, a: Math.PI * 2, duration: 2200, repeat: -1, onUpdate: () => thumb.setPosition(hx + Math.cos(path.a) * 40, hy + Math.sin(path.a) * 40 + 10) });
    c.add([glow, thumb]);
    // actieknop
    if (this.btn) {
      const bx = this.btn.x, by = this.btn.y;
      const ring2 = s.add.circle(bx, by, 96, 0xffffff, 0).setStrokeStyle(8, 0xffffff, 0.9);
      s.tweens.add({ targets: ring2, scale: 1.15, duration: 700, yoyo: true, repeat: -1 });
      const t2 = s.add.text(bx - 30, by - 150, t('hud.coachAction'), textStyle(24, P.ink, { backgroundColor: '#fff8e7', padding: { x: 10, y: 6 }, align: 'center', wordWrap: { width: 300 } })).setOrigin(0.5, 1);
      c.add([ring2, t2]);
    }
    c.setAlpha(0);
    s.tweens.add({ targets: c, alpha: 1, duration: 300 });
    const close = () => {
      if (!this.coach) return;
      this.coach = null; this.onFirstMove = null;
      s.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: () => c.destroy() });
      onDone?.();
    };
    ok.on('pointerdown', close);
    this.moved = false; this.hintLabel.setVisible(true);
    this.onFirstMove = () => s.time.delayedCall(700, close);
  }

  setActionLabel(t) { if (this.btn) this.btn.list[1].setText(t); }
  /** Op touch blijft de knop altijd staan; zonder doel wordt hij gedimd. */
  setActionVisible(v) { if (this.btn) this.btn.setAlpha(v ? 1 : 0.4); }
  /** Actie van buitenaf aanzetten (bv. tik op het "Praten"-label of op een personage). */
  trigger() { if (this.enabled) this._action = true; }
  setVisible(v) {
    if (this.hint) this.hint.setVisible(v);
    if (this.btn) this.btn.setVisible(v);
    if (!v && this.base) { this.base.setVisible(false); this.knob.setVisible(false); this.joy.active = false; this.joy.x = this.joy.y = 0; }
  }

  /** Bewegingsvector (lengte 0..1). */
  vector() {
    if (!this.enabled) return { x: 0, y: 0 };
    const k = this.keys;
    let x = 0, y = 0;
    if (k.A.isDown || k.LEFT.isDown) x -= 1;
    if (k.D.isDown || k.RIGHT.isDown) x += 1;
    if (k.W.isDown || k.UP.isDown) y -= 1;
    if (k.S.isDown || k.DOWN.isDown) y += 1;
    if (x || y) { const l = Math.hypot(x, y); return { x: x / l, y: y / l }; }
    return { x: this.joy.x, y: this.joy.y };
  }

  /** True op het frame dat actie werd ingedrukt. */
  action() {
    if (!this.enabled) { this._action = false; return false; }
    const hit = this._action;
    this._action = false;
    return hit;
  }
}
