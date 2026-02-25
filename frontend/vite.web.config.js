import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src/renderer')
        }
    },
    server: {
        port: Number(process.env.FRONTEND_WEB_PORT || 5173)
    },
    build: {
        outDir: 'dist-web',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                index: path.resolve(__dirname, 'src/web/index.html')
            },
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    alerts: ['sweetalert2']
                }
            }
        }
    }
});
