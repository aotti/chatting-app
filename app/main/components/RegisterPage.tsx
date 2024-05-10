export default function RegisterPage({display}: {display: string}) {
    return (
        <div className={`${display} w-1/2 mx-auto p-2 border-2 border-black rounded-md`}>
            <form className="grid grid-rows-4 gap-4">
                {/* display name */}
                <div className="grid grid-cols-2">
                    <label htmlFor="displayName"> Name: </label>
                    <input type="text" id="displayName" minLength={5} maxLength={16} required/>
                </div>
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
                {/* confirm password */}
                <div className="grid grid-cols-2">
                    <label htmlFor="confirmPassword"> Confirm Password: </label>
                    <input type="password" id="confirmPassword" minLength={8} required/>
                </div>
                {/* submit button */}
                <div className="grid grid-cols-2">
                    <button type="button" className="text-xl bg-slate-400 border-2 rounded-md w-40 p-1 mx-auto"> Back </button>
                    <button type="submit" className="text-xl bg-blue-600 border-2 rounded-md w-40 p-1 mx-auto"> Register </button>
                </div>
            </form>
        </div>
    )
}