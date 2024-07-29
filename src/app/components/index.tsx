'use client'

import { useState, useEffect } from "react"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"
import { LoginProfileContext, LoginProfileType } from "../context/LoginProfileContext"
import { fetcher, getExpiredUsers, getUnreadMessages, verifyAccessToken } from "./helper"
import { IMessage, IResponse, IUserTimeout } from "../types"
import { DarkModeContext } from "../context/DarkModeContext"
import { UsersFoundContext } from "../context/UsersFoundContext"
import { ChatWithContext } from "../context/ChatWithContext"
import FooterContent from "./footer/FooterContent"
import Pubnub, { ListenerParameters } from "pubnub"
import { PubNubProvider } from "pubnub-react"

interface IndexProps {
    accessSecret: string;
    pubnubKeys: Record<'sub'|'pub'|'uuid', string>;
    crypto: Record<'key'|'iv', string>;
}

export default function Index({ accessSecret, pubnubKeys, crypto }: IndexProps) {
    // pubnub 
    const pubnub = new Pubnub({
        subscribeKey: pubnubKeys.sub,
        publishKey: pubnubKeys.pub,
        userId: pubnubKeys.uuid
    })
    // header-MenuButton
    // dark mode state
    const [darkMode, setDarkMode] = useState(false)
    // get page for display
    const [displayPage, setDisplayPage] = useState('home')
    // dark mode props
    const darkModeStates = {
        darkMode: darkMode,
        setDarkMode: setDarkMode,
        displayPage: displayPage,
        setDisplayPage: setDisplayPage
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
    // message items
    const [messageItems, setMessageItems] = useState<IMessage['messages']>(null)
    // history message log
    const [historyMessageLog, setHistoryMessageLog] = useState<IMessage[]>([])
    // unread message
    const [unreadMessageItems, setUnreadMessageItems] = useState(null)
    // chat with states
    const chatWithStates = {
        chatWith: chatWith,
        setChatWith: setChatWith,
        messageItems: messageItems,
        setMessageItems: setMessageItems,
        historyMessageLog: historyMessageLog,
        setHistoryMessageLog: setHistoryMessageLog,
        unreadMessageItems: unreadMessageItems,
        setUnreadMessageItems: setUnreadMessageItems
    }

    const [userTimeout, setUserTimeout] = useState<IUserTimeout[]>([])
    
    // auto login with token
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
        .then(async verifiedUser => {
            // token expired
            if(!verifiedUser) throw 'token expired'
            // get unread message
            const unreadMessages = await getUnreadMessages(crypto, (verifiedUser as LoginProfileType))
            setUnreadMessageItems(unreadMessages)
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
                    // get unread message
                    const unreadMessages = await getUnreadMessages(crypto, (verifiedUser as LoginProfileType))
                    setUnreadMessageItems(unreadMessages)
                    // set state
                    setIsLogin([true, verifiedUser as LoginProfileType])
                    break
                default: 
                    // remove access token & last access if fail to renew
                    window.localStorage.removeItem('accessToken')
                    window.localStorage.removeItem('lastAccess')
                    console.log(renewAccessToken)
                    break
            }
        })
        return () => null
    }, [])
    
    // get logged users
    useEffect(() => {
        // subscribe to user status
        pubnub.subscribe({ channels: ['logged-users'] })
        // listener
        const publishedUsersStatus: ListenerParameters = {
            message: (data) => {
                const encryptedUsers = data.message as string
                if(encryptedUsers !== 'null') {
                    window.localStorage.setItem('loggedUsers', encryptedUsers)
                }
                else console.log({pubnub: `update token failed (${encryptedUsers})`})
            }
        }
        pubnub.addListener(publishedUsersStatus)
        // unsub and remove listener
        return () => {
            pubnub.unsubscribe({ channels: ['logged-users'] })
            pubnub.removeListener(publishedUsersStatus)
        }
    }, [])
    
    // change user status (online/offline)
    useEffect(() => {
        const updateUserStatus = async () => {
            try {
                const userStates = {
                    setChatWith: setChatWith,
                    setUsersFound: setUsersFound,
                    setUserTimeout: setUserTimeout
                }
                const expiredUsers = await getExpiredUsers(crypto, accessSecret, userStates)
                if(!expiredUsers) return
                // someone is away
                for(let expUser of expiredUsers) {
                    // change user found status (profile status)
                    const foundUser = usersFound ? usersFound.map(u => u.id).indexOf(expUser.id) : -1
                    if(foundUser !== -1) {
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
                            }, 300_000) // 5min 
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
            } catch (error) {
                console.log('updateUserStatus error', error)
            }
        }
        
        const updateStatusAndLastAccess = async () => {
            updateUserStatus()
            // update user last access on client
            window.localStorage.setItem('lastAccess', new Date().toISOString())
            // if user not logged in, return
            if(!isLogin[1]) return
            // fetch to update last access on db
            const accessToken = window.localStorage.getItem('accessToken')
            const lastAccess = window.localStorage.getItem('lastAccess')
            const fetchOptions: RequestInit = {
                method: 'PATCH',
                headers: {
                    'authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    id: isLogin[1].id,
                    last_access: lastAccess
                })
            }
            const lastAccessResponse: IResponse = await (await fetcher('/user/lastaccess', fetchOptions)).json()
            switch(lastAccessResponse.status) {
                case 200: break
                default: 
                    console.log({lastAccessResponse})
            }
        }

        document.addEventListener('click', updateUserStatus)
        document.addEventListener('keyup', updateUserStatus)
        document.addEventListener('blur', updateStatusAndLastAccess)

        return () => {
            document.removeEventListener('click', updateUserStatus)
            document.removeEventListener('keyup', updateUserStatus)
            document.removeEventListener('blur', updateStatusAndLastAccess)
        }
    }, [usersFound, chatWith, isLogin, userTimeout])
    
    // ~~~~~~~~~~~ HTML CODE ~~~~~~~~~~~~~
    // ~~~~~~~~~~~ HTML CODE ~~~~~~~~~~~~~
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
                                        <MainContent crypto={crypto} />
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
