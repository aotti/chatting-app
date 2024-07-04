import { useContext, useRef } from "react"
import { clickOutsideElement } from "../../helper-click";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";

export default function Profile({ profileClassName, userData }: { profileClassName: string, userData: LoginProfileType }) {
    // login profile state
    const { setShowMyProfile, showOtherProfile, setShowOtherProfile } = useContext(LoginProfileContext)
    // ref 
    const profileRef = useRef(null)
    // click outside profile
    clickOutsideElement(profileRef, () => setShowMyProfile(false))

    return (
        // profile container
        <div className={`border-2 border-black p-2 ${profileClassName} bg-lime-300 dark:bg-pink-600
            md:w-1/4`} 
            ref={profileRef}>
            {
                // if show other profile, show 'back' button
                !profileClassName.includes('absolute') && 
                <button className=" bg-slate-400 rounded-md py-1 px-2 shadow-sm shadow-black" 
                    onClick={() => setShowOtherProfile([false, showOtherProfile[1]]) }
                > Back </button>
            }
            {/* display name */}
            <p className="mb-2 font-semibold">
                { profileClassName.includes('absolute') ? `My Profile (${userData.display_name})` : `Profile (${userData.display_name})` }
            </p>
            {/* profile picture */}
            <div className=" w-36 h-36 border-2">
                <img src="" alt="pic 144x144" />
            </div>
            {/* status */}
            <div className="font-semibold">
                <p> {userData.is_login} </p>
            </div>
            {/* num of group */}
            <div>
                <p> Joined group: 4 </p>
            </div>
            {/* description */}
            <div>
                <p> {userData.description} </p>
            </div>
        </div>
    )
}