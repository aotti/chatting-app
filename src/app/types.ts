import { PostgrestError } from "@supabase/supabase-js";

// ~~ POSTGREST RETURN TYPE PROMISE ~~
type PG_PromiseType = Promise<{ data: any[] | null, error: PostgrestError | null }>

// queries
interface IQueryBuilder {
    table: string;
    selectColumn: string | number;
    whereColumn: string | null;
    whereValue: string | number | null;
}

interface IQuerySelect extends IQueryBuilder {
    whereColumn: string;
    whereValue: string | number;
    limit?: { min: number, max: number };
    function?: string;
}

interface IQueryInsert extends Omit<IQueryBuilder, 'whereColumn' | 'whereValue'> {
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
type PayloadTypes = IRegisterPayload | ILoginPayload

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
interface ILogin {
    // only for update query to prevent 'get updateColumn' error
    is_login?: boolean;
    updated_at?: string;
}

interface ILoginPayload extends ILogin {
    username: string;
    password: string;
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
    ILoginPayload
}