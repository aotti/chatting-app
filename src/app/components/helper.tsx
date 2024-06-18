import { ChangeEvent } from "react"
import { createHash } from "crypto"

/**
 * @param value html tag / id / class
 * @returns 1st html element that match tag/id/class
 */
export function qS(value: string) {
    return document.querySelector(value)
}

/**
 * @param value html tag / id / class
 * @returns all html element that match tag/id/class
 */
export function qSA(value: string) {
    return document.querySelectorAll(value)
}

export function fetcher(endpoint, options) {
    const host = `${window.location.origin}/api`
    const url = host + endpoint
    return fetch(url, options)
}

export function formInputLength(ev: ChangeEvent<HTMLInputElement>) {
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