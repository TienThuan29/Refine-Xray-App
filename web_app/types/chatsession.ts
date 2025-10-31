
export type ChatSessionRequest = {
    title: string;
    xrayImage: Buffer;
}


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
    predictedDiseases: DiseasePrediction[];
    top5Diseases: DiseasePrediction[];
    gradcamAnalyses: { // s3 urls - dynamic keys from backend (e.g., "top1_Hernia", "top2_Cardiomegaly")
        [key: string]: string;
    };
    attentionMap: string; // s3 url
    individualAnalyses: {
        top1_Pneumothorax: string;
        top2_Atelectasis: string;
        top3_Edema: string;
        top4_Pneumonia: string;
        top5_Pleural_Thickening: string;
        [key: string]: string; // Allow additional dynamic keys
    };
    conciseConclusion: string;
    comprehensiveAnalysis: string;
}

export type DiseasePrediction = {
    disease: string;
    confidence: number;
}

export type ChatItem = {
    content: string;
    imageUrls?: string[];
    isBot?: boolean;
    createdDate?: string;
    metaData?: {
        pubmedQueryUrl?: string;
        pubmedFetchUrl?: string[];
    };
}

export type Report = {
    id?: string;
    content?: string;
    createdDate?: string;
}