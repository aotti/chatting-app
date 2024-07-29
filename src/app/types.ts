import { PostgrestError } from "@supabase/supabase-js";
import { LoginProfileType } from "./context/LoginProfileContext";

// other
// timeout state
interface IUserTimeout {
    user_id: string;
    timeout: NodeJS.Timeout;
}

// ~~ POSTGREST RETURN TYPE PROMISE ~~
type PG_PromiseType<Data> = Promise<{ data: Data[] | null, error: PostgrestError | null }>

// queries
interface IQueryBuilder {
    table: string;
    selectColumn?: string | number;
    function?: string;
    function_args?: {[key: string]: string | number};
    order?: {
        col: string;
        by: 'asc' | 'desc';
    }
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

// encrypt/decrypt data
interface IEncryptDecryptProps {
    key?: string;
    iv?: string;
    text: string;
    encryptedData: string;
}

// token verify
interface ITokenVerifyOnly {
    action: 'verify-only';
    token: string;
}
interface ITokenVerifyPayload {
    action: 'verify-payload';
    token: string;
}

type TokenVerifyReturn<T> = ReturnType<() => T extends ITokenVerifyOnly ? boolean : LoginProfileType>
type TokenVerifyType = ITokenVerifyOnly | ITokenVerifyPayload

// controller
interface IPushLoggedUsers {
    id: string;
    display_name: string;
}

interface IFilterLoggedUsers {
    id: string;
}

type LoggedUsersType = {action: 'push'; data: IPushLoggedUsers} | {action: 'filter'; data: IFilterLoggedUsers} | {action: 'getUsers'; data: IFilterLoggedUsers} | {action: 'renew'; data: IPushLoggedUsers}

// payload types
type PayloadTypes = IRegisterPayload | ILoginPayload | IProfilePayload | IDirectChatPayload | IHistoryMessagePayload

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
    last_access?: string;
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
interface IMessage extends IDirectChat {
    messages: {
        user: string;
        style: string;
        text: string;
        time: string;
        date: string;
        created_at: string;
    }[]
}

// direct message
interface IDirectChat {
    user_me: string;
    user_with: string;
    message_id?: {
        user_id: string;
        message: string;
        created_at?: string;
        updated_at?: string;
    }
}

interface IDirectChatPayload extends IDirectChat {
    display_me: string;
    message: string;
    time: string;
    date: string;
    created_at: string;
}

interface IHistoryMessagePayload extends IDirectChat {
    amount: number;
}

export type {
    // other
    IUserTimeout,
    PG_PromiseType,
    // queries
    IQuerySelect,
    IQueryInsert,
    IQueryUpdate,
    // response
    IResponse,
    // encrypt
    IEncryptDecryptProps,
    // token verify
    TokenVerifyReturn,
    TokenVerifyType,
    // controller
    LoggedUsersType,
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
    IDirectChatPayload,
    IHistoryMessagePayload
}