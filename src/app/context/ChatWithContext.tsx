import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";
import { IMessage } from "../types";

interface IChatWith {
    chatWith: LoginProfileType;
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>;
    messageItems: IMessage['messages'];
    setMessageItems: Dispatch<SetStateAction<IMessage['messages']>>;
    historyMessageLog: IMessage[];
    setHistoryMessageLog: Dispatch<SetStateAction<IMessage[]>>;
}

export const ChatWithContext = createContext<IChatWith>({
    chatWith: null,
    setChatWith: () => null,
    messageItems: null,
    setMessageItems: () => null,
    historyMessageLog: null,
    setHistoryMessageLog: () => null
})