'use client'

import { useContext, useRef, useState } from "react";
import { clickOutsideElement } from "../../helper-click";
import { ProfileContext } from "../../../context/ProfileContext";

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
            <button className="border-2 border-black navbar-burger flex items-center text-blue-400 p-3" onClick={() => setIsMenuOpen(b => !b)}>
                <svg className="block h-4 w-4 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <title>Mobile menu</title>
                    <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
                </svg>
            </button>
            {/* menu item */}
            { 
                isMenuOpen 
                    // display menu item
                    ? <div id="userMenu" className="absolute right-3.5" ref={dropdownRef}>
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
    // profile context
    const { setShowMyProfile } = useContext(ProfileContext)

    return (
        <ul>
            <li>
                <button className="border-2 border-black w-full p-2" onClick={() => {
                    setShowMyProfile(true)
                    setIsMenuOpen(false)
                    }}> My Profile </button>
            </li>
            <li>
                <button className="border-2 border-black w-full p-2"> Logout </button>
            </li>
        </ul>
    )
}