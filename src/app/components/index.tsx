'use client'

import { useState, Dispatch, SetStateAction } from "react"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"
import { IProfileUser, ProfileContext } from "../context/ProfileContext"
import { LoginContext, LoginProfileType } from "../context/LoginContext"


export default function Index(props) {
    // header-MenuButton 
    // main-MainContent, Profile, UserList
    // show my profile
    const [showMyProfile, setShowMyProfile] = useState(false)
    // show other profile
    const [showOtherProfile, setShowOtherProfile] = useState([false, {id: 0, name:'', status:''}])
    // profile props
    const profileStates = {
        showMyProfile: showMyProfile,
        setShowMyProfile: setShowMyProfile,
        showOtherProfile: showOtherProfile as [boolean, IProfileUser],
        setShowOtherProfile: setShowOtherProfile as Dispatch<SetStateAction<[boolean, IProfileUser]>>
    }

    // header-MenuButton
    // main-HomePage, LoginPage
    // login status 
    const [isLogin, setIsLogin] = useState(() => props.verified ? [true, props.verified] : [false, null])
    // login props
    const loginStates = {
        isLogin: isLogin as [boolean, LoginProfileType],
        setIsLogin: setIsLogin as Dispatch<SetStateAction<[boolean, LoginProfileType]>>
    }
    
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