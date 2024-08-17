import { IGroupPayload, IQueryInsert, IQuerySelect, IResponse } from "../../types";
import { Controller } from "../Controller";
import filter from "../filter";
import { respond } from "../helper";

export class GroupController extends Controller {
    async getGroups(action: string, payload: Pick<IGroupPayload, 'group_name'|'user_me'>) {
        let result: IResponse

        try {
            // find_group(group_name text)
            // object to run query
            const queryObject: IQuerySelect = payload.user_me
            ? {
                table: 'group_chat_users',
                selectColumn: this.dq.columnSelector('group_chat_users', 2),
                whereColumn: 'user_id',
                whereValue: payload.user_me
            } : {
                table: 'group_chats',
                function: 'find_group',
                function_args: { group_name: payload.group_name }
            }
            // get data
            const selectResponse = await this.dq.select<IGroupPayload>(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = await respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                // login case
                if(selectResponse.data[0]?.group_chat_id?.name) {
                    // modify array object literal to array string
                    const groupNames = selectResponse.data.map(v => v.group_chat_id.name)
                    // return array string
                    result = await respond(200, `${action} success`, groupNames)
                }
                // search group case
                else {
                    result = await respond(200, `${action} success`, selectResponse.data)
                }
            }
            // return response
            return result
        } catch (err) {
            console.log(`error GroupController getGroups`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async createGroup(action: string, payload: IGroupPayload['create']) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload as IGroupPayload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // new_group_chat(group_name text, group_code text, user_me uuid)
            // object to run query
            const queryObject: Omit<IQueryInsert, 'insertColumn'> = {
                table: 'group_chats',
                function: 'new_group_chat',
                function_args: { 
                    group_name: payload.group_name,
                    group_code: payload.group_code,
                    user_me: payload.user_me
                }
            }
            const insertResponse = await this.dq.insert(queryObject as IQueryInsert)
            // fail 
            if(insertResponse.data === null) {
                result = await respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                // [data] = {name: group_name, display_name: user_name}
                result = await respond(200, `${action} success`, insertResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error GroupController createGroup`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async joinGroup(action: string, payload: IGroupPayload['join']) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload as IGroupPayload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // join_group(group_code text, user_me uuid)
            // object to run query
            const queryObject: Omit<IQueryInsert, 'insertColumn'> = {
                table: 'group_chat_users',
                function: 'join_group',
                function_args: { 
                    group_code: payload.group_code,
                    user_me: payload.user_me
                }
            }
            const insertResponse = await this.dq.insert(queryObject as IQueryInsert)
            // fail 
            if(insertResponse.data === null) {
                result = await respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                // [data] = {name: group_name, display_name: user_name}
                result = await respond(200, `${action} success`, insertResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error GroupController joinGroup`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
}