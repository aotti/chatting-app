import { useContext, useEffect } from "react";
import MenuButton from "./components/MenuButton";
import { ChatWithContext } from "../../context/ChatWithContext";
import { MiscContext } from "../../context/MiscContext";

export default function HeaderContent() {
    // display page state
    const { setDisplayPage, darkMode } = useContext(MiscContext)
    // unread message state
    const { unreadMessageItems, unreadAnimate, setUnreadAnimate } = useContext(ChatWithContext)
    const totalUnreadMessages = []
    // reduce messages
    if(unreadMessageItems) {
        for(let data of unreadMessageItems)
            totalUnreadMessages.push(data.unread_messages.length)
    }
    // update unread message
    useEffect(() => {
        // set animation
        setUnreadAnimate(true)
        // remove animation
        setTimeout(() => setUnreadAnimate(false), 300)
    }, [unreadMessageItems])
    
    return (
        <nav className="grid grid-cols-3 justify-items-stretch">
            {/* logo */}
            <div className="w-44">
                <button onClick={() => setDisplayPage('home')}>
                    <div className={`absolute left-5 top-[1.4rem] pb-1 w-11 
                        ${!unreadAnimate ? '' : darkMode ? 'animate-shadow-d' : 'animate-shadow-l'}
                        dark:text-pink-600 text-lime-600 text-center text-lg font-semibold`}>
                        <span className={unreadAnimate ? 'animate-popup' : ''}> {totalUnreadMessages.reduce((cur, acc) => acc + cur, 0)} </span>
                    </div>
                    <img src="./img/logo.png" className="" alt="logo"/>
                </button>
            </div>
            {/* app name */}
            <div className="">
                <p className="hidden md:block text-center text-2xl"> Chatting App </p>
            </div>
            {/* menu burger */}
            <MenuButton />
        </nav>
    )
}