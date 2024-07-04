import { createContext, Dispatch, SetStateAction } from "react";
import { IProfilePayload } from "../types";

export type LoginProfileType = Pick<IProfilePayload, 'description'> & Omit<IProfilePayload['user_id'], 'username'>

interface ILoginProfileStates {
    // user login state
    isLogin: [boolean, LoginProfileType];
    setIsLogin: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
    // my profile state
    showMyProfile: boolean;
    setShowMyProfile: Dispatch<SetStateAction<boolean>>;
    // other's profile state
    showOtherProfile: [boolean, LoginProfileType];
    setShowOtherProfile: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
}

export const LoginProfileContext = createContext<ILoginProfileStates>({
    // user login state
    isLogin: [false, null],
    setIsLogin: () => [false, null],
    // my profile state
    showMyProfile: false,
    setShowMyProfile: () => false,
    // other's profile state
    showOtherProfile: [false, null],
    setShowOtherProfile: () => [false, null]
})