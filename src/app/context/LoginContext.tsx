import { createContext, Dispatch, SetStateAction } from "react";
import { IProfilePayload } from "../types";

export type LoginProfileType = Pick<IProfilePayload, 'description'> & Omit<IProfilePayload['user_id'], 'id'>

interface ILoginStates {
    isLogin: [boolean, LoginProfileType | null];
    setIsLogin: Dispatch<SetStateAction<[boolean, LoginProfileType | null]>>;
}

export const LoginContext = createContext<ILoginStates>({
    isLogin: [false, null],
    setIsLogin: () => [false, null]
})