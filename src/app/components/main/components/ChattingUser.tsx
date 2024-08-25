import { useContext, useEffect, useState } from "react"
import { MiscContext } from "../../../context/MiscContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { qS } from "../../helper"
import { usePubNub } from "pubnub-react"
import { ListenerParameters } from "pubnub"
import { IMessage } from "../../../types"
import { ChattingBox, ImagesChat, StatesChat, UsersChat } from "./ChattingPage"

export default function ChattingUser({ chatWith }: {chatWith: LoginProfileType}) {
    // get page for display
    const { isLoading } = useContext(MiscContext)
    // chat with context
    const { messageItems, setMessageItems, setHistoryMessageLog, 
        unreadMessageItems, setUnreadMessageItems } = useContext(ChatWithContext)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)
    // image preview state
    const [imageDropPreview, setImageDropPreview] = useState('hidden')
    const [imageZoomPreview, setImageZoomPreview] = useState('')
    const [imageChatData, setImageChatData] = useState<ImagesChat>(null)
    // showUploadWidget
    const [showUploadWidget, setShowUploadWidget] = useState(true)

    // upload widget timeout for auto refresh (mobile cant mouseover)
    useEffect(() => {
        if(showUploadWidget === false) {
            setTimeout(() => {
                setShowUploadWidget(true)
            }, 1000);
        }
    }, [showUploadWidget])
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
        const groupChannels = isLogin[1].group.length === 0 ? [] : isLogin[1].group.map(v => `GroupChat-${v}`)
        const dmChannels = [`DirectChat-${isLogin[1].id}`]
        const subsChannels = [...dmChannels, ...groupChannels]
        pubsub.subscribe({ channels: subsChannels })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage['messages'][0] = data.message
                // only get other message
                if(newMessage.user === isLogin[1].display_name) return
                // if new message is from other user OR group
                // add the chat to unread messages
                if(newMessage.user !== chatWith.display_name && !(chatWith as any)?.name) {
                    // play message notif sound
                    (qS('#message_notif') as HTMLAudioElement).play()
                    return setUnreadMessageItems(data => {
                        const displayName = newMessage.group_name || newMessage.user
                        // data > 0
                        if(data) {
                            const isUserExist = data.map(v => v.display_name).indexOf(displayName)
                            // still have unread message from this user
                            if(isUserExist !== -1) {
                                const newData = [
                                    ...data, 
                                    {
                                        display_name: displayName, 
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
                                const newData = [...data, {display_name: displayName, unread_messages: [newMessage.text]}]
                                return newData
                            }
                        }
                        // data still null
                        else {
                            const newData = [{
                                display_name: displayName,
                                unread_messages: [newMessage.text]
                            }]
                            return newData
                        }
                    })
                }
                // play message notif sound
                (qS('#message_notif') as HTMLAudioElement).play()
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
            pubsub.unsubscribe({ channels: subsChannels })
            pubsub.removeListener(publishedMessage)
        }
    }, [chatWith])
    // image preview params
    const imagePreviewStates = {
        imageChatData: imageChatData,
        setImageChatData: setImageChatData,
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

    return <ChattingBox 
        chatStates={{ isLoading, isLogin, chatWith, messageItems }} 
        imagePreviewStates={imagePreviewStates} 
        userChatData={userChatData} 
        sendChatStates={sendChatStates} 
        widgetStates={{ showUploadWidget, setShowUploadWidget }} />
}