import { config } from "./config";

export const Api = {

    BASE_API: process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:8080',

    Auth: {
        LOGIN: '/api/auth/v1/login',
        REFRESH_TOKEN: '/api/auth/v1/refresh',
        GET_PROFILE: '/api/auth/v1/profile',
    },

    Admin: {
        CREATE_ACCOUNT: '/api/admin/v1/users/create-account',
        GET_ALL_USERS: '/api/admin/v1/users',
        GET_USER_BY_EMAIL: '/api/admin/v1/users/by-email',
        UPDATE_USER: '/api/admin/v1/users',
        DELETE_USER: '/api/admin/v1/users',
        UPDATE_USER_STATUS: '/api/admin/v1/users/status'
    },

    Folder: {
        CREATE_FOLDER: '/api/doctors/v1/folders',
        GET_FOLDER: '/api/doctors/v1/folders',
        UPDATE_PATIENT_PROFILE: '/api/doctors/v1/folders/patient-profile',
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
        CREATE_TEXT_CHAT_SESSION: '/api/doctors/v1/chatsessions/create-text-chatsession',
        GET_CHAT_SESSION: '/api/doctors/v1/chatsessions',
        GET_CHAT_SESSIONS_BY_FOLDER: '/api/doctors/v1/chatsessions/folder',
        SEND_CHAT_MESSAGE: '/api/doctors/v1/chatsessions',
        QUERY_PUBMED_RAG: '/api/doctors/v1/chatsessions/query-pubmed-rag',
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
    },

    Blog: {
        CREATE_BLOG: '/api/patients/v1/blogs',                    // POST (DOCTOR only)
        GET_BLOG: '/api/patients/v1/blogs',                       // GET /:id (Public)
        UPDATE_BLOG: '/api/patients/v1/blogs',                    // PUT /:id (DOCTOR only)
        DELETE_BLOG: '/api/patients/v1/blogs',                    // DELETE /:id (DOCTOR only)
        LIST_BLOGS: '/api/patients/v1/blogs'                      // GET (Public - all blogs)
    }
}