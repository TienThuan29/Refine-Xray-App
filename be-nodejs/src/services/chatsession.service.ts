import { ChatSessionRepository } from "@/repositories/chatsession.repo";
import { ChatSessionRequest } from "@/types/req/chatsession.type";
import { CliniAIService } from "./cliniAI.service";
import { CliniAIResponse } from "@/types/res/clini.res";
import { S3Service } from "./s3.service";
import { ChatSession, Result } from "@/models/chatsession.model";
import { v4 as uuidv4 } from 'uuid';

export class ChatSessionService {

    private chatSessionRepository: ChatSessionRepository;
    private s3Service: S3Service;

    constructor() {
        this.chatSessionRepository = new ChatSessionRepository();
        this.s3Service = new S3Service();
    }

    public async analyzeAndCreateChatSession(chatSessionRequest: ChatSessionRequest): Promise<ChatSession> {
        const cliniAIService = new CliniAIService();
        // Get analyze result from CliniAI
        const cliniAIResponse = await cliniAIService.getAnalyzeResult(
            chatSessionRequest.xrayImage
        ) as CliniAIResponse;

        if (!cliniAIResponse) {
            throw new Error('Failed to get analyze result from CliniAI');
        }

        const chatSessionId = uuidv4();
        // Upload xray image to S3
        const xrayImageUrl = await this.s3Service.uploadFile(
            chatSessionRequest.xrayImage, 
            `${chatSessionId}/xray_image.png`, 
            'image/png'
        );
        // Convert base64 encoded images to actual images and upload to S3
        const result = await this.convertBase64ImagesToS3Urls(chatSessionId,cliniAIResponse);

        const savedChatSession = await this.chatSessionRepository.createChatSession({
            id: chatSessionId,
            title: chatSessionRequest.title,
            xrayImageUrl: xrayImageUrl,
            result: result
        } as ChatSession) as ChatSession;
        
        return savedChatSession;
    }

    /**
     * Converts base64 encoded images to actual images and uploads them to S3
     * @param cliniAIResponse - Response containing base64 encoded images
     * @returns Result object with S3 URLs instead of base64 strings
     */
    private async convertBase64ImagesToS3Urls(
        sessionId: string,
        cliniAIResponse: CliniAIResponse
    ): Promise<Result> {
        const timestamp = Date.now();

        // Convert gradcam analyses base64 images to S3 URLs
        const gradcamAnalyses: { [key: string]: string } = {};
        for (const [key, base64Image] of Object.entries(cliniAIResponse.gradcam_analyses)) {
            if (base64Image) {
                const imageBuffer = this.base64ToBuffer(base64Image);
                const fileName = `${sessionId}/gradcam/${key}.png`;
                const s3Url = await this.s3Service.uploadFile(imageBuffer, fileName, 'image/png');
                gradcamAnalyses[key] = s3Url;
            }
        }

        // Convert attention map base64 image to S3 URL
        let attentionMapUrl = '';
        if (cliniAIResponse.attention_map) {
            const attentionMapBuffer = this.base64ToBuffer(cliniAIResponse.attention_map);
            const fileName = `${sessionId}/attention_map.png`;
            attentionMapUrl = await this.s3Service.uploadFile(attentionMapBuffer, fileName, 'image/png');
        }

        // Convert predicted_diseases and top_5_diseases to match the Result type
        const predictedDiseases = cliniAIResponse.predicted_diseases.map(disease => ({
            disease: disease.disease,
            confidence: disease.confidence
        }));

        const top5Diseases = cliniAIResponse.top_5_diseases.map(disease => ({
            disease: disease.disease,
            confidence: disease.confidence
        }));

        return {
            predicted_diseases: predictedDiseases,
            top_5_diseases: top5Diseases,
            gradcam_analyses: gradcamAnalyses as {
                top1_Pneumonia: string;
                top2_Consolidation: string;
                top3_Effusion: string;
                top4_Atelectasis: string;
                top5_Cardiomegaly: string;
            },
            attention_map: attentionMapUrl,
            individual_analyses: cliniAIResponse.individual_analyses,
            concise_conclusion: cliniAIResponse.concise_conclusion,
            comprehensive_analysis: cliniAIResponse.comprehensive_analysis
        };
    }

    /**
     * Converts base64 string to Buffer
     * @param base64String - Base64 encoded string
     * @returns Buffer containing the image data
     */
    private base64ToBuffer(base64String: string): Buffer {
        // Remove data URL prefix if present (e.g., "data:image/png;base64,")
        const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }
}