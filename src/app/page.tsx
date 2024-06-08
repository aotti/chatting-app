import Index from "./components"

export default function Page() {
    // get secret
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
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
    return <Index secret={accessTokenSecret} />
}