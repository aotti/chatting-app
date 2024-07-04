import Index from "./components"

export default function Page() {
    // pubnub keys
    const pubnubKeys = {
        sub: process.env.PUBNUB_SUB_KEY,
        pub: process.env.PUBNUB_PUB_KEY,
        uuid: process.env.PUBNUB_UUID
    }
    // get secret
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
    // get decrypt key
    const decryptKey = process.env.CIPHER_KEY
    /**
     * dark mode files:
     * index - header, footer
     * MenuButton - menu item
     * MainContent - user list container, main container
     * Profile - profile container
     * LoginPage - 
     * RegisterPage - 
     * 
     * dark mode palette: 
     * main container - indigo 800
     * user list container - violet 900
     * header, footer - indigo 400
     * profile - pink 800
     */
    // send payload to home
    return <Index accessSecret={accessTokenSecret} pubnubKeys={pubnubKeys} decryptKey={decryptKey} />
}