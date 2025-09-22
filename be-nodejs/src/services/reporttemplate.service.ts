import { ReportTemplate } from "@/models/report.model";
import { ReportTemplateRepository } from "@/repositories/reporttemplate.repo";
import { S3Service } from "./s3.service";
import mammoth from "mammoth";
import TurndownService from "turndown";
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
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
            // Validate input parameters
            if (!file || file.length === 0) {
                throw new Error('File buffer is empty or invalid');
            }

            if (!fileName || fileName.trim().length === 0) {
                throw new Error('File name is required');
            }

            if (!createBy || createBy.trim().length === 0) {
                throw new Error('Creator ID is required');
            }

            // Check file size (limit to 100MB for PDFs with Docling)
            const maxSize = 100 * 1024 * 1024; // 100MB
            if (file.length > maxSize) {
                throw new Error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
            }

            // Log file size for monitoring
            const fileSizeMB = (file.length / (1024 * 1024)).toFixed(2);
            logger.info(`Processing file: ${fileName} (${fileSizeMB} MB)`);

            // Validate file type
            if (!this.isFileTypeSupported(contentType, fileName)) {
                throw new Error(`Unsupported file type: ${contentType}. Supported types: ${this.getSupportedFileTypes().join(', ')}`);
            }

            logger.info(`Starting file processing: ${fileName}, size: ${file.length} bytes, type: ${contentType}`);

            // Upload file to S3 first
            const fileLink = await this.s3Service.uploadFile(file, fileName, contentType);
            logger.info(`File uploaded to S3: ${fileLink}`);

            // Convert file to markdown based on content type
            let markdownContent: string;
            
            try {
                if (contentType.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')) {
                    markdownContent = await this.convertPdfToMarkdown(file, fileName);
                } else if (contentType.includes('document') || 
                          contentType.includes('wordprocessingml') ||
                          fileName.toLowerCase().endsWith('.doc') ||
                          fileName.toLowerCase().endsWith('.docx')) {
                    markdownContent = await this.convertDocToMarkdown(file);
                } else {
                    throw new Error(`Unsupported file type: ${contentType}`);
                }
            } catch (conversionError) {
                logger.error(`File conversion failed for ${fileName}: ${conversionError}`);
                throw new Error(`Failed to convert file to markdown: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
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
            
            if (!createdTemplate) {
                throw new Error('Failed to save template to database');
            }

            logger.info(`ReportTemplate created successfully with ID: ${createdTemplate.id}`);
            return createdTemplate;

        } catch (error) {
            logger.error(`Error in uploadAndConvertToMarkdown for file ${fileName}: ${error}`);
            throw error; // Re-throw to let API layer handle it
        }
    }

    /**
     * Convert PDF file to markdown using Docling Python script
     * @param fileBuffer - PDF file buffer
     * @param fileName - Original file name
     * @returns Markdown content
     */
    private async convertPdfToMarkdown(fileBuffer: Buffer, fileName: string): Promise<string> {
        try {
            // Validate buffer
            if (!fileBuffer || fileBuffer.length === 0) {
                throw new Error('PDF buffer is empty or invalid');
            }

            // Check if buffer contains PDF header
            const bufferStart = fileBuffer.subarray(0, 8).toString();
            if (!bufferStart.startsWith('%PDF-')) {
                throw new Error('Invalid PDF file format');
            }

            logger.info(`Converting PDF to markdown using Docling, buffer size: ${fileBuffer.length} bytes`);

            // Create temporary file
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `temp_${Date.now()}_${fileName}`);
            
            try {
                // Write buffer to temporary file
                fs.writeFileSync(tempFilePath, fileBuffer);

                // Get the path to the Python script
                const scriptPath = path.join(__dirname, '..', '..', 'scripts', 'docling_converter.py');

                // Execute Python script
                const result = await this.executeDoclingScript(scriptPath, tempFilePath);

                if (!result.success) {
                    throw new Error(result.error || 'Unknown error occurred during conversion');
                }

                let markdown = result.markdown;

                // Ensure we have meaningful content
                if (!markdown || markdown.length < 10) {
                    throw new Error('PDF conversion resulted in minimal text content');
                }

                logger.info(`PDF conversion completed using Docling, markdown length: ${markdown.length}`);
                return markdown;

            } finally {
                // Clean up temporary file
                if (fs.existsSync(tempFilePath)) {
                    fs.unlinkSync(tempFilePath);
                }
            }
        } catch (error) {
            logger.error(`Error converting PDF to markdown with Docling: ${error}`);
            if (error instanceof Error) {
                throw new Error(`Failed to convert PDF to markdown: ${error.message}`);
            }
            throw new Error('Failed to convert PDF to markdown');
        }
    }

    /**
     * Execute Docling Python script
     * @param scriptPath - Path to Python script
     * @param pdfFilePath - Path to PDF file
     * @returns Promise with conversion result
     */
    private async executeDoclingScript(scriptPath: string, pdfFilePath: string): Promise<{success: boolean, markdown?: string, error?: string}> {
        return new Promise((resolve) => {
            try {
                // Spawn Python process
                const pythonProcess = spawn('python', [scriptPath, pdfFilePath], {
                    stdio: ['pipe', 'pipe', 'pipe']
                });

                let stdout = '';
                let stderr = '';

                // Collect stdout
                pythonProcess.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                // Collect stderr and log progress
                pythonProcess.stderr.on('data', (data) => {
                    const message = data.toString();
                    stderr += message;
                    // Log progress messages to help with debugging
                    if (message.includes('Processing PDF file') || 
                        message.includes('Starting PDF conversion') ||
                        message.includes('PDF conversion completed') ||
                        message.includes('Markdown export completed')) {
                        logger.info(`Docling progress: ${message.trim()}`);
                    }
                });

                // Handle process completion
                pythonProcess.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const result = JSON.parse(stdout);
                            resolve(result);
                        } catch (parseError) {
                            logger.error(`Failed to parse Python script output: ${parseError}`);
                            resolve({
                                success: false,
                                error: `Failed to parse script output: ${stdout}`
                            });
                        }
                    } else {
                        logger.error(`Python script failed with code ${code}, stderr: ${stderr}`);
                        resolve({
                            success: false,
                            error: `Python script failed: ${stderr || 'Unknown error'}`
                        });
                    }
                });

                // Handle process error
                pythonProcess.on('error', (error) => {
                    logger.error(`Failed to spawn Python process: ${error}`);
                    resolve({
                        success: false,
                        error: `Failed to execute Python script: ${error.message}`
                    });
                });

                // Set timeout - increased for large files
                const timeoutDuration = 300000; // 5 minutes timeout
                const timeoutId = setTimeout(() => {
                    pythonProcess.kill();
                    resolve({
                        success: false,
                        error: `Python script execution timeout after ${timeoutDuration / 1000} seconds`
                    });
                }, timeoutDuration);

                // Clear timeout if process completes normally
                pythonProcess.on('close', () => {
                    clearTimeout(timeoutId);
                });

            } catch (error) {
                logger.error(`Error executing Docling script: ${error}`);
                resolve({
                    success: false,
                    error: `Script execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
        });
    }



    /**
     * Convert DOC/DOCX file to markdown using mammoth and turndown
     * @param fileBuffer - DOC/DOCX file buffer
     * @returns Markdown content
     */
    private async convertDocToMarkdown(fileBuffer: Buffer): Promise<string> {
        try {
            // Validate buffer
            if (!fileBuffer || fileBuffer.length === 0) {
                throw new Error('Document buffer is empty or invalid');
            }

            logger.info(`Converting DOC/DOCX to markdown using mammoth, buffer size: ${fileBuffer.length} bytes`);

            // Configure turndown service with better options
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced',
                fence: '```',
                emDelimiter: '*',
                strongDelimiter: '**',
                linkStyle: 'inlined',
                linkReferenceStyle: 'full'
            });

            // Convert to HTML using mammoth with options
            const mammothOptions = {
                buffer: fileBuffer
            };

            const result = await mammoth.convertToHtml(mammothOptions);
            
            if (!result.value || result.value.trim().length === 0) {
                throw new Error('Document contains no extractable content');
            }
            
            logger.info(`Document HTML converted, length: ${result.value.length} characters`);
            
            // Convert HTML to Markdown using turndown
            let markdown = turndownService.turndown(result.value);
            
            // Clean up the markdown
            let cleanedMarkdown = markdown
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\r/g, '\n') // Normalize line endings
                .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove excessive line breaks
                .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
                .replace(/\n /g, '\n') // Remove leading spaces from lines
                .replace(/ \n/g, '\n') // Remove trailing spaces from lines
                .replace(/^#+\s*$/gm, '') // Remove empty headers
                .replace(/^\s*[-*+]\s*$/gm, '') // Remove empty list items
                .trim();

            // Ensure we have meaningful content
            if (cleanedMarkdown.length < 10) {
                throw new Error('Document conversion resulted in minimal text content');
            }

            // Log any conversion warnings
            if (result.messages && result.messages.length > 0) {
                logger.warn(`Mammoth conversion warnings: ${JSON.stringify(result.messages)}`);
            }

            logger.info(`Document conversion completed using mammoth, markdown length: ${cleanedMarkdown.length}`);
            return cleanedMarkdown;
        } catch (error) {
            logger.error(`Error converting DOC to markdown with @adobe/helix-docx2md: ${error}`);
            if (error instanceof Error) {
                throw new Error(`Failed to convert DOC/DOCX to markdown: ${error.message}`);
            }
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