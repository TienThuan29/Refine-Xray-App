import { UserRepository } from "@/repositories/user.repo";
import { JwtUtil } from "@/utils/jwt.util";
import { ResponseUtil } from "@/libs/response";
import { Role } from "@/models/user.model";
import { Request, Response, NextFunction } from "express";
import { config } from "@/configs/config";
import logger from "@/libs/logger";

export const authenticate = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const userRepository = new UserRepository();
      try {
            const authHeader = request.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                  await ResponseUtil.error(response, 'error.access_token_required', 401, undefined, undefined, request);
                  return;
            }

            const token = authHeader.substring(7);
            const decoded = await JwtUtil.verify(token);

            const user = await userRepository.findById(decoded.id);
            if (!user || !user.isEnable) {
                  await ResponseUtil.error(response, 'error.user_not_found', 401, undefined, undefined, request);
                  return;
            }
            next();
      }
      catch(error) {
            console.error('Authentication error:', error);
            await ResponseUtil.error(response, 'error.invalid_token', 401, undefined, undefined, request);
      }
}


export const authorize = (allowedRoles: string[]) => {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        const userRepository = new UserRepository();
        try {
            const authHeader = request.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                await ResponseUtil.error(response, 'error.access_token_required', 401, undefined, undefined, request);
                return;
            }

            const token = authHeader.substring(7);
            const decoded = await JwtUtil.verify(token);

            const user = await userRepository.findById(decoded.id);
            if (!user || !user.isEnable) {
                await ResponseUtil.error(response, 'error.user_not_found', 401, undefined, undefined, request);
                return;
            }

            if (!allowedRoles.includes(user.role)) {
                await ResponseUtil.error(response, 'error.insufficient_permissions', 403, undefined, undefined, request);
                return;
            }

            next();
        }
        catch(error) {
            console.error('Authorization error:', error);
            await ResponseUtil.error(response, 'error.invalid_token', 401, undefined, undefined, request);
        }
    }
}

export const validateSystemSecret = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const systemSecret = request.headers['x-system-secret'];
    // logger.info(`System secret: ${systemSecret}`);
    if (systemSecret !== config.SYSTEM_SECRET) {
        // logger.error(`Invalid system secret: ${systemSecret}`);
        await ResponseUtil.error(response, 'error.invalid_system_secret', 401, undefined, undefined, request);
        return;
    }
    //logger.info(`Valid system secret: ${systemSecret}`);
    next();
}