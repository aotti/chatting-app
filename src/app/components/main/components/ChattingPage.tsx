export default function ChattingPage() {
    return (
        <div className="grid grid-rows-8 h-full p-2">
            {/* chat box */}
            <div className=" row-span-7 border-b border-black"></div>
            {/* send message box */}
            <div className="flex items-center border-t border-black">
                <form className="flex justify-around w-full">
                    <input type="text" className=" text-xl p-1 w-4/5 rounded-md" />
                    <button type="submit" className=" bg-orange-200 inline-block py-1 px-2 w-24 rounded-md"> Send </button>
                </form>
            </div>
        </div>
    )
}