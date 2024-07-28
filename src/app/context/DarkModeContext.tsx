import { createContext, Dispatch, SetStateAction } from "react";

// ### TAMBAH PAGE HANDLER
interface iDarkModeStates {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
    displayPage: string;
    setDisplayPage: Dispatch<SetStateAction<string>>;
}

export const DarkModeContext = createContext<iDarkModeStates>({
    darkMode: null,
    setDarkMode: () => null,
    displayPage: null,
    setDisplayPage: () => null
})