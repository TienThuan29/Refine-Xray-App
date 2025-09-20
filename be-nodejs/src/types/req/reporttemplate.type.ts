export type ReportTemplateFileRequest = {
    file: Buffer;
    fileName: string;
    contentType?: string;
    createBy: string;
}

export type ReportTemplateUpdateRequest = {
    template?: string;
    fileLink?: string;
}

export type ReportTemplateQueryRequest = {
    createBy?: string;
    page?: number;
    limit?: number;
}
