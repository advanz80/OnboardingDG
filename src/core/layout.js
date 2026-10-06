// Schermvullende lay-out.
// Het spel is ontworpen op 1280×720 (16:9). Op bredere schermen (bv. iPhone in landschap)
// wordt de gamebreedte groter gekozen, zodat het park, het menu en de HUD het scherm vullen.
// Scènes met een vaste lay-out (missies, finale, karaktereditor) blijven 1280×720 en worden
// gecentreerd; hun achtergrond wordt naar de zijkanten doorgetrokken.

export const DESIGN = { width: 1280, height: 720 };
export const MAX_WIDTH = 2160; // tot 3:1 (iPhone in Safari met adres- en tabbalk)

/** Gewenste gamebreedte voor het huidige venster (hoogte is altijd 720). */
export function gameWidth() {
  const vw = window.visualViewport?.width || window.innerWidth;
  const vh = window.visualViewport?.height || window.innerHeight;
  if (!vw || !vh || vw < vh) return DESIGN.width; // portret: standaard 16:9
  return Math.round(Math.min(MAX_WIDTH, Math.max(DESIGN.width, (DESIGN.height * vw) / vh)) / 2) * 2;
}

/** Centreer een scène met vaste 1280×720-lay-out en trek de achtergrond door. */
export function centerDesign(scene, sideColor) {
  const { width, height } = scene.scale;
  const ox = (width - DESIGN.width) / 2, oy = (height - DESIGN.height) / 2;
  const cam = scene.cameras.main;
  cam.setScroll(-ox, -oy);
  if (sideColor) cam.setBackgroundColor(sideColor);
  if (ox <= 0) return;
  for (const o of scene.children.list.slice()) {
    if (o.depth > -90 || o.scrollFactorX === 0) continue;
    if (o.type === 'TileSprite' && o.width >= DESIGN.width - 10) {
      o.setPosition(o.x - ox, o.y);
      o.setSize(o.width + 2 * ox, o.height);
    } else if (o.type === 'Image' && o.originX === 0 && o.displayWidth >= DESIGN.width - 10) {
      // gespiegelde kopieën links en rechts: naadloos, zonder uitrekken
      for (const side of [-1, 1]) {
        const copy = scene.add.image(o.x + side * o.displayWidth, o.y, o.texture.key, o.frame.name)
          .setOrigin(0).setScale(o.scaleX, o.scaleY).setFlipX(!o.flipX).setDepth(o.depth).setAlpha(o.alpha);
        if (o.isTinted) copy.setTint(o.tintTopLeft);
      }
    } else if (o.type === 'Rectangle' && o.width >= DESIGN.width - 10) {
      o.x -= ox;
      o.setSize(o.width + 2 * ox, o.height);
    }
  }
}
