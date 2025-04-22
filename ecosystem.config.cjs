module.exports = {
    apps: [{
        name: 'landing-page',
        script: 'npm',
        args: 'start',
        cwd: './server',
        watch: false,
        env: {
            NODE_ENV: 'production'
        }
    }]
}