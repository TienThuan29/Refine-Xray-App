
export type ReportTemplate = {
    id: string;
    template: string; // markdown content
    fileLink: string;
    createBy: string;
    isDeleted: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

export type Report = {
    id: string;
    isAccepted?: boolean;
    templateId?: string;
    template?: string; // markdown content
    chatSessionId?: string;
    createdDate?: Date;
    updatedDate?: Date;
}