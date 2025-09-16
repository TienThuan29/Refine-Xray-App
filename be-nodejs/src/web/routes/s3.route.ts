import { s3ApiInstance } from "../api/s3.api";
import { validateImageFile } from "../middlewares/s3.middleware";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /s3/upload/single:
 *   post:
 *     summary: Upload single image file to S3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *               fileName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image file uploaded successfully
 *       400:
 *         description: Bad request - Invalid file type or missing file
 */
router.post('/s3/upload/single', validateImageFile, s3ApiInstance.uploadSingleFile);

export default router;