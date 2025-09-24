

import { AuthService } from '@/services/auth.service';
import { RegisterData } from '@/types/auth.type';
import { ResponseUtil } from '@/libs/response';
import { Request, Response, NextFunction } from 'express';
import logger from '@/libs/logger';

export class AuthApi {

    private readonly authService: AuthService = new AuthService();

    constructor() {
        this.authenticate = this.authenticate.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.getAllUsers = this.getAllUsers.bind(this);
        this.getUserByEmail = this.getUserByEmail.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.updateUserStatus = this.updateUserStatus.bind(this);
    }


    public async authenticate(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const credentials = request.body;
            const authResponse = await this.authService.authenticate(credentials);
            ResponseUtil.success(response, authResponse, 'Login successful', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, 'Invalid email or password', 400);
            }
            else {
                next(error);
            }
        }
    }


    public async refreshToken(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const { refreshToken } = request.body;
            if (!refreshToken) {
                ResponseUtil.error(response, 'Refresh token required', 400);
                return;
            }
            const newAccessToken = await this.authService.refreshToken(refreshToken);
            ResponseUtil.success(response, newAccessToken, 'Token refreshed successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, 'Invalid or expired token', 400);
            }
            else {
                next(error);
            }
        }
    }


    public async getProfile(request: Request, response: Response): Promise<void> {
        const accessToken = this.getAccessToken(request);
        if (!accessToken) {
            ResponseUtil.error(response, 'User not authenticated', 401);
            return;
        }
        ResponseUtil.success(
            response,
            await this.authService.getProfile(accessToken),
            'Profile retrieved successfully',
            200
        );
    }


    public async createAccount(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const registerData: RegisterData = request.body;
            const registerResponse = await this.authService.createAccount(registerData);
            logger.info(`Register response: ${JSON.stringify(registerResponse)}`);
            ResponseUtil.success(response, registerResponse, 'Account created successfully', 201);
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Email already exists')) {
                    ResponseUtil.error(response, 'Email already exists', 400);
                } else if (error.message.includes('error occurred while creating')) {
                    ResponseUtil.error(response, 'An error occurred while creating the account', 400);
                } else {
                    ResponseUtil.error(response, 'Internal Server Error', 400);
                }
            }
            else {
                next(error);
            }
        }
    }


    public async getAllUsers(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const accessToken = this.getAccessToken(request);
            if (!accessToken) {
                ResponseUtil.error(response, 'User not authenticated', 401);
                return;
            }

            // Verify user has admin/system role
            const user = await this.authService.getUserByToken(accessToken);
            if (!user || (user.role !== 'ADMIN' && user.role !== 'SYSTEM')) {
                ResponseUtil.error(response, 'Insufficient permissions', 403);
                return;
            }

            const users = await this.authService.getAllUsers();
            ResponseUtil.success(response, users, 'Users retrieved successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 400);
            }
            else {
                next(error);
            }
        }
    }

    public async getUserByEmail(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const accessToken = this.getAccessToken(request);
            if (!accessToken) {
                ResponseUtil.error(response, 'User not authenticated', 401);
                return;
            }

            const { email } = request.body;
            if (!email) {
                ResponseUtil.error(response, 'Email is required', 400);
                return;
            }

            const user = await this.authService.getUserByEmail(email);
            if (!user) {
                ResponseUtil.error(response, 'User not found', 404);
                return;
            }

            ResponseUtil.success(response, user, 'User retrieved successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 400);
            }
            else {
                next(error);
            }
        }
    }

    public async updateUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const accessToken = this.getAccessToken(request);
            if (!accessToken) {
                ResponseUtil.error(response, 'User not authenticated', 401);
                return;
            }

            // Verify user has admin/system role
            const currentUser = await this.authService.getUserByToken(accessToken);
            if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SYSTEM')) {
                ResponseUtil.error(response, 'Insufficient permissions', 403);
                return;
            }

            const { email, ...updateData } = request.body;

            if (!email) {
                ResponseUtil.error(response, 'Email is required', 400);
                return;
            }

            // Remove sensitive fields that shouldn't be updated via this endpoint
            delete updateData.id;
            delete updateData.createdDate;
            delete updateData.lastLoginDate;

            const updatedUser = await this.authService.updateUserByEmail(email, updateData);
            if (!updatedUser) {
                ResponseUtil.error(response, 'User not found or update failed', 404);
                return;
            }

            ResponseUtil.success(response, updatedUser, 'User updated successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 400);
            }
            else {
                next(error);
            }
        }
    }

    public async deleteUser(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const accessToken = this.getAccessToken(request);
            if (!accessToken) {
                ResponseUtil.error(response, 'User not authenticated', 401);
                return;
            }

            // Verify user has admin/system role
            const currentUser = await this.authService.getUserByToken(accessToken);
            if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SYSTEM')) {
                ResponseUtil.error(response, 'Insufficient permissions', 403);
                return;
            }

            const { email } = request.body;
            if (!email) {
                ResponseUtil.error(response, 'Email is required', 400);
                return;
            }

            // Prevent self-deletion
            if (currentUser.email === email) {
                ResponseUtil.error(response, 'Cannot delete your own account', 400);
                return;
            }

            const deleted = await this.authService.deleteUserByEmail(email);
            if (!deleted) {
                ResponseUtil.error(response, 'User not found or deletion failed', 404);
                return;
            }

            ResponseUtil.success(response, { deleted: true }, 'User deleted successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 400);
            }
            else {
                next(error);
            }
        }
    }

    public async updateUserStatus(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const accessToken = this.getAccessToken(request);
            if (!accessToken) {
                ResponseUtil.error(response, 'User not authenticated', 401);
                return;
            }

            // Verify user has admin/system role
            const currentUser = await this.authService.getUserByToken(accessToken);
            if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SYSTEM')) {
                ResponseUtil.error(response, 'Insufficient permissions', 403);
                return;
            }

            const { email, isEnable } = request.body;

            if (!email) {
                ResponseUtil.error(response, 'Email is required', 400);
                return;
            }

            if (typeof isEnable !== 'boolean') {
                ResponseUtil.error(response, 'isEnable must be a boolean value', 400);
                return;
            }

            // Prevent self-status change
            if (currentUser.email === email) {
                ResponseUtil.error(response, 'Cannot change your own status', 400);
                return;
            }

            const updatedUser = await this.authService.updateUserStatusByEmail(email, isEnable);
            if (!updatedUser) {
                ResponseUtil.error(response, 'User not found or update failed', 404);
                return;
            }

            ResponseUtil.success(response, updatedUser, 'User status updated successfully', 200);
        }
        catch (error) {
            if (error instanceof Error) {
                ResponseUtil.error(response, error.message, 400);
            }
            else {
                next(error);
            }
        }
    }

    private getAccessToken(request: Request): string | null {
        return request.headers.authorization?.split(' ')[1] ?? null;
    }

}


