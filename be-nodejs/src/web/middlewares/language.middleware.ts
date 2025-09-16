import { Request, Response, NextFunction } from 'express';
import { changeLanguage } from '@/configs/i18n';

export const languageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Priority: query param > header > default
    const lang = req.query.lang as string || 
                 req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 
                 'en';
    
    // Set language for this request
    if (lang === 'vi' || lang === 'en') {
      changeLanguage(lang);
    }
    
    // Store language in request for easy access
    (req as any).language = lang;
    
    next();
  } catch (error) {
    // Fallback to default language
    (req as any).language = 'en';
    next();
  }
};
