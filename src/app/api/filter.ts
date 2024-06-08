import { ILoginPayload, IProfilePayload, IRegisterPayload, IResponse, PayloadTypes } from "../types";
import { respond } from "./helper";

export default function filter(action: string, payload: PayloadTypes) {
    console.log(action);

    let filterResult: IResponse = {
        status: 200,
        message: 'payload ok',
        data: []
    }
    let [filterStatus, filterMessage]: [boolean, string] = [true, '']
    // check payload
    switch(true) {
        case action.includes('get user'):
            // filtering
            [filterStatus, filterMessage] = getUser(payload as IProfilePayload)
            // found error
            if(!filterStatus) {
                filterResult = respond(400, filterMessage, [])
            }
            break
        case action.includes('register'):
            // filtering
            [filterStatus, filterMessage] = register(payload as IRegisterPayload)
            // found error
            if(!filterStatus) {
                filterResult = respond(400, filterMessage, [])
            }
            break
        case action.includes('login'):
            // filtering
            [filterStatus, filterMessage] = login(payload as ILoginPayload)
            // found error
            if(!filterStatus) {
                filterResult = respond(400, filterMessage, [])
            }
            break
        case action.includes('logout'): 
            // filtering
            [filterStatus, filterMessage] = logout(payload as Pick<ILoginPayload, 'username' | 'is_login'>)
            // found error
            if(!filterStatus) {
                filterResult = respond(400, filterMessage, [])
            }
            break
    }
    // return response
    return filterResult
}

function getUser(payload: IProfilePayload): [boolean, string] {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /username/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 1)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'username':
                resultValue = valueCheck(key, value, 'string', 3); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function register(payload: Omit<IRegisterPayload, 'confirm_password'>): [boolean, string] {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /is_login|display_name|username|password/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 4)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'is_login':
                resultValue = valueCheck(key, value, 'boolean'); break
            case 'display_name':
                resultValue = valueCheck(key, value, 'string', 5); break
            case 'username':
                resultValue = valueCheck(key, value, 'string', 5); break
            // hashed password
            case 'password': break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function login(payload: ILoginPayload): [boolean, string] {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /username|password/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 2)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'username':
                resultValue = valueCheck(key, value, 'string', 5); break
            // hashed password
            case 'password': break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function logout(payload: Pick<ILoginPayload, 'username' | 'is_login'>) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /username|is_login/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 2)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'is_login':
                resultValue = valueCheck(key, value, 'boolean'); break
            case 'username':
                resultValue = valueCheck(key, value, 'string', 5); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

// utility functions

function keyCheck(payloadKeys: string, regex: RegExp, length: number): [boolean, string] {
    // check keys
    if(payloadKeys.match(regex)?.length != length) {
        return [false, `missing payload keys! (${regex.source})`]
    }
    // no error
    return [true, '']
}

function valueCheck(key: string, value: string | number | boolean, type: string, length?: number): [boolean, string] {
    // check type
    if(typeof value !== type)
        return [false, `"${key}" type does not match!`]
    // check length
    if((value as string).length < length)
        return [false, `"${key}" must have atleast ${length} characters!`]
    // no error
    return [true, '']
}