import { ChatSessionRepository } from "@/repositories/chatsession.repo";
import { ChatSessionRequest } from "@/types/req/chatsession.type";
import { ChatbotRequest } from "@/types/req/chatbot.type";
import { ChatbotResponse } from "@/types/res/chatbot.type";
import { CliniAIService } from "./cliniAI.service";
import { CliniAIResponse } from "@/types/res/clini.res";
import { S3Service } from "./s3.service";
import { ChatSession, Result, ChatItem } from "@/models/chatsession.model";
import { v4 as uuidv4 } from 'uuid';
import { FolderRepository } from "@/repositories/folder.repo";
import { n8nApiClient } from "@/thirdparty/n8n";

export class ChatSessionService {

    private chatSessionRepository: ChatSessionRepository;
    private folderRepository: FolderRepository;
    private s3Service: S3Service;

    constructor() {
        this.chatSessionRepository = new ChatSessionRepository();
        this.folderRepository = new FolderRepository();
        this.s3Service = new S3Service();
    }


    public async getChatSessionById(chatSessionId: string): Promise<ChatSession | null> {
        return await this.chatSessionRepository.findById(chatSessionId);
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
            sessionId: chatSessionId, // Use the same ID as sessionId for N8N
            title: chatSessionRequest.title,
            xrayImageUrl: xrayImageUrl,
            result: result
        } as ChatSession) as ChatSession;

        // Update chatsession into folder
        await this.folderRepository.addChatSessionId(chatSessionRequest.folderId, savedChatSession.id);
        
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
     * Handle chatbot interaction with N8N
     * @param chatbotRequest - The chatbot request containing message and context
     * @returns Promise containing the chatbot response
     */
    public async handleChatbotRequest(chatbotRequest: ChatbotRequest): Promise<ChatbotResponse> {
        // Get the chat session
        const chatSession = await this.chatSessionRepository.findById(chatbotRequest.chatSessionId);
        if (!chatSession) {
            throw new Error('Chat session not found');
        }

        // Log chat session data for debugging
        console.log('Chat Session Data:', {
            id: chatSession.id,
            sessionId: chatSession.sessionId,
            hasResult: !!chatSession.result,
            resultKeys: chatSession.result ? Object.keys(chatSession.result) : [],
            chatItemsCount: chatSession.chatItems?.length || 0
        });

        // Handle missing sessionId for existing chat sessions
        if (!chatSession.sessionId) {
            console.log('Chat session missing sessionId, using chat session ID as fallback');
            chatSession.sessionId = chatSession.id;
            
            // Update the chat session in the database with the sessionId
            await this.chatSessionRepository.updateChatSession(chatSession.id, {
                sessionId: chatSession.id
            });
        }

        // Determine if this is the first chat or continuation
        const isFirstChat = !chatSession.chatItems || chatSession.chatItems.length === 0;
        const action = chatbotRequest.action || (isFirstChat ? 'start_chat' : 'continue_chat');
        
        console.log('Chatbot Request:', {
            chatSessionId: chatbotRequest.chatSessionId,
            message: chatbotRequest.message,
            action: action,
            isFirstChat: isFirstChat
        });

        // Sanitize result data to avoid potential issues
        const sanitizedResult = chatSession.result ? this.sanitizeResultData(chatSession.result) : undefined;

        let n8nResponse;
        
        try {
            // Create a temporary chat session with sanitized result for N8N calls
            const tempChatSession = {
                ...chatSession,
                result: sanitizedResult
            };

            // Call N8N API based on action type
            try {
                switch (action) {
                    case 'start_chat':
                        n8nResponse = await n8nApiClient.startFirstChat(tempChatSession, chatbotRequest.message);
                        break;
                    case 'continue_chat':
                        n8nResponse = await n8nApiClient.continueChat(tempChatSession, chatbotRequest.message);
                        break;
                    // case 'analyze':
                    //     n8nResponse = await n8nApiClient.analyzeXrayImage(tempChatSession, '', {
                    //         age: chatbotRequest.context?.age,
                    //         gender: chatbotRequest.context?.gender,
                    //         symptoms: chatbotRequest.context?.symptoms,
                    //         medicalHistory: chatbotRequest.context?.medicalHistory
                    //     });
                    //     break;
                    // case 'question':
                    //     n8nResponse = await n8nApiClient.askMedicalQuestion(tempChatSession, chatbotRequest.message, chatbotRequest.context);
                    //     break;
                    default:
                        n8nResponse = await n8nApiClient.continueChat(tempChatSession, chatbotRequest.message);
                }
            } catch (n8nError) {
                console.error('N8N API call failed:', n8nError);
                // Create a fallback response when N8N completely fails
                n8nResponse = {
                    output: {
                        summarize_answer: 'I apologize, but I\'m currently experiencing technical difficulties.',
                        full_answer: 'I apologize, but I\'m currently experiencing technical difficulties. Please try again in a few moments, or rephrase your question.',
                        pubmed_query_url: '',
                        pubmed_fetch_url: ''
                    }
                };
            }

            // Log N8N response for debugging
            console.log('N8N Response received:', {
                full_answer: n8nResponse.output.full_answer,
                summarize_answer: n8nResponse.output.summarize_answer,
                pubmed_query_url: n8nResponse.output.pubmed_query_url,
                pubmed_fetch_url: n8nResponse.output.pubmed_fetch_url
            });

            // Validate N8N response and provide fallback
            let botContent = n8nResponse.output.full_answer || n8nResponse.output.summarize_answer || '';
            
            if (!botContent || botContent.trim() === '') {
                console.error('N8N API returned empty response:', n8nResponse.output);
                botContent = 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or try again later.';
            }

            // Create chat items for user message and bot response
            const userChatItem: ChatItem = {
                content: chatbotRequest.message,
                isBot: false,
                createdDate: new Date()
            };

            const botChatItem: ChatItem = {
                content: botContent,
                isBot: true,
                createdDate: new Date(),
                metaData: {
                    pubmedQueryUrl: n8nResponse.output.pubmed_query_url,
                    ...(n8nResponse.output.pubmed_fetch_url && { pubmedFetchUrl: [n8nResponse.output.pubmed_fetch_url] })
                }
            };

            // Update chat session with new chat items
            const updatedChatItems = [...(chatSession.chatItems || []), userChatItem, botChatItem];
            
            await this.chatSessionRepository.updateChatSession(chatSession.id, {
                chatItems: updatedChatItems,
                updatedDate: new Date()
            });

            return {
                chatSessionId: chatSession.id,
                userChatItem: userChatItem, // Return original items with Date objects for API response
                botChatItem: botChatItem,
                botResponse: n8nResponse.output,
                timestamp: new Date()
            };

        } catch (error) {
            throw new Error(`Failed to process chatbot request: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Sanitize result data to avoid potential issues with N8N API
     * @param result - The result data to sanitize
     * @returns Sanitized result data
     */
    private sanitizeResultData(result: Result): Result {
        try {
            // Create a clean copy of the result data
            const sanitized = {
                predicted_diseases: result.predicted_diseases || [],
                top_5_diseases: result.top_5_diseases || [],
                gradcam_analyses: result.gradcam_analyses || {},
                attention_map: result.attention_map || '',
                individual_analyses: result.individual_analyses || {},
                concise_conclusion: result.concise_conclusion || '',
                comprehensive_analysis: result.comprehensive_analysis || ''
            };

            // Log the size of the result data
            const resultSize = JSON.stringify(sanitized).length;
            console.log(`Result data size: ${resultSize} characters`);

            // If the result is too large, truncate the analysis text
            if (resultSize > 50000) { // 50KB limit
                console.warn('Result data is large, truncating analysis text');
                sanitized.comprehensive_analysis = sanitized.comprehensive_analysis.substring(0, 10000) + '... [truncated]';
            }

            return sanitized;
        } catch (error) {
            console.error('Error sanitizing result data:', error);
            // Return minimal result data if sanitization fails
            return {
                predicted_diseases: [],
                top_5_diseases: [],
                gradcam_analyses: {
                    top1_Pneumonia: '',
                    top2_Consolidation: '',
                    top3_Effusion: '',
                    top4_Atelectasis: '',
                    top5_Cardiomegaly: ''
                },
                attention_map: '',
                individual_analyses: {
                    top1_Pneumonia: '',
                    top2_Consolidation: '',
                    top3_Effusion: '',
                    top4_Atelectasis: '',
                    top5_Cardiomegaly: ''
                },
                concise_conclusion: 'Analysis data unavailable',
                comprehensive_analysis: 'Analysis data unavailable'
            };
        }
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