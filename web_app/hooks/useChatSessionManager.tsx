'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { ChatSession } from '@/types/chatsession';

// Types for chat session operations
export interface CreateChatSessionRequest {
    title: string;
    xrayImage: File;
    folderId: string;
}

export interface ChatSessionManagerState {
    chatSessions: ChatSession[];
    currentChatSession: ChatSession | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isFetching: boolean;
}

export interface ChatSessionManagerActions {
    // CRUD Operations
    createChatSession: (data: CreateChatSessionRequest) => Promise<ChatSession | null>;
    getChatSession: (chatSessionId: string) => Promise<ChatSession | null>;
    
    // State Management
    setCurrentChatSession: (chatSession: ChatSession | null) => void;
    clearError: () => void;
}

export type UseChatSessionManagerReturn = ChatSessionManagerState & ChatSessionManagerActions;

const useChatSessionManager = (): UseChatSessionManagerReturn => {

    const axios = useAxios();
    

    // State
    const [state, setState] = useState<ChatSessionManagerState>({
        chatSessions: [],
        currentChatSession: null,
        loading: false,
        error: null,
        isCreating: false,
        isFetching: false,
    });


    // Helper function to update state
    const updateState = useCallback((updates: Partial<ChatSessionManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);


    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);


    // Create chat session
    const createChatSession = useCallback(async (data: CreateChatSessionRequest): Promise<ChatSession | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            // Create form data for multipart/form-data request
            const formData = new FormData();
            formData.append('title', data.title);
            formData.append('xrayImage', data.xrayImage);
            formData.append('folderId', data.folderId);
            
            const response = await axios.post(Api.ChatSession.CREATE_CHAT_SESSION, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            
            const chatSession = response.data.dataResponse;

            console.log('chatSession', chatSession);
            
            updateState({
                currentChatSession: chatSession,
                isCreating: false,
            });
            
            return chatSession;
        } catch (error) {
            handleError(error, 'create chat session');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Get chat session by ID
    const getChatSession = useCallback(async (chatSessionId: string): Promise<ChatSession | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            const response = await axios.get(`${Api.ChatSession.GET_CHAT_SESSION}/${chatSessionId}`);
            console.log('Chat session response:', response.data);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch chat session');
            }
            
            const chatSession = response.data.dataResponse;
            console.log('Parsed chat session:', chatSession);
            
            // Update current chat session
            updateState({
                currentChatSession: chatSession,
                isFetching: false,
            });
            
            return chatSession;
        } catch (error: any) {
            console.error('Error fetching chat session:', error);
            console.error('Error response:', error.response?.data);
            handleError(error, 'fetch chat session');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Set current chat session
    const setCurrentChatSession = useCallback((chatSession: ChatSession | null) => {
        updateState({ currentChatSession: chatSession });
    }, [updateState]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        chatSessions: state.chatSessions,
        currentChatSession: state.currentChatSession,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isFetching: state.isFetching,
        
        // Actions
        createChatSession,
        getChatSession,
        setCurrentChatSession,
        clearError,
    }), [
        state,
        createChatSession,
        getChatSession,
        setCurrentChatSession,
        clearError,
    ]);

    return returnValue;
};

export default useChatSessionManager;
