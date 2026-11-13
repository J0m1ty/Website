import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        // Keep fonts as files: inlined, every subset would land in the
        // render-blocking CSS even though the browser only needs one or two.
        assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
    },
});
