import { NextRequest, NextResponse } from "next/server";
import UserController from "../UserController";
import { api_action } from "../../helper";
import { ILoginPayload } from "../../../types";

const userController = new UserController()

export async function POST(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get payload from client
    const bodyPayload: ILoginPayload = await req.json()
    // login
    const result = await userController.login(action, bodyPayload, req)
    // return response
    return NextResponse.json(result, { status: result.status })
}