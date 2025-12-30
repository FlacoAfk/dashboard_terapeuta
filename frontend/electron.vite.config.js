import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
    main: {
        build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
                input: {
                    main: path.resolve(__dirname, 'src/main/main.js')
                }
            }
        }
    },
    preload: {
        build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
                input: {
                    preload: path.resolve(__dirname, 'src/preload/preload.js')
                }
            }
        }
    },
    renderer: {
        root: 'src/renderer',
        build: {
            outDir: 'dist-electron/renderer',
            rollupOptions: {
                input: {
                    index: path.resolve(__dirname, 'src/renderer/index.html')
                }
            }
        },
        plugins: [
            react(),
            tailwindcss()
        ],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, 'src/renderer')
            }
        }
    }
});
