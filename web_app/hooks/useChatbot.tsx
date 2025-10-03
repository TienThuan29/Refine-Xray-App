'use client';

import { useState, useCallback } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { ChatItem } from '@/types/chatsession';

// Types for chatbot operations
export interface ChatbotRequest {
    message: string;
    action?: 'start_chat' | 'continue_chat' | 'analyze' | 'question';
    context?: {
        specialty?: string;
        urgency?: 'low' | 'medium' | 'high';
        includeReferences?: boolean;
        age?: number;
        gender?: string;
        symptoms?: string;
        medicalHistory?: string;
    };
}

export interface ChatbotResponse {
    chatSessionId: string;
    userChatItem: ChatItem;
    botChatItem: ChatItem;
    botResponse: {
        summarize_answer: string;
        full_answer: string;
        pubmed_query_url: string;
        pubmed_fetch_url: string;
    };
    timestamp: string;
}

export interface ChatbotState {
    isSending: boolean;
    error: string | null;
}

export interface ChatbotActions {
    sendMessage: (chatSessionId: string, request: ChatbotRequest) => Promise<ChatbotResponse | null>;
    clearError: () => void;
}

export type UseChatbotReturn = ChatbotState & ChatbotActions;

const useChatbot = (): UseChatbotReturn => {
    const axios = useAxios();
    
    const [state, setState] = useState<ChatbotState>({
        isSending: false,
        error: null,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<ChatbotState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    // Send message to chatbot
    const sendMessage = useCallback(async (chatSessionId: string, request: ChatbotRequest): Promise<ChatbotResponse | null> => {
        try {
            updateState({ isSending: true, error: null });
            
            const response = await axios.post(
                `${Api.ChatSession.SEND_CHAT_MESSAGE}/${chatSessionId}/chat`,
                request
            );
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to send message');
            }
            
            const chatbotResponse = response.data.dataResponse;
            console.log('Chatbot response:', chatbotResponse);
            console.log('Chatbot response userChatItem:', chatbotResponse.userChatItem);
            console.log('Chatbot response botChatItem:', chatbotResponse.botChatItem);
            console.log('Chatbot response botResponse:', chatbotResponse.botResponse);
            
            updateState({ isSending: false });
            return chatbotResponse;
        } catch (error) {
            handleError(error, 'send message');
            updateState({ isSending: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    return {
        ...state,
        sendMessage,
        clearError,
    };
};

export default useChatbot;
