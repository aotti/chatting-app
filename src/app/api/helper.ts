import { createCipheriv, createDecipheriv } from "crypto";
import { IEncrypted, IResponse } from "../types";

export function respond(s: number, m: string | object, d: any[]): IResponse {
    return {
        status: s,
        message: m,
        data: d
    }
}

export function api_action(pathname: string, method: string) {
    // split /api from pathname, ex: /api/user > /user
    const splitPathname = pathname.match(/(?<=.api.).*/)[0]
    // replace slash with whitespace
    const action = splitPathname.replace(/\//g, ' ')
    // method alt name
    let altMethod = null
    switch(method) {
        case 'GET': 
            altMethod = 'get'; break
        case 'POST': 
            altMethod = 'insert'; break
        case 'PATCH':
            altMethod = 'update'; break
    }
    return `${altMethod} ${action}`
}

export async function encryptData(data: string): Promise<IEncrypted> {
    // stuff for encrypt
    const key = Buffer.from(process.env.CIPHER_KEY, 'hex')
    const iv = Buffer.from(process.env.CIPHER_IV, 'hex')
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    // encrypt data
    let encrypted = cipher.update(data)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    // return encrypted
    return { iv: iv.toString('hex'), encryptedData: encrypted.toString('base64') }
}

export async function decryptData(data: Record<'key'|'iv'|'encryptedData', string>) {
    // stuff for decrypt
    const key = Buffer.from(data.key, 'hex')
    const iv = Buffer.from(data.iv, 'hex')
    const encryptedData = Buffer.from(data.encryptedData, 'base64')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    decipher.setAutoPadding(false)
    // decrypt data
    let decrypted = decipher.update(encryptedData).toString()
    decrypted += decipher.final()
    // return decrypted
    return { decryptedData: decrypted.toString() }
}