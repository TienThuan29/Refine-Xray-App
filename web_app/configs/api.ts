import { config } from "./config";

export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:8080',

    Auth: {
        LOGIN: '/api/auth/v1/login',
        REFRESH_TOKEN: '/api/auth/v1/refresh',
        GET_PROFILE: '/api/auth/v1/profile',
    },

    Admin: {
        CREATE_ACCOUNT: '/api/v1/admin/users/create-account',
        GET_ALL_USERS: '',
        GET_USER_BY_EMAIL: '',
        UPDATE_USER: '',
        DELETE_USER: '',
        UPDATE_USER_STATUS: ''
    },

    Folder: {
        CREATE_FOLDER: '/api/doctors/v1/folders',
        GET_FOLDER: '/api/doctors/v1/folders',
        UPDATE_PATIENT_PROFILE: '',
        GET_FOLDER_OF_USER: '/api/doctors/v1/folders/created-by',
        RENAME_FOLDER: '/api/doctors/v1/folders',
        DELETE_FOLDER: '/api/doctors/v1/folders'
    },

    Patient: {
        CREATE_PATIENT_PROFILE: '/api/patients/v1/patient-profiles', // POST ?folderId=xxx
        GET_PATIENT_PROFILE: '/api/patients/v1/patient-profiles',    // GET /:id
        UPDATE_PATIENT_PROFILE: '/api/patients/v1/patient-profiles', // PUT /:id
        DELETE_PATIENT_PROFILE: '/api/patients/v1/patient-profiles', // DELETE /:id
        LIST_PATIENT_PROFILES: '/api/patients/v1/patient-profiles'
    },

    ChatSession: {
        CREATE_CHAT_SESSION: '/api/doctors/v1/chatsessions/analyze-and-create-chatsession',
        CREATE_TEXT_CHAT_SESSION: '',
        GET_CHAT_SESSION: '/api/doctors/v1/chatsessions',
        GET_CHAT_SESSIONS_BY_FOLDER: '/api/doctors/v1/chatsessions/folder',
        SEND_CHAT_MESSAGE: '/api/doctors/v1/chatsessions',
        RENAME_CHAT_SESSION: '',
        DELETE_CHAT_SESSION: '/api/doctors/v1/chatsessions'
    },

    ThirdParty: {
        VietnamAddress: {
            GET_PROVINCES: 'https://production.cas.so/address-kit/2025-07-01/provinces',
            GET_COMMUNES_FROM_PROVINCE: 'https://production.cas.so/address-kit/2025-07-01/provinces/{province_id}/communes',
        }
    },

    XrayDetection: {
        DETECT_XRAY: config.XRAY_DETECTION_API,
    }
}