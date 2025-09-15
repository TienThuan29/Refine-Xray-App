import { Router } from "express";
import { testCreateItem } from "./test.route";
import { s3ApiInstance } from "../api/s3.api";
import { validateImageFile } from "../middlewares/s3.middleware";

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


/**
 * @swagger
 * /health:
 *   get:
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (request, response) => {
  response.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});


// Test create item route
router.post('/test/create-test-item', testCreateItem);

export default router;