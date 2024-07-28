'use client'

import { useContext, useState } from "react"
import HomePage from "./components/HomePage"
import LoginPage from "./components/LoginPage"
import RegisterPage from "./components/RegisterPage"
import Profile from "./components/Profile"
import UserList from "./components/UserList"
import ChattingPage from "./components/ChattingPage"
import { SearchBox } from "./components/SearchBox"
import { LoginProfileContext } from "../../context/LoginProfileContext"
import { DarkModeContext } from "../../context/DarkModeContext"

export default function MainContent({ crypto }) {
    // get page for display
    const { displayPage } = useContext(DarkModeContext)
    // display user list
    const [showUserList, setShowUserList] = useState(false)
    // login profile state
    const { isLogin, showMyProfile, showOtherProfile } = useContext(LoginProfileContext)
    
    return (
        <>
            {/* main container */}
            <div className="md:grid md:grid-cols-12 gap-2 p-2 h-full">
                {/* show user list button for mobile */}
                <div className={`${showUserList ? 'hidden' : ''}
                    sticky top-1/3 w-fit invert -mt-12
                    md:hidden sm:top-1/2`}> 
                    <ShowUserListButton showUserList={showUserList} setShowUserList={setShowUserList} />
                </div>
                {/* user list container */}
                <div className={`${showUserList ? '' : 'hidden'}
                    absolute z-20 border-2 border-black p-2 w-2/3 bg-orange-300 dark:bg-sky-600
                    md:static md:block md:col-span-3 md:w-auto`}>
                    {/* hide user list button for mobile */}
                    <div className={`${showUserList ? '' : 'hidden'}
                        w-fit invert mb-2
                        md:hidden sm:top-1/2`}> 
                        <ShowUserListButton showUserList={showUserList} setShowUserList={setShowUserList} />
                    </div>
                    {/* search box */}
                    <div className="">
                        <SearchBox />
                    </div>
                    {/* separator */}
                    <div className="my-4"></div>
                    {
                        /* if profile icon on user list clicked */
                        // pageHandler for profile and chat icon
                        showOtherProfile[0]
                            ? /* show other's profile */
                            <Profile profileClassName="md:w-auto" userData={showOtherProfile[1]} />
                            : /* back button clicked on other's profile, back to user list */
                            <UserList crypto={crypto} />
                    }
                </div>
                {/* main container */}
                <div className="
                    border-2 border-black h-full bg-amber-300 dark:bg-emerald-800
                    md:col-span-9">
                    {/* my profile */}
                    { showMyProfile && <Profile profileClassName="absolute right-2 w-2/3 h-3/4" userData={isLogin[1]} />}
                    {/* pages container */}
                    <div className="table-cell align-middle text-center w-screen h-screen">
                        {
                            isLogin[0] && displayPage == 'chatting' 
                                ? <ChattingPage />
                                : displayPage == 'register'
                                    ? <RegisterPage />
                                    : displayPage == 'login'
                                        ? <LoginPage />
                                        : <HomePage />
                        }
                    </div>
                </div>
            </div>
        </>
    )
}

function ShowUserListButton({ showUserList, setShowUserList }) {
    return (
        <button className="flex border-2 border-black invert dark:invert-0" onClick={() => setShowUserList(b => !b)}>
            <img src="./img/users.png" alt="user list" width={40} />
            { showUserList && <span className="my-auto px-2 dark:invert"> Hide </span> }
        </button>
    )
}