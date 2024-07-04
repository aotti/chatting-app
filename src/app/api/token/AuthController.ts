import { jwtVerify, SignJWT } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { IResponse } from "../../types"
import { respond } from "../helper"
import { LoginProfileType } from "../../context/LoginProfileContext"

export default class AuthController {
    
    async createToken(action: string, refreshToken: string, req: NextRequest) {
        let result: IResponse 

        try {
            // verify refresh token
            const refreshSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET)
            const verifyRefresh = await jwtVerify<LoginProfileType>(refreshToken, refreshSecret)
            // create new access token
            const refreshUser = {
                id: verifyRefresh.payload.id,
                display_name: verifyRefresh.payload.display_name,
                is_login: verifyRefresh.payload.is_login,
                description: verifyRefresh.payload.description
            }
            const newAccessToken = await this.generateAccessToken(refreshUser)
            // response
            result = respond(201, action, [{ token: newAccessToken }])
            return result
        } catch (err) {
            console.log(`error AuthController createToken`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }

    async verifyAccessToken(token) {
        try {
            // verify the token
            const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
            await jwtVerify(token, secret)
            return 'verified'
        } catch (error) {
            return 'expired'
        }
    }
    
    async generateAccessToken<T extends {display_name: string}>(jwtPayload: T) {
        const accessSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
        return await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setAudience('www.chatting-app.com')
            .setIssuer('chatting app')
            .setSubject(jwtPayload.display_name)
            .setExpirationTime('5m')
            .sign(accessSecret)
    }

    async generateRefreshToken(jwtPayload: LoginProfileType) {
        const refreshSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET)
        return await new SignJWT(jwtPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setAudience('www.chatting-app.com')
            .setIssuer('chatting app')
            .setSubject(jwtPayload.display_name)
            .sign(refreshSecret)
    }
}