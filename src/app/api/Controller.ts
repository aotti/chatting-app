import Pubnub from "pubnub";
import { ILoggedUsers, LoggedUsersType } from "../types";
import { DatabaseQueries } from "../config/DatabaseQueries";
import AuthController from "./token/AuthController";
import { encryptData } from "./helper";


export class Controller {
    protected dq = new DatabaseQueries()
    protected auth = new AuthController()
    // log users online
    private static loggedUsers: ILoggedUsers[] = []

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
            Controller.loggedUsers.push({
                ...args.data,
                token: loggedUserToken
            })
            // filter logged users to prevent duplitcate data
            const tempLoggedUsers = []
            new Map(Controller.loggedUsers.map(v => [v['display_name'], v])).forEach(v => tempLoggedUsers.push(v))
            Controller.loggedUsers = tempLoggedUsers
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(Controller.loggedUsers)})
            return encryptedLoggedUsers as T
        }
        else if(args.action === 'filter') {
            // pop logout user from logged users
            Controller.loggedUsers = Controller.loggedUsers.filter(u => u.id !== args.data.id)
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(Controller.loggedUsers)})
            return encryptedLoggedUsers as T
        }
        else if(args.action === 'getUsers') {
            return Controller.loggedUsers.filter(u => u.id === args.data.id) as T
        }
        else if(args.action === 'renew') {
            // create token for logged users
            const loggedUserToken = await this.auth.generateAccessToken({ display_name: args.data.display_name })
            // find user 
            const renewUser = Controller.loggedUsers.map(user => user.id).indexOf(args.data.id)
            if(renewUser === -1) return null
            // user found
            // update my token
            Controller.loggedUsers[renewUser].token = loggedUserToken
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData({text: JSON.stringify(Controller.loggedUsers)})
            return encryptedLoggedUsers as T
        }
    }
}