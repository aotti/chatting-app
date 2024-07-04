import { PostgrestError } from "@supabase/supabase-js";
import { UUID } from "crypto";

// ~~ POSTGREST RETURN TYPE PROMISE ~~
type PG_PromiseType<Data> = Promise<{ data: Data[] | null, error: PostgrestError | null }>

// queries
interface IQueryBuilder {
    table: string;
    selectColumn?: string | number;
    function?: string;
    function_args?: {[key: string]: string}
}

interface IQuerySelect extends IQueryBuilder {
    whereColumn?: string;
    whereValue?: string | number;
    limit?: { min: number, max: number };
}

interface IQueryInsert extends IQueryBuilder {
    get insertColumn(): 
        // register
        IRegister |
        // login
        ILogin |
        // direct chat
        IDirectChat
}

interface IQueryUpdate extends IQueryBuilder {
    whereColumn: string;
    whereValue: string | number;
    get updateColumn(): 
        // register
        IRegister |
        // login
        ILogin |
        // direct chat
        IDirectChat
}

// response
interface IResponse {
    status: number;
    message: string | object;
    data: any[];
}

// payload types
type PayloadTypes = IRegisterPayload | ILoginPayload | IProfilePayload | IDirectChatPayload

// register
interface IRegister {
    display_name: string;
    username: string;
    password: string;
}

interface IRegisterPayload extends IRegister {
    confirm_password: string;
}

// logged user
interface ILoggedUsers {
    id: string;
    display_name: string;
    token: string;
}

// login
interface ILogin {
    // only for update query to prevent 'get updateColumn' error
    id?: string;
    is_login?: string;
    display_name?: string;
    updated_at?: string;
}

interface ILoginPayload extends ILogin {
    username: string;
    password: string;
}

// profile
interface IProfile {
    user_id?: {
        id: string;
        is_login: string;
        username: string;
        display_name: string;
    }
    description?: string;
}

/**
 * @param username used when search user
 */
interface IProfilePayload extends IProfile {
    username: string;
}

// message object
interface IMessage {
    style: string;
    author: string;
    text: string;
    time: string;
}

// direct message
interface IDirectChat {
    user_from: string;
    user_to: string;
    message_id?: {
        message: string;
        created_at?: string;
        updated_at?: string;
    }
}

interface IDirectChatPayload extends IDirectChat {
    message: string;
    time: string;
}

export type {
    PG_PromiseType,
    // queries
    IQuerySelect,
    IQueryInsert,
    IQueryUpdate,
    // response
    IResponse,
    // payload type
    PayloadTypes,
    // logged user
    ILoggedUsers,
    // register
    IRegisterPayload,
    // login
    ILoginPayload,
    // profile
    IProfilePayload,
    // message object
    IMessage,
    // direct message
    IDirectChatPayload
}