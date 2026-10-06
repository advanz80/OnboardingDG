// Slepen óf tikken-tikken: werkt met muis en touch.
// items: containers met .home {x,y}; targets: [{ obj, data }]; onDrop(item, target) retourneert true als het item "op" is.
import { Audio } from '../core/AudioEngine.js';

export function dragTap(scene, { onDrop, onSelect }) {
  scene.input.dragDistanceThreshold = 10;
  const api = { selected: null, targets: [] };

  api.returnHome = (item) => {
    scene.tweens.add({ targets: item, x: item.home.x, y: item.home.y, scale: 1, duration: 260, ease: 'Back.Out', onComplete: () => item.setDepth(item.baseDepth ?? 20) });
  };

  api.select = (item) => {
    if (api.selected && api.selected !== item) api.deselect();
    if (api.selected === item) return api.deselect();
    api.selected = item;
    item.setDepth(90);
    scene.tweens.add({ targets: item, scale: 1.08, duration: 120 });
    if (item.highlight) item.highlight.setVisible(true);
    Audio.sfx('select');
    onSelect && onSelect(item);
  };

  api.deselect = () => {
    const it = api.selected;
    if (!it) return;
    api.selected = null;
    if (it.active) {
      scene.tweens.add({ targets: it, scale: 1, duration: 120 });
      it.setDepth(it.baseDepth ?? 20);
      if (it.highlight) it.highlight.setVisible(false);
    }
  };

  api.addItem = (item, w, h) => {
    item.setSize(w, h).setInteractive({ draggable: true, useHandCursor: true });
    item.on('dragstart', () => {
      if (item.locked) return;
      api.deselect();
      item.setDepth(100);
      scene.tweens.add({ targets: item, scale: 1.08, duration: 100 });
      Audio.sfx('select');
    });
    item.on('drag', (_p, x, y) => { if (!item.locked) item.setPosition(x, y); });
    item.on('dragend', (p) => {
      if (item.locked) return;
      const t = api.targets.find((tg) => tg.obj.active && tg.obj.getBounds().contains(p.worldX, p.worldY));
      if (!(t && onDrop(item, t))) api.returnHome(item);
    });
    item.on('pointerup', (p) => {
      if (item.locked || p.getDistance() > 10) return;
      api.select(item);
    });
  };

  api.addTarget = (obj, data) => {
    const t = { obj, data };
    api.targets.push(t);
    obj.setInteractive({ useHandCursor: true });
    obj.on('pointerup', (p) => {
      if (!api.selected || p.getDistance() > 10) return;
      const it = api.selected;
      api.deselect();
      if (!onDrop(it, t)) api.returnHome(it);
    });
    return t;
  };

  api.removeTarget = (obj) => { api.targets = api.targets.filter((t) => t.obj !== obj); };
  return api;
}
