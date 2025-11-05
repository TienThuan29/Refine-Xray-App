'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { Report, CreateReportRequest, UpdateReportRequest } from '@/types/report';

export interface ReportManagerState {
    reports: Report[];
    currentReport: Report | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isFetching: boolean;
    isDeleting: boolean;
    isSending: boolean;
}

export interface ReportManagerActions {
    createReport: (data: CreateReportRequest) => Promise<Report | null>;
    getReport: (reportId: string) => Promise<Report | null>;
    getReportsByChatSession: (chatSessionId: string) => Promise<Report[] | null>;
    getReportsByPatient: (patientEmail: string) => Promise<Report[] | null>;
    updateReport: (reportId: string, data: UpdateReportRequest) => Promise<Report | null>;
    sendReport: (reportId: string) => Promise<Report | null>;
    deleteReport: (reportId: string) => Promise<boolean>;
    setCurrentReport: (report: Report | null) => void;
    clearError: () => void;
    refreshReport: (reportId: string) => Promise<void>;
    refreshReports: () => Promise<void>;
}

export type UseReportManagerReturn = ReportManagerState & ReportManagerActions;

const useReportManagement = (): UseReportManagerReturn => {
    const axios = useAxios();
    
    const [state, setState] = useState<ReportManagerState>({
        reports: [],
        currentReport: null,
        loading: false,
        error: null,
        isCreating: false,
        isUpdating: false,
        isFetching: false,
        isDeleting: false,
        isSending: false,
    });

    const updateState = useCallback((updates: Partial<ReportManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    const createReport = useCallback(async (data: CreateReportRequest): Promise<Report | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            const response = await axios.post(Api.Report.CREATE_REPORT, data);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to create report');
            }
            
            const newReport = response.data.dataResponse;
            
            setState(prev => ({
                ...prev,
                reports: [newReport, ...prev.reports],
                isCreating: false,
            }));
            
            return newReport;
        } catch (error) {
            handleError(error, 'create report');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const getReport = useCallback(async (reportId: string): Promise<Report | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            const response = await axios.get(`${Api.Report.GET_REPORT}/${reportId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to fetch report');
            }
            
            const report = response.data.dataResponse;
            
            updateState({
                currentReport: report,
                isFetching: false,
            });
            
            return report;
        } catch (error: any) {
            handleError(error, 'fetch report');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const getReportsByChatSession = useCallback(async (chatSessionId: string): Promise<Report[] | null> => {
        try {
            updateState({ loading: true, error: null });
            
            const response = await axios.get(`${Api.Report.GET_REPORTS_BY_CHAT_SESSION}/${chatSessionId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to fetch reports');
            }
            
            const reports = response.data.dataResponse || [];
            
            setState(prev => ({
                ...prev,
                reports,
                loading: false,
            }));
            
            return reports;
        } catch (error) {
            handleError(error, 'fetch reports by chat session');
            updateState({ loading: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const getReportsByPatient = useCallback(async (patientEmail: string): Promise<Report[] | null> => {
        try {
            updateState({ loading: true, error: null });
            
            const response = await axios.get(`${Api.Report.GET_REPORTS_BY_PATIENT}/${encodeURIComponent(patientEmail)}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to fetch reports');
            }
            
            const reports = response.data.dataResponse || [];
            
            setState(prev => ({
                ...prev,
                reports,
                loading: false,
            }));
            
            return reports;
        } catch (error) {
            handleError(error, 'fetch reports by patient');
            updateState({ loading: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const updateReport = useCallback(async (reportId: string, data: UpdateReportRequest): Promise<Report | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const response = await axios.put(`${Api.Report.UPDATE_REPORT}/${reportId}`, data);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to update report');
            }
            
            const updatedReport = response.data.dataResponse;
            
            setState(prev => ({
                ...prev,
                reports: prev.reports.map(report => report.id === reportId ? updatedReport : report),
                currentReport: prev.currentReport?.id === reportId ? updatedReport : prev.currentReport,
                isUpdating: false,
            }));
            
            return updatedReport;
        } catch (error) {
            handleError(error, 'update report');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const sendReport = useCallback(async (reportId: string): Promise<Report | null> => {
        try {
            updateState({ isSending: true, error: null });
            
            const response = await axios.post(`${Api.Report.SEND_REPORT}/${reportId}/send`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to send report');
            }
            
            const sentReport = response.data.dataResponse;
            
            setState(prev => ({
                ...prev,
                reports: prev.reports.map(report => report.id === reportId ? sentReport : report),
                currentReport: prev.currentReport?.id === reportId ? sentReport : prev.currentReport,
                isSending: false,
            }));
            
            return sentReport;
        } catch (error) {
            handleError(error, 'send report');
            updateState({ isSending: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    const deleteReport = useCallback(async (reportId: string): Promise<boolean> => {
        try {
            updateState({ isDeleting: true, error: null });
            
            const response = await axios.delete(`${Api.Report.DELETE_REPORT}/${reportId}`);
            
            if (!response.data || !response.data.success) {
                throw new Error(response.data?.message || 'Failed to delete report');
            }
            
            setState(prev => ({
                ...prev,
                reports: prev.reports.filter(report => report.id !== reportId),
                currentReport: prev.currentReport?.id === reportId ? null : prev.currentReport,
                isDeleting: false,
            }));
            
            return true;
        } catch (error) {
            handleError(error, 'delete report');
            updateState({ isDeleting: false });
            return false;
        }
    }, [axios, updateState, handleError]);

    const setCurrentReport = useCallback((report: Report | null) => {
        updateState({ currentReport: report });
    }, [updateState]);

    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    const refreshReport = useCallback(async (reportId: string) => {
        await getReport(reportId);
    }, [getReport]);

    const refreshReports = useCallback(async () => {
        // This would need a list all endpoint or use getReportsByChatSession/Patient
        // For now, we'll just clear and let components call specific methods
        updateState({ reports: [] });
    }, [updateState]);

    const returnValue = useMemo(() => ({
        reports: state.reports,
        currentReport: state.currentReport,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isUpdating: state.isUpdating,
        isFetching: state.isFetching,
        isDeleting: state.isDeleting,
        isSending: state.isSending,
        createReport,
        getReport,
        getReportsByChatSession,
        getReportsByPatient,
        updateReport,
        sendReport,
        deleteReport,
        setCurrentReport,
        clearError,
        refreshReport,
        refreshReports,
    }), [
        state,
        createReport,
        getReport,
        getReportsByChatSession,
        getReportsByPatient,
        updateReport,
        sendReport,
        deleteReport,
        setCurrentReport,
        clearError,
        refreshReport,
        refreshReports,
    ]);

    return returnValue;
};

export default useReportManagement;
