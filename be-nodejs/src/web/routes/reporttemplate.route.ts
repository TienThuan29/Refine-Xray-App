import { reportTemplate } from "../api/reporttemplate.api";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /report-template/upload-from-path:
 *   post:
 *     summary: Upload file from file path and convert to markdown
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filePath
 *               - createBy
 *             properties:
 *               filePath:
 *                 type: string
 *                 example: "C:/Users/username/Documents/document.pdf"
 *                 description: Full path to the file
 *               createBy:
 *                 type: string
 *                 example: "user123"
 *                 description: Creator user ID
 *               fileName:
 *                 type: string
 *                 example: "my-document.pdf"
 *                 description: Optional custom file name (defaults to basename of filePath)
 *     responses:
 *       201:
 *         description: File uploaded and converted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 dataResponse:
 *                   type: object
 *                   properties:
 *                     templateId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     filePath:
 *                       type: string
 *                     fileLink:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     templatePreview:
 *                       type: string
 *                     createdDate:
 *                       type: string
 *                     markdownLength:
 *                       type: number
 *       400:
 *         description: Bad request - Invalid file path, missing data, or unsupported file type
 *       404:
 *         description: File not found at the specified path
 *       500:
 *         description: Internal server error
 */
router.post('/upload-from-path', reportTemplate.uploadFromFilePath);

/**
 * @swagger
 * /report-template/upload-from-url:
 *   post:
 *     summary: Upload file from URL and convert to markdown
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fileUrl
 *               - createBy
 *             properties:
 *               fileUrl:
 *                 type: string
 *                 example: "https://example.com/document.pdf"
 *                 description: URL of the file to download and process
 *               createBy:
 *                 type: string
 *                 example: "user123"
 *                 description: Creator user ID
 *     responses:
 *       201:
 *         description: File uploaded and converted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 dataResponse:
 *                   type: object
 *                   properties:
 *                     templateId:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     fileUrl:
 *                       type: string
 *                     fileLink:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     templatePreview:
 *                       type: string
 *                     createdDate:
 *                       type: string
 *                     markdownLength:
 *                       type: number
 *       400:
 *         description: Bad request - Invalid URL, missing data, or unsupported file type
 *       500:
 *         description: Internal server error
 */
router.post('/upload-from-url', reportTemplate.uploadFromUrl);

/**
 * @swagger
 * /report-template/validate-file:
 *   get:
 *     summary: Validate file path and get file information
 *     parameters:
 *       - in: query
 *         name: filePath
 *         required: true
 *         schema:
 *           type: string
 *         description: Full path to the file
 *         example: "C:/Users/username/Documents/document.pdf"
 *     responses:
 *       200:
 *         description: File validation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 dataResponse:
 *                   type: object
 *                   properties:
 *                     filePath:
 *                       type: string
 *                     fileName:
 *                       type: string
 *                     fileExtension:
 *                       type: string
 *                     fileSize:
 *                       type: number
 *                     contentType:
 *                       type: string
 *                     isValidExtension:
 *                       type: boolean
 *                     isSupported:
 *                       type: boolean
 *                     canProcess:
 *                       type: boolean
 *                     lastModified:
 *                       type: string
 *       400:
 *         description: Bad request - File path is required
 *       404:
 *         description: File not found at the specified path
 *       500:
 *         description: Internal server error
 */
router.get('/validate-file', reportTemplate.validateFile);

export default router;
