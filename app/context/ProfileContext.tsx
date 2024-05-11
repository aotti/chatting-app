import { createContext, Dispatch, SetStateAction } from "react";

export interface IProfileUser {
    id: number;
    name: string;
    status: string;
}

interface IProfileStates {
    showMyProfile: boolean;
    setShowMyProfile: Dispatch<SetStateAction<boolean>>;
    showOtherProfile: [boolean, IProfileUser];
    setShowOtherProfile: Dispatch<SetStateAction<[boolean, IProfileUser]>>;
}

export const ProfileContext = createContext<IProfileStates>({
    showMyProfile: false,
    setShowMyProfile: () => false,
    showOtherProfile: [false, {id: 0, name:'', status:''}],
    setShowOtherProfile: () => [false, {id: 0, name:'', status:''}]
})
