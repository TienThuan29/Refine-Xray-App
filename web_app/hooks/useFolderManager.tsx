'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { useAuth } from '@/contexts/AuthContext';
import { Api } from '@/configs/api';
import { Folder, Type } from '@/types/folder';

// Types for folder operations
export interface CreateFolderRequest {
    title: string;
    description?: string;
    type?: Type;
}

export interface UpdatePatientProfileRequest {
    patientProfileId: string;
}

export interface RenameFolderRequest {
    title: string;
    description?: string;
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
    isRenaming: boolean;
    isDeleting: boolean;
}

export interface FolderManagerActions {
    // CRUD Operations
    createFolder: (data: CreateFolderRequest) => Promise<Folder | null>;
    getFolder: (folderId: string) => Promise<Folder | null>;
    updatePatientProfile: (folderId: string, data: UpdatePatientProfileRequest) => Promise<Folder | null>;
    getFoldersOfUser: () => Promise<Folder[] | null>;
    renameFolder: (folderId: string, data: RenameFolderRequest) => Promise<Folder | null>;
    deleteFolder: (folderId: string) => Promise<boolean>;
    
    // State Management
    setCurrentFolder: (folder: Folder | null) => void;
    clearError: () => void;
    refreshFolder: (folderId: string) => Promise<void>;
    refreshUserFolders: () => Promise<void>;
}

export type UseFolderManagerReturn = FolderManagerState & FolderManagerActions;

const useFolderManager = (): UseFolderManagerReturn => {
    const axios = useAxios();
    const { user } = useAuth();
    
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
        isRenaming: false,
        isDeleting: false,
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
            if (!user?.id) {
                throw new Error('User not authenticated');
            }
            const payload = {
                Title: data.title,
                Description: data.description,
                CreatedBy: user?.id,
                Type: data.type ?? Type.ANALYZE,
            };
            
            const response = await axios.post(Api.Folder.CREATE_FOLDER, payload);
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
    }, [axios, updateState, handleError, user]);

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
            const createdBy = user?.id || '';
            if (!createdBy) {
                throw new Error('User not authenticated');
            }
            const response = await axios.get(`${Api.Folder.GET_FOLDER_OF_USER}?userId=${encodeURIComponent(createdBy)}`);
            
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
    }, [axios, updateState, handleError, user]);

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

    // Rename folder
    const renameFolder = useCallback(async (folderId: string, data: RenameFolderRequest): Promise<Folder | null> => {
        try {
            updateState({ isRenaming: true, error: null });
            
            const response = await axios.put(`${Api.Folder.RENAME_FOLDER}/${folderId}`, data);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to rename folder');
            }
            
            const updatedFolder = response.data.dataResponse;
            
            // Update folders list
            setState(prev => ({
                ...prev,
                folders: prev.folders.map(folder => 
                    folder.id === folderId ? updatedFolder : folder
                ),
                currentFolder: prev.currentFolder?.id === folderId ? updatedFolder : prev.currentFolder,
                isRenaming: false,
            }));
            
            return updatedFolder;
        } catch (error: any) {
            console.error('Error renaming folder:', error);
            handleError(error, 'rename folder');
            updateState({ isRenaming: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Delete folder
    const deleteFolder = useCallback(async (folderId: string): Promise<boolean> => {
        try {
            updateState({ isDeleting: true, error: null });
            
            const response = await axios.delete(`${Api.Folder.DELETE_FOLDER}/${folderId}`);
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to delete folder');
            }
            
            // Remove folder from folders list
            setState(prev => ({
                ...prev,
                folders: prev.folders.filter(folder => folder.id !== folderId),
                currentFolder: prev.currentFolder?.id === folderId ? null : prev.currentFolder,
                isDeleting: false,
            }));
            
            return true;
        } catch (error: any) {
            console.error('Error deleting folder:', error);
            handleError(error, 'delete folder');
            updateState({ isDeleting: false });
            return false;
        }
    }, [axios, updateState, handleError]);

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
        isRenaming: state.isRenaming,
        isDeleting: state.isDeleting,
        
        // Actions
        createFolder,
        getFolder,
        updatePatientProfile,
        getFoldersOfUser,
        renameFolder,
        deleteFolder,
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
        renameFolder,
        deleteFolder,
        setCurrentFolder,
        clearError,
        refreshFolder,
        refreshUserFolders,
    ]);

    return returnValue;
};

export default useFolderManager;
