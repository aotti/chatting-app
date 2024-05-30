import { MutableRefObject, useEffect } from "react";

export function clickOutsideElement(ref: MutableRefObject<any>, handler: () => void) {
    useEffect(() => {
        const listener = (ev: Event) => {
            // do nothing if clicking ref's element or descendent elements
            if(!ref?.current || ref.current.contains(ev.target)) return

            handler()
        }

        // event listener
        document.addEventListener('click', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('click', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler])
}