import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Sync and rename generated RPG concept art into static public assets
const sourceDir = 'C:\\Users\\vivan\\.gemini\\antigravity-ide\\brain\\87f9ef14-80d2-458f-9d7b-f7dc8ff15d36';
const targetDir = path.resolve(__dirname, 'public/assets');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

if (fs.existsSync(sourceDir)) {
  try {
    const files = fs.readdirSync(sourceDir);
    files.forEach(file => {
      let targetName = '';
      if (file.startsWith('lost_kingdom_art')) targetName = 'world1.png';
      else if (file.startsWith('planet_nova_art')) targetName = 'world2.png';
      else if (file.startsWith('wizard_academy_art')) targetName = 'world3.png';
      else if (file.startsWith('become_ceo_art')) targetName = 'world4.png';
      else if (file.startsWith('zombie_survival_art')) targetName = 'world5.png';
      else if (file.startsWith('detective_mystery_art')) targetName = 'world6.png';
      else if (file.startsWith('treasure_island_art')) targetName = 'world7.png';
      else if (file.startsWith('hospital_emergency_art')) targetName = 'world8.png';
      else if (file.startsWith('tournament_arena_art')) targetName = 'world9.png';
      else if (file.startsWith('build_company_art')) targetName = 'world10.png';
      else if (file.startsWith('around_world_art')) targetName = 'world11.png';
      else if (file.startsWith('fire_rescue_art')) targetName = 'world12.png';

      if (targetName) {
        const srcFile = path.join(sourceDir, file);
        const destFile = path.join(targetDir, targetName);
        fs.copyFileSync(srcFile, destFile);
      }
    });
  } catch (err) {
    console.error('Error syncing assets:', err);
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: false
  }
});
