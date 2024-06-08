import { createContext, Dispatch, SetStateAction } from "react";

interface iDarkModeStates {
    darkMode: boolean,
    setDarkMode: Dispatch<SetStateAction<boolean>>
}

export const DarkModeContext = createContext<iDarkModeStates>({
    darkMode: false,
    setDarkMode: () => false
})