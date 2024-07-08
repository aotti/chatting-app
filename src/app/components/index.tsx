'use client'

import { useState, useEffect, Dispatch, SetStateAction } from "react"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"
import { LoginProfileContext, LoginProfileType } from "../context/LoginProfileContext"
import { jwtVerify } from "jose"
import { fetcher } from "./helper"
import { ILoggedUsers, IResponse } from "../types"
import { DarkModeContext } from "../context/DarkModeContext"
import { UsersFoundContext } from "../context/UsersFoundContext"
import { ChatWithContext } from "../context/ChatWithContext"
import FooterContent from "./footer/FooterContent"
import Pubnub, { ListenerParameters } from "pubnub"
import { PubNubProvider } from "pubnub-react"
import { decryptData } from "../api/helper"

interface IndexProps {
    accessSecret: string;
    pubnubKeys: Record<'sub'|'pub'|'uuid', string>;
    decryptKey: string;
}
// timeout state
interface IUserTimeout {
    user_id: string;
    timeout: NodeJS.Timeout;
}

export default function Index({ accessSecret, pubnubKeys, decryptKey }: IndexProps) {
    // pubnub 
    const pubnub = new Pubnub({
        subscribeKey: pubnubKeys.sub,
        publishKey: pubnubKeys.pub,
        userId: pubnubKeys.uuid
    })
    // header-MenuButton
    // dark mode state
    const [darkMode, setDarkMode] = useState(false)
    // dark mode props
    const darkModeStates = {
        darkMode: darkMode,
        setDarkMode: setDarkMode
    }

    // main-SearchBox
    // users found
    const [usersFound, setUsersFound] = useState<LoginProfileType[]>(null)
    // users found props
    const usersFoundStates = {
        usersFound: usersFound,
        setUsersFound: setUsersFound
    }

    // header-MenuButton 
    // main-MainContent, Profile, UserList
    // show my profile
    const [showMyProfile, setShowMyProfile] = useState(false)
    // show other profile
    const [showOtherProfile, setShowOtherProfile] = useState<[boolean, LoginProfileType]>([false, null])

    // header-MenuButton, LogoutButton
    // main-HomePage, LoginPage, Profile, UserList
    // login status 
    const [isLogin, setIsLogin] = useState<[boolean, LoginProfileType]>([false, null])

    // login profile props
    const loginProfileStates = {
        // login
        isLogin: isLogin,
        setIsLogin: setIsLogin,
        // my profile
        showMyProfile: showMyProfile,
        setShowMyProfile: setShowMyProfile,
        // other's profile
        showOtherProfile: showOtherProfile,
        setShowOtherProfile: setShowOtherProfile
    }

    // chat with context
    const [chatWith, setChatWith] = useState<LoginProfileType>(null)
    // chat with states
    const chatWithStates = {
        chatWith: chatWith,
        setChatWith: setChatWith
    }

    const [userTimeout, setUserTimeout] = useState<IUserTimeout[]>([])
    
    // verify access token
    useEffect(() => {
        // get dark mode
        const getDarkMode = window.localStorage.getItem('darkMode')
        // set dark mode state
        setDarkMode(JSON.parse(getDarkMode))
        const getAccessToken = window.localStorage.getItem('accessToken')
        // is exist
        if(!getAccessToken) return
        // verify token
        verifyAccessToken(getAccessToken, accessSecret)
        .then(verifiedUser => {
            // token expired
            if(!verifiedUser) throw 'token expired'
            // set state
            setIsLogin([true, verifiedUser as LoginProfileType])
        }).catch(async error => {
            // token expired
            // create new access token
            const accessTokenOptions: RequestInit = { method: 'GET' }
            const renewAccessToken: IResponse = await (await fetcher('/token', accessTokenOptions)).json()
            // response api
            switch(renewAccessToken.status) {
                case 201: 
                    // get access token
                    const getAccessToken = renewAccessToken.data[0].token
                    // verify token
                    const verifiedUser = await verifyAccessToken(getAccessToken, accessSecret)
                    // save token to local storage
                    window.localStorage.setItem('accessToken', getAccessToken)
                    // set state
                    setIsLogin([true, verifiedUser as LoginProfileType])
                    break
                default: 
                    // remove access token if exist
                    window.localStorage.removeItem('accessToken')
                    console.log(renewAccessToken)
                    break
            }
        })
        return 
    }, [])
    
    // get logged users
    useEffect(() => {
        // subscribe to user status
        pubnub.subscribe({ channels: ['logged-users'] })
        // listener
        const publishedUsersStatus: ListenerParameters = {
            message: (data) => {
                const encryptedUsers = data.message as Record<'iv'|'encryptedData', string>
                if(typeof encryptedUsers === 'object') {
                    window.localStorage.setItem('loggedUsers', encryptedUsers.encryptedData)
                    window.localStorage.setItem('iv', encryptedUsers.iv)
                }
                else console.log({pubnub: `update token failed (${encryptedUsers})`})
            }
        }
        pubnub.addListener(publishedUsersStatus)
        // unsub and remove listener
        return () => {
            pubnub.unsubscribe({ channels: ['users-status'] })
            pubnub.removeListener(publishedUsersStatus)
        }
    }, [])
    
    // change user status (online/offline)
    useEffect(() => {
        const updateUserStatus = async () => {
            const userStates = {
                setChatWith: setChatWith,
                setUsersFound: setUsersFound,
                setUserTimeout: setUserTimeout
            }
            const expiredUsers = await getExpiredUsers(decryptKey, accessSecret, userStates)
            // change user found status (profile status)
            for(let expUser of expiredUsers) {
                const foundUser = usersFound ? usersFound.map(u => u.id).indexOf(expUser.id) : -1
                if(foundUser !== -1) {
                    // ### KALO SUDAH BALIK ONLINE, HAPUS DATA TIMEOUT
                    // ### AGAR BISA FAKE OFFLINE LAGI
                    // check if user alr have timeout 
                    const isUserTimeout = userTimeout.map(u => u.user_id).indexOf(expUser.id)
                    // user alr timeout
                    if(isUserTimeout !== -1) return
                    // set user found to away
                    setUsersFound(users => {
                        users[foundUser].is_login = 'Away'
                        return users
                    })
                    // set timeout for away user before going offline
                    const goingOffline: IUserTimeout = {
                        user_id: expUser.id,
                        timeout: setTimeout(() => {
                            console.log(`${usersFound[foundUser].display_name} is offline`)
                            // set chat with to offline
                            setChatWith(user => { return {...user, is_login: 'Offline'} })
                            // set users found to offline 
                            usersFound[foundUser].is_login = 'Offline'
                            setUsersFound(usersFound)
                        }, 60_000) // 5min 
                    }
                    setUserTimeout(user => [...user, goingOffline])
                }
            }
            
            // change chat with user status (status on chatting page)
            const chatUser = chatWith ? expiredUsers.map(v => v.id).indexOf(chatWith.id) : -1
            // user not found
            if(chatUser === -1) return
            // chat user is away
            setChatWith(user => { return {...user, is_login: 'Away'} })
        }

        document.addEventListener('blur', updateUserStatus)
        document.addEventListener('click', updateUserStatus)
        document.addEventListener('keyup', updateUserStatus)

        return () => {
            document.removeEventListener('blur', updateUserStatus)
            document.removeEventListener('click', updateUserStatus)
            document.removeEventListener('keyup', updateUserStatus)
        }
    }, [usersFound, chatWith, isLogin, userTimeout])
    
    return (
        <DarkModeContext.Provider value={ darkModeStates }>
            <LoginProfileContext.Provider value={ loginProfileStates }>
                <UsersFoundContext.Provider value={ usersFoundStates }>
                    <ChatWithContext.Provider value={ chatWithStates }>
                        <PubNubProvider client={pubnub}>
                            <div className={ darkMode ? 'dark' : '' }>
                                <div className="grid grid-rows-10 bg-slate-300 dark:bg-slate-800">
                                    {/* header */}
                                    <header className="row-span-1 h-fit p-3 bg-blue-300 dark:bg-orange-400 dark:text-white">
                                        <HeaderContent />
                                    </header>
                                    {/* main */}
                                    <main className="row-span-8 h-full dark:text-white">
                                        <MainContent />
                                    </main>
                                    {/* footer */}
                                    <footer className="row-span-1 p-3 bg-blue-400 dark:bg-orange-600 dark:text-white">
                                        <FooterContent />
                                    </footer>
                                </div>
                            </div>
                        </PubNubProvider>
                    </ChatWithContext.Provider>
                </UsersFoundContext.Provider>
            </LoginProfileContext.Provider>
        </DarkModeContext.Provider>
    )
}

async function verifyAccessToken(token: string, accessSecret: string, onlyVerify?: boolean) {
    try {
        // verify token
        const encodedSecret = new TextEncoder().encode(accessSecret)
        const verifyToken = await jwtVerify<LoginProfileType>(token, encodedSecret)
        // only wanna verify, not get the payload
        if(onlyVerify) return true
        // token verified
        const verifiedUser = {
            id: verifyToken.payload.id,
            display_name: verifyToken.payload.display_name,
            is_login: verifyToken.payload.is_login,
            description: verifyToken.payload.description
        }
        return verifiedUser
    } catch (error) {
        return null
    }
}

type IUserStates = {
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>;
    setUsersFound: Dispatch<SetStateAction<LoginProfileType[]>>;
    setUserTimeout: Dispatch<SetStateAction<IUserTimeout[]>>;
}
async function getExpiredUsers(decryptKey: string, accessSecret: string, userStates: IUserStates) {
    try {
        // nonce and encrypted data
        const iv = window.localStorage.getItem('iv')
        const encryptedData = window.localStorage.getItem('loggedUsers')
        // decrypt the data
        const decrypted = await decryptData({key: decryptKey, iv: iv, encryptedData: encryptedData})
        const filterDecrypted = decrypted.decryptedData.match(/\[.*\]/)[0]
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
        console.log(error)
    }
}