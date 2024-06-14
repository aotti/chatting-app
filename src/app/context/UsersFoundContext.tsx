import { createContext, Dispatch, SetStateAction } from "react";
import { LoginProfileType } from "./LoginProfileContext";

interface IUsersFoundStates {
    usersFound: LoginProfileType[];
    setUsersFound: Dispatch<SetStateAction<LoginProfileType[]>>
}

export const UsersFoundContext = createContext<IUsersFoundStates>({
    usersFound: null,
    setUsersFound: () => null
})