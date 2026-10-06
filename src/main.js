import Phaser from 'phaser';
import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/pirata-one/400.css';

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { CharacterScene } from './scenes/CharacterScene.js';
import { WorldScene } from './scenes/WorldScene.js';
import { HUDScene } from './scenes/HUDScene.js';
import { DialogScene } from './scenes/DialogScene.js';
import { LeaderboardScene } from './scenes/LeaderboardScene.js';
import { FinaleScene } from './scenes/FinaleScene.js';
import { CreditsScene } from './scenes/CreditsScene.js';
import { MISSION_SCENES } from './scenes/missions/index.js';
import { SaveManager } from './core/SaveManager.js';
import { Leaderboard } from './core/Leaderboard.js';
import { Audio } from './core/AudioEngine.js';
import { gameWidth } from './core/layout.js';

window.Phaser = Phaser;

async function start() {
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('600 24px Fredoka'),
        document.fonts.load('700 24px Fredoka'),
        document.fonts.load('400 24px "Pirata One"'),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch { /* fallback-fonts */ }
  document.getElementById('loading')?.remove();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: gameWidth(),
    height: 720,
    backgroundColor: '#0f3d5c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    dom: { createContainer: true },
    input: { activePointers: 3 },
    render: { antialias: true, powerPreference: 'high-performance' },
    fps: { target: 60 },
    scene: [BootScene, MenuScene, CharacterScene, WorldScene, HUDScene, DialogScene, LeaderboardScene, FinaleScene, CreditsScene, ...MISSION_SCENES],
  });

  // Schermverhouding veranderd (bv. telefoon gedraaid)? In het menu passen we de breedte aan.
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = gameWidth();
      if (Math.abs(w - game.scale.width) < 16) return;
      const menu = game.scene.getScene('Menu');
      if (game.scene.isActive('Menu')) { game.scale.setGameSize(w, 720); menu.scene.restart(); }
    }, 300);
  });

  // Audio ontgrendelen bij eerste interactie
  const noAudio = new URLSearchParams(location.search).has('noaudio');
  const unlock = () => { if (!noAudio) Audio.unlock(); };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchend', unlock);

  // Speeltijd bijhouden (alleen tijdens actief spel)
  let saveAcc = 0;
  game.events.on('step', (_t, delta) => {
    if (!SaveManager.clockRunning || document.hidden) return;
    SaveManager.addTime(Math.min(delta, 100));
    saveAcc += delta;
    if (saveAcc > 5000) { saveAcc = 0; SaveManager.save(); }
  });

  if (new URLSearchParams(location.search).has('debug')) { window.__game = game; window.__audio = Audio; window.__lb = Leaderboard; }
}

start();
