import { FormEvent, useContext, useEffect, useRef, useState } from "react"
import { clickOutsideElement } from "../../helper-click";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { CldImage, CldUploadButton } from "next-cloudinary";
import { randomBytes } from "crypto";
import { IResponse } from "../../../types";
import { fetcher, qS } from "../../helper";
import { IGroupsFound } from "../../../context/UsersFoundContext";

interface IProfile<T> {
    profileClassName: string, 
    profileData: T
}

export default function Profile({ profileClassName, profileData }: IProfile<any>) {
    return profileData?.member_count
        ? <GroupProfile profileClassName={profileClassName} profileData={profileData} />
        : <UserProfile profileClassName={profileClassName} profileData={profileData} />
}

function UserProfile({ profileClassName, profileData }: IProfile<LoginProfileType>) {
    // login profile state
    const { isLogin, setIsLogin, setShowMyProfile, showOtherProfile, setShowOtherProfile } = useContext(LoginProfileContext)
    // profile ref 
    const profileRef = useRef(null)
    // edit profile state
    const [editProfile, setEditProfile] = useState(false)
    // showUploadWidget
    const [showUploadWidget, setShowUploadWidget] = useState(true)
    // profile photo
    let photoSrc = 'data:,' 
    if(isLogin[0] && isLogin[1].id === profileData.id && isLogin[1].photo) photoSrc = isLogin[1].photo
    else if(profileData && profileData.photo) photoSrc = profileData.photo
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
            <form onSubmit={(ev) => updateUserProfile(ev, isLogin[1], setIsLogin)}>
                {/* display name */}
                <div className="flex justify-between mb-2 font-semibold">
                    {
                        profileData.id === isLogin[1].id
                            // if open my profile, show edit button
                            ? <EditUserProfile profileClassName={profileClassName} profileData={profileData} editProfile={editProfile} setEditProfile={setEditProfile} />
                            // else, hide all buttons
                            : <span className={`${!editProfile ? 'block' : 'hidden'}`}>
                                { profileClassName.includes('absolute') ? `My Profile (${profileData.display_name})` : `Profile (${profileData.display_name})` }
                            </span>
                    }
                </div>
                {/* profile picture */}
                <div className="flex gap-2">
                    <CldImage src={photoSrc} alt="pic 160x160" loading="lazy" className="border-2 border-black dark:border-white" width={160} height={160} />
                    { 
                        isLogin[0] && profileData.id === isLogin[1].id 
                            ? <div className="self-center">
                                <div className="mb-2">
                                    <p id="uploadPhotoResponse" className="font-semibold text-green-300 whitespace-pre"></p>
                                    <span> max. 2mb <br /> jpg, png </span>
                                    <span className="text-xs border rounded-full p-0.5" tabIndex={0}
                                        title="if the image doesnt display, try re-login"> 
                                        ❔ 
                                    </span>
                                </div>
                                {
                                !showUploadWidget
                                    ? <button type="button" className="bg-sky-600 h-fit p-2 rounded-lg"> Upload </button>
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
                    <p> {profileData.is_login} </p>
                </div>
                {/* num of group */}
                <div>
                    <p> Joined group: {profileData?.group?.length || profileData?.group_count} </p>
                    {
                        profileData?.group?.length > 0
                            ? <p> Group list: {profileData.group.join(' | ')} </p>
                            : null
                    }
                </div>
                {/* description */}
                <div className="mt-2 border-t border-dashed">
                    {/* input */}
                    <textarea className={`${editProfile ? 'block' : 'hidden'} mt-1 resize-none p-1 rounded-md text-black`} minLength={1} maxLength={256}  rows={4} cols={24} defaultValue={profileData.description} required></textarea>
                    {/* text */}
                    <p className={`${!editProfile ? 'block' : 'hidden'}`}> {profileData.description} </p>
                </div>
                {/* error message */}
                <div className="font-semibold">
                    {/* error */}
                    <p id="error_message" className="text-red-300"></p>
                    {/* success */}
                    <p id="success_message" className="text-green-300"></p>
                </div>
            </form>
        </div>
    )
}

function GroupProfile({ profileClassName, profileData }: IProfile<IGroupsFound>) {
    // login profile state
    const { isLogin, setShowMyProfile, showOtherProfile, setShowOtherProfile } = useContext(LoginProfileContext)
    // profile ref 
    const profileRef = useRef(null)
    // group photo
    const groupSrc = 'https://res.cloudinary.com/dk5hjh5w5/image/upload/v1723531320/meeting_wxp4ys.png'
    // click outside profile
    clickOutsideElement(profileRef, () => setShowMyProfile(false))

    return (
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
                { `Group Profile (${profileData.name})` }
            </p>
            {/* profile picture */}
            <div className="flex gap-2">
                <CldImage src={groupSrc} alt="pic 160x160" loading="lazy" className="border-2" width={160} height={160} />
            </div>
            {/* admin */}
            <div className="font-semibold">
                {/* show invite code for admin & member */}
                <p> 
                    Creator: {profileData.member_names.split(', ')[0]} 
                    {isLogin[1].group.indexOf(profileData.name) !== -1 ? ` - ${profileData.invite_code}` : ''} 
                </p>
                <p> Since: {new Date(profileData.created_at).toLocaleDateString(['id'], {day: '2-digit', month: '2-digit', year: 'numeric'})} </p>
            </div>
            {/* num of member */}
            <div>
                <p> Member count: {profileData.member_count} </p>
            </div>
            {/* description */}
            <div>
                <p> {profileData.description} </p>
            </div>
        </div>
    )
}

function EditUserProfile({ profileClassName, profileData, editProfile, setEditProfile }) {
    return (
        <>
            {/* text */}
            <span className={`${!editProfile ? 'block' : 'hidden'}`}>
                { profileClassName.includes('absolute') ? `My Profile (${profileData.display_name})` : `Profile (${profileData.display_name})` }
            </span>
            {/* input */}
            <input type="text" className={`${editProfile ? 'block' : 'hidden'} p-1 rounded-md text-black`} minLength={5} maxLength={32} defaultValue={profileData.display_name} required />
            {/* buttons */}
            <button className={`${editProfile ? 'block' : 'hidden'} bg-sky-600 h-fit py-1 px-2 rounded-lg`} type="submit" onClick={() => setEditProfile(false)}> Save </button>
            <button className={`${!editProfile ? 'block' : 'hidden'} bg-sky-600 h-fit py-1 px-2 rounded-lg`} type="button" onClick={() => setEditProfile(true)}> Edit </button>
        </>
    )
}

async function uploadProfilePhoto(result, userId: string, setIsLogin) {
    try {
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
                qS('#uploadPhotoResponse').textContent = 'photo updated! \r\nre-open your profile'
                // set new profile photo
                setIsLogin(data => {
                    data[1].photo = result.info.public_id
                    return data
                })
                // set new token
                localStorage.setItem('accessToken', photoResponse.data[0].token)
                delete photoResponse.data[0].token
                break
            default: 
                console.log({photoResponse})
        }
    } catch (error) {
        console.log(error);
    }
}

async function updateUserProfile(ev: FormEvent<HTMLFormElement>, userMe: LoginProfileType, setIsLogin) {
    ev.preventDefault()

    try {
        // message container
        const errorMessage = qS('#error_message')
        const successMessage = qS('#success_message')
        // form inputs
        // filter button elements
        const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName.match(/INPUT|TEXTAREA/))
        // get form input values
        const formData = {
            user_id: {id: userMe.id},
            display_name: (formInputs[0].value as string).trim().replace(/ +(?= )/g,''),
            description: (formInputs[1].value as string).trim().replace(/ +(?= )/g,'')
        }
        // check display name value
        if(formData.display_name.match(/[^a-z\s]/gi)) {
            return errorMessage.textContent = `any symbol is not allowed! (Name)`
        }
        // check description value
        if(formData.description.match(/[^a-z\s\.\,]/gi)) {
            return errorMessage.textContent = `only . and , is allowed! (Description)`
        }
        errorMessage.textContent = ''
        // access token
        const token = window.localStorage.getItem('accessToken')
        // updateProfile account
        // fetch options
        const updateProfileFetchOptions: RequestInit = {
            method: 'PATCH',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        } 
        // fetching
        successMessage.textContent = 'loading..'
        const updateProfileResponse: IResponse = await (await fetcher('/user/profile', updateProfileFetchOptions)).json()
        console.log(updateProfileResponse);
        
        // response
        switch(updateProfileResponse.status) {
            case 200: 
                successMessage.textContent = 'profile updated! re-open profile to take effect'
                // set new name and description
                setIsLogin(data => {
                    data[1].display_name = updateProfileResponse.data[0].display_name
                    data[1].description = updateProfileResponse.data[0].description
                    return data
                })
                // set new token
                localStorage.setItem('accessToken', updateProfileResponse.data[0].token)
                delete updateProfileResponse.data[0].token
                break
            default: 
                errorMessage.textContent = `${updateProfileResponse.status}: ${JSON.stringify(updateProfileResponse.message)}`
        }
    } catch (error) {
        console.log(error);
    }
}