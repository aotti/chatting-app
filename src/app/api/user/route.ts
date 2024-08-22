import { NextRequest, NextResponse } from "next/server";
import UserController from "./UserController";
import { api_action, verifyUserTokens } from "../helper";
import { IResponse } from "../../types";

const userController = new UserController()

export async function GET(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // get access token
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    // let variable required because search user is can be done with/without login
    let verify: IResponse = null
    // token exist
    if(token) verify = await verifyUserTokens(token, action)
    // query param
    const key = Array.from(req.nextUrl.searchParams.keys())[0]
    const queryPayload = {
        [key]: req.nextUrl.searchParams.get('display_name')
    }
    // get users, token for renew online status
    const result = await userController.getProfiles(action, queryPayload, req, verify?.data[0].token)
    // modify result if theres new access token
    if(verify?.status === 201)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // response from controller
    return NextResponse.json(result, { status: result.status })
}