export default function LoginPage({pageHandler}: {pageHandler: (page: string) => void}) {
    return (
        <div className="
            mx-auto p-2 border-2 border-black rounded-md
            lg:w-1/2 ">
            <form className="grid grid-rows-3 gap-4">
                {/* username */}
                <div className="grid grid-cols-2">
                    <label htmlFor="username"> Username: </label>
                    <input type="text" id="username" minLength={5} maxLength={16} required/>
                </div>
                {/* password */}
                <div className="grid grid-cols-2">
                    <label htmlFor="password"> Password: </label>
                    <input type="password" id="password" minLength={8} required/>
                </div>
                {/* submit button */}
                <div className="grid grid-cols-2">
                    <button type="button" className="text-xl bg-slate-400 border-2 rounded-md w-36 p-1 mx-auto"
                        onClick={() => pageHandler('home')}> Back </button>
                    <button type="submit" className="text-xl bg-green-600 border-2 rounded-md w-36 p-1 mx-auto"> Login </button>
                </div>
            </form>
        </div>
    )
}