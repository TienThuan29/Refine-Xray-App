import { Response, Request } from 'express';
import { config } from '@/configs/config';
import { t, changeLanguage } from '@/configs/i18n';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  dataResponse?: T;
  error?: string;
  stack?: string;
}

export class ResponseUtil {
  static async success<T>(
    res: Response, 
    dataResponse: T, 
    message: string = 'Success', 
    statusCode: number = 200,
    req?: Request
  ): Promise<Response<ApiResponse<T>>> {
    const localizedMessage = req ? await this.getLocalizedMessage(req, message) : message;
    return res.status(statusCode).json({
      success: true,
      message: localizedMessage,
      dataResponse,
    });
  }

  static async error(
    res: Response, 
    message: string = 'Internal Server Error', 
    statusCode: number = 500,
    error?: string,
    stack?: string,
    req?: Request
  ): Promise<Response<ApiResponse>> {
    const localizedMessage = req ? await this.getLocalizedMessage(req, message) : message;
    const response: ApiResponse = {
      success: false,
      message: localizedMessage,
    };

    if (error) response.error = error;
    if (stack && config.NODE_ENV === 'development') {
      response.stack = stack;
    }

    return res.status(statusCode).json(response);
  }

  static async validation(
    res: Response, 
    message: string = 'Validation Error', 
    errors?: any,
    req?: Request
  ): Promise<Response<ApiResponse>> {
    const localizedMessage = req ? await this.getLocalizedMessage(req, message) : message;
    return res.status(400).json({
      success: false,
      message: localizedMessage,
      error: errors,
    });
  }

  private static async getLocalizedMessage(req: Request, message: string): Promise<string> {
    try {
      // Get language from Accept-Language header or query parameter
      const lang = req.query.lang as string || 
                   req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                   'en';
      
      // Set lang
      if (lang === 'vi' || lang === 'en') {
        await changeLanguage(lang);
      }
      
      if (message.includes('.')) {
        return t(message);
      }
      
      return message;
    } 
    catch (error) {
      return message;
    }
  }
}