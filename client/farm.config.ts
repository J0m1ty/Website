import { defineConfig } from '@farmfe/core';
import farmPluginPostcss from '@farmfe/js-plugin-postcss';

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
    publicDir: 'public',
    plugins: [
        '@farmfe/plugin-react',
        farmPluginPostcss()
    ]
});