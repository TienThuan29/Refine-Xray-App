

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
            await ResponseUtil.success(response, authResponse, 'success.login', 200, request);
        }
        catch (error) {
            if (error instanceof Error) {
                await ResponseUtil.error(response, 'error.invalid_credentials', 400, undefined, undefined, request);
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
                await ResponseUtil.error(response, 'error.refresh_token_required', 400, undefined, undefined, request);
                return;
            }
            const newAccessToken = await this.authService.refreshToken(refreshToken);
            await ResponseUtil.success(response, newAccessToken, 'success.refresh_token', 200, request);
        }
        catch (error) {
            if (error instanceof Error) {
                await ResponseUtil.error(response, 'error.invalid_token', 400, undefined, undefined, request);
            }
            else {
                next(error);
            }
        }
    }


    public async getProfile(request: Request, response: Response): Promise<void> {
        const accessToken = this.getAccessToken(request);
        if (!accessToken) {
            await ResponseUtil.error(response, 'error.user_not_authenticated', 401, undefined, undefined, request);
            return;
        }
        await ResponseUtil.success(
            response,
            await this.authService.getProfile(accessToken),
            'success.profile',
            200,
            request
        );
    }


    public async createAccount(request: Request, response: Response, next: NextFunction): Promise<void> {
        try {
            const registerData: RegisterData = request.body;
            const registerResponse = await this.authService.createAccount(registerData);
            logger.info(`Register response: ${registerResponse}`);
            await ResponseUtil.success(response, registerResponse, 'success.create_account', 201, request);
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('Email already exists')) {
                    await ResponseUtil.error(response, 'error.email_exists', 400, undefined, undefined, request);
                } else if (error.message.includes('error occurred while creating')) {
                    await ResponseUtil.error(response, 'error.account_creation_failed', 400, undefined, undefined, request);
                } else {
                    await ResponseUtil.error(response, 'error.internal_server_error', 400, undefined, undefined, request);
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


