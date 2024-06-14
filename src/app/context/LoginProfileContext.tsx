import { createContext, Dispatch, SetStateAction } from "react";
import { IProfilePayload } from "../types";

export type LoginProfileType = Pick<IProfilePayload, 'description'> & Omit<IProfilePayload['user_id'], 'username'>

interface ILoginProfileStates {
    isLogin: [boolean, LoginProfileType];
    setIsLogin: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
    showMyProfile: boolean;
    setShowMyProfile: Dispatch<SetStateAction<boolean>>;
    showOtherProfile: [boolean, LoginProfileType];
    setShowOtherProfile: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
}

export const LoginProfileContext = createContext<ILoginProfileStates>({
    isLogin: [false, null],
    setIsLogin: () => [false, null],
    showMyProfile: false,
    setShowMyProfile: () => false,
    showOtherProfile: [false, null],
    setShowOtherProfile: () => [false, null]
})