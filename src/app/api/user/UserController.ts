import { DatabaseQueries } from "../../config/DatabaseQueries"
import { respond } from "../helper"
import { ILoginPayload, IProfilePayload, IQueryInsert, IQuerySelect, IQueryUpdate, IRegisterPayload, IResponse, LoginType } from "../../types"
import filter from "../filter"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import AuthController from "../token/AuthController"

export default class UserController {
    private dq = new DatabaseQueries()
    private authController = new AuthController()

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
                selectColumn: this.dq.columnSelector('users', 345),
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
                        result = await this.loggedIn(action, selectResponse.data[0], req)
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

    async loggedIn(action: string, data: ILoginPayload, req: NextRequest) {
        let result: IResponse

        try {
            const dateNow = new Date()
            // object to run query
            const queryObject: IQueryUpdate = {
                table: 'users',
                selectColumn: this.dq.columnSelector('users', 135),
                whereColumn: 'username',
                whereValue: data.username,
                get updateColumn() {
                    return { 
                        is_login: true,
                        updated_at: dateNow.toISOString()
                    }
                }
            }
            // update data
            const updateResponse = await this.dq.update<ILoginPayload>(queryObject)
            // fail 
            if(updateResponse.data === null) {
                result = respond(500, updateResponse.error, [])
            }
            // success
            else if(updateResponse.error === null) {
                result = await this.getProfiles(action, updateResponse.data[0], req)
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

    async getProfiles<T extends LoginType>(action: string, payload: T, req?: NextRequest) {
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
                    function: ['join_users_profiles', payload.username]
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
                type NewSelectResDataType = {
                    username: string;
                    display_name: string;
                    is_login: boolean;
                    description: string;
                    token?: string;
                }
                let newSelectResData: NewSelectResDataType[] | IProfilePayload[]
                // login case
                if(selectResponse.data[0].user_id?.username) {
                    newSelectResData = [{
                        username: selectResponse.data[0].user_id.username,
                        display_name: selectResponse.data[0].user_id.display_name,
                        is_login: selectResponse.data[0].user_id.is_login,
                        description: selectResponse.data[0].description
                    }]
                    // create access token 
                    const accessToken = await this.authController.generateAccessToken(newSelectResData[0])
                    // create refresh token
                    const refreshSecret = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET)
                    const refreshToken = await new SignJWT(newSelectResData[0])
                        .setProtectedHeader({ alg: 'HS256' })
                        .setAudience('chatting app')
                        .setIssuer('chatting app')
                        .setSubject(newSelectResData[0].username as string)
                        .sign(refreshSecret)
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
                    newSelectResData = selectResponse.data
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
}