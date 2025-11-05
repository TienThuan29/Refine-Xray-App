export interface Report {
    id: string;
    title?: string;
    templateId?: string;
    content?: string; // markdown content
    chatSessionId?: string;
    patientEmail?: string; // is user's email
    isSent: boolean; // if IsSent is true => doctor cannot edit the report
    sentDate?: string;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateReportRequest {
    title?: string;
    templateId?: string;
    content: string; // markdown content - required
    chatSessionId?: string;
    patientEmail?: string; // is user's email
}

export interface UpdateReportRequest {
    title?: string;
    templateId?: string;
    content?: string; // markdown content
    patientEmail?: string; // is user's email
    isSent?: boolean; // Allow updating sent status
    sentDate?: string; // Allow updating sent date
}
