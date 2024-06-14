import { jwtVerify } from "jose";
import { IDirectChatPayload, IQueryInsert, IResponse } from "../../types";
import filter from "../filter";
import { respond } from "../helper";
import { DatabaseQueries } from "../../config/DatabaseQueries";

export class ChatController {
    private dq = new DatabaseQueries()
    
    async send(action: string, payload: IDirectChatPayload, token: string) {
        let result: IResponse
        // verify token
        const accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
        const verifyAccessToken = await jwtVerify(token, accessTokenSecret)
        // token expired
        if(!verifyAccessToken.payload) 
            return result = respond(401, 'invalid token', [])
        // filter payload
        const filteredPayload = filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: Omit<IQueryInsert, 'insertColumn'> = {
                table: 'users',
                function: 'insert_direct_chat',
                function_args: { 
                    user_from: payload.user_from, 
                    user_to: payload.user_to,
                    message: JSON.parse(payload.message)
                }
            }
            // insert data
            const insertResponse = await this.dq.insert<any>(queryObject as IQueryInsert)
            console.log(insertResponse);
            
            // fail 
            if(insertResponse.data === null) {
                result = respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                result = respond(200, `${action} success`, insertResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error ChatController send`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }
}