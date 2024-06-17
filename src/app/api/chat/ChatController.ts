import { IDirectChatPayload, IMessage, IQueryInsert, IResponse } from "../../types";
import filter from "../filter";
import { respond } from "../helper";
import { DatabaseQueries } from "../../config/DatabaseQueries";
import Pubnub from "pubnub";

export class ChatController {
    private dq = new DatabaseQueries()
    
    async send(action: string, payload: IDirectChatPayload, token: string) {
        let result: IResponse
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
            // fail 
            if(insertResponse.data === null) {
                result = respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                // pubnub
                const publishMessage: IMessage = {
                    style: '',
                    author: payload.user_from,
                    text: JSON.parse(payload.message)
                }
                // pubnub 
                const pubpub = new Pubnub({
                    subscribeKey: process.env.PUBNUB_SUB_KEY,
                    publishKey: process.env.PUBNUB_PUB_KEY,
                    userId: process.env.PUBNUB_UUID
                })
                const dmChannel = `DirectChat-${payload.user_to}`
                await pubpub.publish({
                    channel: dmChannel,
                    message: publishMessage
                })
                // response data is number
                result = respond(200, `${action} success`, [{ messageCount: insertResponse.data }])
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