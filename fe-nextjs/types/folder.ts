import { ChatSession } from "./chatsession";

export interface MenuItem {
    key: string;
    icon?: React.ReactNode;
    label: string;
    isNew?: boolean;
    isFolder?: boolean;
    isSubItem?: boolean;
    isExpanded?: boolean;
    itemCount?: number;
    parentFolder?: string;
}


// export type Folder = {
//     id: string;
//     title: string;
//     chatSessions: ChatSession[];
//     createdDate: string;
//     updatedDate: string;
// }

// export type Folder = {
//     id: string;
//     title: string;
//     description?: string;
//     patientProfileId: string | null;
//     chatSessionIds?: string[];
//     createdBy: string;
//     isDeleted: boolean;
//     createdDate?: string;
//     updatedDate?: string;
// }

export type Folder = {
    id: string;
    title: string;
    description?: string;
    patientProfileId: string | null;
    chatSessionIds?: string[];
    chatSessionsInfo?: ChatSessionInfo[];
    createdBy: string;
    isDeleted: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

export type ChatSessionInfo = {
    id: string;
    title: string;
    isDeleted: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}