import { IDirectChatPayload, IHistoryMessagePayload, IMessage, IQueryInsert, IQuerySelect, IResponse } from "../../types";
import { Controller } from "../Controller";
import filter from "../filter";
import { decryptData, respond } from "../helper";

export class ChatController extends Controller {

    async historyMessages(action: string, payload: {data: string}) {
        let result: IResponse

        try {
            // decrypt payload
            const decryptedPayload = await decryptData({encryptedData: payload.data.replaceAll(' ', '+')})
            const parsePayload: IHistoryMessagePayload = JSON.parse(decryptedPayload.match(/\{.*\}/)[0]) 
            // filter payload
            const filteredPayload = await filter(action, parsePayload)
            if(filteredPayload.status === 400) {
                return filteredPayload
            }
            // object to run query
            const queryObject: IQuerySelect = {
                table: 'direct_chats',
                function: 'get_history_messages',
                function_args: {
                    user_one: parsePayload.user_me, 
                    user_two: parsePayload.user_with, 
                    amount: parsePayload.amount
                },
                order: {col: 'created_at', by: 'asc'}
            }
            // insert data
            const selectResponse = await this.dq.db_func<IHistoryMessagePayload['message_id']>(queryObject)
            // fail
            if(selectResponse.data === null) {
                result = await respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                result = await respond(200, `${action} success`, selectResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error ChatController historyMessages`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
    
    async send(action: string, payload: IDirectChatPayload) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: Omit<IQueryInsert, 'insertColumn'> = {
                table: 'direct_chats',
                function: 'insert_direct_chat',
                function_args: { 
                    user_from: payload.user_me, 
                    user_to: payload.user_with,
                    message: JSON.parse(payload.message)
                }
            }
            // insert data
            const insertResponse = await this.dq.insert<any>(queryObject as IQueryInsert)
            // fail 
            if(insertResponse.data === null) {
                result = await respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                // pubnub
                const publishMessage: IMessage['messages'][0] = {
                    style: '',
                    user: payload.user_me,
                    text: JSON.parse(payload.message),
                    time: payload.time,
                    date: '',
                    created_at: payload.created_at
                }
                // pubnub 
                const dmChannel = `DirectChat-${payload.user_with}`
                await this.pubnubPublish(dmChannel, publishMessage)
                // response data is number
                result = await respond(200, `${action} success`, [{ messageCount: insertResponse.data }])
            }
            // return response
            return result
        } catch (err) {
            console.log(`error ChatController send`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
}