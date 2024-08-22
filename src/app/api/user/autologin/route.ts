import { NextRequest, NextResponse } from "next/server";
import { verifyUserTokens } from "../../helper";
import { ChatController } from "../../chat/ChatController";

const chatController = new ChatController()

export async function POST(req: NextRequest) {
    // create api action
    const action = 'unread dms'
    // get payload from client
    const bodyPayload = await req.json()
    // get access token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    const verify = await verifyUserTokens(token, action)
    if(verify.status === 403) {
        // access token / refresh token invalid
        return NextResponse.json(verify, { status: verify.status })
    }
    // get unread messages
    const result = await chatController.unreadMessages(action, bodyPayload)
    // no need to return new access token
    // return response
    return NextResponse.json(result, { status: result.status })
}