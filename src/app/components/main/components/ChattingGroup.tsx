import { useContext, useEffect, useState } from "react"
import { MiscContext } from "../../../context/MiscContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { LoginProfileContext } from "../../../context/LoginProfileContext"
import { addMessageItem, qS } from "../../helper"
import { usePubNub } from "pubnub-react"
import { ListenerParameters } from "pubnub"
import { IMessage } from "../../../types"
import { IGroupsFound } from "../../../context/UsersFoundContext"
import { ChattingBox, ImagesChat, StatesChat, UsersChat } from "./ChattingPage"

export default function ChattingGroup({ chatWith }: {chatWith: IGroupsFound}) {
    // get page for display
    const { isLoading } = useContext(MiscContext)
    // chat with context
    const { messageItems, setMessageItems, historyMessageLog, setHistoryMessageLog, 
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
                if(user.display_name === chatWith.name)
                    setUnreadMessageItems(data => data.filter(v => v.display_name !== chatWith.name))
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
                if(newMessage.user === isLogin[1].display_name) {
                    if(messageItems) {
                        // check if my last message created_at is the same as new message
                        const getMyMessages = messageItems.map(v => v.id === isLogin[1].id ? v.created_at : null).filter(i => i)
                        const isSameAsLastMsg = getMyMessages[getMyMessages.length-1] === newMessage.created_at
                        // message created_at is the same, stop
                        if(isSameAsLastMsg) return
                        // message created_at is diff
                        // append new message
                        const tempMessages: IMessage['messages'][0] = {
                            user: newMessage.user,
                            style: 'justify-end',
                            text: newMessage.text,
                            is_image: newMessage.is_image,
                            time: newMessage.time,
                            date: newMessage.date,
                            created_at: newMessage.created_at
                        }
                        // check if data null
                        setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
                        // add message to history log
                        setHistoryMessageLog(data => addMessageItem(data, isLogin[1], chatWith, tempMessages))
                    }
                    return
                }
                // if new message is from other user OR group
                // add the chat to unread messages
                if(newMessage.group_name !== chatWith.name && !(chatWith as any)?.display_name) {
                    // play message notif sound
                    (qS('#message_notif') as HTMLAudioElement).play()
                    setUnreadMessageItems(data => {
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
                                        type: newMessage?.group_name ? 'group' : 'user',
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
                                const newData = [
                                    ...data, 
                                    {
                                        display_name: displayName, 
                                        type: newMessage?.group_name ? 'group' : 'user',
                                        unread_messages: [newMessage.text]
                                    }
                                ]
                                return newData
                            }
                        }
                        // data still null
                        else {
                            const newData = [{
                                display_name: displayName,
                                type: newMessage?.group_name ? 'group' : 'user',
                                unread_messages: [newMessage.text]
                            }]
                            return newData
                        }
                    })
                    // add if the user/group is exist 
                    // (assuming the user already have the history chat)
                    const isUserGroupExist = historyMessageLog.length === 0 
                                            ? null
                                            : historyMessageLog.map(v => v.user_with).indexOf(newMessage.id as string)
                    // add message to history log
                    if(isUserGroupExist !== null && isUserGroupExist !== -1) {
                        const _with = {id: newMessage.id} as IGroupsFound
                        setHistoryMessageLog(data => addMessageItem(data, isLogin[1], _with, newMessage))
                    }
                    return
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
    }, [chatWith, messageItems])
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