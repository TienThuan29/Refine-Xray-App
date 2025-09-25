import { Report } from "./report.model";

export type ChatSession = {
    id: string;
    sessionId: string; // n8n session id
    title: string;
    result?: Result;
    xrayImageUrl?: string;
    chatItems?: ChatItem[];
    reports?: Report[];
    isDeleted: boolean;
    createdDate?: Date;
    updatedDate?: Date;
}

export type Result = {
    predicted_diseases: DiseasePrediction[];
    top_5_diseases: DiseasePrediction[];
    gradcam_analyses: { // s3 urls
        top1_Pneumonia: string;
        top2_Consolidation: string;
        top3_Effusion: string;
        top4_Atelectasis: string;
        top5_Cardiomegaly: string;
    };
    attention_map: string; // s3 url
    individual_analyses: {
        top1_Pneumonia: string;
        top2_Consolidation: string;
        top3_Effusion: string;
        top4_Atelectasis: string;
        top5_Cardiomegaly: string;
    };
    concise_conclusion: string;
    comprehensive_analysis: string;
}

export type DiseasePrediction = {
    disease: string;
    confidence: number;
}

export type ChatItem = {
    content: string;
    imageUrls?: string[];
    isBot?: boolean;
    createdDate?: Date;
    metaData?: {
        pubmedQueryUrl?: string;
        pubmedFetchUrl?: string[];
    }
}

