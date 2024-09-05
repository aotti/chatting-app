import { Dispatch, DragEvent, FormEvent, SetStateAction, useContext } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileType } from "../../../context/LoginProfileContext";
import { IChatPayload, IImagePayload, IMessage, IResponse } from "../../../types";
import { addMessageItem, fetcher, qS, qSA } from "../../helper";
import LoadingPage from "../../loading";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { randomBytes } from "crypto";
import { IGroupsFound } from "../../../context/UsersFoundContext";
import ChattingGroup from "./ChattingGroup";
import ChattingUser from "./ChattingUser";

type MessageType<T> = Dispatch<SetStateAction<T>>
export type UsersChat = {
    _me: LoginProfileType;
    _with: LoginProfileType | IGroupsFound;
}
export type StatesChat = {
    setMessageItems: MessageType<IMessage['messages']>;
    setHistoryMessageLog: MessageType<IMessage[]>;
}
export type ImagesChat = {
    img_file: string;
    size: number;
    is_uploaded: boolean;
}
export default function ChattingPage() {
    // chat with context
    const { chatWith } = useContext(ChatWithContext)

    return typeof chatWith.id == 'number'
        ? <ChattingGroup chatWith={chatWith as IGroupsFound} />
        : <ChattingUser chatWith={chatWith as LoginProfileType} />
}

export function ChattingBox({ chatStates, imagePreviewStates, userChatData, sendChatStates, widgetStates }) {
    const { isLoading, isLogin, chatWith, messageItems } = chatStates
    const { setImageDropPreview, setImageChatData, setImageZoomPreview } = imagePreviewStates
    const { showUploadWidget, setShowUploadWidget } = widgetStates

    return (
        <div className="grid grid-rows-10 w-full h-screen p-2">
            {/* user|group profile */}
            <ChattingProfile chatWith={chatWith} isLogin={isLogin} />
            {/* chat box */}
            <div className="flex items-end row-span-8 border-b border-t border-black dark:border-white" 
                onDrop={ev => previewImage(ev, setImageDropPreview, setImageChatData)} onDragOver={ev => imageDragOver(ev, setImageDropPreview)} onDragLeave={() => imageDragLeave(setImageDropPreview, setImageZoomPreview)}>
                {
                    isLoading
                        ? <LoadingPage />
                        : messageItems
                            ? <Messages messageItems={messageItems} imagePreviewStates={imagePreviewStates} />
                            // if null, show empty chat box
                            : <Messages messageItems={messageItems} firstMessage={true} imagePreviewStates={imagePreviewStates} />
                }
                <ImagePreview imagePreviewStates={imagePreviewStates} userChatData={userChatData} sendChatStates={sendChatStates} />
            </div>
            {/* send message box */}
            <div className="flex items-center">
                <form className="flex justify-around gap-1 w-full" onSubmit={ev => sendChat(ev, userChatData, sendChatStates)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" id="messageBox" />
                    {
                    !showUploadWidget
                        // hide si showUploadWidget yatim agar public id reset
                        ? <button type="button" className="w-fit rounded-md bg-orange-400 dark:bg-sky-600">
                            <img src="https://img.icons8.com/?id=yF8LPIFelJU7&format=png&color=000000" alt="img-up" />
                        </button>
                        // show si showUploadWidget agar public id selalu fresh
                        : <CldUploadWidget signatureEndpoint="/api/user/photo"
                            options={{ sources: ['local', 'url'], maxFiles: 1, clientAllowedFormats: ['jpg', 'png'], maxFileSize: 2048_000, publicId: `image_${randomBytes(16).toString('hex')}`, folder: 'chatting-app-images' }} 
                            onSuccess={async (result, {widget}) => {
                                widget.close()
                                setShowUploadWidget(false)
                                // send image chat
                                const tempImageChatData: ImagesChat = { img_file: result.info['public_id'], size: result.info['bytes'], is_uploaded: true }
                                await sendChat(null, userChatData, sendChatStates, tempImageChatData);
                            }}>
                            {({ open }) => {
                                return (
                                    <button type="button" className="w-fit rounded-md bg-orange-400 dark:bg-sky-600" 
                                        onClick={() => open('local')}>
                                        <img src="https://img.icons8.com/?id=yF8LPIFelJU7&format=png&color=000000" alt="img-up" />
                                    </button>
                                )
                            }}
                        </CldUploadWidget>
                    }
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 h-12 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

export function ChattingProfile({ isLogin, chatWith }: {isLogin: [boolean, LoginProfileType], chatWith /* LoginProfileType | IGroupsFound */}) {
    // profile photo
    let photoSrc = 'data:,' 
    // check chat with data
    if(typeof chatWith.id == 'number') {
        // group photo
        photoSrc = 'https://res.cloudinary.com/dk5hjh5w5/image/upload/v1723531320/meeting_wxp4ys.png'
    }
    else {
        // user photo
        if(isLogin[0] && isLogin[1].id === chatWith.id && isLogin[1].photo) photoSrc = isLogin[1].photo
        else if(chatWith && chatWith.photo) photoSrc = chatWith.photo
    }

    return (
        <div className="flex justify-center gap-4">
            <div className={photoSrc == 'data:,' ? 'rounded-full border border-black dark:border-white' : ''}>
                <CldImage src={photoSrc} alt="pfp" width={60} height={60} radius={'max'}/>
            </div>
            <div className="">
                <p> {chatWith.name || chatWith.display_name} </p>
                <p> {chatWith.member_count ? `${chatWith.member_count} member(s)` : chatWith.is_login} </p>
            </div>
        </div>
    )
}

function Messages({ messageItems, firstMessage, imagePreviewStates }: {messageItems: IMessage['messages']; firstMessage?: boolean; imagePreviewStates}) {
    if(firstMessage && !messageItems) {
        return (
            // message container
            <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll"></div>
        )
    }
    // filter messages
    const _filteredMessages: IMessage['messages'] = []
    new Map(messageItems.map(v => [v['created_at'], v])).forEach(v => _filteredMessages.push(v))
    // get dates
    const dateMessages: IMessage['messages'] = []
    new Map(_filteredMessages.map(v => [v['date'], v])).forEach(v => dateMessages.push(v))
    // month names
    const monthNames = ['January', 'February', 'March', 'April', 
                        'May', 'June', 'July', 'August', 
                        'September', 'October', 'November', 'December']
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll overflow-x-hidden">
            {// date items
            dateMessages.length === 0 
                ? null
                : dateMessages.map((d, i) => {
                    return (
                        <div key={i}>
                            <div className="sticky top-0 z-10 flex justify-center">
                                <span className="bg-lime-300 dark:bg-pink-600 rounded-md p-1"> 
                                    {/* eg: 01/30/1999 to Januari 30, 1999 */}
                                    {d.date.replace(/\d+/, monthNames[+d.date.split('/')[0]-1]).replaceAll('/', ', ').replace(', ', ' ')} 
                                </span>
                            </div>
                            {
                                // message items
                                !_filteredMessages ? null : _filteredMessages.map((m, i) => {
                                    if(m.date === d.date)
                                        return <MessageItem msgItem={m} key={i} imagePreviewStates={imagePreviewStates} />
                                })
                            }
                        </div>
                    )
                })
            }
        </div>
    )
}

function MessageItem({ msgItem, imagePreviewStates }: {msgItem: IMessage['messages'][0]; imagePreviewStates: any}) {
    const currentTime = new Date().toISOString()
    const { setImageDropPreview, setImageZoomPreview } = imagePreviewStates

    return (
        <>
            <div className={`flex ${msgItem.style}`}>
                <div className="border rounded-md min-w-32 max-w-72 md:max-w-96 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                    {/* author & status*/}
                    <p className="text-xs flex justify-between gap-2"> 
                        <span className="mb-1"> {msgItem.user} </span>
                        <span className="brightness-150" data-created={msgItem.created_at}> 
                            {   // for incoming messages
                                msgItem.style.includes('start') 
                                    ? '✔' 
                                    // check message item created_at 
                                    // if past the current time consider delivered
                                    : currentTime > msgItem.created_at
                                        ? '✔' 
                                        : '🕗'
                            } 
                        </span>
                    </p>
                    {/* message */} 
                    <p className="text-left">
                        {
                            msgItem.is_image 
                                // width & height overwritten by !important style
                                ? <CldImage src={msgItem.text} alt="image-chat" width={200} height={0} 
                                    className="!w-auto !max-h-72 md:!max-w-md cursor-pointer" onClick={ev => { 
                                    setImageZoomPreview(ev.currentTarget.src)
                                    setImageDropPreview('flex') 
                                }} />
                                : msgItem.text.includes('https://')
                                    ? <a href={msgItem.text} target="_blank" className="underline"> {msgItem.text} </a>
                                    : msgItem.text
                        }
                    </p>
                    {/* time */}
                    <p className="text-right text-xs border-t"> {msgItem.time} </p>
                </div>
            </div>
        </>
    )
}

function ImagePreview({ imagePreviewStates, userChatData = null, sendChatStates = null }) {
    const { imageDropPreview, setImageDropPreview, imageChatData, imageZoomPreview, setImageZoomPreview } = imagePreviewStates
    
    return (
        <div id="imagePreviewContainer" className={`absolute z-20 ${imageDropPreview} bg-black/75 md:bg-black/35 border-2 border-dashed h-[78%] w-[91%] md:w-[71%]`}>
            <div className="mx-auto self-center">
                {/* image preview */}
                <img id="imageDropPreview" src={imageZoomPreview} alt="img preview" 
                    className={`border mx-auto ${imageZoomPreview ? 'w-auto max-h-[32rem] md:max-w-3xl md:max-h-96' : 'w-1/2 h-1/3'}`}/>
                {/* error message */}
                <div className="flex justify-center my-3">
                    <p id="imageErrorMessage" className="text-red-600 font-semibold bg-red-200/50 w-fit px-2"> </p>
                </div>
                {/* buttons */}
                <div className="flex justify-center">
                    {/* send image chat */}
                    <button className="w-20 mx-2 p-1 border-2 rounded-md bg-slate-400" 
                        onClick={() => imageDragLeave(setImageDropPreview, setImageZoomPreview)}> ❌ </button>
                    {// IF imageZoomPreview != null THEN ONLY SHOW x button, ELSE SHOW ALL 
                        imageZoomPreview 
                            ? null
                            : <button className="w-20 mx-2 p-1 border-2 rounded-md bg-orange-400" 
                                onClick={() => {
                                if(imageChatData) sendChat(null, userChatData, sendChatStates, imageChatData);
                                setImageDropPreview('hidden');
                            }}> ✔ </button>
                    }
                </div>
            </div>
        </div>
    )
}

// ~~~~~~~ FUNCTIONS ~~~~~~~
// ~~~~~~~ FUNCTIONS ~~~~~~~
async function sendChat(ev: FormEvent<HTMLFormElement> | null, userChatData: UsersChat, sendChatStates: StatesChat, image?: ImagesChat) {
    ev?.preventDefault()
    // form inputs
    // filter button elements
    const formInputs = image ? [{value: image?.img_file}] : ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // check input empty
    if(!formInputs[0].value) return
    // check image size, 2MB limit
    // 1 MB = 1024_000, 2 MB = 2048_000
    if(image?.size > 2048_000) {
        qS('#imageErrorMessage').textContent = 'image size limit is 2 MB'
        return
    }
    // userChatData & sendChatStates
    const { _me, _with } = userChatData
    const { setMessageItems, setHistoryMessageLog } = sendChatStates
    // message date
    const [date, month, year] = [new Date().getDate(), new Date().getMonth()+1, new Date().getFullYear()]
    const messageDate = `${month}/${date}/${year}`
    // message payload
    const messageTime = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})
    // can be use for DM (direct msg) / GM (group msg)
    const currentDate = new Date().toISOString()
    const formData: IChatPayload & IImagePayload = {
        // author is user_id
        user_me: _me.id, // user id
        display_me: _me.display_name,
        // group = group id + group name | dm = user id
        user_with: typeof _with.id == 'number' 
                ? `${_with.id}_${(_with as IGroupsFound).name}` 
                : (_with as LoginProfileType).id, 
        message: JSON.stringify(formInputs[0].value),
        is_group_chat: typeof _with.id == 'number' ? true : false,
        is_image: image ? true : false,
        is_uploaded: !image ? false : image.is_uploaded, // !image to make sure the text message will always be FALSE
        image_size: image ? image.size : 0,
        time: messageTime,
        date: messageDate,
        created_at: currentDate
    }
    // check message empty, trim to clear all useless whitespace
    if(!formData.message.trim()) return
    // append new message
    const tempMessages: IMessage['messages'][0] = {
        user: _me.display_name,
        style: 'justify-end',
        text: formInputs[0].value,
        is_image: image ? true : false,
        time: messageTime,
        date: messageDate,
        created_at: currentDate
    }
    // check if data null
    setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
    // add message to history log
    setHistoryMessageLog(data => addMessageItem(data, _me, _with, tempMessages))
    // empty message input
    const messageBox = qS('#messageBox') as HTMLInputElement
    messageBox.value = ''
    // access token
    const token = window.localStorage.getItem('accessToken')
    // send message
    // fetch options
    const messageFetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    }
    // if image exist, then use image endpoint, else direct chat
    const apiEndpoint = image 
                        ? '/chat/image' 
                        : typeof _with.id == 'number' 
                            ? '/chat/group'
                            : '/chat/direct'
    // fetching
    const messageFetch: IResponse = await (await fetcher(apiEndpoint, messageFetchOptions)).json()
    // change message status
    const getMessageStatus = qSA('[data-created]')
    console.log(messageFetch);
    
    // response
    switch(messageFetch.status) {
        case 200: 
            getMessageStatus.forEach((v: HTMLSpanElement) => {
                if(v.dataset.created == currentDate)
                    v.textContent = '✔'
            })
            // check new access token
            if(messageFetch.data[0].token) {
                // save token to local storage
                window.localStorage.setItem('accessToken', messageFetch.data[0].token)
                // delete token 
                delete messageFetch.data[0].token
            }
            break
        default: 
            getMessageStatus.forEach((v: HTMLSpanElement) => {
                if(v.dataset.created == currentDate)
                    v.textContent = '⚠'
            })
            break
    }
}

// highlight background
function imageDragOver(ev: DragEvent, setImageDropPreview) {
    setImageDropPreview('flex')
    ev.preventDefault()
}

// un-highlight background
function imageDragLeave(setImageDropPreview, setImageZoomPreview) {
    setImageDropPreview('hidden');
    setImageZoomPreview('');
    (qS('#imageDropPreview') as HTMLImageElement).src = ''
    qS('#imageErrorMessage').textContent = ''
}

function previewImage(ev: DragEvent, setImageDropPreview, setImageChatData) {
    ev.preventDefault()
    if(ev.dataTransfer.items) {
        // get dropped file
        Object.values(ev.dataTransfer.items).forEach(v => {
            const imageFile = v.getAsFile()
            // file reader
            const reader = new FileReader()
            // read dropped file
            reader.readAsDataURL(imageFile)
            // read success
            reader.onload = () => {
                const imageElement = qS('#imageDropPreview') as HTMLImageElement
                // set image src
                imageElement.src = reader.result as string
                imageElement.dataset.size = imageFile.size.toString()
                setImageChatData({ img_file: imageElement.src, size: imageFile.size, is_uploaded: false })
                // display image
                setImageDropPreview('flex')
            }
        })
    }
}

