import { Request, Response } from 'express';
import { S3Service } from '@/services/s3.service';
import { ResponseUtil } from '@/libs/response';
import logger from '@/libs/logger';
import { FileRequest } from '@/types/req/s3.type';

class S3Api {

    private s3Service: S3Service;

    constructor() {
        this.s3Service = new S3Service();
    }

    public async uploadSingleFile(request: Request, response: Response): Promise<void> {
        try {
            const fileRequest: FileRequest = request.body;
            if (!fileRequest.file) {
                ResponseUtil.error(response, 'No file uploaded', 400);
                return;
            }
    
            const fileName = `uploads/${Date.now()}-${fileRequest.fileName}`;
            const contentType = fileRequest.contentType || 
                               this.getContentTypeFromFileName(fileRequest.fileName) ||
                               'application/octet-stream';
            
            const fileUrl = await this.s3Service.uploadFile(
                fileRequest.file,
                fileName,
                contentType
            );
    
            ResponseUtil.success(response, { fileUrl, fileName, contentType }, 'File uploaded successfully');
        } 
        catch (error) {
            logger.error('Error uploading file:', error);
            ResponseUtil.error(response, 'Error uploading file', 500, error as string);
        }
    }


    private getContentTypeFromFileName(fileName: string): string {
        const extension = fileName.split('.').pop()?.toLowerCase();
        const mimeTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'json': 'application/json',
            'mp4': 'video/mp4',
            'mp3': 'audio/mpeg',
        };
        
        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

}

export const s3ApiInstance = new S3Api();