import { NextRequest, NextResponse } from "next/server";
import { api_action, verifyUserTokens } from "../../helper";
import UserController from "../UserController";

const userController = new UserController()

export async function PATCH(req: NextRequest) {
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
    // update last access
    const result = await userController.lastAccess(action, bodyPayload)
    // no need to return new access token
    // return response
    return NextResponse.json(result, { status: result.status })
}