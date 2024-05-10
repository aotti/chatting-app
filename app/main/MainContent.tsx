'use client'

import { useState } from "react"
import HomePage from "./components/HomePage"
import LoginPage from "./components/LoginPage"
import RegisterPage from "./components/RegisterPage"
import Profile from "./components/Profile"

export default function MainContent() {
    const userList = [
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' },
        { name: 'wawan' }
    ]
    // get page for display
    const [displayPage, setDisplayPage] = useState('home')
    // page click handler
    const getPageHandler = (page: string) => {
        setDisplayPage(page)
    }
    return (
        <>
            {/* main container */}
            <div className="md:grid md:grid-cols-12 gap-2 p-2 h-full">
                {/* user list container on mobile */}
                <div className="
                    sticky top-1/3 w-10 -mt-12
                    md:hidden sm:top-1/2"> 
                    <button className="border-2 border-black"> user list </button>
                </div>
                {/* user list container */}
                <div className="hidden
                    border-2 border-black p-2 absolute w-2/3
                    md:static md:block md:col-span-3 md:w-auto">
                    {/* search box */}
                    <div className="border-2 border-black">
                        search box
                    </div>
                    {/* separator */}
                    <div className="my-4"></div>
                    {/* user list box */}
                    <div className="border-2 border-black p-2">
                        {/* user list header */}
                        <div className="grid grid-cols-3">
                            {/* name */}
                            <span className=" col-span-2"> User </span>
                            {/* chat button */}
                            <span className=" text-center"> Action </span>
                        </div>
                        {/* separator */}
                        <hr className="border-2 border-black my-2" />
                        {
                            // the list
                            userList.map((v, i) => {
                                return (
                                    <div className="grid grid-cols-3 mb-4 last:mb-0" key={i}>
                                        <span className=" col-span-2"> {v.name} </span>
                                        <button className="border-2 rounded-md"> chat </button>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
                {/* main container */}
                <div className="
                    border-2 border-black h-full
                    md:col-span-9">
                    {/* my profile */}
                    <Profile />
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