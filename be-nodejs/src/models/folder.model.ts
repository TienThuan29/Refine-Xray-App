
export type Folder = {
    id: string;
    title: string;
    description?: string;
    patientProfileId: string | null;
    chatSessionIds?: string[];
    createdBy: string;
    isDeleted: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}