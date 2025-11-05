

export const config = {

    HASHING_SECRET_KEY: process.env.NEXT_PUBLIC_HASHING_SECRET_KEY || '',

    XRAY_DETECTION_API: process.env.NEXT_PUBLIC_XRAY_DETECTION_API || '',

    GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',

    GEMINI_API_MODEL: process.env.NEXT_PUBLIC_GEMINI_API_MODEL || '',

} as const;