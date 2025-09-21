import logger from "@/libs/logger";
import { ResponseUtil } from "@/libs/response";
import { ChatSessionService } from "@/services/chatsession.service";
import { ChatSessionRequest } from "@/types/req/chatsession.type";
import { Request, Response } from "express";

export class ChatSessionApi {

    private chatsessionService: ChatSessionService;


    constructor() {
        this.chatsessionService = new ChatSessionService();
        this.createChatSession = this.createChatSession.bind(this);
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

}