import { useContext } from "react";
import MenuButton from "./components/MenuButton";
import { ChatWithContext } from "../../context/ChatWithContext";
import { DarkModeContext } from "../../context/DarkModeContext";

export default function HeaderContent() {
    // display page state
    const { setDisplayPage } = useContext(DarkModeContext)
    // unread message state
    const { unreadMessageItems } = useContext(ChatWithContext)
    const totalUnreadMessages = []
    // reduce messages
    if(unreadMessageItems) {
        for(let data of unreadMessageItems)
            totalUnreadMessages.push(data.unread_messages.length)
    }
    
    return (
        <nav className="grid grid-cols-3 justify-items-stretch">
            {/* logo */}
            <div className="w-44">
                <button onClick={() => setDisplayPage('home')}>
                    <div className="absolute left-5 top-6 w-11 text-black text-center font-semibold">
                        <span> {totalUnreadMessages.reduce((cur, acc) => acc + cur, 0)} </span>
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