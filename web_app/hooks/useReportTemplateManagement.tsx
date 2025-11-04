'use client';

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { useAuth } from '@/contexts/AuthContext';
import { Api } from '@/configs/api';

// Types for report template operations
export interface ReportTemplate {
    id: string;
    name: string;
    template: string;
    fileLink: string;
    createBy: string;
    isDeleted: boolean;
    createdDate?: string;
    updatedDate?: string;
}

export interface CreateReportTemplateRequest {
    file: File;
    name?: string;
}

export interface UpdateReportTemplateRequest {
    name?: string;
    template?: string;
    fileLink?: string;
    isDeleted?: boolean;
    file?: File;
}

export interface ReportTemplateManagerState {
    reportTemplates: ReportTemplate[];
    currentReportTemplate: ReportTemplate | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isFetching: boolean;
}

export interface ReportTemplateManagerActions {
    // CRUD Operations
    createReportTemplate: (data: CreateReportTemplateRequest) => Promise<ReportTemplate | null>;
    getReportTemplate: (templateId: string) => Promise<ReportTemplate | null>;
    getAllReportTemplates: () => Promise<ReportTemplate[] | null>;
    updateReportTemplate: (templateId: string, data: UpdateReportTemplateRequest) => Promise<ReportTemplate | null>;
    
    // State Management
    setCurrentReportTemplate: (template: ReportTemplate | null) => void;
    clearError: () => void;
    refreshReportTemplate: (templateId: string) => Promise<void>;
    refreshReportTemplates: () => Promise<void>;
}

export type UseReportTemplateManagerReturn = ReportTemplateManagerState & ReportTemplateManagerActions;

const useReportTemplateManagement = (): UseReportTemplateManagerReturn => {
    const axios = useAxios();
    const { user } = useAuth();
    
    // State
    const [state, setState] = useState<ReportTemplateManagerState>({
        reportTemplates: [],
        currentReportTemplate: null,
        loading: false,
        error: null,
        isCreating: false,
        isUpdating: false,
        isFetching: false,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<ReportTemplateManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    // Create report template
    const createReportTemplate = useCallback(async (data: CreateReportTemplateRequest): Promise<ReportTemplate | null> => {
        try {
            if (!user?.id) {
                handleError({ message: 'User ID not found' }, 'create report template');
                updateState({ isCreating: false });
                return null;
            }

            updateState({ isCreating: true, error: null });
            
            const formData = new FormData();
            formData.append('file', data.file);
            formData.append('userId', user.id);
            if (data.name) {
                formData.append('name', data.name);
            }
            
            // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
            const response = await axios.post(Api.Admin.CREATE_REPORT_TEMPLATE, formData);
            
            const newTemplate = response.data.dataResponse;
            
            // Update templates list
            setState(prev => ({
                ...prev,
                reportTemplates: [...prev.reportTemplates, newTemplate],
                isCreating: false,
            }));
            
            return newTemplate;
        } catch (error) {
            handleError(error, 'create report template');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, user, updateState, handleError]);

    // Get report template by ID
    const getReportTemplate = useCallback(async (templateId: string): Promise<ReportTemplate | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            const response = await axios.get(`${Api.Admin.GET_REPORT_TEMPLATE_BY_ID}/${templateId}`);
            const template = response.data.dataResponse;
            
            setState(prev => ({
                ...prev,
                currentReportTemplate: template,
                isFetching: false,
            }));
            
            return template;
        } catch (error) {
            handleError(error, 'get report template');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Get all report templates
    const getAllReportTemplates = useCallback(async (): Promise<ReportTemplate[] | null> => {
        try {
            updateState({ loading: true, error: null });
            
            const response = await axios.get(Api.Admin.GET_ALL_REPORT_TEMPLATES);
            const templates = response.data.dataResponse || [];

            console.log('templates', templates);
            
            updateState({
                reportTemplates: templates,
                loading: false,
            });
            
            return templates;
        } catch (error) {
            handleError(error, 'get all report templates');
            updateState({ loading: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Update report template
    const updateReportTemplate = useCallback(async (
        templateId: string, 
        data: UpdateReportTemplateRequest
    ): Promise<ReportTemplate | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const formData = new FormData();
            
            // Add optional fields to form data
            // Only append if value is not undefined and not empty string
            if (data.name !== undefined && data.name !== null && data.name.trim() !== '') {
                formData.append('name', data.name);
            }
            if (data.template !== undefined && data.template !== null && data.template.trim() !== '') {
                formData.append('template', data.template);
            }
            if (data.fileLink !== undefined && data.fileLink !== null && data.fileLink.trim() !== '') {
                formData.append('fileLink', data.fileLink);
            }
            // Always include isDeleted if provided (it's a boolean, so undefined check is enough)
            if (data.isDeleted !== undefined) {
                formData.append('isDeleted', data.isDeleted.toString());
            }
            if (data.file) {
                formData.append('file', data.file);
            }
            
            // Don't manually set Content-Type - axios will set it automatically with boundary for FormData
            const response = await axios.put(
                `${Api.Admin.UPDATE_REPORT_TEMPLATE}/${templateId}`, 
                formData
            );
            
            const updatedTemplate = response.data.dataResponse;
            
            // Update templates list and current template
            setState(prev => ({
                ...prev,
                reportTemplates: prev.reportTemplates.map(t => 
                    t.id === templateId ? updatedTemplate : t
                ),
                currentReportTemplate: prev.currentReportTemplate?.id === templateId 
                    ? updatedTemplate 
                    : prev.currentReportTemplate,
                isUpdating: false,
            }));
            
            return updatedTemplate;
        } catch (error) {
            handleError(error, 'update report template');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Set current report template
    const setCurrentReportTemplate = useCallback((template: ReportTemplate | null) => {
        updateState({ currentReportTemplate: template });
    }, [updateState]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Refresh report template data
    const refreshReportTemplate = useCallback(async (templateId: string) => {
        await getReportTemplate(templateId);
    }, [getReportTemplate]);

    // Refresh all report templates
    const refreshReportTemplates = useCallback(async () => {
        await getAllReportTemplates();
    }, [getAllReportTemplates]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        reportTemplates: state.reportTemplates,
        currentReportTemplate: state.currentReportTemplate,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isUpdating: state.isUpdating,
        isFetching: state.isFetching,
        
        // Actions
        createReportTemplate,
        getReportTemplate,
        getAllReportTemplates,
        updateReportTemplate,
        setCurrentReportTemplate,
        clearError,
        refreshReportTemplate,
        refreshReportTemplates,
    }), [
        state.reportTemplates,
        state.currentReportTemplate,
        state.loading,
        state.error,
        state.isCreating,
        state.isUpdating,
        state.isFetching,
        createReportTemplate,
        getReportTemplate,
        getAllReportTemplates,
        updateReportTemplate,
        setCurrentReportTemplate,
        clearError,
        refreshReportTemplate,
        refreshReportTemplates,
    ]);

    return returnValue;
};

export default useReportTemplateManagement;

