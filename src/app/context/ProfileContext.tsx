import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginContext";

interface IProfileStates {
    showMyProfile: boolean;
    setShowMyProfile: Dispatch<SetStateAction<boolean>>;
    showOtherProfile: [boolean, LoginProfileType];
    setShowOtherProfile: Dispatch<SetStateAction<[boolean, LoginProfileType]>>;
}

// createContext used for send useState var to any child component
// no matter how deep is the component
export const ProfileContext = createContext<IProfileStates>({
    showMyProfile: false,
    setShowMyProfile: () => false,
    showOtherProfile: [false, null],
    setShowOtherProfile: () => [false, null]
})
