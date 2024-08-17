import { createContext, Dispatch, SetStateAction } from "react";

// ### TAMBAH PAGE HANDLER
interface IMiscStates {
    darkMode: boolean;
    setDarkMode: Dispatch<SetStateAction<boolean>>;
    displayPage: string;
    setDisplayPage: Dispatch<SetStateAction<string>>;
    displaySearch: boolean;
    setDisplaySearch: Dispatch<SetStateAction<boolean>>;
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
}

export const MiscContext = createContext<IMiscStates>({
    darkMode: null,
    setDarkMode: () => null,
    displayPage: null,
    setDisplayPage: () => null,
    displaySearch: null,
    setDisplaySearch: () => null,
    isLoading: null,
    setIsLoading: () => null
})