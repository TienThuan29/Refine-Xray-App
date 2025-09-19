import { Response, Request } from 'express';
import { config } from '@/configs/config';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  dataResponse?: T;
  error?: string;
  stack?: string;
}

export class ResponseUtil {
  static success<T>(
    res: Response, 
    dataResponse: T, 
    message: string = 'Success', 
    statusCode: number = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      message,
      dataResponse,
    });
  }

  static error(
    res: Response, 
    message: string = 'Internal Server Error', 
    statusCode: number = 500,
    error?: string,
    stack?: string
  ): Response<ApiResponse> {
    const response: ApiResponse = {
      success: false,
      message,
    };

    if (error) response.error = error;
    if (stack && config.NODE_ENV === 'development') {
      response.stack = stack;
    }

    return res.status(statusCode).json(response);
  }

  static validation(
    res: Response, 
    message: string = 'Validation Error', 
    errors?: any
  ): Response<ApiResponse> {
    return res.status(400).json({
      success: false,
      message,
      error: errors,
    });
  }
}