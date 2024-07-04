import Pubnub from "pubnub";
import { ILoggedUsers } from "../types";
import { DatabaseQueries } from "../config/DatabaseQueries";
import AuthController from "./token/AuthController";
import { encryptData } from "./helper";

interface IPushLoggedUsers {
    id: string;
    display_name: string;
}

interface IFilterLoggedUsers {
    id: string;
}

type LoggedUsersType = {action: 'push'; data: IPushLoggedUsers} | {action: 'filter'; data: IFilterLoggedUsers} | {action: 'getUsers'; data: IFilterLoggedUsers}

export class Controller {
    protected dq = new DatabaseQueries()
    protected auth = new AuthController()
    // log users online
    protected static loggedUsers: ILoggedUsers[] = []

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

    protected async alterLoggedUsers(args: LoggedUsersType) {
        if(args.action === 'push') {
            // create token for logged users
            const loggedUserToken = await this.auth.generateAccessToken({ display_name: args.data.display_name })
            // push to logged users
            Controller.loggedUsers.push({
                ...args.data,
                token: loggedUserToken
            })
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData(JSON.stringify(Controller.loggedUsers))
            return encryptedLoggedUsers
        }
        else if(args.action === 'filter') {
            // pop logout user from logged users
            Controller.loggedUsers = Controller.loggedUsers.filter(u => u.id !== args.data.id)
            // hash the logged users 
            const encryptedLoggedUsers = await encryptData(JSON.stringify(Controller.loggedUsers))
            return encryptedLoggedUsers
        }
        else if(args.action === 'getUsers') {
            return Controller.loggedUsers.filter(u => u.id === args.data.id)
        }
    }
}