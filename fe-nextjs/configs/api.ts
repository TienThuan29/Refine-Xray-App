export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000',

    Auth: {
        LOGIN: '/api/v1/auth/authenticate',
        REFRESH_TOKEN: '/api/v1/auth/refresh-token',
        GET_PROFILE: '/api/v1/auth/profile',
    },

    System: {
        CREATE_ACCOUNT: '/api/v1/auth/create-account'
    }
}