'use client'

import { useState, useEffect } from "react"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"
import { IProfileUser, ProfileContext } from "../context/ProfileContext"
import { LoginContext, LoginProfileType } from "../context/LoginContext"
import { jwtVerify } from "jose"
import { fetcher } from "./helper"
import { IResponse } from "../types"

export default function Index({ secret }) {
    // header-MenuButton 
    // main-MainContent, Profile, UserList
    // show my profile
    const [showMyProfile, setShowMyProfile] = useState(false)
    // show other profile
    const [showOtherProfile, setShowOtherProfile] = useState<[boolean, IProfileUser]>([false, {id: 0, name:'', status:''}])
    // profile props
    const profileStates = {
        showMyProfile: showMyProfile,
        setShowMyProfile: setShowMyProfile,
        showOtherProfile: showOtherProfile,
        setShowOtherProfile: setShowOtherProfile
    }

    // header-MenuButton
    // main-HomePage, LoginPage
    // login status 
    const [isLogin, setIsLogin] = useState<[boolean, LoginProfileType]>([false, null])
    // login props
    const loginStates = {
        isLogin: isLogin,
        setIsLogin: setIsLogin
    }

    // verify access token
    useEffect(() => {
        const getAccessToken = window.localStorage.getItem('accessToken')
        // is exist
        if(!getAccessToken) return
        // verify
        const encodedSecret = new TextEncoder().encode(secret)
        const verifyAccessToken = jwtVerify(getAccessToken, encodedSecret)
        verifyAccessToken.then(user => {
            // token verified
            const verifiedUser = {
                username: user.payload.username as string,
                display_name: user.payload.display_name as string,
                is_login: user.payload.is_login as boolean,
                description: user.payload.description as string
            }
            // set state
            setIsLogin([true, verifiedUser])
        }).catch(async err => {
            // create new access token
            const accessTokenOptions: RequestInit = { method: 'GET' }
            const resetAccessToken: IResponse = await (await fetcher('/token', accessTokenOptions)).json()
            // response api
            switch(resetAccessToken.status) {
                case 201: 
                    // get access token
                    const getAccessToken = resetAccessToken.data[0].token
                    // verify token
                    const encodedSecret = new TextEncoder().encode(secret)
                    const verifyToken = await jwtVerify(getAccessToken, encodedSecret)
                    // token verified
                    const verifiedUser = {
                        username: verifyToken.payload.username as string,
                        display_name: verifyToken.payload.display_name as string,
                        is_login: verifyToken.payload.is_login as boolean,
                        description: verifyToken.payload.description as string
                    }
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
        <div className="grid grid-rows-10">
            <ProfileContext.Provider value={ profileStates }>
                <LoginContext.Provider value={ loginStates }>
                    {/* header */}
                    <header className="row-span-1 h-fit p-3 border-2 border-black">
                        <HeaderContent />
                    </header>
                    {/* main */}
                    <main className="row-span-8 h-full">
                        <MainContent />
                    </main>
                    {/* footer */}
                    <footer className="row-span-1 p-3 border-2 border-black">
                        <p className="h-full"> ©aotti 2024 </p>
                    </footer>
                </LoginContext.Provider>
            </ProfileContext.Provider>
        </div>
    )
}