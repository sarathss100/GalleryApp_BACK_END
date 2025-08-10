import cloudinary from '../../config/cloudinary';
import { IImage } from '../../model/image.model';
import { ImageOrderPayload } from "../../types/basicTypes";
import IImageService from "../IImageService";
import IImageRepository from "../../repository/user/IImageRepository";

class ImageService implements IImageService {
    private _imageRepository: IImageRepository;
    constructor(imageRepository: IImageRepository) {
        this._imageRepository = imageRepository;
    }

    async uploadImage(buffer: Buffer, title: string, userId: string): Promise<IImage | null> {
        try {

            // Convert buffer to base64
            const base64String = buffer.toString('base64');
            const dataUri = `data:image/jpeg;base64,${base64String}`;

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'images',
            });

            const uploadImage = await this._imageRepository.uploadImage(userId, title, result.secure_url)
            return uploadImage;

        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    }

    async getImages(userId: string): Promise<IImage[] | null> {
        const response = await this._imageRepository.getImages(userId);
        return response
    }

    async updateOrder(userId: string, imageOrder: ImageOrderPayload): Promise<boolean | null> {
        const response = await this._imageRepository.updateOrder(userId, imageOrder);
        return response;
    }

    async deleteImage(imageId: string): Promise<IImage | null> {
        console.log(imageId)
        const response = await this._imageRepository.delete(imageId);
        console.log(response)
        return response;
    }

    async editImage(buffer: Buffer, title: string, id: string): Promise<IImage | null> {
        try {

            if (buffer) {
                const base64String = buffer.toString('base64');
                const dataUri = `data:image/jpeg;base64,${base64String}`;

                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataUri, {
                    folder: 'images', 
                });

                const uploadImage = await this._imageRepository.editImage(title, result.secure_url, id)
                return uploadImage ??  null;
            } else {
                const uploadImage = await this._imageRepository.editImage(title, "", id)
                return uploadImage ??  null;
            }

        } catch (error) {
            console.error("Error uploading image:", error);
            throw error;
        }
    }
}

export default ImageService;