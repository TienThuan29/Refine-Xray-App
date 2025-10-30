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
        CREATE_FOLDER: '',
        GET_FOLDER: '',
        UPDATE_PATIENT_PROFILE: '',
        GET_FOLDER_OF_USER: '',
        RENAME_FOLDER: '',
        DELETE_FOLDER: ''
    },

    Patient: {
        CREATE_PATIENT_PROFILE: '',
        GET_PATIENT_PROFILE: '',
        UPDATE_PATIENT_PROFILE: '',
        DELETE_PATIENT_PROFILE: '',
        LIST_PATIENT_PROFILES: ''
    },

    ChatSession: {
        CREATE_CHAT_SESSION: '',
        CREATE_TEXT_CHAT_SESSION: '',
        GET_CHAT_SESSION: '',
        SEND_CHAT_MESSAGE: '',
        RENAME_CHAT_SESSION: '',
        DELETE_CHAT_SESSION: ''
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