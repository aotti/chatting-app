import { ChangeEvent, Dispatch, SetStateAction } from "react"
import { createHash } from "crypto"
import { LoginProfileType } from "../context/LoginProfileContext"
import { jwtVerify } from "jose"
import { ILoggedUsers, IMessage, IResponse, IUnreadMessagePayload, IUserTimeout } from "../types"
import { decryptData, encryptData } from "../api/helper"
import { IGroupsFound } from "../context/UsersFoundContext"

/**
 * @param value html tag / id / class
 * @returns 1st html element that match tag/id/class
 */
export function qS(value: string) {
    return document.querySelector(value)
}

/**
 * @param value html tag / id / class
 * @returns all html element that match tag/id/class
 */
export function qSA(value: string) {
    return document.querySelectorAll(value)
}

export function fetcher(endpoint, options) {
    const host = `${window.location.origin}/api`
    const url = host + endpoint
    return fetch(url, options)
}

export function formInputLength(ev: ChangeEvent<HTMLInputElement>) {
    // get current value
    const value = ev.currentTarget.value
    const minLength = ev.currentTarget.minLength
    // check length
    if(value.length < minLength) 
        ev.currentTarget.style.boxShadow = '0 0 10px inset crimson'
    else 
        ev.currentTarget.style.removeProperty('box-shadow')
}

export function sha256(text: string) {
    const hash = createHash('sha256').update(text).digest('hex')
    return hash
}

export async function verifyAccessToken(token: string, secret: string, onlyVerify?: boolean) {
    try {
        // verify token
        const encodedSecret = new TextEncoder().encode(secret)
        const verifyToken = await jwtVerify<LoginProfileType>(token, encodedSecret)
        // only wanna verify, not get the payload
        if(onlyVerify) return true
        // token verified
        const verifiedUser = {
            id: verifyToken.payload.id,
            display_name: verifyToken.payload.display_name,
            is_login: verifyToken.payload.is_login,
            description: verifyToken.payload.description,
            photo: verifyToken.payload.photo,
            group: []
        }
        return verifiedUser
    } catch (error) {
        return null
    }
}

export function addMessageItem(data: IMessage[], userMe: LoginProfileType, userWith: LoginProfileType | IGroupsFound, tempMessages: IMessage['messages'][0]) {
    // temp message items data
    const tempData = data ? data : []
    const isTargetExist = tempData.map(v => v.user_with).indexOf(`${userWith.id}`) // group id = number
    // havent chat with this user yet
    if(isTargetExist === -1) {
        // push target data 
        tempData.push({
            user_me: userMe.id, 
            user_with: `${userWith.id}`, // group id = number 
            messages: [tempMessages]
        })
        // return data
        return tempData
    }
    // have chatted with this user
    else {
        tempData[isTargetExist].messages.push(tempMessages)
        // return data
        return tempData
    }
}

type IUserStates = {
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>;
    setUsersFound: Dispatch<SetStateAction<LoginProfileType[]>>;
    setUserTimeout: Dispatch<SetStateAction<IUserTimeout[]>>;
}
export async function getExpiredUsers(crypto: Record<'key'|'iv', string>, accessSecret: string, userStates: IUserStates) {
    try {
        // nonce and encrypted data
        const encryptedData = window.localStorage.getItem('loggedUsers')
        // decrypt the data
        const decrypted = await decryptData({key: crypto.key, iv: crypto.iv, encryptedData: encryptedData})
        const filterDecrypted = decrypted.match(/\[.*\]/)[0]
        // verify the token
        const expiredUsers = [] as {id: string}[]
        const usersData = JSON.parse(filterDecrypted) as ILoggedUsers[]
        for(let user of usersData) {
            const isVerified = await verifyAccessToken(user.token, accessSecret, true) as boolean
            // token expired
            if(!isVerified) {
                // push id of user who is away
                expiredUsers.push({ id: user.id })
            }
            // token active
            else {
                // set users to online
                const { setChatWith, setUsersFound, setUserTimeout }: IUserStates = userStates
                // remove timeout user if exist
                setUserTimeout(data => {
                    if(data.length > 0) {
                        // clear timeout
                        const getTimeout = data.filter(u => u.user_id === user.id)[0]
                        clearTimeout(getTimeout.timeout)
                        // return data with filtered user
                        return data.filter(u => u.user_id !== user.id)
                    }
                    else return data
                })
                // user chat with status
                setChatWith(data => {
                    if(data != null && data?.id === user.id) {
                        data.is_login = 'Online'
                        return data
                    }
                    else return data
                })
                // users found status
                setUsersFound(data => {
                    const isUserMatch = data != null ? data.map(u => u.id).indexOf(user.id) : -1
                    if(isUserMatch !== -1) {
                        data[isUserMatch].is_login = 'Online'
                        return data
                    }
                    else return data
                })
            }
        }
        // return expired users
        return expiredUsers
    } catch (error) {
        return null
    }
}

export async function getUnreadMessages(crypto: Record<'key'|'iv', string>, user: LoginProfileType & IGroupsFound) {
    // access token
    const token = window.localStorage.getItem('accessToken')
    const lastAccess = window.localStorage.getItem('lastAccess')
    // fetch stuff
    const unreadMessagesPayload: IUnreadMessagePayload = {
        user_id: user.id,
        display_name: user.display_name,
        group_names: user.group.join(','),
        last_access: lastAccess
    }
    const encryptedPayload = await encryptData({text: JSON.stringify(unreadMessagesPayload), key: crypto.key, iv: crypto.iv})
    // using POST method to force revalidate the data
    // vercel dont revalidate it with GET method 
    // even after modify the cache-control to no-store / s-maxage=1
    const unreadMessagesFetchOptions: RequestInit = { 
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: encryptedPayload })
    }
    // fetching
    const unreadMessagesResponse: IResponse = await (await fetcher(`/user/autologin`, unreadMessagesFetchOptions)).json()
    // response api
    switch(unreadMessagesResponse.status) {
        case 200:
            console.log(unreadMessagesResponse);
            
            return modifyUnreadMessages(unreadMessagesResponse)
        default: 
            console.log({unreadMessagesResponse})
    }
}

export function modifyUnreadMessages(fetchResponse: IResponse) {
    const unreadMessagesData = fetchResponse.data[0].unread_messages as Record<'display_name'|'type'|'message', string>[]
    if(unreadMessagesData.length === 0) return []
    // modify data before return
    const modifiedUnreadMessages = []
    // get only display name
    new Map(unreadMessagesData.map(v => [v['display_name'], v])).forEach(v => {
        modifiedUnreadMessages.push({ display_name: v['display_name'], type: v['type'], unread_messages: [] })
    })
    // push the messages
    for(let data of unreadMessagesData) {
        // find the display name index
        const unreadName = modifiedUnreadMessages.map(v => v['display_name']).indexOf(data.display_name)
        if(unreadName !== -1)
            modifiedUnreadMessages[unreadName]['unread_messages'].push(data.message)
    }
    return modifiedUnreadMessages
}

export async function getGroupNames(userData: LoginProfileType) {
    // access token
    const token = window.localStorage.getItem('accessToken')
    // using POST method to force revalidate the data
    // vercel dont revalidate it with GET method 
    // even after modify the cache-control to no-store / s-maxage=1
    const getGroupFetchOptions: RequestInit = { 
        method: 'POST',
        headers: {
            'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_me: userData.id })
    }
    // fetching
    const getGroupResponse: IResponse = await (await fetcher(`/group`, getGroupFetchOptions)).json()
    // response api
    switch(getGroupResponse.status) {
        case 200:
            console.log(getGroupResponse);
            // modify array object literal to array string
            const groupNames = getGroupResponse.data.map(v => v.group_chat_id.name)
            return groupNames
        default: 
            console.log({getGroupResponse})
    }
}