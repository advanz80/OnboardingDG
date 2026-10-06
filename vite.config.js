import { defineConfig } from 'vite';

// GitHub Pages serveert de site op https://<user>.github.io/<repo>/
// Pas REPO_BASE aan als de repository een andere naam krijgt.
const REPO_BASE = '/OnboardingDG/';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.BASE_PATH || REPO_BASE) : '/',
  build: {
    chunkSizeWarningLimit: 2500,
    assetsInlineLimit: 0,
  },
  server: { host: true },
}));
