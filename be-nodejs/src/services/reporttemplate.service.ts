import { ReportTemplate } from "@/models/report.model";
import { ReportTemplateRepository } from "@/repositories/reporttemplate.repo";
import { S3Service } from "./s3.service";
import mammoth from "mammoth";
import PdfParse from "pdf-parse";
import TurndownService from "turndown";
import logger from "@/libs/logger";

export class ReportTemplateService {

    private readonly reportTemplateRepository: ReportTemplateRepository;
    private readonly s3Service: S3Service;
    private readonly turndownService: TurndownService;

    constructor() {
        this.reportTemplateRepository = new ReportTemplateRepository();
        this.s3Service = new S3Service();
        this.turndownService = new TurndownService();
    }

    /**
     * Upload file and convert to markdown, then save to database
     * @param file - File buffer
     * @param fileName - Original file name
     * @param contentType - MIME type of the file
     * @param createBy - User ID who created the template
     * @returns Created ReportTemplate or null if failed
     */
    public async uploadAndConvertToMarkdown(
        file: Buffer, 
        fileName: string, 
        contentType: string, 
        createBy: string
    ): Promise<ReportTemplate | null> {
        try {
            // Upload file to S3
            const fileLink = await this.s3Service.uploadFile(file, fileName, contentType);
            logger.info(`File uploaded to S3: ${fileLink}`);

            // Convert file to markdown based on content type
            let markdownContent: string;
            
            if (contentType.includes('pdf')) {
                markdownContent = await this.convertPdfToMarkdown(file);
            } else if (contentType.includes('document') || 
                      contentType.includes('wordprocessingml') ||
                      fileName.toLowerCase().endsWith('.doc') ||
                      fileName.toLowerCase().endsWith('.docx')) {
                markdownContent = await this.convertDocToMarkdown(file);
            } else {
                throw new Error(`Unsupported file type: ${contentType}`);
            }

            logger.info(`File converted to markdown, content length: ${markdownContent.length}`);

            // Create ReportTemplate object
            const reportTemplate: Omit<ReportTemplate, 'id' | 'createdDate' | 'updatedDate'> = {
                template: markdownContent,
                fileLink: fileLink,
                createBy: createBy,
                isDeleted: false
            };

            // Save to database
            const createdTemplate = await this.reportTemplateRepository.create(reportTemplate as ReportTemplate);
            
            if (createdTemplate) {
                logger.info(`ReportTemplate created successfully with ID: ${createdTemplate.id}`);
            }

            return createdTemplate;

        } catch (error) {
            logger.error(`Error in uploadAndConvertToMarkdown: ${error}`);
            return null;
        }
    }

    /**
     * Convert PDF file to markdown
     * @param fileBuffer - PDF file buffer
     * @returns Markdown content
     */
    private async convertPdfToMarkdown(fileBuffer: Buffer): Promise<string> {
        try {
            const data = await PdfParse(fileBuffer);
            
            // Basic markdown formatting
            let markdown = data.text;
            
            // Clean up the text
            markdown = markdown
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

            // Add title if first line looks like a title
            const lines = markdown.split('\n');
            if (lines.length > 0 && lines[0].length > 0 && lines[0].length < 100) {
                markdown = `# ${lines[0]}\n\n${lines.slice(1).join('\n')}`;
            }

            return markdown;
        } catch (error) {
            logger.error(`Error converting PDF to markdown: ${error}`);
            throw new Error('Failed to convert PDF to markdown');
        }
    }

    /**
     * Convert DOC/DOCX file to markdown
     * @param fileBuffer - DOC/DOCX file buffer
     * @returns Markdown content
     */
    private async convertDocToMarkdown(fileBuffer: Buffer): Promise<string> {
        try {
            const result = await mammoth.convertToHtml({ buffer: fileBuffer });
            
            // Convert HTML to Markdown using turndown
            let markdown = this.turndownService.turndown(result.value);
            
            // Clean up the markdown
            markdown = markdown
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .trim();

            // Log any conversion warnings
            if (result.messages && result.messages.length > 0) {
                logger.warn(`Mammoth conversion warnings: ${JSON.stringify(result.messages)}`);
            }

            return markdown;
        } catch (error) {
            logger.error(`Error converting DOC to markdown: ${error}`);
            throw new Error('Failed to convert DOC/DOCX to markdown');
        }
    }

    /**
     * Get all report templates
     * @returns Array of ReportTemplate
     */
    public async getAllTemplates(): Promise<ReportTemplate[]> {
        try {
            return await this.reportTemplateRepository.findAll();
        } catch (error) {
            logger.error(`Error getting all templates: ${error}`);
            return [];
        }
    }

    /**
     * Get templates by creator
     * @param createBy - User ID
     * @returns Array of ReportTemplate
     */
    public async getTemplatesByCreator(createBy: string): Promise<ReportTemplate[]> {
        try {
            return await this.reportTemplateRepository.findByCreator(createBy);
        } catch (error) {
            logger.error(`Error getting templates by creator: ${error}`);
            return [];
        }
    }

    /**
     * Get template by ID
     * @param templateId - Template ID
     * @returns ReportTemplate or null
     */
    public async getTemplateById(templateId: string): Promise<ReportTemplate | null> {
        try {
            return await this.reportTemplateRepository.findById(templateId);
        } catch (error) {
            logger.error(`Error getting template by ID: ${error}`);
            return null;
        }
    }

    /**
     * Update template
     * @param templateId - Template ID
     * @param updateData - Partial template data
     * @returns Updated ReportTemplate or null
     */
    public async updateTemplate(templateId: string, updateData: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
        try {
            return await this.reportTemplateRepository.update(templateId, updateData);
        } catch (error) {
            logger.error(`Error updating template: ${error}`);
            return null;
        }
    }

    /**
     * Soft delete template
     * @param templateId - Template ID
     * @returns Success status
     */
    public async deleteTemplate(templateId: string): Promise<boolean> {
        try {
            return await this.reportTemplateRepository.softDelete(templateId);
        } catch (error) {
            logger.error(`Error deleting template: ${error}`);
            return false;
        }
    }

    /**
     * Get supported file types
     * @returns Array of supported MIME types
     */
    public getSupportedFileTypes(): string[] {
        return [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
    }

    /**
     * Check if file type is supported
     * @param contentType - MIME type
     * @param fileName - File name
     * @returns True if supported
     */
    public isFileTypeSupported(contentType: string, fileName: string): boolean {
        const supportedTypes = this.getSupportedFileTypes();
        const isSupportedMimeType = supportedTypes.includes(contentType);
        const isSupportedExtension = fileName.toLowerCase().endsWith('.pdf') || 
                                   fileName.toLowerCase().endsWith('.doc') || 
                                   fileName.toLowerCase().endsWith('.docx');
        
        return isSupportedMimeType || isSupportedExtension;
    }
}

// Export singleton instance
export const reportTemplateServiceInstance = new ReportTemplateService();