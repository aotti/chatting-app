import { useContext, useRef } from "react"
import { ProfileContext } from "../../../context/ProfileContext"
import { clickOutsideElement } from "../../helper-click";
import { LoginProfileType } from "../../../context/LoginContext";

export default function Profile({ profileClassName, userData }: { profileClassName: string, userData: LoginProfileType }) {
    // profile set state
    const { setShowMyProfile, setShowOtherProfile } = useContext(ProfileContext)
    // ref 
    const profileRef = useRef(null)
    // click outside profile
    clickOutsideElement(profileRef, () => setShowMyProfile(false))
    // default profile
    const defaultProfile: LoginProfileType = {
        username: '',
        display_name: '',
        is_login: false,
        description: ''
    }

    return (
        // profile container
        <div className={`border-2 border-black p-2 ${profileClassName} bg-lime-300 dark:bg-pink-600
            md:w-1/4`} 
            ref={profileRef}>
            {
                // if show other profile, show 'back' button
                !profileClassName.includes('absolute') && 
                <button className=" bg-slate-400 rounded-md py-1 px-2 shadow-sm shadow-black" 
                    onClick={() => setShowOtherProfile([false, defaultProfile]) }
                > Back </button>
            }
            {/* display name */}
            <p className="mb-2 font-semibold">
                { `Profile (${userData.display_name})` }
            </p>
            {/* profile picture */}
            <div className=" w-36 h-36 border-2">
                <img src="" alt="pic 144x144" />
            </div>
            {/* status */}
            <div className="font-semibold">
                <p> {userData.is_login ? 'Online' : 'Offline'} </p>
            </div>
            {
            /* num of group */
                userData.username === ''
                ? <div>
                    <p> Joined group: 4 </p>
                </div>
                : null
            }
            {/* description */}
            <div>
                <p> 
                    {userData.description}
                </p>
            </div>
        </div>
    )
}