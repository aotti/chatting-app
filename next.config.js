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
                        value: "public, s-maxage=1"
                    }
                ]
            },
            {
                source: '/api/group',
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, s-maxage=1"
                    }
                ]
            }
        ]
    }
}

module.exports = nextConfig
