import { NextRequest, NextResponse } from "next/server";
import { api_action, verifyUserTokens } from "../../helper";
import { ChatController } from "../ChatController";
import { IDirectChatPayload, IResponse } from "../../../types";
import AuthController from "../../token/AuthController";
import { cookies } from "next/headers";

const chatController = new ChatController()
const authController = new AuthController()

export async function GET(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // query param
    const key = Array.from(req.nextUrl.searchParams.keys())[0]
    const queryPayload = {
        [key]: req.nextUrl.searchParams.get('data')
    } as {data: string}
    // get access token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    const verify = await verifyUserTokens(token, action)
    if(verify.status === 403) {
        // access token / refresh token invalid
        return NextResponse.json(verify, { status: verify.status })
    }
    // send chat result
    const result = await chatController.historyMessages(action, queryPayload)
    // modify result if theres new access token
    if(verify.status === 201)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // return response
    return NextResponse.json(result, { status: result.status })
}

export async function POST(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // get body payload
    const bodyPayload: IDirectChatPayload = await req.json()
    // get access token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    const verify = await verifyUserTokens(token, action)
    if(verify.status === 403) {
        // access token / refresh token invalid
        return NextResponse.json(verify, { status: verify.status })
    }
    // send chat result
    const result = await chatController.send(action, bodyPayload)
    // modify result if theres new access token
    if(verify.status === 201)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // return response
    return NextResponse.json(result, { status: result.status })
}