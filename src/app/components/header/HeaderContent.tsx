import MenuButton from "./components/MenuButton";

export default function HeaderContent() {
    return (
        <nav className="grid grid-cols-3 justify-items-stretch">
            {/* logo */}
            <div className="border-2 border-black w-44">
                <img src="./img/logo.png" alt="logo"/>
            </div>
            {/* app name */}
            <div className="">
                <p className="hidden md:block text-center text-2xl"> Chatting App </p>
            </div>
            {/* menu burger */}
            <MenuButton />
        </nav>
    )
}