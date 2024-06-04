import { IResponse } from "../types";

export function respond(s: number, m: string | object, d: any[]): IResponse {
    return {
        status: s,
        message: m,
        data: d
    }
}

export function api_action(pathname: string, method: string) {
    // split /api from pathname, ex: /api/user > /user
    const splitPathname = pathname.match(/(?<=.api.).*/)[0]
    // replace slash with whitespace
    const action = splitPathname.replace(/\//g, ' ')
    // method alt name
    let altMethod = null
    switch(method) {
        case 'GET': 
            altMethod = 'get'; break
        case 'POST': 
            altMethod = 'insert'; break
        case 'PATCH':
            altMethod = 'update'; break
    }
    return `${altMethod} ${action}`
}