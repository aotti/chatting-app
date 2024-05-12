import { useContext } from "react"
import { ProfileContext } from "../../context/ProfileContext"

export default function UserList({pageHandler}: {pageHandler: (page: string) => void}) {
    const userList = [
        { id: 2, name: 'Susanti', status: 'Offline' },
        { id: 3, name: 'Wahyu', status: 'Online' },
        { id: 4, name: 'Imam', status: 'Offline' },
        { id: 5, name: 'Kegelapan', status: 'Online' }
    ]
    // profile context
    const { setShowOtherProfile } = useContext(ProfileContext)

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
                userList.map((user, i) => {
                    return (
                        <div className="grid grid-cols-3 mb-4 last:mb-0" key={i}>
                            <span className=" col-span-2"> {user.name} </span>
                            <div className="flex justify-around invert">
                                {/* profile button */}
                                <button title="profile" onClick={() => setShowOtherProfile([true, user])}>
                                    <img src="./img/profile.png" alt="profile" width={30} />
                                </button>
                                {/* chat button */}
                                <button title="chat" onClick={() => pageHandler('chatting')}>
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