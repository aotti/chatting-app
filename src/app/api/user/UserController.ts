import { encryptData, respond } from "../helper"
import { ILoggedUsers, ILoginPayload, IProfilePayload, IQueryInsert, IQuerySelect, IQueryUpdate, IRegisterPayload, IResponse } from "../../types"
import filter from "../filter"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { Controller } from "../Controller"
import { LoginProfileType } from "../../context/LoginProfileContext"
import AuthController from "../token/AuthController"
import { ChatController } from "../chat/ChatController"
import { GroupController } from "../group/GroupController"

export default class UserController extends Controller {

    async register(action: string, payload: Omit<IRegisterPayload, 'confirm_password'>) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
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
                result = await respond(500, insertResponse.error, [])
            }
            // success
            else if(insertResponse.error === null) {
                result = await respond(201, `${action} success`, insertResponse.data)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController register`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }        
    }

    async login(action: string, payload: ILoginPayload, req: NextRequest) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: IQuerySelect = {
                table: 'users',
                selectColumn: this.dq.columnSelector('users', 1245),
                whereColumn: 'username',
                whereValue: payload.username
            }
            // select data
            const selectResponse = await this.dq.select<ILoginPayload>(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = await respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                // check data length
                if(selectResponse.data.length === 0) {
                    // username not found
                    result = await respond(400, `username/password doesnt match!`, [])
                }
                else {
                    // check password
                    const checkPassword = selectResponse.data[0].password === payload.password
                    // wrong 
                    if(!checkPassword)
                        result = await respond(400, `username/password doesnt match!`, [])
                    // correct
                    else {
                        // get group names
                        const groupController = new GroupController()
                        const getGroupNames = await groupController.getGroups('group names', {user_me: selectResponse.data[0].id})
                        // if error, return
                        if(getGroupNames.status !== 200) return getGroupNames
                        // modify array object literal to array string
                        const groupNames = getGroupNames.data.map(v => v.group_chat_id.name)
                        // get unread direct message
                        const chatController = new ChatController()
                        const encryptedData = await encryptData({text: JSON.stringify(selectResponse.data[0])})
                        const getUnreadMessages = await chatController.unreadMessages('unread dms', {data: encryptedData})
                        // if error, return
                        if(getUnreadMessages.status !== 200) return getUnreadMessages
                        // remove to prevent last access not updating, the prop not required when login
                        delete selectResponse.data[0].last_access
                        // update last access & get profile
                        result = await this.lastAccess(action, selectResponse.data[0], req)
                        // combine user profile & unread messages
                        result.data[0] = {...result.data[0], group: groupNames, ...getUnreadMessages.data[0]}
                    }
                }
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController login`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async lastAccess(action: string, data: ILoginPayload, req?: NextRequest) {
        let result: IResponse

        try {
            const dateNow = new Date()
            // object to run query
            const queryObject: IQueryUpdate = {
                table: 'users',
                selectColumn: this.dq.columnSelector('users', 15),
                whereColumn: 'id',
                whereValue: data.id,
                get updateColumn() {
                    return { 
                        last_access: data.last_access || dateNow.toISOString()
                    } as ILoginPayload
                }
            }
            // update data
            const updateResponse = await this.dq.update<Pick<ILoginPayload, 'id'|'display_name'>>(queryObject)
            // fail 
            if(updateResponse.data === null) {
                result = await respond(500, updateResponse.error, [])
            }
            // success
            else if(updateResponse.error === null) {
                // login case - get profile
                if(req) {
                    const pushLoggedUsers: string = await this.alterLoggedUsers({
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
                // only update case
                else {
                    result = await respond(200, `${action} success`, [])
                }
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController lastAccess`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async getProfiles(action: string, payload: Omit<ILoginPayload, 'username' | 'password'>, req?: NextRequest, tempToken?: string) {
        let result: IResponse
        // filter payload
        const filteredPayload = !payload.id ? await filter(action, payload as IProfilePayload) : null
        if(filteredPayload?.status === 400) {
            return filteredPayload
        }
        
        try {
            // object for select query
            const queryObject: IQuerySelect = payload.id
                ? {
                    table: 'profiles',
                    selectColumn: this.dq.columnSelector('profiles', 234),
                    whereColumn: 'user_id',
                    whereValue: payload.id
                } : {
                    table: 'profiles',
                    function: 'join_users_profiles',
                    function_args: {name: payload.display_name}
                }
            const selectResponse = await this.dq.select<IProfilePayload>(queryObject)
            // fail 
            if(selectResponse.data === null) {
                result = await respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                // select response for query
                // modify data for easier reading
                type NewSelectResDataType = LoginProfileType & { token?: string }
                let newSelectResData: NewSelectResDataType[] | IProfilePayload[]
                // login case
                if(selectResponse.data[0]?.user_id?.id) {
                    const { user_id, description, photo } = selectResponse.data[0]
                    newSelectResData = [{
                        id: user_id.id,
                        display_name: user_id.display_name,
                        is_login: 'Online',
                        description: description,
                        photo: photo
                    }]
                    // create access token 
                    const accessToken = await this.auth.generateAccessToken(newSelectResData[0])
                    // create refresh token
                    const refreshToken = await this.auth.generateRefreshToken(newSelectResData[0])
                    // save refresh token
                    cookies().set('refreshToken', refreshToken, { 
                        path: '/',
                        domain: req.nextUrl.hostname,
                        maxAge: 7776000, // 3 months
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
                    
                    // check if user is logged in
                    const selectResData = selectResponse.data as any[]
                    for(let i in selectResData) {
                        const data = selectResData[i] as NewSelectResDataType
                        const loggedInUsers: ILoggedUsers[] = await this.alterLoggedUsers({action: 'getUsers', data: {id: data.id}})
                        // get logged in users
                        if(loggedInUsers.length > 0) {
                            const isVerified = await AuthController.verifyAccessToken({action: 'verify-only', token: loggedInUsers[i].token})
                            // online
                            if(isVerified) newSelectResData.push({ ...data, is_login: 'Online' })
                            // away
                            else newSelectResData.push({ ...data, is_login: 'Away' })
                        }
                        // offline users
                        else newSelectResData.push({ ...data, is_login: 'Offline' })
                    }
                }
                // response
                result = await respond(200, `${action} success`, newSelectResData)
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController getUsers`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async updateProfile(action: string, payload: IProfilePayload, req: NextRequest) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // object to run query
            const queryObject: Partial<IQueryUpdate> = payload?.photo 
            ? {
                table: 'profiles',
                selectColumn: this.dq.columnSelector('profiles', 234),
                whereColumn: 'user_id',
                whereValue: payload.user_id.id,
                get updateColumn() {
                    return {
                        photo: payload.photo,
                        updated_at: new Date().toISOString()
                    }
                }
            } : {
                table: 'profiles',
                function: 'update_user_profile',
                function_args: {
                    user_me: payload.user_id.id,
                    name: payload.display_name,
                    descript: payload.description
                }
            }
            // update data
            const updateResponse = await this.dq.update<IProfilePayload>(queryObject as IQueryUpdate)
            // fail 
            if(updateResponse.data === null) {
                result = await respond(500, updateResponse.error, [])
            }
            // success
            else if(updateResponse.error === null) {
                // jwt payload
                const jwtPayload = {
                    id: payload.user_id.id,
                    display_name: updateResponse.data[0]?.user_id?.display_name || updateResponse.data[0].display_name,
                    is_login: 'Online',
                    description: updateResponse.data[0].description,
                    photo: updateResponse.data[0].photo
                }
                // create access token 
                const accessToken = await this.auth.generateAccessToken(jwtPayload)
                // create refresh token
                const refreshToken = await this.auth.generateRefreshToken(jwtPayload)
                // save refresh token
                cookies().set('refreshToken', refreshToken, { 
                    path: '/',
                    domain: req.nextUrl.hostname,
                    maxAge: 7776000, // 3 months
                    httpOnly: true 
                })
                result = await respond(200, `${action} success`, updateResponse.data)
                // add access token to response
                result.data[0] = {...result.data[0], token: accessToken}
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController updateProfile`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }

    async logout(action: string, payload: Pick<ILoginPayload, 'id'>, req: NextRequest) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload as ILoginPayload)
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
                result = await respond(500, selectResponse.error, [])
            }
            // success
            else if(selectResponse.error === null) {
                const filterLoggedUsers: string = await this.alterLoggedUsers({ action: 'filter', data: {id: payload.id} })
                // publish logged users data to client
                await this.pubnubPublish('logged-users', filterLoggedUsers)
                // delete refresh token
                cookies().set('refreshToken', '', { 
                    path: '/',
                    domain: req.nextUrl.hostname,
                    httpOnly: true 
                })
                // response
                result = await respond(204, action, [])
            }
            // return response
            return result
        } catch (err) {
            console.log(`error UserController logout`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
}