import { NextRequest, NextResponse } from "next/server";
import { api_action, verifyUserTokens } from "../../helper";
import { ImageController } from "./ImageController";

const imageController = new ImageController()

export async function POST(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // get body payload
    const bodyPayload = await req.json()
    // get access token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    const verify = await verifyUserTokens(token, action)
    if(verify.status === 403) {
        // access token / refresh token invalid
        return NextResponse.json(verify, { status: verify.status })
    }
    // upload image chat
    const result = await imageController.sendImage(action, bodyPayload)
    // modify result if theres new access token
    if(verify.status === 201)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // return response
    return NextResponse.json(result, { status: result.status })
}