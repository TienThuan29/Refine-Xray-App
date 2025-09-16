
export type Folder = {
    id: string;
    title: string;
    description?: string;
    patientProfileId: string;
    chatSessionIds?: string[];
    createdBy: string;
    isDeleted: boolean;
    createdDate?: string;
    updatedDate?: string;
}