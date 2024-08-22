import { NextRequest, NextResponse } from "next/server";
import { verifyUserTokens } from "../../helper";
import { ChatController } from "../../chat/ChatController";

const chatController = new ChatController()

export async function GET(req: NextRequest) {
    // create api action
    const action = 'unread dms'
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
    // get unread messages
    const result = await chatController.unreadMessages(action, queryPayload)
    // no need to return new access token
    // return response
    NextResponse.next({headers: {
        'cache-control': 'no-cache'
    }})
    return NextResponse.json(result, { status: result.status })
}