import { useContext, useEffect, useRef, useState } from "react"
import { clickOutsideElement } from "../../helper-click";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { CldImage, CldUploadButton } from "next-cloudinary";
import { randomBytes } from "crypto";
import { IResponse } from "../../../types";
import { fetcher, qS } from "../../helper";

export default function Profile({ profileClassName, userData }: { profileClassName: string, userData: LoginProfileType }) {
    // login profile state
    const { isLogin, setIsLogin, setShowMyProfile, showOtherProfile, setShowOtherProfile } = useContext(LoginProfileContext)
    // profile ref 
    const profileRef = useRef(null)
    // showUploadWidget
    const [showUploadWidget, setShowUploadWidget] = useState(true)
    // profile photo
    let photoSrc = 'data:,' 
    if(isLogin[0] && isLogin[1].id === userData.id && isLogin[1].photo) photoSrc = isLogin[1].photo
    else if(userData && userData.photo) photoSrc = userData.photo
    // click outside profile
    clickOutsideElement(profileRef, () => setShowMyProfile(false))

    // upload widget timeout for auto refresh (mobile cant mouseover)
    useEffect(() => {
        if(showUploadWidget === false) {
            setTimeout(() => {
                setShowUploadWidget(true)
            }, 1000);
        }
    }, [showUploadWidget])

    return (
        // profile container
        <div className={`static z-10 border-2 border-black p-2 ${profileClassName} bg-lime-300 dark:bg-pink-600 md:w-1/4`} 
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
            <div className="flex gap-2">
                <CldImage src={photoSrc} alt="pic 160x160" loading="lazy" className="border-2" width={160} height={160} />
                { 
                    isLogin[0] && userData.id === isLogin[1].id 
                        ? <div className="self-center">
                            <div className="mb-2">
                                <p id="uploadPhotoResponse" className="font-semibold"></p>
                                <span> max. 2mb <br /> jpg, png </span>
                                <span className="text-xs border rounded-full p-0.5" tabIndex={0}
                                    title="if the image doesnt display, try re-login"> 
                                    ❔ 
                                </span>
                            </div>
                            {
                            !showUploadWidget
                                ? <button className="bg-sky-600 h-fit p-2 rounded-lg"> Upload </button>
                                : <CldUploadButton className="bg-sky-600 h-fit p-2 rounded-lg" signatureEndpoint="/api/user/photo" 
                                    options={{
                                        sources: ['local'], publicId: `image_${randomBytes(16).toString('hex')}`, folder: 'chatting-app-profile',
                                        maxFiles: 1, clientAllowedFormats: ['jpg', 'png'], maxFileSize: 2048_000, 
                                        multiple: false, cropping: true, croppingCoordinatesMode: 'custom', croppingValidateDimensions: true,
                                        croppingAspectRatio: 1, croppingShowDimensions: true
                                    }} 
                                    onSuccess={async (result, {widget}) => {
                                        // close widget
                                        widget.close()
                                        setShowUploadWidget(false)
                                        // save photo to db
                                        await uploadProfilePhoto(result, isLogin[1].id, setIsLogin)
                                    }}
                                />
                            }
                        </div>
                        : null
                }
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

async function uploadProfilePhoto(result, userId: string, setIsLogin) {
    // set new profile photo
    setIsLogin(data => {
        data[1].photo = result.info.public_id
        return data
    })
    // access token
    const token = window.localStorage.getItem('accessToken')
    // update photo to db
    const photoFetchOptions: RequestInit = {
        method: 'PATCH',
        headers: {
            'authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            user_id: {id: userId},
            photo: result.info.public_id
        })
    }
    // fetching
    const photoResponse: IResponse = await (await fetcher('/user/photo', photoFetchOptions)).json()
    console.log(photoResponse);
    
    // response
    switch(photoResponse.status) {
        case 200: 
            qS('#uploadPhotoResponse').textContent = 'photo updated!'
            setTimeout(() => {
                qS('#uploadPhotoResponse').textContent = ''
            }, 3000);
            break
        default: 
            console.log({photoResponse})
    }
}