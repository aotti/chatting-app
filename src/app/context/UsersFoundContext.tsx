import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";

export interface IGroupsFound {
    id: number;
    name: string;
    description: string;
    invite_code: string;
    display_name: string;
    member_count: number;
    created_at: string;
}

interface IUsersFoundStates {
    usersFound: LoginProfileType[];
    setUsersFound: Dispatch<SetStateAction<LoginProfileType[]>>;
    groupsFound: IGroupsFound[];
    setGroupsFound: Dispatch<SetStateAction<IGroupsFound[]>>;
}

export const UsersFoundContext = createContext<IUsersFoundStates>({
    usersFound: null,
    setUsersFound: () => null,
    groupsFound: null,
    setGroupsFound: () => null
})