import { NextRequest, NextResponse } from "next/server";
import { api_action } from "../../helper";
import { ChatController } from "../ChatController";

const chatController = new ChatController()

export async function GET(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // return response
    return NextResponse.json({ message: 'get chat' }, { status: 200 })
}

export async function POST(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    // get body payload
    const bodyPayload = await req.json()
    // send chat
    const result = await chatController.send(action, bodyPayload, token)
    // return response
    return NextResponse.json(result, { status: result.status })
}