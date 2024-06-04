import { KeyboardEvent } from "react"
import { createHash } from "crypto"

/**
 * @param value html tag / id / className
 * @returns html element
 */
export function qS(value: string) {
    return document.querySelector(value)
}

export function fetcher(url, options) {
    return fetch(`api${url}`, options)
}

export function formInputLength(ev: KeyboardEvent<HTMLInputElement>) {
    // get current value
    const value = ev.currentTarget.value
    const minLength = ev.currentTarget.minLength
    // check length
    if(value.length < minLength) 
        ev.currentTarget.style.boxShadow = '0 0 10px inset crimson'
    else 
        ev.currentTarget.style.removeProperty('box-shadow')
}

export function sha256(text: string) {
    const hash = createHash('sha256').update(text).digest('hex')
    return hash
}