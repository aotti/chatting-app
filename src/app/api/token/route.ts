import { NextRequest, NextResponse } from "next/server";
import AuthController from "./AuthController";
import { api_action } from "../helper";
import { cookies } from "next/headers";

const authController = new AuthController()

export async function GET(req: NextRequest) {
    // create api action
    const action = api_action(req.nextUrl.pathname, req.method)
    // check refresh token
    const refreshToken = cookies().get('refreshToken')?.value
    // no token
    if(!refreshToken) return NextResponse.json({
        status: 403,
        message: 'refresh token invalid',
        data: []
    }, { status: 403 })
    // response
    const result = await authController.createToken(action, refreshToken, req)
    return NextResponse.json(result, { status: result.status })
}