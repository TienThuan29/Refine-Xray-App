import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/libs/response';
import { reportTemplateServiceInstance } from '@/services/reporttemplate.service';
import logger from '@/libs/logger';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

export class ReportTemplate {

    constructor() {
        this.uploadFromFilePath = this.uploadFromFilePath.bind(this);
        this.uploadFromUrl = this.uploadFromUrl.bind(this);
    }

    /**
     * Upload file from file path and convert to markdown
     * POST /report-template/upload-from-path
     */
    public async uploadFromFilePath(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { filePath, createBy, fileName } = request.body;
            
            // Validate required fields
            if (!filePath) {
                ResponseUtil.error(response, 'File path is required', 400);
                return;
            }

            if (!createBy) {
                ResponseUtil.error(response, 'Creator ID is required', 400);
                return;
            }

            // Check if file exists
            if (!fs.existsSync(filePath)) {
                ResponseUtil.error(response, 'File not found at the specified path', 404);
                return;
            }

            // Get file info
            const fileStats = fs.statSync(filePath);
            const fileSize = fileStats.size;
            
            // Check file size (limit to 50MB)
            const maxSize = 50 * 1024 * 1024; // 50MB
            if (fileSize > maxSize) {
                ResponseUtil.error(response, 'File size too large. Maximum size is 50MB', 400);
                return;
            }

            // Get file name and extension
            const actualFileName = fileName || path.basename(filePath);
            const fileExtension = path.extname(actualFileName).toLowerCase();
            
            // Validate file extension
            const allowedExtensions = ['.pdf', '.doc', '.docx'];
            if (!allowedExtensions.includes(fileExtension)) {
                ResponseUtil.error(response, 'Only PDF, DOC, and DOCX files are allowed', 400);
                return;
            }

            // Determine content type
            const contentType = this.getContentTypeFromExtension(fileExtension);

            logger.info(`Processing file: ${filePath} (${fileSize} bytes) by user: ${createBy}`);

            // Read file as buffer
            const fileBuffer = fs.readFileSync(filePath);

            // Check if file type is supported by service
            const isSupported = reportTemplateServiceInstance.isFileTypeSupported(contentType, actualFileName);
            if (!isSupported) {
                ResponseUtil.error(response, 'File type not supported by the service', 400);
                return;
            }

            // Upload and convert using service
            const result = await reportTemplateServiceInstance.uploadAndConvertToMarkdown(
                fileBuffer,
                actualFileName,
                contentType,
                createBy
            );

            if (!result) {
                ResponseUtil.error(response, 'Failed to process file', 500);
                return;
            }

            logger.info(`File processed successfully: ${result.id}`);

            ResponseUtil.success(
                response, 
                {
                    templateId: result.id,
                    fileName: actualFileName,
                    filePath: filePath,
                    fileLink: result.fileLink,
                    fileSize: fileSize,
                    templatePreview: result.template.substring(0, 200) + '...',
                    createdDate: result.createdDate,
                    markdownLength: result.template.length
                }, 
                'File uploaded and converted successfully', 
                201
            );

        } catch (error) {
            logger.error('Error in uploadFromFilePath:', error);
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 500);
            } else {
                next(error);
            }
        }
    }

    /**
     * Get content type from file extension
     */
    private getContentTypeFromExtension(extension: string): string {
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        
        return mimeTypes[extension] || 'application/octet-stream';
    }

    /**
     * Upload file from URL and convert to markdown
     * POST /report-template/upload-from-url
     */
    public async uploadFromUrl(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { fileUrl, createBy } = request.body;
            
            // Validate required fields
            if (!fileUrl) {
                ResponseUtil.error(response, 'File URL is required', 400);
                return;
            }

            if (!createBy) {
                ResponseUtil.error(response, 'Creator ID is required', 400);
                return;
            }

            // Validate URL format
            try {
                new URL(fileUrl);
            } catch {
                ResponseUtil.error(response, 'Invalid URL format', 400);
                return;
            }

            logger.info(`Processing file from URL: ${fileUrl} by user: ${createBy}`);

            // Download file from URL
            const fileBuffer = await this.downloadFileFromUrl(fileUrl);
            
            // Get file name from URL
            const fileName = this.getFileNameFromUrl(fileUrl);
            const fileExtension = path.extname(fileName).toLowerCase();
            
            // Validate file extension
            const allowedExtensions = ['.pdf', '.doc', '.docx'];
            if (!allowedExtensions.includes(fileExtension)) {
                ResponseUtil.error(response, 'Only PDF, DOC, and DOCX files are allowed', 400);
                return;
            }

            // Determine content type
            const contentType = this.getContentTypeFromExtension(fileExtension);

            // Check if file type is supported by service
            const isSupported = reportTemplateServiceInstance.isFileTypeSupported(contentType, fileName);
            if (!isSupported) {
                ResponseUtil.error(response, 'File type not supported by the service', 400);
                return;
            }

            // Upload and convert using service
            const result = await reportTemplateServiceInstance.uploadAndConvertToMarkdown(
                fileBuffer,
                fileName,
                contentType,
                createBy
            );

            if (!result) {
                ResponseUtil.error(response, 'Failed to process file', 500);
                return;
            }

            logger.info(`File from URL processed successfully: ${result.id}`);

            ResponseUtil.success(
                response, 
                {
                    templateId: result.id,
                    fileName: fileName,
                    fileUrl: fileUrl,
                    fileLink: result.fileLink,
                    fileSize: fileBuffer.length,
                    templatePreview: result.template.substring(0, 200) + '...',
                    createdDate: result.createdDate,
                    markdownLength: result.template.length
                }, 
                'File from URL uploaded and converted successfully', 
                201
            );

        } catch (error) {
            logger.error('Error in uploadFromUrl:', error);
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 500);
            } else {
                next(error);
            }
        }
    }

    /**
     * Download file from URL
     */
    private async downloadFileFromUrl(url: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            
            client.get(url, (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download file. Status: ${response.statusCode}`));
                    return;
                }

                const chunks: Buffer[] = [];
                response.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                response.on('end', () => {
                    const fileBuffer = Buffer.concat(chunks);
                    
                    // Check file size (limit to 50MB)
                    const maxSize = 50 * 1024 * 1024; // 50MB
                    if (fileBuffer.length > maxSize) {
                        reject(new Error('File size too large. Maximum size is 50MB'));
                        return;
                    }

                    resolve(fileBuffer);
                });

                response.on('error', (error) => {
                    reject(error);
                });
            }).on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Get file name from URL
     */
    private getFileNameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const fileName = path.basename(pathname);
            
            // If no extension, try to determine from content type or default to .pdf
            if (!path.extname(fileName)) {
                return fileName + '.pdf';
            }
            
            return fileName;
        } catch {
            // Fallback to a default name
            return `file-${Date.now()}.pdf`;
        }
    }

    /**
     * Validate file path and get file info
     * GET /report-template/validate-file
     */
    public async validateFile(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { filePath } = request.query;
            
            if (!filePath) {
                ResponseUtil.error(response, 'File path is required', 400);
                return;
            }

            // Check if file exists
            if (!fs.existsSync(filePath as string)) {
                ResponseUtil.error(response, 'File not found at the specified path', 404);
                return;
            }

            // Get file info
            const fileStats = fs.statSync(filePath as string);
            const fileName = path.basename(filePath as string);
            const fileExtension = path.extname(fileName).toLowerCase();
            const contentType = this.getContentTypeFromExtension(fileExtension);

            // Validate file extension
            const allowedExtensions = ['.pdf', '.doc', '.docx'];
            const isValidExtension = allowedExtensions.includes(fileExtension);
            const isSupported = reportTemplateServiceInstance.isFileTypeSupported(contentType, fileName);

            ResponseUtil.success(
                response,
                {
                    filePath: filePath,
                    fileName: fileName,
                    fileExtension: fileExtension,
                    fileSize: fileStats.size,
                    contentType: contentType,
                    isValidExtension: isValidExtension,
                    isSupported: isSupported,
                    canProcess: isValidExtension && isSupported,
                    lastModified: fileStats.mtime
                },
                'File validation completed'
            );

        } catch (error) {
            logger.error('Error validating file:', error);
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 500);
            } else {
                next(error);
            }
        }
    }
}

export const reportTemplate = new ReportTemplate();
