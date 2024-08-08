import { Dispatch, DragEvent, FormEvent, SetStateAction, useContext, useEffect, useState } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { IDirectChatPayload, IImagePayload, IMessage, IResponse } from "../../../types";
import { addMessageItem, fetcher, qS, qSA } from "../../helper";
import { ListenerParameters } from "pubnub";
import { usePubNub } from "pubnub-react";
import { MiscContext } from "../../../context/MiscContext";
import LoadingPage from "../../loading";
import { CldImage, CldUploadWidget } from "next-cloudinary";
import { randomBytes } from "crypto";

export default function ChattingPage() {
    // get page for display
    const { isLoading } = useContext(MiscContext)
    // chat with context
    const { chatWith, messageItems, 
        setMessageItems, setHistoryMessageLog, 
        unreadMessageItems, setUnreadMessageItems } = useContext(ChatWithContext)
    // image preview state
    const [imageDropPreview, setImageDropPreview] = useState('hidden')
    const [imageZoomPreview, setImageZoomPreview] = useState('')
    const [imageChatData, setImageChatData] = useState<ImagesChat>(null)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)

    // update unread message
    useEffect(() => {
        if(unreadMessageItems) {
            for(let user of unreadMessageItems) {
                // remove unread message data from the user after read it
                if(user.display_name === chatWith.display_name)
                    setUnreadMessageItems(data => data.filter(v => v.display_name !== chatWith.display_name))
            }
        }
    }, [unreadMessageItems])

    // message items scroll
    useEffect(() => {
        // scroll to bottom
        const messageContainer = qS('#messageContainer')
        if(messageContainer) messageContainer.scrollTo({top: messageContainer.scrollHeight})
    }, [messageItems])

    // pubnub
    const pubsub = usePubNub()
    // FOR CHAT AND UNREAD MESSAGES
    useEffect(() => {
        // subscribe
        const dmChannel = `DirectChat-${isLogin[1].id}`
        pubsub.subscribe({ channels: [dmChannel] })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage['messages'][0] = data.message
                // only get other message
                if(newMessage.user === isLogin[1].display_name) return
                // make sure chat with the current opened chat user 
                // add the chat to unread messages
                if(newMessage.user !== chatWith.display_name) {
                    return setUnreadMessageItems(data => {
                        // data > 0
                        if(data) {
                            const isUserExist = data.map(v => v.display_name).indexOf(newMessage.user)
                            // still have unread message from this user
                            if(isUserExist !== -1) {
                                const newData = [
                                    ...data, 
                                    {
                                        display_name: newMessage.user, 
                                        unread_messages: [...data[isUserExist].unread_messages, newMessage.text]
                                    }
                                ]
                                // filter duplicate object
                                const filterNewData = []
                                new Map(newData.map(v => [v['display_name'], v])).forEach(v => filterNewData.push(v))
                                return filterNewData
                            }
                            // no unread message from the user
                            else {
                                const newData = [...data, {display_name: newMessage.user, unread_messages: [newMessage.text]}]
                                return newData
                            }
                        }
                        // data still null
                        else {
                            const newData = [{
                                display_name: newMessage.user,
                                unread_messages: [newMessage.text]
                            }]
                            return newData
                        }
                    })
                }
                // messages data
                const tempMessages: IMessage['messages'][0] = {
                    user: newMessage.user,
                    style: newMessage.style,
                    text: newMessage.text,
                    is_image: newMessage.is_image,
                    time: newMessage.time,
                    date: newMessage.date,
                    created_at: newMessage.created_at
                }
                // add message from other, only add message if data != null
                setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
            }
        }
        pubsub.addListener(publishedMessage)
        // unsub and remove listener
        return () => {
            pubsub.unsubscribe({ channels: [dmChannel] })
            pubsub.removeListener(publishedMessage)
        }
    }, [chatWith])
    // profile photo
    let photoSrc = 'data:,' 
    if(isLogin[0] && isLogin[1].id === chatWith.id && isLogin[1].photo) photoSrc = isLogin[1].photo
    else if(chatWith && chatWith.photo) photoSrc = chatWith.photo
    // image preview params
    const imagePreviewStates = {
        imageChatData: imageChatData,
        imageDropPreview: imageDropPreview, 
        setImageDropPreview: setImageDropPreview, 
        imageZoomPreview: imageZoomPreview,
        setImageZoomPreview: setImageZoomPreview
    }
    // send chat params
    const userChatData: UsersChat = {_me: isLogin[1], _with: chatWith};
    const sendChatStates: StatesChat = {
        setMessageItems: setMessageItems, 
        setHistoryMessageLog: setHistoryMessageLog
    };

    return (
        <div className="grid grid-rows-8 h-screen p-2">
            {/* user */}
            <div className="flex justify-center gap-4 p-2">
                <div className={photoSrc == 'data:,' ? 'rounded-full border border-black dark:border-white' : ''}>
                    <CldImage src={photoSrc} alt="pfp" width={64} height={64} radius={'max'}/>
                </div>
                <div className="">
                    <p> {chatWith.display_name} </p>
                    <p> {chatWith.is_login} </p>
                </div>
            </div>
            {/* chat box */}
            <div className="flex items-end row-span-6 border-b border-t border-black dark:border-white" 
                onDrop={ev => previewImage(ev, setImageDropPreview, setImageChatData)} onDragOver={ev => imageDragOver(ev, setImageDropPreview)} onDragLeave={() => imageDragLeave(setImageDropPreview, setImageZoomPreview)}>
                {
                    isLoading
                        ? <LoadingPage />
                        : messageItems
                            ? <Messages historyMessages={messageItems} imagePreviewStates={imagePreviewStates} />
                            // if null, show empty chat box
                            : <Messages historyMessages={messageItems} firstMessage={true} imagePreviewStates={imagePreviewStates} />
                }
                <ImagePreview imagePreviewStates={imagePreviewStates} userChatData={userChatData} sendChatStates={sendChatStates} />
            </div>
            {/* send message box */}
            <div className="flex items-center">
                <form className="flex justify-around w-full" onSubmit={ev => sendChat(ev, userChatData, sendChatStates)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" id="messageBox" />
                    <CldUploadWidget signatureEndpoint="/api/user/photo"
                    options={{ sources: ['local', 'url'], maxFiles: 1, clientAllowedFormats: ['jpg', 'png'], maxFileSize: 2048_000, publicId:`image_${randomBytes(16).toString('hex')}`, folder: 'chatting-app-images' }} 
                    onSuccess={async (result, {widget}) => {
                        const tempImageChatData: ImagesChat = { base64_file: result.info['public_id'], size: result.info['bytes'], is_uploaded: true }
                        await sendChat(null, userChatData, sendChatStates, tempImageChatData);
                        widget.close()
                    }}>
                        {({ open }) => {
                            return (
                                <button className="w-fit rounded-md bg-orange-400 dark:bg-sky-600" onClick={() => open('local')}>
                                    <img src="https://img.icons8.com/?id=yF8LPIFelJU7&format=png&color=000000" alt="img-up" />
                                </button>
                            )
                        }}
                    </CldUploadWidget>
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 h-12 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

function Messages({ historyMessages, firstMessage, imagePreviewStates }: {historyMessages: IMessage['messages']; firstMessage?: boolean; imagePreviewStates: any}) {
    if(firstMessage && !historyMessages) {
        return (
            // message container
            <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll"></div>
        )
    }
    // filter messages
    const _filteredMessages: IMessage['messages'] = []
    new Map(historyMessages.map(v => [v['created_at'], v])).forEach(v => _filteredMessages.push(v))
    // get dates
    const dateMessages: IMessage['messages'] = []
    new Map(_filteredMessages.map(v => [v['date'], v])).forEach(v => dateMessages.push(v))
    // month names
    const monthNames = ['January', 'February', 'March', 'April', 
                        'May', 'June', 'July', 'August', 
                        'September', 'October', 'November', 'December']
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {// date items
            dateMessages.length === 0 
                ? null
                : dateMessages.map((d, i) => {
                    return (
                        <div key={i}>
                            <div className="sticky top-0 z-10">
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

const currentTime = new Date().toISOString()
function MessageItem({ msgItem, imagePreviewStates }: {msgItem: IMessage['messages'][0]; imagePreviewStates: any}) {
    const { setImageDropPreview, setImageZoomPreview } = imagePreviewStates

    return (
        <>
            <div className={`flex ${msgItem.style}`}>
                <div className="border rounded-md min-w-32 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                    {/* author & status*/}
                    <p className="text-xs flex justify-between "> 
                        <span className="mb-1"> {msgItem.user} </span>
                        <span id="messageStatus" className="brightness-150"> 
                            {   // for incoming messages
                                msgItem.style.includes('start') 
                                    ? '✔' 
                                    // check message item created_at 
                                    // if past the current time consider delivered
                                    : currentTime > msgItem.created_at 
                                        ? '✔' 
                                        // if no, the its delivering
                                        : '🕗' 
                            } 
                        </span>
                    </p>
                    {/* message */} 
                    <p className="text-left">
                        {
                            msgItem.is_image 
                                ? <CldImage src={msgItem.text} alt="image-chat" width={300} height={250} className="max-w-md max-h-80 cursor-pointer" onClick={ev => { 
                                    setImageZoomPreview(ev.currentTarget.src)
                                    setImageDropPreview('flex') 
                                }} />
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
        <div id="imagePreviewContainer" className={`absolute z-20 ${imageDropPreview} bg-black/30 border-2 border-dashed h-[72%] w-[91%] md:w-[71%]`}>
            <div className="mx-auto self-center">
                <img id="imageDropPreview" src={imageZoomPreview} alt="img preview" className={`border mx-auto ${imageZoomPreview ? 'max-w-xl max-h-full' : 'w-1/2 h-1/3'}`}/>
                <span id="imageErrorMessage" className="text-red-600"></span>
                {/* send image chat */}
                <button className="w-20 mx-2 mt-3 p-1 rounded-md bg-slate-400" 
                    onClick={() => imageDragLeave(setImageDropPreview, setImageZoomPreview)}> ❌ </button>
                {// IF != empty THEN ONLY SHOW x button, ELSE SHOW ALL 
                    imageZoomPreview 
                        ? null
                        : <button className="w-20 mx-2 mt-3 p-1 rounded-md bg-orange-400" 
                            onClick={() => {
                            if(imageChatData) sendChat(null, userChatData, sendChatStates, imageChatData);
                            setImageDropPreview('hidden');
                        }}> ✔ </button>
                }
            </div>
        </div>
    )
}

// ~~~~~~~ FUNCTIONS ~~~~~~~
// ~~~~~~~ FUNCTIONS ~~~~~~~
type MessageType<T> = Dispatch<SetStateAction<T>>
type UsersChat = Record<'_me'|'_with', LoginProfileType>
type StatesChat = {
    setMessageItems: MessageType<IMessage['messages']>;
    setHistoryMessageLog: MessageType<IMessage[]>;
}
type ImagesChat = {
    base64_file: string;
    size: number;
    is_uploaded: boolean;
}
async function sendChat(ev: FormEvent<HTMLFormElement> | null, userChatData: UsersChat, sendChatStates: StatesChat, image?: ImagesChat) {
    ev?.preventDefault()
    // form inputs
    // filter button elements
    const formInputs = image ? [{value: image?.base64_file}] : ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // check input empty
    if(!formInputs[0].value) return
    // check image size, 2MB limit
    // 1 MB = 1073741824, 2 MB = 2147483648
    if(image?.size > 2147483648) {
        qS('#imageErrorMessage').textContent = 'image size limit is 2 MB'
        return
    }
    // userChatData & sendChatStates
    const { _me, _with } = userChatData
    const { setMessageItems, setHistoryMessageLog } = sendChatStates
    // message payload
    const messageTime = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})
    const messageDate = new Date().toLocaleDateString([], {day: '2-digit', month: '2-digit', year: 'numeric'})
    const formData: IDirectChatPayload & IImagePayload = {
        // author is user_id
        user_me: _me.id,
        display_me: _me.display_name,
        user_with: _with.id,
        message: JSON.stringify(formInputs[0].value),
        is_image: image ? true : false,
        is_uploaded: image.is_uploaded,
        time: messageTime,
        date: messageDate,
        created_at: new Date().toISOString()
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
        created_at: new Date().toISOString()
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
            'authorization': `Bearer ${token}`,
            'image-size': `${image?.size || 0}`
        },
        body: JSON.stringify(formData)
    }
    // if image exist, then use image endpoint, else direct chat
    const apiEndpoint = image ? '/chat/image' : '/chat/direct'
    // fetching
    const messageFetch: IResponse = await (await fetcher(apiEndpoint, messageFetchOptions)).json()
    console.log(messageFetch);
    // message elements
    const messageStatus = qSA('#messageStatus')
    
    // response
    switch(messageFetch.status) {
        case 200: 
            // change message status
            messageStatus[messageStatus.length-1].textContent = '✔'
            // check new access token
            if(messageFetch.data[0].token) {
                // save token to local storage
                window.localStorage.setItem('accessToken', messageFetch.data[0].token)
                // delete token 
                delete messageFetch.data[0].token
            }
            break
        default: 
            messageStatus[messageStatus.length-1].textContent = '⚠'
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
                setImageChatData({ base64_file: imageElement.src, size: imageFile.size, is_uploaded: false })
                // display image
                setImageDropPreview('flex')
            }
        })
    }
}

