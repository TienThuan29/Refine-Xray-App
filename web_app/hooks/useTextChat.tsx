'use client';

import { useState, useCallback } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import useFolderManager from './useFolderManager';
import { Type } from '@/types/folder';

export interface TextChatItem {
  id: string;
  content: string;
  isBot: boolean;
  timestamp: Date;
  metaData?: {
    pubmedQueryUrl?: string;
    pubmedFetchUrl?: string[];
  };
}

export interface TextChatState {
  chatItems: TextChatItem[];
  isSending: boolean;
  error: string | null;
  textChatSessionId: string | null;
}

export interface TextChatActions {
  sendMessage: (message: string) => Promise<void>;
  createTextChatSession: (folderId?: string) => Promise<string>;
  clearError: () => void;
  clearChat: () => void;
}

export type UseTextChatReturn = TextChatState & TextChatActions;

const useTextChat = (
  onSessionCreated?: (sessionId: string) => void,
  folderId?: string
): UseTextChatReturn => {
  const axios = useAxios();
  const { createFolder, getFoldersOfUser, folders } = useFolderManager();

  const [state, setState] = useState<TextChatState>({
    chatItems: [],
    isSending: false,
    error: null,
    textChatSessionId: null,
  });

  const updateState = useCallback((updates: Partial<TextChatState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleError = useCallback((error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
    updateState({ error: errorMessage });
  }, [updateState]);

  // Find or create "Text chat" folder
  const findOrCreateTextChatFolder = useCallback(async (): Promise<string> => {
    try {
      // Get all folders to check if text chat folder exists
      await getFoldersOfUser();
      
      // Check if a TEXT folder already exists
      const existingTextChatFolder = folders.find(
        (f) => f.title === 'Text Chat' && f.type === Type.TEXT
      );

      if (existingTextChatFolder) {
        return existingTextChatFolder.id;
      }

      // Create a new text chat folder if none exists
      const textChatFolder = await createFolder({
        title: 'Text Chat',
        description: 'General text conversations with Clini AI',
        type: Type.TEXT
      });

      if (textChatFolder) {
        return textChatFolder.id;
      }
      
      throw new Error('Failed to create text chat folder');
    } catch (error) {
      console.error('Error finding/creating text chat folder:', error);
      throw error;
    }
  }, [createFolder, getFoldersOfUser, folders]);

  // Create a text-only chat session
  const createTextChatSession = useCallback(async (targetFolderId?: string): Promise<string> => {
    try {
      // Use provided folderId parameter, or the hook's folderId, or find/create text chat folder
      const finalFolderId = targetFolderId || folderId || await findOrCreateTextChatFolder();
      
      // Create a simple chat session without X-ray image
      const chatSessionData = {
        title: `Text Chat ${new Date().toLocaleString()}`,
        folderId: finalFolderId,
        // We'll create a minimal chat session for text-only conversations
      };

      // For text chat, we'll create a simple session without X-ray analysis
      // This would need to be implemented in the backend to handle text-only sessions
      const response = await axios.post(Api.ChatSession.CREATE_TEXT_CHAT_SESSION, chatSessionData);
      
      if (response.data.success) {
        const sessionId = response.data.dataResponse.id;
        updateState({ textChatSessionId: sessionId });
        return sessionId;
      }
      
      throw new Error(response.data.message || 'Failed to create text chat session');
    } catch (error) {
      console.error('Error creating text chat session:', error);
      throw error; // Don't return mock ID, let the error propagate
    }
    }, [axios, findOrCreateTextChatFolder, updateState, folderId]);

  // Send message to N8N chatbot
  const sendMessage = useCallback(async (message: string) => {
    try {
      updateState({ isSending: true, error: null });

      // Create text chat session if it doesn't exist
      let sessionId = state.textChatSessionId;
      let isNewSession = false;
      if (!sessionId) {
        // Use the folderId from hook props if available, otherwise let createTextChatSession figure it out
        sessionId = await createTextChatSession(folderId);
        updateState({ textChatSessionId: sessionId });
        isNewSession = true;
      }

      // Add user message to chat items
      const userMessage: TextChatItem = {
        id: `user-${Date.now()}`,
        content: message,
        isBot: false,
        timestamp: new Date(),
      };

      updateState({
        chatItems: [...state.chatItems, userMessage],
      });

      // Send message to N8N chatbot
      const chatbotRequest = {
        chatSessionId: sessionId,
        message: message,
        action: state.chatItems.length === 0 ? 'start_chat' : 'continue_chat'
      };

      const response = await axios.post(`${Api.ChatSession.SEND_CHAT_MESSAGE}/${sessionId}/chat`, chatbotRequest);

      if (response.data.success) {
        const botResponse = response.data.dataResponse;
        
        // Add bot response to chat items
        const botMessage: TextChatItem = {
          id: `bot-${Date.now()}`,
          content: botResponse.botChatItem.content,
          isBot: true,
          timestamp: new Date(),
          metaData: botResponse.botChatItem.metaData,
        };

        updateState({
          chatItems: [...state.chatItems, userMessage, botMessage],
          isSending: false,
        });

        // If this was a new session, notify parent component after successful message send
        if (isNewSession && onSessionCreated) {
          onSessionCreated(sessionId);
        }
      } else {
        throw new Error(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      handleError(error, 'send text message');
      updateState({ isSending: false });
    }
    }, [axios, state.chatItems, state.textChatSessionId, updateState, handleError, createTextChatSession, onSessionCreated, folderId]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const clearChat = useCallback(() => {
    updateState({
      chatItems: [],
      textChatSessionId: null,
      error: null,
    });
  }, [updateState]);

  return {
    ...state,
    sendMessage,
    createTextChatSession,
    clearError,
    clearChat,
  };
};

export default useTextChat;
