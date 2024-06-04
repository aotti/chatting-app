import { useContext, useRef } from "react"
import { ProfileContext } from "../../../context/ProfileContext"
import { clickOutsideElement } from "../../helper-click";

export default function Profile({ profileClassName, userData }: { profileClassName: string, userData: { id: number; name: string; status: string } }) {
    // profile set state
    const { setShowMyProfile, setShowOtherProfile } = useContext(ProfileContext)
    // ref 
    const profileRef = useRef(null)
    // click outside profile
    clickOutsideElement(profileRef, () => setShowMyProfile(false))
    // default profile
    const defaultProfile = {
        id: 0,
        name: '',
        status: ''
    }

    return (
        <div className={`border-2 border-black p-2 ${profileClassName}
            md:w-1/4`} 
            ref={profileRef}>
            {
                // ### BERHUBUNGAN DGN AUTH, KALO SUDAH BISA LOGIN, CEK DGN USERNAME
                // if show other profile, show 'back' button
                userData.id !== 1 && 
                <button className=" bg-slate-400 rounded-md py-1 px-2" 
                    onClick={() => setShowOtherProfile([false, defaultProfile]) }
                > Back </button>
            }
            {/* display name */}
            <p className="mb-2 font-semibold">
                {
                    userData.id === 1 ? `My Profile (${userData.name})` : `${userData.name} Profile`
                }
            </p>
            {/* profile picture */}
            <div className=" w-36 h-36 border-2">
                <img src="" alt="pic 144x144" />
            </div>
            {/* status */}
            <div className={userData.status === 'Online' ? 'text-green-400' : 'text-red-400'}>
                <p> {userData.status} </p>
            </div>
            {
            /* num of group */
                userData.id === 1 
                ? <div>
                    <p> Joined group: 4 </p>
                </div>
                : null
            }
            {/* description */}
            <div>
                <p> 
                    Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ducimus maiores fugiat harum quae a assumenda minima architecto officia facilis, incidunt at. Dolores aspernatur fuga quam consequatur veniam dolorum vitae maiores. 
                </p>
            </div>
        </div>
    )
}