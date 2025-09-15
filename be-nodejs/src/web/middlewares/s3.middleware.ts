import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/libs/response';
import { FileRequest } from '@/types/req/s3.type';

export const validateImageFile = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const fileRequest: FileRequest = req.body;
        
        if (!fileRequest.file) {
            ResponseUtil.error(res, 'No file uploaded', 400);
            return;
        }

        if (!fileRequest.fileName) {
            ResponseUtil.error(res, 'File name is required', 400);
            return;
        }

        // Get file extension
        const fileExtension = fileRequest.fileName.split('.').pop()?.toLowerCase();
        
        // Allowed image extensions
        const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        
        if (!fileExtension || !allowedImageExtensions.includes(fileExtension)) {
            ResponseUtil.error(res, 'Only image files are allowed. Supported formats: JPG, JPEG, PNG, GIF, BMP, WEBP, SVG', 400);
            return;
        }

        // check if contentType is provided and is an image type
        if (fileRequest.contentType && !fileRequest.contentType.startsWith('image/')) {
            ResponseUtil.error(res, 'File must be an image type', 400);
            return;
        }

        next();
    } 
    catch (error) {
        ResponseUtil.error(res, 'Error validating file', 500, error as string);
    }
};
