export default function HomePage({display}: {display: string}) {
    return (
        <div className={display}>
            <p className=" text-xl"> Do you already have an account? </p>
            <div className=" mt-2">
                {/* login button */}
                <button className="border-2 border-black bg-green-600 rounded-md p-2 w-20"> Login </button>
                {/* separator */}
                <span className=" mx-4"></span>
                {/* register button */}
                <button className="border-2 border-black bg-blue-600 rounded-md p-2 w-20"> Register </button>
            </div>
        </div>
    )
}