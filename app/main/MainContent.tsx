export default function MainContent() {
    return (
        <>
            {/* main container */}
            <div className="md:grid md:grid-cols-12 gap-2 p-2 h-full">
                {/* user list container on mobile */}
                <div className="
                    sticky top-1/3 w-10 -mt-12
                    md:hidden sm:top-1/2"> 
                    <button className="border-2 border-black"> user list </button>
                </div>
                {/* user list container */}
                <div className="
                    border-2 border-black p-2 hidden absolute w-2/3 h-2/3
                    md:static md:block md:col-span-3 md:w-auto md:h-full">
                    {/* search box */}
                    <div className="border-2 border-black">
                        search box
                    </div>
                    {/* separator */}
                    <div className="my-4"></div>
                    {/* user list */}
                    <div className="border-2 border-black grid grid-cols-3">
                        {/* name */}
                        <span className="border-2 border-black col-span-2"> User </span>
                        {/* chat button */}
                        <span className="border-2 border-black"> Action </span>
                    </div>
                </div>
                {/* main box */}
                <div className="
                    border-2 border-black h-full
                    md:col-span-9">
                    wawan
                </div>
            </div>
        </>
    )
}