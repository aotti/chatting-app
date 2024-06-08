import { NextRequest, NextResponse } from "next/server";
import UserController from "../UserController";
import { api_action } from "../../helper";
import { ILoginPayload } from "../../../types";

const userController = new UserController()

export async function POST(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get payload from client
    const bodyPayload: Pick<ILoginPayload, 'username' | 'is_login'> = await req.json()
    // logout
    const result = await userController.logout(action, bodyPayload)
    // return response
    return new Response(null, { status: result.status })
}