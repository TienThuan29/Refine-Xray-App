export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000',

    Auth: {
        LOGIN: '/master-services/api/v1/auth/login',
        REFRESH_TOKEN: '/master-services/api/v1/auth/refresh',
        GET_PROFILE: '/master-services/api/v1/auth/profile',
    },

    Folder: {
        CREATE_FOLDER: '/master-services/api/v1/folder/create-folder',
        GET_FOLDER: '/master-services/api/v1/folder/get',
        UPDATE_PATIENT_PROFILE: '/master-services/api/v1/folder/update-patient-profile-id',
        GET_FOLDER_OF_USER: '/master-services/api/v1/folder/get-all-created-by'
    },

    Patient: {
        CREATE_PATIENT_PROFILE: '/master-services/api/v1/patient/create-profile',
        GET_PATIENT_PROFILE: '',
        UPDATE_PATIENT_PROFILE: '',
        DELETE_PATIENT_PROFILE: '',
        LIST_PATIENT_PROFILES: ''
    },

    ChatSession: {
        CREATE_CHAT_SESSION: '/ai-services/api/v1/chatsessions/analyze-and-create-chatsession',
        GET_CHAT_SESSION: '/ai-services/api/v1/chatsessions/get',
        SEND_CHAT_MESSAGE: '/ai-services/api/v1/chatsessions', // Base path for chat messages
    },

    ThirdParty: {
        VietnamAddress: {
            GET_PROVINCES: 'https://production.cas.so/address-kit/2025-07-01/provinces',
            GET_COMMUNES_FROM_PROVINCE: 'https://production.cas.so/address-kit/2025-07-01/provinces/{province_id}/communes',
        }
    }
}