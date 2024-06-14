import { useContext } from "react"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"

export default function HomePage({pageHandler}: {pageHandler: (page: string) => void}) {
    // login state
    const { isLogin } = useContext(LoginProfileContext)

    return (
        isLogin[0]
            ? <LoginTrue loginData={isLogin[1]} />
            : <LoginFalse pageHandler={pageHandler} /> 
    )
}

function LoginTrue({ loginData }: {loginData: LoginProfileType}) {
    return (
        <>
            <p className="text-xl"> Welcome {loginData.display_name}! </p>
        </>
    )
}

function LoginFalse({pageHandler}: {pageHandler: (page: string) => void}) {
    return (
        <>
            <p className=" text-xl"> Do you already have an account? </p>
            <div className=" mt-2">
                {/* login button */}
                <button className=" bg-green-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => pageHandler('login')}> Login </button>
                {/* separator */}
                <span className=" mx-4"></span>
                {/* register button */}
                <button className=" bg-blue-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => pageHandler('register')}> Register </button>
            </div>
        </>
    )
}