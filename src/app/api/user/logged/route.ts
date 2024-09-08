import { NextRequest, NextResponse } from "next/server"
import { Controller } from "../../Controller"

export async function GET(req: NextRequest) {
    // create api action
    const action = ''
    // response from controller
    return NextResponse.json({
        status: 200,
        message: 'success get logged users',
        data: Controller.loggedUsers
    }, { status: 200 })
}