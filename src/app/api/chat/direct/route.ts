import { NextRequest, NextResponse } from "next/server";
import { api_action, respond } from "../../helper";
import { ChatController } from "../ChatController";
import { jwtVerify } from "jose";
import { IDirectChatPayload } from "../../../types";
import { LoginProfileType } from "../../../context/LoginProfileContext";
import AuthController from "../../token/AuthController";
import { cookies } from "next/headers";

const chatController = new ChatController()
const authController = new AuthController()

export async function GET(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // return response
    return NextResponse.json({ message: 'get chat' }, { status: 200 })
}

export async function POST(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get body payload
    const bodyPayload: IDirectChatPayload = await req.json()
    // get token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    try {
        // authorize token
        const accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
        const verifyAccessToken = await jwtVerify<LoginProfileType>(token, accessTokenSecret)
        if(verifyAccessToken.payload.id !== bodyPayload.user_from) {
            const notVerified = respond(401, 'Unauthorized', [])
            return NextResponse.json(notVerified, { status: notVerified.status })
        }
        console.log('chat with access token');
        
    } catch (err) {
        console.log('chat with refresh token');
        
        // token expired
        // check refresh token
        const refreshToken = cookies().get('refreshToken')?.value
        // no token
        if(!refreshToken) return NextResponse.json({
            status: 403,
            message: 'refresh token invalid',
            data: []
        }, { status: 403 })
        // create new access token
        const newAccessToken = await authController.createToken(action, refreshToken, req)
        // send chat
        const altResult = await chatController.send(action, bodyPayload)
        // return response
        altResult.data[0] = {...altResult.data[0], ...newAccessToken.data[0]}
        return NextResponse.json(altResult, { status: altResult.status })
    }
    // send chat
    const result = await chatController.send(action, bodyPayload)
    // return response
    return NextResponse.json(result, { status: result.status })
}