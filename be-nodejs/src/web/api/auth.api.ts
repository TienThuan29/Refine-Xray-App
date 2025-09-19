

import { AuthService } from '@/services/auth.service';
import { RegisterData } from '@/types/auth.type';
import { ResponseUtil } from '@/libs/response';
import { Request, Response, NextFunction, request } from 'express';
import logger from '@/libs/logger';

export class AuthApi {

    private authService: AuthService = new AuthService();

    constructor() {
        this.authenticate = this.authenticate.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.getProfile = this.getProfile.bind(this);
        this.createAccount = this.createAccount.bind(this);
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
            logger.info(`Register response: ${registerResponse}`);
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


    private getAccessToken(request: Request): string | null {
        return request.headers.authorization?.split(' ')[1] ?? null;
    }

}


