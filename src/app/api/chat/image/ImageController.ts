import { v2 as cloudinary } from "cloudinary";
import { Controller } from "../../Controller";
import { IDirectChatPayload, IImagePayload, IResponse } from "../../../types";
import filter from "../../filter";
import { respond } from "../../helper";
import { randomBytes } from "crypto";
import { DirectChatController } from "../direct/DirectChatController";

cloudinary.config({ 
    secure: true,
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

export class ImageController extends Controller {
    private directChat = new DirectChatController()

    async sendImage(action: string, payload: IDirectChatPayload & IImagePayload) {
        let result: IResponse
        // filter payload
        const filteredPayload = await filter(action, payload)
        if(filteredPayload.status === 400) {
            return filteredPayload
        }

        try {
            // ### check file size
            // ### check file size
            // check if image uploaded via widget
            if(payload.is_uploaded === false) {
                // upload image
                const uploadedImage = await cloudinary.uploader.upload(JSON.parse(payload.message), {
                    allowed_formats: ['jpg', 'png'],
                    folder: 'chatting-app-images',
                    public_id: `image_${randomBytes(16).toString('hex')}`
                })
                // edit payload message to image public_id (url)
                payload.message = JSON.stringify(uploadedImage.public_id)
            }
            // response data is number
            result = await this.directChat.send(action, payload)
            // return response
            return result
        } catch (err) {
            console.log(`error ImageController sendImage`)
            console.log(err)
            // return response
            result = await respond(500, err.message, [])
            return result
        }
    }
}