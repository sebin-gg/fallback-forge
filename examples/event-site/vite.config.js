import react from '@vitejs/plugin-react';
import fallbackForge from 'fallback-forge';
import { defineConfig } from 'vite';
import { mockApi } from './scripts/mock-api.mjs';

export default defineConfig({
  plugins: [react(), fallbackForge(), mockApi()],
});
