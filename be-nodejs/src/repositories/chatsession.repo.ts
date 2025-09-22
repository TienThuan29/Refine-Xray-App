import { config } from "@/configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { ChatSession } from "@/models/chatsession.model";
import { v4 as uuidv4 } from 'uuid';

export class ChatSessionRepository extends DynamoRepository {


    constructor() {
        super(config.CHAT_SESSION_TABLE);
    }


    public async createChatSession(chatSession: ChatSession): Promise<ChatSession | null> {
        chatSession.createdDate = new Date();
        chatSession.updatedDate = new Date();
        chatSession.isDeleted = false;
        const savingResult = await this.putItem({
            ...chatSession,
            createdDate: this.convertDateToISOString(chatSession.createdDate),
            updatedDate: this.convertDateToISOString(chatSession.updatedDate)
        });
        if (!savingResult) {
            return null;
        }
        return await this.findById(chatSession.id);
    }


    public async findById(chatSessionId: string): Promise<ChatSession | null> {
        const chatSession = await this.getItem({ id: chatSessionId });
        if (!chatSession) {
            return null;
        }
        return chatSession as ChatSession;
    }
    
}