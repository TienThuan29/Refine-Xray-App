'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { Folder } from '@/types/folder';

// Types for folder operations
export interface CreateFolderRequest {
    title: string;
    description?: string;
}

export interface UpdatePatientProfileRequest {
    patientProfileId: string;
}

export interface FolderManagerState {
    folders: Folder[];
    currentFolder: Folder | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isFetching: boolean;
    isFetchingUserFolders: boolean;
}

export interface FolderManagerActions {
    // CRUD Operations
    createFolder: (data: CreateFolderRequest) => Promise<Folder | null>;
    getFolder: (folderId: string) => Promise<Folder | null>;
    updatePatientProfile: (folderId: string, data: UpdatePatientProfileRequest) => Promise<Folder | null>;
    getFoldersOfUser: () => Promise<Folder[] | null>;
    
    // State Management
    setCurrentFolder: (folder: Folder | null) => void;
    clearError: () => void;
    refreshFolder: (folderId: string) => Promise<void>;
    refreshUserFolders: () => Promise<void>;
}

export type UseFolderManagerReturn = FolderManagerState & FolderManagerActions;

const useFolderManager = (): UseFolderManagerReturn => {
    const axios = useAxios();
    
    // State
    const [state, setState] = useState<FolderManagerState>({
        folders: [],
        currentFolder: null,
        loading: false,
        error: null,
        isCreating: false,
        isUpdating: false,
        isFetching: false,
        isFetchingUserFolders: false,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<FolderManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    // Create folder
    const createFolder = useCallback(async (data: CreateFolderRequest): Promise<Folder | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            const response = await axios.post(Api.Folder.CREATE_FOLDER, data);
            console.log('Folder creation response:', response.data);
            console.log('Response status:', response.status);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create folder');
            }
            
            const newFolder = response.data.dataResponse;
            console.log('Parsed newFolder:', newFolder);
            
            // Update folders list
            setState(prev => ({
                ...prev,
                folders: [...prev.folders, newFolder],
                isCreating: false,
            }));
            
            return newFolder;
        } catch (error: any) {
            console.error('Error creating folder:', error);
            console.error('Error response:', error.response?.data);
            handleError(error, 'create folder');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Get folder by ID
    const getFolder = useCallback(async (folderId: string): Promise<Folder | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            const response = await axios.get(`${Api.Folder.GET_FOLDER}/${folderId}`);
            const folder = response.data.data;
            
            updateState({
                currentFolder: folder,
                isFetching: false,
            });
            
            return folder;
        } catch (error) {
            handleError(error, 'fetch folder');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Update patient profile for a folder
    const updatePatientProfile = useCallback(async (
        folderId: string, 
        data: UpdatePatientProfileRequest
    ): Promise<Folder | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const response = await axios.put(
                `${Api.Folder.UPDATE_PATIENT_PROFILE}/${folderId}`, 
                data
            );
            const updatedFolder = response.data.data;
            
            // Update current folder if it's the one being updated
            setState(prev => ({
                ...prev,
                currentFolder: prev.currentFolder?.id === folderId ? updatedFolder : prev.currentFolder,
                folders: prev.folders.map(folder => 
                    folder.id === folderId ? updatedFolder : folder
                ),
                isUpdating: false,
            }));
            
            return updatedFolder;
        } catch (error) {
            handleError(error, 'update patient profile');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Get folders of current user
    const getFoldersOfUser = useCallback(async (): Promise<Folder[] | null> => {
        try {
            updateState({ isFetchingUserFolders: true, error: null });
            
            const response = await axios.get(Api.Folder.GET_FOLDER_OF_USER);
            
            const userFolders = response.data.dataResponse;

            console.log(userFolders);
            updateState({
                folders: userFolders,
                isFetchingUserFolders: false,
            });
            
            return userFolders;
        } catch (error) {
            handleError(error, 'fetch user folders');
            updateState({ isFetchingUserFolders: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Set current folder
    const setCurrentFolder = useCallback((folder: Folder | null) => {
        updateState({ currentFolder: folder });
    }, [updateState]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Refresh folder data
    const refreshFolder = useCallback(async (folderId: string) => {
        await getFolder(folderId);
    }, [getFolder]);

    // Refresh user folders data
    const refreshUserFolders = useCallback(async () => {
        await getFoldersOfUser();
    }, [getFoldersOfUser]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        folders: state.folders,
        currentFolder: state.currentFolder,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isUpdating: state.isUpdating,
        isFetching: state.isFetching,
        isFetchingUserFolders: state.isFetchingUserFolders,
        
        // Actions
        createFolder,
        getFolder,
        updatePatientProfile,
        getFoldersOfUser,
        setCurrentFolder,
        clearError,
        refreshFolder,
        refreshUserFolders,
    }), [
        state,
        createFolder,
        getFolder,
        updatePatientProfile,
        getFoldersOfUser,
        setCurrentFolder,
        clearError,
        refreshFolder,
        refreshUserFolders,
    ]);

    return returnValue;
};

export default useFolderManager;
