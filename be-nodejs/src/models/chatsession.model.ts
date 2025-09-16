import { Report } from "./report.model";

export type ChatSession = {
    id: string;
    title: string;
    result?: Result;
    xrayImageUrl?: string;
    chatItems?: ChatItem[];
    reports?: Report[];
    isDeleted: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export type Result = {
    diseaseName?: string;
    gradCamImgUrls: string[];
}

export type ChatItem = {
    content: string;
    imageUrls?: string[];
    isBot?: boolean;
    createdDate?: string;
}

