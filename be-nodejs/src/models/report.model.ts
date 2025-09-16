
export type ReportTemplate = {
    id: string;
    template: string; // markdown content
    fileLink: string;
    createBy: string;
    isDeleted: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export type Report = {
    id: string;
    isAccepted?: boolean;
    templateId?: string;
    template?: string; // markdown content
    chatSessionId?: string;
    createdDate?: string;
    updatedDate?: string;
}