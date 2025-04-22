export default {
    apps: [{
        name: 'landing',
        script: 'pnpm',
        args: 'start',
        cwd: './server',
        watch: false,
        env: {
            NODE_ENV: 'production'
        }
    }]
}