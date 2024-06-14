/** @type {import('next').NextConfig} */

const { NormalModuleReplacementPlugin } = require('webpack')

const nextConfig = {
    webpack: (config, {isServer}) => {
        if(!isServer) {
            config.resolve.fallback.fs = false
            config.resolve.fallback.dns = false
            config.resolve.fallback.net = false
        }
        config.plugins.push(
            new NormalModuleReplacementPlugin(/^hexoid$/, require.resolve('hexoid/dist/index.js'))
        )
        return config
    }
}

module.exports = nextConfig
