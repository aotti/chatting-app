'use client'

import { useContext, useRef, useState } from "react";
import { clickOutsideElement } from "../../helper-click";
import { ProfileContext } from "../../../context/ProfileContext";
import { DarkModeContext } from "../../../context/DarkModeContext";
import { LoginContext } from "../../../context/LoginContext";
import LogoutButton from "./LogoutButton";

export default function MenuButton() {
    // dropdown stuff
    const dropdownRef = useRef()
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    // click outside dropdown
    clickOutsideElement(dropdownRef, () => setIsMenuOpen(false))
    
    // html
    return (
        <div className="place-self-end">
            {/* button */}
            <button className="border-2 border-black flex items-center text-blue-800 p-3" onClick={() => setIsMenuOpen(b => !b)}>
                <svg className="block h-4 w-4 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <title>Mobile menu</title>
                    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
                </svg>
            </button>
            {/* menu item */}
            { 
                isMenuOpen 
                    // display menu item
                    ? <div id="userMenu" className="absolute right-3" ref={dropdownRef}>
                        <MenuItem setIsMenuOpen={setIsMenuOpen} />
                        {/* <span> You are not login yet. </span>  */}
                    </div>
                    // hide menu item
                    : null 
            }
        </div>
    )
}

function MenuItem({ setIsMenuOpen }) {
    // login context
    const { isLogin } = useContext(LoginContext)
    // profile context
    const { setShowMyProfile } = useContext(ProfileContext)
    // dark mode toggle
    const { darkMode, setDarkMode } = useContext(DarkModeContext)

    return (
        <ul className="border-2 border-black bg-blue-400 dark:bg-orange-600">
            <li>
                <button className="hover:bg-sky-400 dark:hover:bg-orange-400 w-full p-2"
                    onClick={() => darkModeToggle(setDarkMode) }> { darkMode ? 'Light Mode' : 'Dark Mode' } </button>
            </li>
            {
                isLogin[0] && 
                <>
                    <li>
                        <button className="hover:bg-sky-400 dark:hover:bg-orange-400 w-full p-2" onClick={() => {
                            setShowMyProfile(true)
                            setIsMenuOpen(false)
                            }}> My Profile </button>
                    </li>
                    <li>
                        <LogoutButton />
                    </li>
                </>
            }
        </ul>
    )
}

function darkModeToggle(setDarkMode) {
    // set dark mode state
    setDarkMode(b => {
        // save state to local storage 
        window.localStorage.setItem('darkMode', JSON.stringify(!b))
        return !b
    })
}