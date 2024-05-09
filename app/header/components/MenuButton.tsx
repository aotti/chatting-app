'use client'

import { useRef, useState } from "react";
import MenuItem from "./MenuItem";
import clickOutsideElement from "../../helper";

export default function MenuButton() {
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
                    ? <div id="userMenu" className="border-2 border-black absolute right-3.5 p-2" ref={dropdownRef}>
                        <MenuItem /> 
                    </div>
                    // hide menu item
                    : null 
            }
        </div>
    )
}