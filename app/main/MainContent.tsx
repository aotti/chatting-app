'use client'

import { useContext, useState } from "react"
import HomePage from "./components/HomePage"
import LoginPage from "./components/LoginPage"
import RegisterPage from "./components/RegisterPage"
import Profile from "./components/Profile"
import { ProfileContext } from "../context/ProfileContext"
import UserList from "./components/UserList"

export default function MainContent() {
    // get page for display
    const [displayPage, setDisplayPage] = useState('home')
    // page click handler
    const getPageHandler = (page: string) => {
        setDisplayPage(page)
    }
    // profile state
    const { showMyProfile, showOtherProfile } = useContext(ProfileContext)
    console.log(showOtherProfile);
    
    
    return (
        <>
            {/* main container */}
            <div className="md:grid md:grid-cols-12 gap-2 p-2 h-full">
                {/* user list container on mobile */}
                <div className="
                    sticky top-1/3 w-10 -mt-16
                    md:hidden sm:top-1/2"> 
                    <button className="border-2 border-black"> user list </button>
                </div>
                {/* user list container */}
                <div className="
                    border-2 border-black p-2 absolute w-2/3
                    md:static md:block md:col-span-3 md:w-auto">
                    {/* search box */}
                    <div className="border-2 border-black">
                        search box
                    </div>
                    {/* separator */}
                    <div className="my-4"></div>
                    {
                        showOtherProfile[0]
                            ? /* other's profile */
                            <Profile profileClassName="md:w-auto" userData={showOtherProfile[1]} />
                            : /* user list box */
                            <UserList />
                    }
                </div>
                {/* main container */}
                <div className="
                    border-2 border-black h-full
                    md:col-span-9">
                    {/* my profile */}
                    { showMyProfile && <Profile profileClassName="absolute right-2 w-2/3 h-3/4" userData={{ id: 1, name: 'Wawanto', status: 'Online' }} />}
                    {/* pages container */}
                    <div className="table-cell align-middle text-center w-screen h-screen">
                        {
                            displayPage == 'home' 
                                ? <HomePage pageHandler={ getPageHandler } />
                                : displayPage == 'register'
                                    ? <RegisterPage pageHandler={ getPageHandler } />
                                    : <LoginPage pageHandler={ getPageHandler } />
                        }
                    </div>
                </div>
            </div>
        </>
    )
}