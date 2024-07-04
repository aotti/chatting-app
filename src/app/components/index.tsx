'use client'

import { useState, useEffect } from "react"
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

    // timeout state
    interface UserTimeout {
        user_id: string;
        timeout: NodeJS.Timeout
    }
    const [userTimeout, setUserTimeout] = useState<UserTimeout[]>([])
    
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
            const resetAccessToken: IResponse = await (await fetcher('/token', accessTokenOptions)).json()
            // response api
            switch(resetAccessToken.status) {
                case 201: 
                    // get access token
                    const getAccessToken = resetAccessToken.data[0].token
                    // verify token
                    const verifiedUser = await verifyAccessToken(getAccessToken, accessSecret)
                    // save token to local storage
                    window.localStorage.setItem('accessToken', getAccessToken)
                    // set state
                    setIsLogin([true, verifiedUser as LoginProfileType])
                    break
                default: 
                    console.log(resetAccessToken)
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
                window.localStorage.setItem('loggedUsers', encryptedUsers.encryptedData)
                window.localStorage.setItem('iv', encryptedUsers.iv)
            }
        }
        pubnub.addListener(publishedUsersStatus)
        // unsub and remove listener
        return () => {
            pubnub.unsubscribe({ channels: ['users-status'] })
            pubnub.removeListener(publishedUsersStatus)
        }
    }, [])

    if(typeof document !== 'undefined') {
        const updateUserStatus = async () => {
            const expiredUsers = await getExpiredUsers(decryptKey, accessSecret)
            // change chat with user status (status on chatting page)
            if(!chatWith) return
            const chatUser = expiredUsers.map(v => v.id).indexOf(chatWith.id)
            // user is away
            if(chatUser !== -1) {
                // check if user alr have timeout
                const isUserTimeout = userTimeout.map(u => u.user_id).indexOf(expiredUsers[chatUser].id)
                if(isUserTimeout !== -1) return
                // if user dont have timeout
                setChatWith(user => { return {...user, is_login: expiredUsers[chatUser].is_login} })
            }
            // change user found status (profile status)
            for(let expUser of expiredUsers) {
                const foundUser = usersFound.map(u => u.id).indexOf(expUser.id)
                if(foundUser !== -1) {
                    usersFound[foundUser].is_login = expUser.is_login
                    setUsersFound(usersFound)
                    // set timeout for away user before going offline
                    const goingOffline = {
                        user_id: expUser.id,
                        timeout: setTimeout(() => {
                            // set chat with to offline
                            setChatWith(user => { return {...user, is_login: 'Offline'} })
                            // set users found to offline 
                            usersFound[foundUser].is_login = 'Offline'
                            setUsersFound(usersFound)
                        }, 10_000) // 5min
                    }
                    setUserTimeout(user => [...user, goingOffline])
                }
            }
            console.log({userTimeout});
            
        }
        
        document.onblur = async () => await updateUserStatus()
        document.onclick = async () => await updateUserStatus()
        document.onkeyup = async () => await updateUserStatus()
    }
    
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

async function getExpiredUsers(decryptKey: string, accessSecret: string) {
    try {
        // nonce and encrypted data
        const iv = window.localStorage.getItem('iv')
        const encryptedData = window.localStorage.getItem('loggedUsers')
        // decrypt the data
        const decrypted = await decryptData({key: decryptKey, iv: iv, encryptedData: encryptedData})
        const filterDecrypted = decrypted.decryptedData.match(/\[.*\]/)[0]
        // verify the token
        const expiredUsers = [] as Record<'id'|'is_login', string>[]
        const usersData = JSON.parse(filterDecrypted) as ILoggedUsers[]
        for(let user of usersData) {
            const isVerified = await verifyAccessToken(user.token, accessSecret)
            // token expired
            if(!isVerified) {
                // set user is_login to Away
                // then setTimeout (5min) before set to Offline 
                // ### buat useState untuk setTimeout
                expiredUsers.push({
                    id: user.id,
                    is_login: 'Away'
                })
            }
        }
        // return expired users
        return expiredUsers
    } catch (error) {
        console.log(error)
    }
}