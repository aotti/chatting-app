'use client'

import { useContext, useState } from "react"
import HomePage from "./components/HomePage"
import LoginPage from "./components/LoginPage"
import RegisterPage from "./components/RegisterPage"
import Profile from "./components/Profile"
import { ProfileContext } from "../../context/ProfileContext"
import UserList from "./components/UserList"
import ChattingPage from "./components/ChattingPage"

export default function MainContent() {
    // get page for display
    const [displayPage, setDisplayPage] = useState('home')
    // page click handler
    const getPageHandler = (page: string) => {
        setDisplayPage(page)
    }
    // display user list
    const [showUserList, setShowUserList] = useState(false)
    // profile state
    const { showMyProfile, showOtherProfile } = useContext(ProfileContext)
    
    return (
        <>
            {/* main container */}
            <div className="md:grid md:grid-cols-12 gap-2 p-2 h-full">
                {/* user list container on mobile */}
                <div className={`${showUserList ? 'hidden' : null}
                    sticky top-1/3 w-fit invert -mt-12
                    md:hidden sm:top-1/2`}> 
                    <ShowUserListButton showUserList={showUserList} setShowUserList={setShowUserList} />
                </div>
                {/* user list container */}
                <div className={`${showUserList ? null : 'hidden'}
                    absolute border-2 border-black p-2 w-2/3
                    md:static md:block md:col-span-3 md:w-auto`}>
                    {/* user list container on mobile */}
                    <div className={`${showUserList ? null : 'hidden'}
                        w-fit invert mb-2
                        md:hidden sm:top-1/2`}> 
                        <ShowUserListButton showUserList={showUserList} setShowUserList={setShowUserList} />
                    </div>
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
                            <UserList pageHandler={ getPageHandler } />
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
                                    : displayPage == 'login'
                                        ? <LoginPage pageHandler={ getPageHandler } />
                                        : <ChattingPage />
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

function ShowUserListButton({ showUserList, setShowUserList }) {
    return (
        <button className="flex border-2 border-black" onClick={() => setShowUserList(b => !b)}>
            <img src="./img/users.png" alt="user list" width={40} />
            { showUserList && <span className="invert my-auto px-2"> Hide </span> }
        </button>
    )
}