import { IChatPayload, IGroupPayload, IHistoryMessagePayload, ILoginPayload, IMessage, IQueryInsert, IQuerySelect, IResponse, IUnreadMessagePayload } from "../../types";
import { Controller } from "../Controller";
import filter from "../filter";
import { decryptData, respond } from "../helper";
import AuthController from "../token/AuthController";

export class ChatController extends Controller {
    
    async sendDirect(action: string, payload: IChatPayload, tempToken?: string) {
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
                    message: JSON.parse(payload.message),
                    is_image: payload.is_image
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
                    style: 'justify-start',
                    user: payload.display_me,
                    text: JSON.parse(payload.message),
                    is_image: payload.is_image,
                    time: payload.time,
                    date: payload.date,
                    created_at: payload.created_at
                }
                console.log(publishMessage);
                
                // pubnub 
                const dmChannel = `DirectChat-${payload.user_with}`
                await this.pubnubPublish(dmChannel, publishMessage)
                // RENEW TOKEN FOR ONLINE STATUS
                if(tempToken) {
                    // get user data from access token
                    const verifiedUser = await AuthController.verifyAccessToken({action: 'verify-payload', token: tempToken})
                    // update my token (online/offline)
                    const updatedToken: string = await this.alterLoggedUsers({action: 'renew', data: {id: verifiedUser.id, display_name: verifiedUser.display_name}})
                    console.log(updatedToken 
                        ? `my token updated ${verifiedUser.display_name}` 
                        : `update token failed ${verifiedUser.display_name}`
                    );
                    // publish updated token
                    if(updatedToken) await this.pubnubPublish('logged-users', updatedToken)
                    // fail to update token
                    else await this.pubnubPublish('logged-users', JSON.stringify(updatedToken))
                }
                // response data is number
                result = await respond(200, `${action} success`, [{ messageCount: insertResponse.data }])
            }
            // return response
            return result
        } catch (err) {
            console.log(`error ChatController sendDirect`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async sendGroup(action: string, payload: IChatPayload, tempToken?: string) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            const [groupId, groupName] = payload.user_with.split('_')
            // object to run query
            const queryObject: Omit<IQueryInsert, 'insertColumn'> = {
                table: 'group_chat_messages',
                function: 'insert_group_chat',
                function_args: { 
                    user_me: payload.user_me, 
                    group_id: +groupId,
                    message: JSON.parse(payload.message),
                    is_image: payload.is_image
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
                    style: 'justify-start',
                    group_name: groupName,
                    user: payload.display_me,
                    text: JSON.parse(payload.message),
                    is_image: payload.is_image,
                    time: payload.time,
                    date: payload.date,
                    created_at: payload.created_at
                }
                console.log(publishMessage);
                
                // pubnub 
                const dmChannel = `GroupChat-${groupName}`
                await this.pubnubPublish(dmChannel, publishMessage)
                // RENEW TOKEN FOR ONLINE STATUS
                if(tempToken) {
                    // get user data from access token
                    const verifiedUser = await AuthController.verifyAccessToken({action: 'verify-payload', token: tempToken})
                    // update my token (online/offline)
                    const updatedToken: string = await this.alterLoggedUsers({action: 'renew', data: {id: verifiedUser.id, display_name: verifiedUser.display_name}})
                    console.log(updatedToken 
                        ? `my token updated ${verifiedUser.display_name}` 
                        : `update token failed ${verifiedUser.display_name}`
                    );
                    // publish updated token
                    if(updatedToken) await this.pubnubPublish('logged-users', updatedToken)
                    // fail to update token
                    else await this.pubnubPublish('logged-users', JSON.stringify(updatedToken))
                }
                // response data is number
                result = await respond(200, `${action} success`, [{ messageCount: insertResponse.data }])
            }
            // return response
            return result
        } catch (err) {
            console.log(`error ChatController sendGroup`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async historyDirectMessages(action: string, payload: {data: string}) {
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
                table: 'direct_chats & messages',
                function: 'get_history_dms', // dms = direct messages
                function_args: {
                    user_one: parsePayload.user_me, 
                    user_two: parsePayload.user_with, 
                    amount: parsePayload.amount
                },
                order: {col: 'created_at', by: 'asc'}
            }
            // select data
            const selectResponse = await this.dq.select<IHistoryMessagePayload['message_id']>(queryObject)
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
            console.log(`error ChatController historyDirectMessages`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async historyGroupMessages(action: string, payload: {data: string}) {
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
                table: 'group_chat_messages & messages',
                function: 'get_history_gms', // gms = group_chat_messages
                function_args: {
                    group_id: parsePayload.user_with, // as group id
                    amount: parsePayload.amount
                },
                order: {col: 'created_at', by: 'asc'}
            }
            // select data
            const selectResponse = await this.dq.select<IHistoryMessagePayload['message_id']>(queryObject)
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
            console.log(`error ChatController historyGroupMessages`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async unreadMessages(action: string, payload: {data: string}) {
        let result: IResponse

        try {
            let resultDMS
            // decrypt payload
            const decryptedPayload = await decryptData({encryptedData: payload.data.replaceAll(' ', '+')})
            const parsePayload = JSON.parse(decryptedPayload.match(/\{.*\}/)[0]) as IUnreadMessagePayload
            // filter payload
            const filteredPayload = await filter(action, parsePayload)
            if(filteredPayload.status === 400) {
                return filteredPayload
            }

            // ~~~ GET UNREAD DIRECT MESSAGES ~~~
            // ~~~ GET UNREAD DIRECT MESSAGES ~~~
            // object to run query
            const queryObjectDMS: IQuerySelect = {
                table: 'direct_chats & messages & users',
                function: 'get_unread_dms', // dms = direct messages
                function_args: {
                    user_me: parsePayload?.user_id || parsePayload['id'], // uuid
                    last_online: parsePayload.last_access // timestampz
                }
            }
            // select data
            const selectResponseDMS = await this.dq.select(queryObjectDMS)
            // fail
            if(selectResponseDMS.data === null) {
                result = await respond(500, selectResponseDMS.error, [])
                return result
            }
            // success
            else if(selectResponseDMS.error === null) {
                // response 
                resultDMS = selectResponseDMS.data
            }

            // ~~~ GET UNREAD GROUP MESSAGES ~~~
            // ~~~ GET UNREAD GROUP MESSAGES ~~~
            let resultGMS
            // object to run query
            const queryObjectGMS: IQuerySelect = {
                table: 'group_chats & group_chat_messages & messages',
                function: 'get_unread_gms', // gms = group_chat_messages
                function_args: {
                    group_names: parsePayload?.group_names || '', // uuid
                    last_online: parsePayload.last_access // timestampz
                }
            }
            // select data
            const selectResponseGMS = await this.dq.select(queryObjectGMS)
            // fail
            if(selectResponseGMS.data === null) {
                result = await respond(500, selectResponseGMS.error, [])
                return result
            }
            // success
            else if(selectResponseGMS.error === null) {
                // response 
                resultGMS = selectResponseGMS.data
            }
            // record logged in users
            await this.alterLoggedUsers({action: 'push', data: {id: parsePayload.user_id, display_name: parsePayload.display_name}})
            // ~~~ MERGE RESULTS ~~~
            // ~~~ MERGE RESULTS ~~~
            const mergedResult = [...resultDMS, ...resultGMS]
            result = await respond(200, `${action} success`, [{ unread_messages: mergedResult }])
            // return response
            return result
        } catch (err: any) {
            console.log(`error ChatController unreadDirectMessages`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
}