/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    async headers() {
        return [
            {
                source: '/api/user/autologin',
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store"
                    }
                ]
            },
            {
                source: '/api/group',
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-store"
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
