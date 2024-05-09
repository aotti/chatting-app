import Link from "next/link"
import HeaderContent from "./header/HeaderContent"
import MainContent from "./main/MainContent"


export default function Page() {

    return (
        <div className="grid grid-rows-10">
            {/* header */}
            <header className="row-span-1 h-fit p-3 border-2 border-black">
                <HeaderContent />
            </header>
            {/* main */}
            <main className="row-span-8 h-full">
                <MainContent />
            </main>
            {/* footer */}
            <footer className="row-span-1 p-3 border-2 border-black">
                <p className="h-full"> ©aotti 2024 </p>
            </footer>
        </div>
    )
}