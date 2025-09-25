export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000',

    Auth: {
        LOGIN: '/api/v1/auth/authenticate',
        REFRESH_TOKEN: '/api/v1/auth/refresh-token',
        GET_PROFILE: '/api/v1/auth/profile',
    },

    System: {
        CREATE_ACCOUNT: '/api/v1/auth/create-account',
        GET_ALL_USERS: '/api/v1/auth/users',
        GET_USER_BY_EMAIL: '/api/v1/auth/users/by-email',
        UPDATE_USER: '/api/v1/auth/users/update',
        DELETE_USER: '/api/v1/auth/users/delete',
        UPDATE_USER_STATUS: '/api/v1/auth/users/status'
    },

    Folder: {
        CREATE_FOLDER: '/api/v1/folder/create-folder',
        GET_FOLDER: '/api/v1/folder/get',
        UPDATE_PATIENT_PROFILE: '/api/v1/folder/update-patient-profile-id',
        GET_FOLDER_OF_USER: '/api/v1/folder/get-all-created-by'
    },

    Patient: {
        CREATE_PATIENT_PROFILE: '/api/v1/patient/create-profile',
        GET_PATIENT_PROFILE: '',
        UPDATE_PATIENT_PROFILE: '',
        DELETE_PATIENT_PROFILE: '',
        LIST_PATIENT_PROFILES: ''
    },

    ChatSession: {
        CREATE_CHAT_SESSION: '/api/v1/chatsessions/analyze-and-create-chatsession',
        GET_CHAT_SESSION: '/api/v1/chatsessions/get',
        SEND_CHAT_MESSAGE: '/api/v1/chatsessions', // Base path for chat messages
    },

    ThirdParty: {
        VietnamAddress: {
            GET_PROVINCES: 'https://production.cas.so/address-kit/2025-07-01/provinces',
            GET_COMMUNES_FROM_PROVINCE: 'https://production.cas.so/address-kit/2025-07-01/provinces/{province_id}/communes',
        }
    }
}