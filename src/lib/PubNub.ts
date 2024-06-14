import Pubnub from "pubnub"

export function startPubnub(subkey: string, pubkey: string, uuid: string) {
    // pubnub 
    const pubnub = new Pubnub({
        subscribeKey: subkey,
        publishKey: pubkey,
        userId: uuid
    })
    return pubnub
}