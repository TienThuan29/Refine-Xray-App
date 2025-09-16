import logger from "@/libs/logger";
import { config } from "../configs/config";
import { JWTPayload } from "@/types/auth.type";
import jwt, { SignOptions, VerifyErrors } from "jsonwebtoken";

export class JwtUtil {

  private static secret = config.JWT_SECRET || '';
  private static accessTokenExpiration = config.JWT_ACCESS_TOKEN_EXPIRATION || '1d';
  private static refreshTokenExpiration = config.JWT_REFRESH_TOKEN_EXPIRATION || '7d';


  static async generateAccessToken(payload: JWTPayload, options?: SignOptions): Promise<string> {
    return this.sign(payload, options, this.accessTokenExpiration);
  }

  static async generateRefreshToken(payload: JWTPayload, options?: SignOptions): Promise<string> {
    return this.sign(payload, options, this.refreshTokenExpiration);
  }

  /**
   * Verify token and return payload (user info in jwt)
   * @param token access token
   * @returns payload with user info
   */
  public static async verify(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, JwtUtil.secret) as JWTPayload;
      return decoded; 
    } 
    catch (err) {
      logger.error('Invalid token, message:', (err as VerifyErrors).message);
      throw new Error(`Invalid token: ${(err as VerifyErrors).message}`);
    }
  }

  /**
   * Decode token without verifying signature
   * @param token jwt token
   * @returns payload with user info or null if invalid
   */
  public static async decode(token: string): Promise<JWTPayload | null> {
    const decoded = jwt.decode(token);
    if (decoded && typeof decoded === "object") {
      return decoded as JWTPayload;
    }
    return null;
  }

  /**
   * Generate token from payload
   * @param payload : info to encode to jwt
   * @param options : custom expiration, or more
   * @returns jwt string token
   */
  private static async sign(payload: JWTPayload, options?: SignOptions, expiresIn?: string): Promise<string> {
    const signOptions: SignOptions = {
      algorithm: "HS256",
      expiresIn: expiresIn as SignOptions["expiresIn"],
      ...options,
    };
    return jwt.sign(payload, JwtUtil.secret, signOptions);
  }

}
