import { authenticate, authorize, validateSystemSecret } from '@/web/middlewares/auth.middleware';
import { AuthApi } from '@/web/api/auth.api';
import { Router } from 'express';
import { Role } from '@/models/user.model';

const router = Router();

const authApi = new AuthApi();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginCredentials:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string }
 *     RegisterData:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name: { type: string }
 *         email: { type: string, format: email }
 *         password: { type: string }
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         message: { type: string }
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 fullname: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *             accessToken: { type: string }
 *             refreshToken: { type: string }
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success: { type: boolean }
 *         message: { type: string }
 *     RefreshTokenRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken: { type: string }
 *     UserProfile:
 *       type: object
 *       properties:
 *         id: { type: string }
 *         email: { type: string }
 *         role: { type: string }
 */

/**
 * @swagger
 * /api/v1/auth/create-account:
 *   post:
 *     summary: Register user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/types/auth.type/RegisterData'
 *     responses:
 *       201:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/types/auth.type/AuthResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/create-account', validateSystemSecret, (req, res, next) => authApi.createAccount(req, res, next));

// , authenticate, authorize([Role.ADMIN])

/**
 * @swagger
 * /api/v1/auth/authenticate:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/authenticate', (req, res, next) => authApi.authenticate(req, res, next));

/**
 * @swagger
 * /api/v1/auth/refresh-token:
 *   post:
 *     summary: Refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh-token', authApi.refreshToken);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Get profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/profile', authenticate, (req, res) => authApi.getProfile(req, res));

/**
 * @swagger
 * /api/v1/auth/users:
 *   get:
 *     summary: Get all users (Admin/System only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/users', authenticate, authorize([Role.ADMIN, Role.SYSTEM]), (req, res, next) => authApi.getAllUsers(req, res, next));

/**
 * @swagger
 * /api/v1/auth/users/by-email:
 *   post:
 *     summary: Get user by email
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: User not found
 */
router.post('/users/by-email', authenticate, (req, res, next) => authApi.getUserByEmail(req, res, next));

/**
 * @swagger
 * /api/v1/auth/users/update:
 *   put:
 *     summary: Update user (Admin/System only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               fullname: { type: string }
 *               phone: { type: string }
 *               dateOfBirth: { type: string, format: date }
 *               role: { type: string, enum: [DOCTOR, ADMIN, SYSTEM] }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/users/update', authenticate, authorize([Role.ADMIN, Role.SYSTEM]), (req, res, next) => authApi.updateUser(req, res, next));

/**
 * @swagger
 * /api/v1/auth/users/delete:
 *   delete:
 *     summary: Delete user (Admin/System only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: boolean }
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.delete('/users/delete', authenticate, authorize([Role.ADMIN, Role.SYSTEM]), (req, res, next) => authApi.deleteUser(req, res, next));

/**
 * @swagger
 * /api/v1/auth/users/status:
 *   patch:
 *     summary: Update user status (Admin/System only)
 *     tags: [User Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               isEnable: { type: boolean }
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.patch('/users/status', authenticate, authorize([Role.ADMIN, Role.SYSTEM]), (req, res, next) => authApi.updateUserStatus(req, res, next));

export default router;