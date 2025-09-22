
export type CliniAIResponse = {
    predicted_diseases: {
        disease: string;
        confidence: number;
    }[];
    top_5_diseases: {
        disease: string;
        confidence: number;
    }[];
    gradcam_analyses: { // base64 encoded images
        top1_Pneumonia: string;
        top2_Consolidation: string;
        top3_Effusion: string;
        top4_Atelectasis: string;
        top5_Cardiomegaly: string;
    };
    attention_map: string; // base64 encoded image
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