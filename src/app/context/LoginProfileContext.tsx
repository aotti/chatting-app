import { createContext, Dispatch, SetStateAction } from "react";
import { IProfilePayload } from "../types";
import { IGroupsFound } from "./UsersFoundContext";

export type LoginProfileType = Pick<IProfilePayload, 'description'|'photo'> 
                            & Omit<IProfilePayload['user_id'], 'username'> 
                            & {group?: string[]}

interface ILoginProfileStates {
    // user login state
    isLogin: [boolean, LoginProfileType];
    setIsLogin: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
    // my profile state
    showMyProfile: boolean;
    setShowMyProfile: Dispatch<SetStateAction<boolean>>;
    // other's profile state
    showOtherProfile: [boolean, LoginProfileType|IGroupsFound];
    setShowOtherProfile: Dispatch<SetStateAction<[boolean, LoginProfileType|IGroupsFound]>>;
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