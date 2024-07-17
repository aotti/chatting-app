import { NextRequest, NextResponse } from "next/server";
import UserController from "./UserController";
import { api_action } from "../helper";

const userController = new UserController()

export async function GET(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // query param
    const key = Array.from(req.nextUrl.searchParams.keys())[0]
    const queryPayload = {
        [key]: req.nextUrl.searchParams.get('display_name')
    }
    // get users
    const result = await userController.getProfiles(action, queryPayload, req)
    // response from controller
    return NextResponse.json(result, { status: result.status })
}