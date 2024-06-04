import { useContext } from "react"
import { LoginContext, LoginProfileType } from "../../../context/LoginContext"

export default function HomePage({pageHandler}: {pageHandler: (page: string) => void}) {
    // login state
    const { isLogin, setIsLogin } = useContext(LoginContext)

    return (
        isLogin[0]
            ? <LoginTrue loginData={isLogin[1]} />
            : <LoginFalse pageHandler={pageHandler} /> 
    )
}

function LoginTrue({ loginData }: {loginData: LoginProfileType}) {
    return (
        <>
            <p className="text-xl"> Welcome {loginData.username}! </p>
        </>
    )
}

function LoginFalse({pageHandler}: {pageHandler: (page: string) => void}) {
    return (
        <>
            <p className=" text-xl"> Do you already have an account? </p>
            <div className=" mt-2">
                {/* login button */}
                <button className="border-2 border-black bg-green-600 rounded-md p-2 w-20"
                    onClick={() => pageHandler('login')}> Login </button>
                {/* separator */}
                <span className=" mx-4"></span>
                {/* register button */}
                <button className="border-2 border-black bg-blue-600 rounded-md p-2 w-20"
                    onClick={() => pageHandler('register')}> Register </button>
            </div>
        </>
    )
}