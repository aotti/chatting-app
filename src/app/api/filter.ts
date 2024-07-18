import { IDirectChatPayload, IHistoryMessagePayload, ILoginPayload, IProfilePayload, IRegisterPayload, IResponse, PayloadTypes } from "../types";
import { respond } from "./helper";

export default async function filter(action: string, payload: PayloadTypes) {
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
            [filterStatus, filterMessage] = getUser(payload)
            break
        case action.includes('register'):
            // filtering
            [filterStatus, filterMessage] = register(payload)
            break
        case action.includes('login'):
            // filtering
            [filterStatus, filterMessage] = login(payload)
            break
        case action.includes('logout'): 
            // filtering
            [filterStatus, filterMessage] = logout(payload)
            break
        case action.includes('insert chat direct'): 
            // filtering
            [filterStatus, filterMessage] = directChat(payload)
            break
        case action.includes('get chat direct'): 
            // filtering
            [filterStatus, filterMessage] = historyMessages(payload)
            break
    }
    // found error
    if(!filterStatus) filterResult = await respond(400, filterMessage, [])
    // return response
    return filterResult
}

function getUser(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /display_name/g
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
            case 'display_name':
                const displayNameRegex = /[^a-z\s]/gi
                resultValue = valueCheck(key, value, 'string', 3, displayNameRegex); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function register(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /display_name|username|password/g
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
            case 'display_name':
                const displayNameRegex = /[^a-z\s]/gi
                resultValue = valueCheck(key, value, 'string', 5, displayNameRegex); break
            case 'username':
                const usernameRegex = /[^a-z0-9]/gi
                resultValue = valueCheck(key, value, 'string', 5, usernameRegex); break
            // hashed password
            case 'password': break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function login(payload: PayloadTypes) {
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
                const usernameRegex = /[^a-z0-9]/gi
                resultValue = valueCheck(key, value, 'string', 5, usernameRegex); break
            // hashed password
            case 'password': break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function logout(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /id/g
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
            case 'id':
                resultValue = uuidCheck(key, value); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function directChat(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_me|user_with|message/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 3)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'user_me':
                resultValue = valueCheck(key, value, 'string', 5); break
            case 'user_with':
                resultValue = valueCheck(key, value, 'string', 5); break
            case 'message':
                resultValue = valueCheck(key, value, 'string', 1); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function historyMessages(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_me|user_with|amount/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 3)
    if(!resultKey[0]) return resultKey
    // payload value
    let resultValue: [boolean, string] = [true, '']
    // loop payload
    for(let key of Object.keys(payload)) {
        const value = payload[key]
        // filter payload value
        switch(key) {
            case 'user_me':
                resultValue = uuidCheck(key, value); break
            case 'user_with':
                resultValue = uuidCheck(key, value); break
            case 'amount':
                resultValue = valueCheck(key, value, 'number'); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

// utility functions
/**
 * check number of payload keys and match each key with regex
 * @param payloadKeys payload keys
 * @param regex regex to match payload keys
 * @param length number of payload keys
 * @returns true if no error
 */
function keyCheck(payloadKeys: string, regex: RegExp, length: number): [boolean, string] {
    // check keys
    if(payloadKeys.match(regex)?.length != length) {
        return [false, `missing payload keys! (${regex.source})`]
    }
    // no error
    return [true, '']
}

/**
 * check payload values type and length
 * @param key payload key
 * @param value payload value
 * @param type typeof value to check
 * @param length value length
 * @returns true if no error
 */
function valueCheck(key: string, value: string | number | boolean, type: string, length?: number, regex?: RegExp): [boolean, string] {
    // check type
    if(typeof value !== type)
        return [false, `"${key}" type does not match!`]
    // check length
    if((value as string).length < length)
        return [false, `"${key}" must have atleast ${length} characters!`]
    // check regex
    const valRegex = (value as string).match(regex)
    if(regex && valRegex)
        return [false, `"${key}" is not allowed to have these characters (${valRegex.join('')})`]
    // no error
    return [true, '']
}

function uuidCheck(key: string, value: string): [boolean, string] {
    const uuidv4_regex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
    if(!value.match(uuidv4_regex))
        return [false, `"${key}" type does not match!`]
    // no error
    return [true, '']
}