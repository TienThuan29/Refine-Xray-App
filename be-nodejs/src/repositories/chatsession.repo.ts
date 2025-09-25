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
        
        // Convert ISO date strings back to Date objects
        const processedChatSession = {
            ...chatSession,
            createdDate: chatSession.createdDate ? new Date(chatSession.createdDate) : undefined,
            updatedDate: chatSession.updatedDate ? new Date(chatSession.updatedDate) : undefined,
            chatItems: chatSession.chatItems ? chatSession.chatItems.map((item: any) => ({
                ...item,
                createdDate: item.createdDate ? new Date(item.createdDate) : undefined
            })) : undefined
        };
        
        console.log('Processed chat session for return:', processedChatSession);
        return processedChatSession as ChatSession;
    }

    public async updateChatSession(chatSessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> {
        // Add updatedDate to updates
        const updateData = {
            ...updates,
            updatedDate: new Date()
        };

        // Deep clean function to remove undefined values recursively
        const deepClean = (obj: any): any => {
            if (obj === null || obj === undefined) {
                return undefined;
            }
            
            if (Array.isArray(obj)) {
                return obj.map(deepClean).filter(item => item !== undefined);
            }
            
            if (typeof obj === 'object') {
                const cleaned: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    const cleanedValue = deepClean(value);
                    if (cleanedValue !== undefined) {
                        cleaned[key] = cleanedValue;
                    }
                }
                return Object.keys(cleaned).length > 0 ? cleaned : undefined;
            }
            
            return obj;
        };

        // Convert dates to ISO strings for DynamoDB and filter out undefined values
        const processedUpdates: Record<string, any> = {};
        for (const [key, value] of Object.entries(updateData)) {
            // Skip undefined values
            if (value === undefined) {
                continue;
            }

            if (value instanceof Date) {
                processedUpdates[key] = this.convertDateToISOString(value);
            } else if (key === 'chatItems' && Array.isArray(value)) {
                // Special handling for chatItems array - convert Date objects in each item and clean
                const cleanedChatItems = value.map((item: any) => {
                    if (item && typeof item === 'object') {
                        const processedItem = { ...item };
                        if (processedItem.createdDate instanceof Date) {
                            processedItem.createdDate = this.convertDateToISOString(processedItem.createdDate);
                        }
                        return deepClean(processedItem);
                    }
                    return deepClean(item);
                }).filter(item => item !== undefined);
                
                if (cleanedChatItems.length > 0) {
                    processedUpdates[key] = cleanedChatItems;
                }
            } else {
                const cleanedValue = deepClean(value);
                if (cleanedValue !== undefined) {
                    processedUpdates[key] = cleanedValue;
                }
            }
        }

        // Only proceed if there are valid updates
        if (Object.keys(processedUpdates).length === 0) {
            console.log('No valid updates to process');
            return await this.findById(chatSessionId);
        }

        console.log('Processed updates for DynamoDB:', JSON.stringify(processedUpdates, null, 2));

        const success = await this.updateItem({ id: chatSessionId }, processedUpdates);
        if (!success) {
            return null;
        }
        
        return await this.findById(chatSessionId);
    }
    
}