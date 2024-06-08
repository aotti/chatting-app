'use client'

import { useState, useEffect } from "react"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"
import { ProfileContext } from "../context/ProfileContext"
import { LoginContext, LoginProfileType } from "../context/LoginContext"
import { jwtVerify } from "jose"
import { fetcher } from "./helper"
import { IResponse } from "../types"
import { DarkModeContext } from "../context/DarkModeContext"
import { UsersFoundContext } from "../context/UsersFoundContext"

export default function Index({ secret }) {
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
    // profile props
    const profileStates = {
        showMyProfile: showMyProfile,
        setShowMyProfile: setShowMyProfile,
        showOtherProfile: showOtherProfile,
        setShowOtherProfile: setShowOtherProfile
    }

    // header-MenuButton, LogoutButton
    // main-HomePage, LoginPage, Profile
    // login status 
    const [isLogin, setIsLogin] = useState<[boolean, LoginProfileType]>([false, null])
    // login props
    const loginStates = {
        isLogin: isLogin,
        setIsLogin: setIsLogin
    }

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
        verifyAccessToken(getAccessToken, secret)
        .then(verifiedUser => {
            // token expired
            if(!verifiedUser) throw 'token expired'
            // set state
            setIsLogin([true, verifiedUser])
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
                    const verifiedUser = await verifyAccessToken(getAccessToken, secret)
                    // save token to local storage
                    window.localStorage.setItem('accessToken', getAccessToken)
                    // set state
                    setIsLogin([true, verifiedUser])
                    break
                default: 
                    console.log(resetAccessToken)
                    break
            }
        })
    }, [])
    
    return (
        <DarkModeContext.Provider value={ darkModeStates }>
            <ProfileContext.Provider value={ profileStates }>
                <LoginContext.Provider value={ loginStates }>
                    <UsersFoundContext.Provider value={ usersFoundStates }>
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
                                    <p className="h-full"> ©aotti 2024 </p>
                                </footer>
                            </div>
                        </div>
                    </UsersFoundContext.Provider>
                </LoginContext.Provider>
            </ProfileContext.Provider>
        </DarkModeContext.Provider>
    )
}

async function verifyAccessToken(token: string, secret: string) {
    try {
        // verify token
        const encodedSecret = new TextEncoder().encode(secret)
        const verifyToken = await jwtVerify(token, encodedSecret)
        // token verified
        const verifiedUser = {
            username: verifyToken.payload.username as string,
            display_name: verifyToken.payload.display_name as string,
            is_login: verifyToken.payload.is_login as boolean,
            description: verifyToken.payload.description as string
        }
        return verifiedUser
    } catch (error) {
        return null
    }
}