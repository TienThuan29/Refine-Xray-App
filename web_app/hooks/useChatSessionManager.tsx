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

export interface RenameChatSessionRequest {
    title: string;
}

export interface ChatSessionManagerState {
    chatSessions: ChatSession[];
    currentChatSession: ChatSession | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isFetching: boolean;
    isRenaming: boolean;
    isDeleting: boolean;
}

export interface ChatSessionManagerActions {
    // CRUD Operations
    createChatSession: (data: CreateChatSessionRequest) => Promise<ChatSession | null>;
    getChatSession: (chatSessionId: string) => Promise<ChatSession | null>;
    renameChatSession: (chatSessionId: string, data: RenameChatSessionRequest) => Promise<ChatSession | null>;
    deleteChatSession: (chatSessionId: string) => Promise<boolean>;
    
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
        isRenaming: false,
        isDeleting: false,
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

    // Rename chat session
    const renameChatSession = useCallback(async (chatSessionId: string, data: RenameChatSessionRequest): Promise<ChatSession | null> => {
        try {
            updateState({ isRenaming: true, error: null });
            
            const response = await axios.put(`${Api.ChatSession.RENAME_CHAT_SESSION}/${chatSessionId}`, data);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to rename chat session');
            }
            
            const updatedChatSession = response.data.dataResponse;
            
            // Update current chat session if it's the one being renamed
            setState(prev => ({
                ...prev,
                currentChatSession: prev.currentChatSession?.id === chatSessionId ? updatedChatSession : prev.currentChatSession,
                isRenaming: false,
            }));
            
            return updatedChatSession;
        } catch (error: any) {
            console.error('Error renaming chat session:', error);
            handleError(error, 'rename chat session');
            updateState({ isRenaming: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Delete chat session
    const deleteChatSession = useCallback(async (chatSessionId: string): Promise<boolean> => {
        try {
            updateState({ isDeleting: true, error: null });
            
            const response = await axios.delete(`${Api.ChatSession.DELETE_CHAT_SESSION}/${chatSessionId}`);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete chat session');
            }
            
            // Clear current chat session if it's the one being deleted
            setState(prev => ({
                ...prev,
                currentChatSession: prev.currentChatSession?.id === chatSessionId ? null : prev.currentChatSession,
                isDeleting: false,
            }));
            
            return true;
        } catch (error: any) {
            console.error('Error deleting chat session:', error);
            handleError(error, 'delete chat session');
            updateState({ isDeleting: false });
            return false;
        }
    }, [axios, updateState, handleError]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        chatSessions: state.chatSessions,
        currentChatSession: state.currentChatSession,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isFetching: state.isFetching,
        isRenaming: state.isRenaming,
        isDeleting: state.isDeleting,
        
        // Actions
        createChatSession,
        getChatSession,
        renameChatSession,
        deleteChatSession,
        setCurrentChatSession,
        clearError,
    }), [
        state,
        createChatSession,
        getChatSession,
        renameChatSession,
        deleteChatSession,
        setCurrentChatSession,
        clearError,
    ]);

    return returnValue;
};

export default useChatSessionManager;
