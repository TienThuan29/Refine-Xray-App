'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { ChatSession } from '@/types/chatsession';

// Types for folder chat sessions
export interface FolderChatSessionsState {
    folderChatSessions: Record<string, ChatSession[]>; // folderId -> chatSessions
    loading: boolean;
    error: string | null;
    isFetching: boolean;
}

export interface FolderChatSessionsActions {
    // Operations
    getChatSessionsForFolder: (folderId: string) => Promise<ChatSession[] | null>;
    addChatSessionToFolder: (folderId: string, chatSession: ChatSession) => void;
    clearAllChatSessions: () => void;
    
    // State Management
    clearError: () => void;
    refreshFolderChatSessions: (folderId: string) => Promise<void>;
}

export type UseFolderChatSessionsReturn = FolderChatSessionsState & FolderChatSessionsActions;

const useFolderChatSessions = (): UseFolderChatSessionsReturn => {
    const axios = useAxios();
    
    // State
    const [state, setState] = useState<FolderChatSessionsState>({
        folderChatSessions: {},
        loading: false,
        error: null,
        isFetching: false,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<FolderChatSessionsState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    
    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);


    // Get chat sessions for a specific folder
    const getChatSessionsForFolder = useCallback(async (folderId: string): Promise<ChatSession[] | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            // For now, we'll return empty array since we don't have a specific endpoint
            // In the future, you might want to add an endpoint like /api/v1/folder/{folderId}/chat-sessions
            const chatSessions: ChatSession[] = [];
            
            // Update state with the chat sessions for this folder
            setState(prev => ({
                ...prev,
                folderChatSessions: {
                    ...prev.folderChatSessions,
                    [folderId]: chatSessions
                },
                isFetching: false,
            }));
            
            return chatSessions;
        } catch (error) {
            handleError(error, 'fetch folder chat sessions');
            updateState({ isFetching: false });
            return null;
        }
    }, [updateState, handleError]);

    // Add a chat session to a folder (for when we create a new one)
    const addChatSessionToFolder = useCallback((folderId: string, chatSession: ChatSession) => {
        setState(prev => ({
            ...prev,
            folderChatSessions: {
                ...prev.folderChatSessions,
                [folderId]: [
                    ...(prev.folderChatSessions[folderId] || []),
                    chatSession
                ]
            }
        }));
    }, []);

    // Clear all chat sessions
    const clearAllChatSessions = useCallback(() => {
        setState(prev => ({
            ...prev,
            folderChatSessions: {}
        }));
    }, []);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Refresh chat sessions for a folder
    const refreshFolderChatSessions = useCallback(async (folderId: string) => {
        await getChatSessionsForFolder(folderId);
    }, [getChatSessionsForFolder]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        folderChatSessions: state.folderChatSessions,
        loading: state.loading,
        error: state.error,
        isFetching: state.isFetching,
        
        // Actions
        getChatSessionsForFolder,
        addChatSessionToFolder,
        clearAllChatSessions,
        clearError,
        refreshFolderChatSessions,
    }), [
        state,
        getChatSessionsForFolder,
        addChatSessionToFolder,
        clearAllChatSessions,
        clearError,
        refreshFolderChatSessions,
    ]);

    return returnValue;
};

export default useFolderChatSessions;
