import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";
import { IMessage } from "../types";

interface IChatWith {
    // user data we are chatting to
    chatWith: LoginProfileType;
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>;
    // current messages
    messageItems: IMessage['messages'];
    setMessageItems: Dispatch<SetStateAction<IMessage['messages']>>;
    // history messages
    historyMessageLog: IMessage[];
    setHistoryMessageLog: Dispatch<SetStateAction<IMessage[]>>;
    // unread messages
    unreadMessageItems: {display_name: string, unread_messages: string[]}[];
    setUnreadMessageItems: Dispatch<SetStateAction<{display_name: string, unread_messages: string[]}[]>>;
}

export const ChatWithContext = createContext<IChatWith>({
    chatWith: null,
    setChatWith: () => null,
    messageItems: null,
    setMessageItems: () => null,
    historyMessageLog: null,
    setHistoryMessageLog: () => null,
    unreadMessageItems: null,
    setUnreadMessageItems: () => null
})