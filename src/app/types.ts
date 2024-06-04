import { PostgrestError } from "@supabase/supabase-js";

// ~~ POSTGREST RETURN TYPE PROMISE ~~
type PG_PromiseType<Data> = Promise<{ data: Data[] | null, error: PostgrestError | null }>

// queries
interface IQueryBuilder {
    table: string;
    selectColumn?: string | number;
}

interface IQuerySelect extends IQueryBuilder {
    whereColumn?: string;
    whereValue?: string | number;
    limit?: { min: number, max: number };
    function?: string[];
}

interface IQueryInsert extends IQueryBuilder {
    get insertColumn(): 
        // register
        IRegister |
        // login
        ILogin
}

interface IQueryUpdate extends IQueryBuilder {
    whereColumn: string;
    whereValue: string | number;
    get updateColumn(): 
        // register
        IRegister |
        // login
        ILogin
}

// response
interface IResponse {
    status: number;
    message: string | object;
    data: any[];
}

// payload types
type PayloadTypes = IRegisterPayload | ILoginPayload | IProfilePayload

// register
interface IRegister {
    is_login: boolean;
    display_name: string;
    username: string;
    password: string;
}

interface IRegisterPayload extends IRegister {
    confirm_password: string;
}

// login

/**
 * property yang diperlukan saat login
 * LOGIN = username, password
 * UPDATE LOGIN = is_login, token, updated_at
 * SELECT PROFILE = id / user_id
 */

interface LoginType {
    id?: string;
    username?: string;
}

interface ILogin {
    // only for update query to prevent 'get updateColumn' error
    id?: string;
    is_login?: boolean;
    display_name?: string;
    updated_at?: string;
}

interface ILoginPayload extends ILogin {
    username: string;
    password: string;
}

// profile
interface iProfile {
    user_id?: {
        id: string;
        is_login: boolean;
        username: string;
        display_name: string;
    }
    description?: string;
}

/**
 * @param username used when search user
 */
interface IProfilePayload extends iProfile {
    username: string;
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
    // register
    IRegisterPayload,
    // login
    LoginType,
    ILoginPayload,
    // profile
    IProfilePayload
}