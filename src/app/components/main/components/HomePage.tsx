import { useContext } from "react"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { DarkModeContext } from "../../../context/DarkModeContext"
import { ChatWithContext } from "../../../context/ChatWithContext"

export default function HomePage() {
    // get page for display
    const { setDisplayPage } = useContext(DarkModeContext)
    // login state
    const { isLogin } = useContext(LoginProfileContext)

    return (
        isLogin[0]
            ? <LoginTrue loginData={isLogin[1]} />
            : <LoginFalse setDisplayPage={setDisplayPage} /> 
    )
}

function LoginTrue({ loginData }: {loginData: LoginProfileType}) {
    const { unreadMessageItems } = useContext(ChatWithContext)
    return (
        <>
            <p className="text-xl"> Welcome {loginData.display_name}! </p>
            {  // if null
            !unreadMessageItems 
                ? null
                : <>
                    <span className="font-semibold"> Unread Messages! </span>
                    {
                        unreadMessageItems.map((v, i) => {
                            return (
                                <div key={i}>
                                    <span> {`${v['display_name']} - ${v['unread_messages'].length} messages`} </span>
                                </div>
                            )
                        })
                    }
                </>
            }
        </>
    )
}

function LoginFalse({ setDisplayPage }) {
    return (
        <>
            <p className=" text-xl"> Do you already have an account? </p>
            <div className=" mt-2">
                {/* login button */}
                <button className=" bg-green-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => setDisplayPage('login')}> Login </button>
                {/* separator */}
                <span className=" mx-4"></span>
                {/* register button */}
                <button className=" bg-blue-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => setDisplayPage('register')}> Register </button>
            </div>
        </>
    )
}