import { NextRequest, NextResponse } from "next/server";
import UserController from "../UserController";
import { IRegisterPayload } from "../../../types";
import { api_action } from "../../helper";

const userController = new UserController()

export async function POST(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get payload from client
    const bodyPayload: IRegisterPayload = await req.json()
    // confirm_password isnt required for database 
    delete bodyPayload['confirm_password']
    // register
    const result = await userController.register(action, bodyPayload)
    return NextResponse.json(result, { status: result.status })
}