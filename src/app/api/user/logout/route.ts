import { NextRequest } from "next/server";
import UserController from "../UserController";
import { api_action } from "../../helper";
import { ILoginPayload } from "../../../types";

const userController = new UserController()

export async function POST(req: NextRequest) {
    // create api action
    const action = await api_action(req.nextUrl.pathname, req.method)
    // ### CHECK ACCESS TOKEN / REFRESH TOKEN
    // ### NO NEED PAYLOAD
    // get payload from client
    const bodyPayload: Pick<ILoginPayload, 'id'> = await req.json()
    // logout
    const result = await userController.logout(action, bodyPayload, req)
    // return response
    return new Response(null, { status: result.status })
}