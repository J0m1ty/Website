import { defineConfig } from '@farmfe/core';

export default defineConfig({
    compilation: {
        input: {
            index: './src/index.html'
        },
        output: {
            path: 'dist',
            filename: '[name].[hash].v2.js'
        },
        lazyCompilation: false
    },
    publicDir: 'public',
    plugins: [
        '@farmfe/plugin-react'
    ]
});