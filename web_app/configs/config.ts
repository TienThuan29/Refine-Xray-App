

export const config = {

    HASHING_SECRET_KEY: process.env.NEXT_PUBLIC_HASHING_SECRET_KEY || '',

    XRAY_DETECTION_API: process.env.NEXT_PUBLIC_XRAY_DETECTION_API || '',

} as const;