import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";
import { IHistoryMessagePayload } from "../types";

interface IChatWith {
    chatWith: LoginProfileType;
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>;
    historyMessages: IHistoryMessagePayload['message_id'][];
    setHistoryMessages: Dispatch<SetStateAction<IHistoryMessagePayload['message_id'][]>>;
}

export const ChatWithContext = createContext<IChatWith>({
    chatWith: null,
    setChatWith: () => null,
    historyMessages: null,
    setHistoryMessages: () => null
})