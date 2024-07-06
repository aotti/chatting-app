import { respond } from "../helper"
import { IEncrypted, ILoggedUsers, ILoginPayload, IProfilePayload, IQueryInsert, IQuerySelect, IQueryUpdate, IRegisterPayload, IResponse } from "../../types"
import filter from "../filter"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { Controller } from "../Controller"
import { LoginProfileType } from "../../context/LoginProfileContext"
import AuthController from "../token/AuthController"

export default class UserController extends Controller {

    async register(action: string, payload: Omit<IRegisterPayload, 'confirm_password'>) {
        let result: IResponse
        // filter payload
        const filteredPayload = filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }
        
        try {
            // object to run query
            const queryObject: IQueryInsert = {
                table: 'users',
                selectColumn: '*',
                get insertColumn() {
                    return payload
                }
            }
            // insert data
            const insertResponse = await this.dq.insert<IRegisterPayload>(queryObject)
            // fail 
            if(insertResponse.data === null) {
                result = respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                result = respond(201, `${action} success`, insertResponse.data)
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

    async login(action: string, payload: ILoginPayload, req: NextRequest) {
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
                selectColumn: this.dq.columnSelector('users', 34),
                whereColumn: 'username',
                whereValue: payload.username
            }
            // select data
            const selectResponse = await this.dq.select<ILoginPayload>(queryObject)
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
                    const checkPassword = selectResponse.data[0].password === payload.password
                    // wrong 
                    if(!checkPassword)
                        result = respond(400, `username/password doesnt match!`, [])
                    // correct
                    else {
                        result = await this.loggedUser(action, selectResponse.data[0], req)
                    }
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

    async loggedUser(action: string, data: ILoginPayload, req?: NextRequest) {
        let result: IResponse

        try {
            const dateNow = new Date()
            // object to run query
            const queryObject: IQueryUpdate = {
                table: 'users',
                selectColumn: this.dq.columnSelector('users', 15),
                whereColumn: 'username',
                whereValue: data.username,
                get updateColumn() {
                    return { 
                        updated_at: dateNow.toISOString()
                    }
                }
            }
            // update data
            const updateResponse = await this.dq.update<Pick<ILoginPayload, 'id'|'display_name'>>(queryObject)
            // fail 
            if(updateResponse.data === null) {
                result = respond(500, updateResponse.error, [])
            }
            // success
            else if(updateResponse.error === null) {
                // login case - get profile
                if(req) {
                    const pushLoggedUsers: IEncrypted = await this.alterLoggedUsers({
                        action: 'push', 
                        data: {
                            id: updateResponse.data[0].id,
                            display_name: updateResponse.data[0].display_name
                        } 
                    })
                    // publish logged users data to client
                    await this.pubnubPublish('logged-users', pushLoggedUsers)
                    // get user profile
                    result = await this.getProfiles(action, updateResponse.data[0], req)
                }
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController loggedUser`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }

    async getProfiles(action: string, payload: Omit<ILoginPayload, 'username' | 'password'>, req?: NextRequest) {
        let result: IResponse
        // filter payload
        const filteredPayload = !payload.id ? filter(action, payload as IProfilePayload) : null
        if(filteredPayload?.status === 400) {
            return filteredPayload
        }
        
        try {
            // object for select query
            const queryObject: IQuerySelect = payload.id
                ? {
                    table: 'profiles',
                    selectColumn: this.dq.columnSelector('profiles', 23),
                    whereColumn: 'user_id',
                    whereValue: payload.id
                }
                : {
                    table: 'profiles',
                    function: 'join_users_profiles',
                    function_args: {name: payload.display_name}
                }
            const selectResponse = await this.dq.select<IProfilePayload>(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                // select response for query
                // modify data for easier reading
                type NewSelectResDataType = LoginProfileType & { token?: string }
                let newSelectResData: NewSelectResDataType[] | IProfilePayload[]
                // login case
                if(selectResponse.data[0]?.user_id?.username) {
                    newSelectResData = [{
                        id: selectResponse.data[0].user_id.id,
                        display_name: selectResponse.data[0].user_id.display_name,
                        is_login: 'Online',
                        description: selectResponse.data[0].description
                    }]
                    // create access token 
                    const accessToken = await this.auth.generateAccessToken(newSelectResData[0])
                    // create refresh token
                    const refreshToken = await this.auth.generateRefreshToken(newSelectResData[0])
                    // save refresh token
                    cookies().set('refreshToken', refreshToken, { 
                        path: '/',
                        domain: req.nextUrl.hostname,
                        httpOnly: true 
                    })
                    // add token to response data
                    newSelectResData[0] = {
                        ...newSelectResData[0],
                        token: accessToken
                    }
                }
                // get user case
                else {
                    newSelectResData = [] as NewSelectResDataType[]
                    // get user data from access token
                    const accessToken = req.headers.get('authorization').replace('Bearer ', '')
                    if(accessToken !== 'null') {
                        let verifiedUser = await AuthController.verifyAccessToken({action: 'verify-payload', token: accessToken})
                        // token expired, renew with refresh token
                        if(!verifiedUser) {
                            // check refresh token
                            const refreshToken = cookies().get('refreshToken')?.value
                            // refresh token invalid
                            if(!refreshToken) return result = respond(403, `failed to ${action}`, [])
                            // create new access token
                            const newAccessToken = await this.auth.renewAccessToken(refreshToken, true)
                            verifiedUser = newAccessToken.payload;
                            // add token prop to response data
                            (newSelectResData as {token: string}[]).push({
                                token: newAccessToken.token
                            })
                        }
                        // update my token (online/offline)
                        const updatedToken: IEncrypted = await this.alterLoggedUsers({action: 'renew', data: {id: verifiedUser.id, display_name: verifiedUser.display_name}})
                        console.log(updatedToken 
                            ? `my token updated ${verifiedUser.display_name}` 
                            : `update token failed ${verifiedUser.display_name}`
                        );
                        // publish updated token
                        await this.pubnubPublish('logged-users', updatedToken)
                    }
                    
                    // check if user is logged in
                    const selectResData = selectResponse.data as any[]
                    for(let i in selectResData) {
                        const data = selectResData[i] as NewSelectResDataType
                        const loggedInUsers: ILoggedUsers[] = await this.alterLoggedUsers({action: 'getUsers', data: {id: data.id}})
                        // get logged in users
                        if(loggedInUsers.length > 0) {
                            const isVerified = await AuthController.verifyAccessToken({action: 'verify-only', token: loggedInUsers[i].token})
                            if(isVerified) {
                                newSelectResData.push({ ...data, is_login: 'Online' })
                            }
                            else {
                                newSelectResData.push({ ...data, is_login: 'Away' })
                            }
                        }
                        // offline users
                        else {
                            newSelectResData.push({ ...data, is_login: 'Offline' })
                        }
                    }
                }
                // response
                result = respond(200, `${action} success`, newSelectResData)
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

    async logout(action: string, payload: Pick<ILoginPayload, 'id'>) {
        let result: IResponse
        // filter payload
        const filteredPayload = filter(action, payload as ILoginPayload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: IQuerySelect = {
                table: 'users',
                selectColumn: this.dq.columnSelector('users', 3),
                whereColumn: 'id',
                whereValue: payload.id
            }
            // select data
            const selectResponse = await this.dq.select<ILoginPayload>(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                const filterLoggedUsers: IEncrypted = await this.alterLoggedUsers({ action: 'filter', data: {id: payload.id} })
                // publish logged users data to client
                await this.pubnubPublish('logged-users', filterLoggedUsers)
                // delete refresh token
                cookies().delete('refreshToken')
                // update user is_login
                result = respond(204, action, [])
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController logout`)
            console.log(err)
            // return response
            result = respond(500, err.message, [])
            return result
        }
    }
}