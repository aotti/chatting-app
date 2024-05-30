import { NextRequest, NextResponse } from "next/server";
import UserController from "./UserController";
import { api_action } from "../helper";

const userController = new UserController()

export async function GET(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // get users
    const result = await userController.getUsers(action)
    // response from controller
    return NextResponse.json(result, { status: result.status })
}