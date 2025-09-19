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
                  ResponseUtil.error(response, 'Access token required', 401);
                  return;
            }

            const token = authHeader.substring(7);
            const decoded = await JwtUtil.verify(token);

            const user = await userRepository.findById(decoded.id);
            if (!user || !user.isEnable) {
                  ResponseUtil.error(response, 'User not found or inactive', 401);
                  return;
            }
            next();
      }
      catch(error) {
            console.error('Authentication error:', error);
            ResponseUtil.error(response, 'Invalid or expired token', 401);
      }
}


export const authorize = (allowedRoles: string[]) => {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
        const userRepository = new UserRepository();
        try {
            const authHeader = request.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                ResponseUtil.error(response, 'Access token required', 401);
                return;
            }

            const token = authHeader.substring(7);
            const decoded = await JwtUtil.verify(token);

            const user = await userRepository.findById(decoded.id);
            if (!user || !user.isEnable) {
                ResponseUtil.error(response, 'User not found or inactive', 401);
                return;
            }

            if (!allowedRoles.includes(user.role)) {
                ResponseUtil.error(response, 'Insufficient permissions', 403);
                return;
            }

            next();
        }
        catch(error) {
            console.error('Authorization error:', error);
            ResponseUtil.error(response, 'Invalid or expired token', 401);
        }
    }
}

export const validateSystemSecret = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const systemSecret = request.headers['x-system-secret'];
    // logger.info(`System secret: ${systemSecret}`);
    if (systemSecret !== config.SYSTEM_SECRET) {
        // logger.error(`Invalid system secret: ${systemSecret}`);
        ResponseUtil.error(response, 'Invalid system secret', 401);
        return;
    }
    //logger.info(`Valid system secret: ${systemSecret}`);
    next();
}