import { Router } from "express";
import { testCreateItem } from "./test.route";
import authRouter from "./auth.route";
import s3Router from "./s3.route";

const router = Router();

router.use('/auth', authRouter);
router.use('/s3', s3Router);

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