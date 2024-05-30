import { NextRequest, NextResponse } from "next/server";
import UserController from "../UserController";
import { api_action } from "../../helper";
import { ILoginPayload } from "../../../types";

const userController = new UserController()

export async function GET(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get payload from client
    const queryPayload: ILoginPayload = {
        username: req.nextUrl.searchParams.get('username'),
        password: req.nextUrl.searchParams.get('password')
    }
    // login
    const result = await userController.login(action, queryPayload)
    return NextResponse.json(result, { status: result.status })
}