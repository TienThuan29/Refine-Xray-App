import logger from "@/libs/logger";
import { ResponseUtil } from "@/libs/response";
import { ChatSessionService } from "@/services/chatsession.service";
import { ChatSessionRequest } from "@/types/req/chatsession.type";
import { ChatbotRequest } from "@/types/req/chatbot.type";
import { Request, Response } from "express";

export class ChatSessionApi {

    private chatsessionService: ChatSessionService;


    constructor() {
        this.chatsessionService = new ChatSessionService();
        this.createChatSession = this.createChatSession.bind(this);
        this.getChatSessionById = this.getChatSessionById.bind(this);
        this.sendChatMessage = this.sendChatMessage.bind(this);
    }


    public async createChatSession(request: Request, response: Response): Promise<void> {
        try {
            // Validate required fields first
            if (!request.body.title) {
                ResponseUtil.error(response, 'Title is required', 400, 'Missing title field');
                return;
            }

            if (!request.file?.buffer) {
                ResponseUtil.error(response, 'X-ray image is required', 400, 'Missing xrayImage file');
                return;
            }

            // Get form data from request
            const chatSessionRequest: ChatSessionRequest = {
                folderId: request.body.folderId,
                title: request.body.title,
                xrayImage: request.file.buffer // This comes from multer middleware
            };

            const createdChatSession = await this.chatsessionService.analyzeAndCreateChatSession(chatSessionRequest);
            ResponseUtil.success(response, createdChatSession, 'Chat session created successfully');
        }
        catch(error) {
            logger.error('Error creating chat session:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }


    public async getChatSessionById(request: Request, response: Response): Promise<void> {
        try {
            const chatSessionId = request.params.chatSessionId;
            const chatSession = await this.chatsessionService.getChatSessionById(chatSessionId);
            ResponseUtil.success(response, chatSession, 'Chat session found successfully');
        }
        catch(error) {
            logger.error('Error getting chat session by id:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }

    /**
     * Send a chat message to the N8N chatbot
     * POST /api/chatsessions/:chatSessionId/chat
     */
    public async sendChatMessage(request: Request, response: Response): Promise<void> {
        try {
            const chatSessionId = request.params.chatSessionId;
            
            // Validate required fields
            if (!request.body.message) {
                ResponseUtil.error(response, 'Message is required', 400, 'Missing message field');
                return;
            }

            // Create chatbot request
            const chatbotRequest: ChatbotRequest = {
                chatSessionId: chatSessionId,
                message: request.body.message,
                action: request.body.action,
                context: request.body.context
            };

            // Process the chatbot request
            const chatbotResponse = await this.chatsessionService.handleChatbotRequest(chatbotRequest);
            
            ResponseUtil.success(response, chatbotResponse, 'Chat message processed successfully');
        }
        catch(error) {
            logger.error('Error processing chat message:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }


}