import Link from "next/link"

export default function Page() {
    return (
        <>
            {/* header */}
            <header>
                <p className="text-2xl"> Chatting App </p>
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