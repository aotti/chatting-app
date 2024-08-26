import { IResponse, PayloadTypes } from "../types";
import { respond } from "./helper";

export default async function filter(action: string, payload: PayloadTypes) {
    // log the action
    console.log(action);

    let filterResult: IResponse = {
        status: 200,
        message: 'payload ok',
        data: []
    }
    let [filterStatus, filterMessage]: [boolean, string] = [true, '']
    // check payload
    switch(true) {
        // filtering
        // user routes
        case action.includes('get user'): [filterStatus, filterMessage] = getUser(payload); break
        case action.includes('register'): [filterStatus, filterMessage] = register(payload); break
        case action.includes('login'): [filterStatus, filterMessage] = login(payload); break
        case action.includes('logout'): [filterStatus, filterMessage] = logout(payload); break
        case action.includes('user photo'): [filterStatus, filterMessage] = updateUserPhoto(payload); break
        case action.includes('user profile'): [filterStatus, filterMessage] = updateUserProfile(payload); break
        // chat routes
        case action.includes('insert chat direct'): 
        case action.includes('insert chat group'):
        case action.includes('chat image'):
            [filterStatus, filterMessage] = sendChat(payload); break
        case action.includes('get chat direct'): [filterStatus, filterMessage] = historyDMS(payload); break
        case action.includes('get chat group'): [filterStatus, filterMessage] = historyGMS(payload); break
        // unread direct & group
        case action.includes('unread dms'): [filterStatus, filterMessage] = unreadDMS(payload); break
        // group routes
        case action.includes('get group'): [filterStatus, filterMessage] = getGroup(payload); break
        case action.includes('group names'): [filterStatus, filterMessage] = getGroupNames(payload); break
        case action.includes('group create'): [filterStatus, filterMessage] = createGroup(payload); break
        case action.includes('group join'): [filterStatus, filterMessage] = joinGroup(payload); break
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
    const resultKey = keyCheck(payloadKeys, regexKeys, 3)
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

function updateUserPhoto(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_id|photo/g
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
            case 'user_id':
                resultValue = valueCheck(key, value, 'object'); break
            case 'photo':
                resultValue = valueCheck(key, value, 'string', 60); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function updateUserProfile(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_id|display_name|description/g
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
            case 'user_id':
                resultValue = valueCheck(key, value, 'object'); break
            case 'display_name':
                const displayNameRegex = /[^a-z\s]/gi
                resultValue = valueCheck(key, value, 'string', 5, displayNameRegex); break
            case 'description':
                resultValue = valueCheck(key, value, 'string', 1); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function sendChat(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_me|display_me|user_with|message|is_group_chat|is_image|is_uploaded|image_size|time|date|created_at/g
    // filter payload key
    const resultKey = keyCheck(payloadKeys, regexKeys, 11)
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
            case 'display_me':
                const displayNameRegex = /[^a-z\s]/gi
                resultValue = valueCheck(key, value, 'string', 5, displayNameRegex); break
            case 'user_with':
                resultValue = valueCheck(key, value, 'string', 5); break
            case 'message':
                resultValue = valueCheck(key, value, 'string', 1); break
            case 'is_image':
                resultValue = valueCheck(key, value, 'boolean'); break
            case 'is_uploaded':
                resultValue = valueCheck(key, value, 'boolean'); break
            case 'image_size':
                resultValue = valueCheck(key, value, 'number'); break
            case 'time':
                resultValue = valueCheck(key, value, 'string'); break
            case 'date':
                resultValue = valueCheck(key, value, 'boolean'); break
            case 'created_at':
                resultValue = valueCheck(key, value, 'number'); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function historyDMS(payload: PayloadTypes) {
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

function historyGMS(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_with|amount/g
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
            case 'user_with':
                resultValue = valueCheck(key, value, 'string'); break
            case 'amount':
                resultValue = valueCheck(key, value, 'number'); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function unreadDMS(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /id|display_name|last_access/g
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
            case 'id':
                resultValue = uuidCheck(key, value); break
            case 'display_name':
                const displayNameRegex = /[^a-z\s]/gi
                resultValue = valueCheck(key, value, 'string', 3, displayNameRegex); break
            case 'last_access':
                resultValue = valueCheck(key, value, 'string', 20); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function getGroup(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /user_me/g
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
            case 'user_me':
                resultValue = uuidCheck(key, value); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function getGroupNames(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /group_name/g
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
            case 'group_name':
                resultValue = valueCheck(key, value, 'string', 3); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function createGroup(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /group_name|group_code|user_me/g
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
            case 'group_name':
                resultValue = valueCheck(key, value, 'string', 5); break
            case 'group_code':
                resultValue = valueCheck(key, value, 'string', 8); break
            case 'user_me':
                resultValue = uuidCheck(key, value); break
        }
        // error found
        if(!resultValue[0]) return resultValue
    }
    // no error
    return resultValue
}

function joinGroup(payload: PayloadTypes) {
    // payload key
    const payloadKeys = Object.keys(payload).join(',')
    const regexKeys = /group_code|user_me/g
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
            case 'group_code':
                resultValue = valueCheck(key, value, 'string', 8); break
            case 'user_me':
                resultValue = uuidCheck(key, value); break
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

type ValueCheckTypes = 'string' | 'number' | 'boolean' | 'object'
/**
 * check payload values type and length
 * @param key payload key
 * @param value payload value
 * @param type typeof value to check
 * @param length required value length
 * @returns true if no error
 */
function valueCheck(key: string, value: string | number | boolean, type: ValueCheckTypes, length?: number, regex?: RegExp): [boolean, string] {
    // check type
    if(typeof value !== type)
        return [false, `"${key}" type does not match!`]
    // check length
    if((value as string).length < length)
        return [false, `"${key}" must have atleast ${length} characters!`]
    // check regex
    const valRegex = regex ? (value as string).match(regex) : null
    if(valRegex)
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