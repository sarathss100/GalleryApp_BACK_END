import { STATUS_CODES } from "../../constants/statusCode";
import IImageService from "../../service/IImageService"
import IImageController from "../interfaces/IImageControler";
import { Request, Response } from "express";

class ImageController implements IImageController {

    private _imageService: IImageService;
    constructor(imageService: IImageService) {
        this._imageService = imageService;
    }

    async uploadImage(req: Request, res: Response): Promise<void> {
        try {
            const files = (req.files as { [fieldname: string]: Express.Multer.File[] })?.image;
            console.log("Uploaded files:", files);

            if (!files || files.length === 0) {
                res.status(STATUS_CODES.BAD_REQUEST).json({ 
                    success: false, 
                    message: "No files uploaded" 
                });
                return;
            }

            const userId = req.userId as string;
            let titles: string[] = [];
            if (req.body.titles) {
                try {
                    titles = JSON.parse(req.body.titles);
                } catch {
                    titles = Array.isArray(req.body.titles) ? req.body.titles : [req.body.titles];
                }
            }

            while (titles.length < files.length) {
                titles.push(`Image ${titles.length + 1}`);
            }

            const uploadPromises = files.map(async (file, index) => {
                const buffer = file.buffer;
                const title = titles[index] || `Image ${index + 1}`;
                return await this._imageService.uploadImage(buffer, title, userId);
            });

            const uploads = await Promise.all(uploadPromises);
            const successfulUploads = uploads.filter(upload => upload !== null);

            if (successfulUploads.length > 0) {
                res.status(STATUS_CODES.CREATED).json({ 
                    success: true, 
                    message: `${successfulUploads.length} image(s) uploaded successfully`, 
                    data: successfulUploads 
                });
            } else {
                res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
                    success: false, 
                    message: "Failed to upload images" 
                });
            }
        } catch (error) {
            console.error("Error in uploadImage:", error);
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ 
                success: false, 
                message: "Internal server error" 
            });
        }
    }

    async getImages(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId;
            const response = await this._imageService.getImages(userId as string);
            if (response) {
                res.status(STATUS_CODES.OK).json({ success: true, message: "Image retrived successfull", data: response })
            }
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error while getting images" })
        }
    }

    async updateOrder(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.userId as string;
            const imageOrder = req.body
            const response = await this._imageService.updateOrder(userId, imageOrder)
            if (response) {
                res.status(STATUS_CODES.OK).json({ success: true, message: "Image Order changed successfull" })
            }
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error while updating the order" })
        }
    }

    async deleteImage(req: Request, res: Response): Promise<void> {
        try {
            const { id: imageId } = req.params;
            const response = await this._imageService.deleteImage(imageId);
            if (response) {
                res.status(STATUS_CODES.OK).json({ success: true, message: "Image deleted successfull" })
            }
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error while deleting the image" })
        }
    }

    async updateImage(req: Request, res: Response): Promise<void> {
        try {
            const files = req.files as Express.Multer.File[];
            const { id } = req.params;
            if (files.length > 0) {
                const buffer = files[0].buffer;
                const upload = await this._imageService.editImage(buffer, req.body.title, id);
                res.status(STATUS_CODES.CREATED).json({ success: true, message: "Image uploaded successfully", data: upload });
            } else {
                const upload = await this._imageService.editImage("", req.body.title, id)
                res.status(STATUS_CODES.CREATED).json({ success: true, message: "Image uploaded successfully", data: upload });
            }
        } catch (error) {
            res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Error while editing the image" })
        }
    }
}

export default ImageController;