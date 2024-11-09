import { defineConfig } from '@farmfe/core';

export default defineConfig({
    compilation: {
        input: {
            index: './src/index.html'
        },
        output: {
            path: 'dist'
        },
        lazyCompilation: false
    },
    plugins: [
        '@farmfe/plugin-react'
    ]
});