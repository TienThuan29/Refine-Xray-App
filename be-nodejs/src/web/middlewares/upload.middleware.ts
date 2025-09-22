import multer from 'multer';
import { Request } from 'express';

// Configure multer for memory storage (no disk storage)
const storage = multer.memoryStorage();

// File filter to only allow image files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 1 // Only allow 1 file
    }
});

// Middleware for single file upload with field name 'xrayImage'
export const uploadXrayImage = upload.single('xrayImage');

export default upload;
