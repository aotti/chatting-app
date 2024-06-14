import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";

interface IChatWith {
    chatWith: LoginProfileType;
    setChatWith: Dispatch<SetStateAction<LoginProfileType>>
}

export const ChatWithContext = createContext<IChatWith>({
    chatWith: null,
    setChatWith: () => null
})