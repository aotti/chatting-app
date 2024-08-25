import { NextRequest, NextResponse } from "next/server"
import { api_action, verifyUserTokens } from "../../helper"
import UserController from "../UserController"

const userController = new UserController()

export async function PATCH(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // get payload from client
    const bodyPayload = await req.json()
    // get access token
    const token = req.headers.get('authorization').replace('Bearer ', '')
    const verify = await verifyUserTokens(token, action)
    if(verify.status === 403) {
        // access token / refresh token invalid
        return NextResponse.json(verify, { status: verify.status })
    }
    // update profile
    const result = await userController.updateProfile(action, bodyPayload, req)
    // modify result if theres new access token
    if(verify.status === 201)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // return response
    return NextResponse.json(result, { status: result.status })
}