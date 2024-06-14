import { useContext } from "react"
import { UsersFoundContext } from "../../../context/UsersFoundContext"
import { LoginProfileContext } from "../../../context/LoginProfileContext"
import { ChatWithContext } from "../../../context/ChatWithContext"

export default function UserList({pageHandler}: {pageHandler: (page: string) => void}) {
    // login profile context
    const { isLogin, setShowOtherProfile } = useContext(LoginProfileContext)
    // chat with context
    const { setChatWith } = useContext(ChatWithContext)
    // users found context
    const { usersFound } = useContext(UsersFoundContext)

    return (
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
                usersFound && usersFound.map((user, i) => {
                    return (
                        <div className="grid grid-cols-3 mb-4 last:mb-0" key={i}>
                            <span className=" col-span-2"> {user.display_name} </span>
                            <div className="flex justify-around invert">
                                {/* profile button */}
                                <button title="profile" className="invert dark:invert-0" onClick={() => setShowOtherProfile([true, user])}>
                                    <img src="./img/profile.png" alt="profile" width={30} />
                                </button>
                                {/* chat button */}
                                <button title="chat" className="invert dark:invert-0" 
                                    onClick={() => startChat(isLogin, setChatWith, user, pageHandler)}>
                                    <img src="./img/send.png" alt="chat" width={30} />
                                </button>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}

function startChat(isLogin, setChatWith, user, pageHandler) {
    // get user data to chat with
    setChatWith(user)
    // change page
    pageHandler(isLogin[0] ? 'chatting' : 'login')
}