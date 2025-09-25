import { N8NOutputData } from "@/thirdparty/n8n";
import { ChatItem } from "@/models/chatsession.model";

export type ChatbotResponse = {
    chatSessionId: string;
    userChatItem: ChatItem;
    botChatItem: ChatItem;
    botResponse: N8NOutputData;
    timestamp: Date;
}
