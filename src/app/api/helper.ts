"use server"

import { createCipheriv, createDecipheriv } from "crypto";
import { IEncryptDecryptProps, IResponse } from "../types";
import { jwtVerify } from "jose";
import { LoginProfileType } from "../context/LoginProfileContext";
import { cookies } from "next/headers";
import AuthController from "./token/AuthController";

export async function respond(s: number, m: string | object, d: any[]): Promise<IResponse> {
    return {
        status: s,
        message: m,
        data: d
    }
}

export async function api_action(pathname: string, method: string) {
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

export async function verifyUserTokens(accessToken: string, action: string) {
    const authController = new AuthController()
    try {
        // authorize token
        const accessTokenSecret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET)
        const verifyAccessToken = await jwtVerify<LoginProfileType>(accessToken, accessTokenSecret)
        // access token ok
        return respond(200, 'access token ok', [{ token: accessToken }])
    } catch (err) {
        // token expired
        // check refresh token
        const refreshToken = cookies().get('refreshToken')?.value
        // no token
        if(!refreshToken) return respond(403, 'forbidden action', [])
        // refresh token ok
        // create new access token
        const newAccessToken = await authController.createToken(action, refreshToken)
        return newAccessToken
    }
}

/**
 * @param data required data to encrypt the text
 * - TEXT is required
 * - KEY is optional (except on client-side)
 * - IV is optional (except on client-side)
 * @returns encrypted data
 */
export async function encryptData(data: Omit<IEncryptDecryptProps, 'encryptedData'>) {
    // stuff for encrypt
    const getKey = process.env.CIPHER_KEY || data.key
    const getIV = process.env.CIPHER_IV || data.iv
    const key = Buffer.from(getKey, 'hex')
    const iv = Buffer.from(getIV, 'hex')
    const cipher = createCipheriv('aes-256-cbc', key, iv)
    // encrypt data
    let encrypted = cipher.update(data.text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    // return encrypted
    return encrypted.toString('base64')
}

/**
 * @param data required data to decrypt the encrypted text
 * - TEXT is required
 * - KEY is optional (except on client-side)
 * - IV is optional (except on client-side)
 * @returns decrypted data
 */
export async function decryptData(data: Omit<IEncryptDecryptProps, 'text'>) {
    // stuff for decrypt
    const getKey = process.env.CIPHER_KEY || data.key
    const getIV = process.env.CIPHER_IV || data.iv
    const key = Buffer.from(getKey, 'hex')
    const iv = Buffer.from(getIV, 'hex')
    const encryptedData = Buffer.from(data.encryptedData, 'base64')
    const decipher = createDecipheriv('aes-256-cbc', key, iv)
    // to prevent error on final()
    decipher.setAutoPadding(false)
    // decrypt data
    let decrypted = decipher.update(encryptedData).toString()
    decrypted += decipher.final()
    // return decrypted
    return decrypted.toString()
}