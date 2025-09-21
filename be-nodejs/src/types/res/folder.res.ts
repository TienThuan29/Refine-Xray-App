

export type FolderResponse = {
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