import Pubnub from "pubnub";
import { ILoggedUsers, LoggedUsersType } from "../types";
import { DatabaseQueries } from "../config/DatabaseQueries";
import AuthController from "./token/AuthController";
import { encryptData } from "./helper";

// log users online
let loggedUsers: ILoggedUsers[] = []

export class Controller {
    protected dq = new DatabaseQueries()
    protected auth = new AuthController()

    // pubnub for publish
    protected pubpub: Pubnub

    constructor() {
        // initialize pubnub
        this.pubpub = new Pubnub({
            subscribeKey: process.env.PUBNUB_SUB_KEY,
            publishKey: process.env.PUBNUB_PUB_KEY,
            userId: process.env.PUBNUB_UUID
        })
    }

    protected async pubnubPublish(channel: string, data: any) {
        await this.pubpub.publish({
            channel: channel,
            message: data
        })
    }

    protected async alterLoggedUsers<T>(args: LoggedUsersType): Promise<T> {
        if(args.action === 'push') {
            // create token for logged users
            const loggedUserToken = await this.auth.generateAccessToken({ display_name: args.data.display_name })
            // push to logged users
            loggedUsers.push({
                ...args.data,
                token: loggedUserToken
            })
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(loggedUsers)})
            console.log(args.action, {loggedUsers})
            return encryptedLoggedUsers as T
        }
        else if(args.action === 'filter') {
            // pop logout user from logged users
            loggedUsers = loggedUsers.filter(u => u.id !== args.data.id)
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(loggedUsers)})
            console.log(args.action, {loggedUsers})
            return encryptedLoggedUsers as T
        }
        else if(args.action === 'getUsers') {
            console.log(args.action, {loggedUsers})
            return loggedUsers.filter(u => u.id === args.data.id) as T
        }
        else if(args.action === 'renew') {
            // create token for logged users
            const loggedUserToken = await this.auth.generateAccessToken({ display_name: args.data.display_name })
            // find user 
            const renewUser = loggedUsers.map(user => user.id).indexOf(args.data.id)
            if(renewUser === -1) return null
            // user found
            // update my token
            loggedUsers[renewUser].token = loggedUserToken
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(loggedUsers)})
            console.log(args.action, {loggedUsers})
            return encryptedLoggedUsers as T
        }
    }
}