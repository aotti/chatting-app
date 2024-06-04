import { jwtVerify } from "jose"
import { cookies } from "next/headers"
import Index from "./components"

export default async function Page() {
    // get cookie
    const token = cookies().get('accessToken')?.value
    // cookie expired
    if(!token) return <Index />
    
    try {
        // verify access token
        // if invalid check refresh token, then create new access token
        const accessSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
        const verify = await jwtVerify(token, accessSecret)
        // user payload
        const verifiedUser = {
            username: verify.payload.username,
            display_name: verify.payload.display_name,
            is_login: verify.payload.is_login,
            description: verify.payload.description
        }
        // send payload to home
        return <Index verified={verifiedUser} />
    } catch (error) {
        // token expired
        if(error) return <Index />
    }
}