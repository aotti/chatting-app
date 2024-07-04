import MenuButton from "./components/MenuButton";

export default function HeaderContent() {
    return (
        <nav className="grid grid-cols-3 justify-items-stretch">
            {/* logo */}
            <div className="w-44">
                <img src="./img/logo.png" className="" alt="logo"/>
            </div>
            {/* app name */}
            <div className="">
                <p className="hidden md:block text-center text-2xl"> Chatting App <br /> filter input empty & regex [a-z] </p>
            </div>
            {/* menu burger */}
            <MenuButton />
        </nav>
    )
}