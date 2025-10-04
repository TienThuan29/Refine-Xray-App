import dotenv from 'dotenv';

dotenv.config();

export const config = {

    NODE_ENV: process.env.NODE_ENV || 'dev',
    PORT: parseInt(process.env.PORT || '5000', 10),
    SYSTEM_SECRET: process.env.SYSTEM_SECRET || '',

    JWT_SECRET: process.env.JWT_SECRET,
    JWT_ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION,
    JWT_REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION,
    BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
    HASHING_SECRET_KEY: process.env.HASHING_SECRET_KEY || '',

    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

    // aws
    AWS_REGION: process.env.AWS_REGION || '',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
    DYNAMODB_TABLE_PREFIX: process.env.DYNAMODB_TABLE_PREFIX || '',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',

    // log
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    LOG_FILE_MAX_SIZE: process.env.LOG_FILE_MAX_SIZE || '20m',
    LOG_FILE_MAX_FILES: process.env.LOG_FILE_MAX_FILES || '14d',

    // CLINIAI
    CLINI_BASE_URL: process.env.CLINI_BASE_URL || '',
    // N8N
    N8N_CHAT_URL: process.env.N8N_CHAT_URL || '',

    // tables
    USER_TABLE: process.env.USER_TABLE || '',
    REPORT_TEMPLATE_TABLE: process.env.REPORT_TEMPLATE_TABLE || '',
    PATIENT_PROFILE_TABLE: process.env.PATIENT_PROFILE_TABLE || '',
    FOLDER_TABLE: process.env.FOLDER_TABLE || '',
    CHAT_SESSION_TABLE: process.env.CHAT_SESSION_TABLE || '',
    REPORT_TABLE: process.env.REPORT_TABLE || '',
    SYSTEM_VAR_TABLE: process.env.SYSTEM_VAR_TABLE || '',

    // model
    CONFIDENCE_THRESHOLD: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.4'),
    MODEL_PATH: process.env.MODEL_PATH || '',

} as const;