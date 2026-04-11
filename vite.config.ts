import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/katex')) return 'katex';
            if (id.includes('node_modules/react-katex')) return 'katex';
            if (id.includes('node_modules/recharts')) return 'recharts';
            if (id.includes('node_modules/html2canvas')) return 'html2canvas';
            if (id.includes('lib/exportUtils')) return 'design-export';
            if (id.includes('ComplianceInfo')) return 'compliance';
            if (id.includes('SeismicDetailing')) return 'seismic';
            if (id.includes('ProfessionalComponents')) return 'professional';
            if (id.includes('calculators')) return 'calculators';
          }
        }
      }
    },
    server: {

      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
