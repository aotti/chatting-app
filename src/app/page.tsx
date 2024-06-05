import Index from "./components"

export default async function Page() {
    // get secret
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET
    // send payload to home
    return <Index secret={accessTokenSecret} />
}