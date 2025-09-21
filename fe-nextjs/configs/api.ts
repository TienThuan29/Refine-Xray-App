export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000',

    Auth: {
        LOGIN: '/api/v1/auth/authenticate',
        REFRESH_TOKEN: '/api/v1/auth/refresh-token',
        GET_PROFILE: '/api/v1/auth/profile',
    },

    System: {
        CREATE_ACCOUNT: '/api/v1/auth/create-account'
    },

    ThirdParty: {
        VietnamAddress: {
            GET_PROVINCES: 'https://production.cas.so/address-kit/2025-07-01/provinces',
            GET_COMMUNES_FROM_PROVINCE: 'https://production.cas.so/address-kit/2025-07-01/provinces/{province_id}/communes',
        }
    }
}