import Phaser from 'phaser';
import { t } from '../core/i18n.js';
import { P, HEX, textStyle } from '../gfx/palette.js';
import { panel, button } from '../ui/widgets.js';
import { Audio } from '../core/AudioEngine.js';

const SPEAKERS = {
  petra: { tex: 'npc_petra', color: HEX.teal },
  jan: { tex: 'npc_jan', color: HEX.red },
  captain: { tex: 'npc_captain', color: HEX.pirateRed },
  guard: { tex: 'npc_guard', color: HEX.pirate },
  player: { tex: 'player', color: HEX.gold },
};

/**
 * Toon een dialoog bovenop `scene`.
 * opts: { lines:[{speaker,text}], npc:{name,tex,color}, choices:[{label,value,color}], onDone(value) }
 */
export function showDialog(scene, opts) {
  scene.dialogOpen = true;
  const done = opts.onDone;
  scene.scene.launch('Dialog', {
    ...opts,
    onDone: (v) => { scene.dialogOpen = false; done && done(v); },
  });
  scene.scene.bringToTop('Dialog');
}

export class DialogScene extends Phaser.Scene {
  constructor() { super('Dialog'); }

  init(data) {
    this.lines = data.lines || [];
    this.npc = data.npc || {};
    this.choices = data.choices;
    this.onDone = data.onDone;
    this.i = 0;
    // scène-instantie wordt hergebruikt: state resetten
    this.closing = false;
    this.typing = false;
    this.choiceLayer = null;
    this.typer = null;
  }

  create() {
    const { width, height } = this.scale;
    this.blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x0f1a2a, 0.25).setInteractive();
    this.blocker.alpha = 0;
    this.tweens.add({ targets: this.blocker, alpha: 1, duration: 200 });

    this.box = this.add.container(width / 2, height + 150);
    const bg = panel(this, 0, 0, 1180, 210);
    this.portraitBg = this.add.circle(-500, -10, 82, 0xffffff).setStrokeStyle(6, HEX.ink);
    this.portraitMask = this.make.graphics().fillCircle(0, 0, 78);
    this.portrait = this.add.sprite(-500, 70, 'player', 'idle').setOrigin(0.5, 1).setScale(1.9);
    this.nameTag = this.add.container(-500, -110);
    this.nameBg = this.add.nineslice(0, 0, 'ui_btn', undefined, 260, 54, 20, 20, 20, 24);
    this.nameText = this.add.text(0, -4, '', textStyle(24, P.cream, { stroke: P.ink, strokeThickness: 5 })).setOrigin(0.5);
    this.nameTag.add([this.nameBg, this.nameText]);
    this.text = this.add.text(-390, -70, '', textStyle(28, P.ink, { wordWrap: { width: 900 }, lineSpacing: 6 })).setOrigin(0, 0);
    this.more = this.add.text(540, 70, '▼', textStyle(26, P.inkSoft)).setOrigin(0.5);
    this.tweens.add({ targets: this.more, y: 78, duration: 400, yoyo: true, repeat: -1 });
    this.box.add([bg, this.portraitBg, this.portrait, this.nameTag, this.text, this.more]);

    // portret maskeren binnen de cirkel
    this.portraitMask.setPosition(width / 2 - 500, height - 130);
    this.portrait.setMask(this.portraitMask.createGeometryMask());

    this.tweens.add({ targets: this.box, y: height - 130, duration: 320, ease: 'Back.Out', onUpdate: () => this.portraitMask.setPosition(width / 2 - 500, this.box.y - 10) });

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());
    this.input.keyboard.on('keydown-E', () => this.advance());

    this.showLine();
  }

  resolveSpeaker(s) {
    if (typeof s === 'object') return s;
    if (s === 'npc') return { name: this.npc.name, tex: this.npc.tex, color: this.npc.color ?? HEX.gold };
    const base = SPEAKERS[s] || { tex: `npc_${s}`, color: HEX.gold };
    return { ...base, name: t(`npc.${s}`) };
  }

  showLine() {
    const line = this.lines[this.i];
    if (!line) return this.finish();
    const sp = this.resolveSpeaker(line.speaker);
    this.nameText.setText(sp.name || '');
    this.nameBg.width = Math.max(180, this.nameText.width + 50);
    this.nameBg.setTint(sp.color ?? HEX.gold);
    this.portraitBg.setFillStyle(Phaser.Display.Color.ValueToColor(sp.color ?? HEX.gold).lighten(35).color);
    if (sp.tex && this.textures.exists(sp.tex)) this.portrait.setTexture(sp.tex, 'idle').setVisible(true);
    else this.portrait.setVisible(false);
    this.portrait.setScale(1.9);
    this.tweens.add({ targets: this.portrait, scaleY: { from: 1.75, to: 1.9 }, duration: 260, ease: 'Back.Out' });

    this.full = line.text;
    this.shown = 0;
    this.text.setText('');
    this.more.setVisible(false);
    this.typing = true;
    if (this.typer) this.typer.remove();
    this.typer = this.time.addEvent({
      delay: 22, loop: true, callback: () => {
        this.shown += 1;
        this.text.setText(this.full.slice(0, this.shown));
        if (this.shown % 3 === 0) {
          Audio.sfx('type');
          if (this.portrait.visible) this.portrait.setFrame(this.portrait.frame.name === 'talk' ? 'idle' : 'talk');
        }
        if (this.shown >= this.full.length) this.endTyping();
      },
    });
  }

  endTyping() {
    this.typing = false;
    if (this.typer) this.typer.remove();
    this.text.setText(this.full);
    if (this.portrait.visible) this.portrait.setFrame('idle');
    const last = this.i === this.lines.length - 1;
    if (last && this.choices) this.showChoices();
    else this.more.setVisible(true);
  }

  showChoices() {
    if (this.choiceLayer) return;
    const { width, height } = this.scale;
    this.choiceLayer = this.add.container(0, 0);
    const n = this.choices.length;
    this.choices.forEach((c, idx) => {
      const b = button(this, width / 2 + 200, height - 270 - (n - 1 - idx) * 78, c.label, () => this.finish(c.value), { width: 520, color: c.color ?? HEX.cream, size: 24 });
      b.alpha = 0; b.x += 40;
      this.tweens.add({ targets: b, alpha: 1, x: b.x - 40, delay: idx * 80, duration: 250 });
      this.choiceLayer.add(b);
    });
  }

  advance() {
    if (this.closing) return;
    if (this.typing) return this.endTyping();
    if (this.choiceLayer) return;
    this.i++;
    Audio.sfx('click');
    this.showLine();
  }

  finish(value) {
    if (this.closing) return;
    this.closing = true;
    const { height } = this.scale;
    this.tweens.add({ targets: this.box, y: height + 160, duration: 220, ease: 'Cubic.In' });
    if (this.choiceLayer) this.tweens.add({ targets: this.choiceLayer, alpha: 0, duration: 150 });
    this.tweens.add({
      targets: this.blocker, alpha: 0, duration: 230, onComplete: () => {
        const cb = this.onDone;
        this.scene.stop();
        cb && cb(value);
      },
    });
  }
}
