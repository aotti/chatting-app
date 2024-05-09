import Link from "next/link"
import HeaderContent from "./header/HeaderContent"


export default function Page() {

    return (
        <>
            {/* header */}
            <header className="w-screen p-3 border-2 border-black">
                <HeaderContent />
            </header>
            {/* main */}
            <main>
                go to <Link href="/profiles">Profile Page</Link>
            </main>
            {/* footer */}
            <footer>
                <p> ©aotti 2024 </p>
            </footer>
        </>
    )
}