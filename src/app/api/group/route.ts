import { NextRequest, NextResponse } from "next/server"
import { api_action, verifyUserTokens } from "../helper"
import { IGroupPayload, IResponse } from "../../types"
import { GroupController } from "./GroupController"

const groupController = new GroupController()

export async function GET(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // get access token
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || null
    let verify: IResponse = null
    // token exist
    if(token) verify = await verifyUserTokens(token, action)
    // query param
    const key = Array.from(req.nextUrl.searchParams.keys())[0]
    const queryPayload = {
        [key]: req.nextUrl.searchParams.get('group_name') || req.nextUrl.searchParams.get('user_me')
    } as Pick<IGroupPayload, 'group_name'|'user_me'>
    // get users, token for renew online status
    const result = await groupController.getGroups(action, queryPayload)
    // modify result if theres new access token
    if(verify?.status === 201 && queryPayload.group_name)
        result.data[0] = {...result.data[0], ...verify.data[0]}
    // response from controller
    return NextResponse.json(result, { status: result.status })
}