import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";

export interface IGroupsFound {
    id: number;
    name: string;
    description: string;
    invite_code: string;
    member_ids: string;
    member_names: string;
    member_roles: string;
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