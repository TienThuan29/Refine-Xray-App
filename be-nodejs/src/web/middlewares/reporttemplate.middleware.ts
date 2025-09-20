import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '@/libs/response';
import { ReportTemplateFileRequest } from '@/types/req/reporttemplate.type';
import { reportTemplateServiceInstance } from '@/services/reporttemplate.service';

export const validateReportTemplateFile = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const fileRequest: ReportTemplateFileRequest = req.body;
        
        if (!fileRequest.file) {
            ResponseUtil.error(res, 'No file uploaded', 400);
            return;
        }

        if (!fileRequest.fileName) {
            ResponseUtil.error(res, 'File name is required', 400);
            return;
        }

        if (!fileRequest.createBy) {
            ResponseUtil.error(res, 'Creator ID is required', 400);
            return;
        }

        // Get file extension
        const fileExtension = fileRequest.fileName.split('.').pop()?.toLowerCase();
        
        // Allowed file extensions for report templates
        const allowedExtensions = ['pdf', 'doc', 'docx'];
        
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            ResponseUtil.error(res, 'Only PDF, DOC, and DOCX files are allowed', 400);
            return;
        }

        // Check if file type is supported by service
        const isSupported = reportTemplateServiceInstance.isFileTypeSupported(
            fileRequest.contentType || '', 
            fileRequest.fileName
        );

        if (!isSupported) {
            ResponseUtil.error(res, 'File type not supported. Please upload PDF, DOC, or DOCX files', 400);
            return;
        }

        next();
    } 
    catch (error) {
        ResponseUtil.error(res, 'Error validating file', 500, error as string);
    }
};

export const validateTemplateId = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const { templateId } = req.params;
        
        if (!templateId) {
            ResponseUtil.error(res, 'Template ID is required', 400);
            return;
        }

        // Basic UUID validation (you can make this more strict if needed)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(templateId)) {
            ResponseUtil.error(res, 'Invalid template ID format', 400);
            return;
        }

        next();
    } 
    catch (error) {
        ResponseUtil.error(res, 'Error validating template ID', 500, error as string);
    }
};
