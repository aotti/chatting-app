import { DatabaseQueries } from "../../config/DatabaseQueries"
import { respond, sha256 } from "../helper"
import { ILoginPayload, IQueryInsert, IQuerySelect, IQueryUpdate, IRegisterPayload, IResponse } from "../../types"
import filter from "../filter"

export default class UserController {
    private dq = new DatabaseQueries()

    async getUsers(action: string) {
        let result: IResponse

        try {
            const queryObject: Pick<IQuerySelect, 'table' | 'selectColumn'> = {
                table: 'users',
                selectColumn: '*'
            }
            const selectResponse = await this.dq.select(queryObject as IQuerySelect)
            // fail 
            if(selectResponse.data === null) {
                result = respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                result = respond(200, `${action} success`, selectResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController getUsers`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }

    async register(action: string, payload: Omit<IRegisterPayload, 'confirm_password'>) {
        let result: IResponse
        // filter payload
        const filteredPayload = filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }
        
        try {
            // hash password
            payload.password = sha256(payload.password)
            // object to run query
            const queryObject: IQueryInsert = {
                table: 'users',
                selectColumn: '*',
                get insertColumn() {
                    return payload
                }
            }
            // insert data
            const insertResponse = await this.dq.insert(queryObject)
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
            console.log(`error UserController register`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }        
    }

    async login(action: string, payload: ILoginPayload) {
        let result: IResponse
        // filter payload
        const filteredPayload = filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: IQuerySelect = {
                table: 'users',
                selectColumn: '*',
                whereColumn: 'username',
                whereValue: payload.username
            }
            // select data
            const selectResponse = await this.dq.select(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                // check data length
                if(selectResponse.data.length === 0) {
                    // username not found
                    result = respond(400, `username/password doesnt match!`, [])
                }
                else {
                    // check password
                    const checkPassword = selectResponse.data[0].password === sha256(payload.password)
                    // wrong 
                    if(!checkPassword)
                        result = respond(400, `username/password doesnt match!`, [])
                    // correct
                    else
                        result = await this.loggedIn(action, payload.username)
                }
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController login`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }

    async loggedIn(action: string, username: string) {
        let result: IResponse

        try {
            const dateNow = new Date()
            // object to run query
            const queryObject: IQueryUpdate = {
                table: 'users',
                selectColumn: '*',
                whereColumn: 'username',
                whereValue: username,
                get updateColumn() {
                    return { 
                        is_login: true,
                        updated_at: dateNow.toISOString()
                    }
                }
            }
            // update data
            const updateResponse = await this.dq.update(queryObject)
            // fail 
            if(updateResponse.data === null) {
                result = respond(500, updateResponse.error, [])
            }
            // success
            else if(updateResponse.error === null) {
                result = respond(200, `${action} success`, updateResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController loggedIn`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }
}