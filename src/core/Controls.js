// Besturing: toetsenbord (WASD/pijlen + spatie/E/Enter) én touch (virtuele joystick + actieknop).
import { HEX, P, textStyle } from '../gfx/palette.js';

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
    // hint-ring op vaste plek
    this.hint = s.add.circle(150, height - 150, 70, 0xffffff, 0.08).setStrokeStyle(4, 0xffffff, 0.25).setScrollFactor(0).setDepth(29999);
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
    });
    const end = (p) => {
      if (p.id !== this.joy.id) return;
      this.joy.active = false; this.joy.x = 0; this.joy.y = 0; this.joy.id = -1;
      this.base.setVisible(false); this.knob.setVisible(false); this.hint.setVisible(true);
    };
    s.input.on('pointerup', end);
    s.input.on('pointerupoutside', end);
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
