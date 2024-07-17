import { jwtVerify, SignJWT } from "jose"
import { IResponse, TokenVerifyReturn, TokenVerifyType } from "../../types"
import { respond } from "../helper"
import { LoginProfileType } from "../../context/LoginProfileContext"

export default class AuthController {
    
    async createToken(action: string, refreshToken: string) {
        let result: IResponse 

        try {
            // create new access token
            const newAccessToken = await this.renewAccessToken(refreshToken)
            // response
            result = await respond(201, action, [{ token: newAccessToken }])
            return result
        } catch (err) {
            console.log(`error AuthController createToken`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    static verifyAccessToken<T extends TokenVerifyType>(args: T): Promise<TokenVerifyReturn<T>>
    // static verifyAccessToken(args: ITokenVerifyOnly): Promise<boolean>
    // static verifyAccessToken(args: ITokenVerifyPayload): Promise<LoginProfileType>
    static async verifyAccessToken(args: TokenVerifyType) {
        try {
            // verify the token
            const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
            const verified = await jwtVerify(args.token, secret)
            if(args.action === 'verify-only') 
                return true
            else if(args.action === 'verify-payload') {
                const verifiedUser = {
                    id: verified.payload.id,
                    display_name: verified.payload.display_name,
                    is_login: verified.payload.is_login,
                    description: verified.payload.description
                } 
                return verifiedUser as LoginProfileType
            }
        } catch (error) {
            return false
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

    renewAccessToken<T>(refreshToken: string, getPayload?: T): Promise<T extends boolean ? {token: string; payload: LoginProfileType} : string>
    async renewAccessToken(refreshToken: string, getPayload?: boolean) {
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
        return getPayload
            ? {token: newAccessToken, payload: refreshUser as LoginProfileType}
            : newAccessToken
    }
}