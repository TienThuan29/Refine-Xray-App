'use client';


import { useState, useCallback, useMemo } from 'react';
import useAxios from './useAxios';
import { Api } from '@/configs/api';
import { PatientProfileRequest, Commune, Province } from '@/types/patient';

// Types for patient profile operations
export interface CreatePatientProfileRequest {
    fullname: string;
    gender: string;
    phone?: string;
    houseNumber?: string;
    commune?: Commune;
    province?: Province;
    nation?: string;
}

export interface UpdatePatientProfileRequest {
    fullname?: string;
    gender?: string;
    phone?: string;
    houseNumber?: string;
    commune?: Commune;
    province?: Province;
    nation?: string;
}

export interface PatientProfile {
    id: string;
    fullname: string;
    gender: string;
    phone?: string;
    houseNumber?: string;
    commune?: Commune;
    province?: Province;
    nation?: string;
}

export interface PatientProfileManagerState {
    patientProfiles: PatientProfile[];
    currentPatientProfile: PatientProfile | null;
    loading: boolean;
    error: string | null;
    isCreating: boolean;
    isUpdating: boolean;
    isFetching: boolean;
    isDeleting: boolean;
}

export interface PatientProfileManagerActions {
    // CRUD Operations
    createPatientProfile: (data: CreatePatientProfileRequest, folderId: string) => Promise<PatientProfile | null>;
    getPatientProfile: (patientId: string) => Promise<PatientProfile | null>;
    updatePatientProfile: (patientId: string, data: UpdatePatientProfileRequest) => Promise<PatientProfile | null>;
    deletePatientProfile: (patientId: string) => Promise<boolean>;
    listPatientProfiles: () => Promise<PatientProfile[] | null>;
    
    // State Management
    setCurrentPatientProfile: (patient: PatientProfile | null) => void;
    clearError: () => void;
    refreshPatientProfile: (patientId: string) => Promise<void>;
    refreshPatientProfiles: () => Promise<void>;
}

export type UsePatientProfileManagerReturn = PatientProfileManagerState & PatientProfileManagerActions;

const usePatientProfileManager = (): UsePatientProfileManagerReturn => {
    const axios = useAxios();
    
    // State
    const [state, setState] = useState<PatientProfileManagerState>({
        patientProfiles: [],
        currentPatientProfile: null,
        loading: false,
        error: null,
        isCreating: false,
        isUpdating: false,
        isFetching: false,
        isDeleting: false,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<PatientProfileManagerState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    // Create patient profile
    const createPatientProfile = useCallback(async (data: CreatePatientProfileRequest, folderId: string): Promise<PatientProfile | null> => {
        try {
            updateState({ isCreating: true, error: null });
            
            const response = await axios.post(`${Api.Patient.CREATE_PATIENT_PROFILE}?folderId=${encodeURIComponent(folderId)}`, data);
            const newPatientProfile = response.data.dataResponse;
            
            // Update patient profiles list
            setState(prev => ({
                ...prev,
                patientProfiles: [...prev.patientProfiles, newPatientProfile],
                isCreating: false,
            }));
            
            return newPatientProfile;
        } catch (error) {
            handleError(error, 'create patient profile');
            updateState({ isCreating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Get patient profile by ID
    const getPatientProfile = useCallback(async (patientId: string): Promise<PatientProfile | null> => {
        try {
            updateState({ isFetching: true, error: null });
            
            console.log(`[API Call] GET Patient Profile by ID: ${Api.Patient.GET_PATIENT_PROFILE}/${patientId}`);
            const response = await axios.get(`${Api.Patient.GET_PATIENT_PROFILE}/${patientId}`);
            
            // Validate response structure
            if (!response.data || !response.data.success) {
                console.error('Invalid API response:', response.data);
                throw new Error(response.data?.message || 'Invalid response from patient profile API');
            }
            
            const patientProfile = response.data.dataResponse;
            
            // Validate patient profile data
            if (!patientProfile || !patientProfile.id) {
                console.error('Invalid patient profile data:', patientProfile);
                throw new Error('Patient profile data is invalid');
            }
            
            console.log('Patient profile received:', patientProfile);
            
            updateState({
                currentPatientProfile: patientProfile,
                isFetching: false,
            });
            
            return patientProfile;
        } catch (error: any) {
            console.error('Error fetching patient profile:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            handleError(error, 'fetch patient profile');
            updateState({ isFetching: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Update patient profile
    const updatePatientProfile = useCallback(async (
        patientId: string, 
        data: UpdatePatientProfileRequest
    ): Promise<PatientProfile | null> => {
        try {
            updateState({ isUpdating: true, error: null });
            
            const response = await axios.put(
                `${Api.Patient.UPDATE_PATIENT_PROFILE}/${patientId}`, 
                data
            );
            const updatedPatientProfile = response.data.data;
            
            // Update current patient profile if it's the one being updated
            setState(prev => ({
                ...prev,
                currentPatientProfile: prev.currentPatientProfile?.id === patientId ? updatedPatientProfile : prev.currentPatientProfile,
                patientProfiles: prev.patientProfiles.map(patient => 
                    patient.id === patientId ? updatedPatientProfile : patient
                ),
                isUpdating: false,
            }));
            
            return updatedPatientProfile;
        } catch (error) {
            handleError(error, 'update patient profile');
            updateState({ isUpdating: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Delete patient profile
    const deletePatientProfile = useCallback(async (patientId: string): Promise<boolean> => {
        try {
            updateState({ isDeleting: true, error: null });
            
            await axios.delete(`${Api.Patient.DELETE_PATIENT_PROFILE}/${patientId}`);
            
            // Remove from patient profiles list
            setState(prev => ({
                ...prev,
                patientProfiles: prev.patientProfiles.filter(patient => patient.id !== patientId),
                currentPatientProfile: prev.currentPatientProfile?.id === patientId ? null : prev.currentPatientProfile,
                isDeleting: false,
            }));
            
            return true;
        } catch (error) {
            handleError(error, 'delete patient profile');
            updateState({ isDeleting: false });
            return false;
        }
    }, [axios, updateState, handleError]);

    // List all patient profiles
    const listPatientProfiles = useCallback(async (): Promise<PatientProfile[] | null> => {
        try {
            updateState({ loading: true, error: null });
            
            const response = await axios.get(Api.Patient.LIST_PATIENT_PROFILES);
            const patientProfiles = response.data.data;
            
            updateState({
                patientProfiles,
                loading: false,
            });
            
            return patientProfiles;
        } catch (error) {
            handleError(error, 'list patient profiles');
            updateState({ loading: false });
            return null;
        }
    }, [axios, updateState, handleError]);

    // Set current patient profile
    const setCurrentPatientProfile = useCallback((patient: PatientProfile | null) => {
        updateState({ currentPatientProfile: patient });
    }, [updateState]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Refresh patient profile data
    const refreshPatientProfile = useCallback(async (patientId: string) => {
        await getPatientProfile(patientId);
    }, [getPatientProfile]);

    // Refresh all patient profiles
    const refreshPatientProfiles = useCallback(async () => {
        await listPatientProfiles();
    }, [listPatientProfiles]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        patientProfiles: state.patientProfiles,
        currentPatientProfile: state.currentPatientProfile,
        loading: state.loading,
        error: state.error,
        isCreating: state.isCreating,
        isUpdating: state.isUpdating,
        isFetching: state.isFetching,
        isDeleting: state.isDeleting,
        
        // Actions
        createPatientProfile,
        getPatientProfile,
        updatePatientProfile,
        deletePatientProfile,
        listPatientProfiles,
        setCurrentPatientProfile,
        clearError,
        refreshPatientProfile,
        refreshPatientProfiles,
    }), [
        state,
        createPatientProfile,
        getPatientProfile,
        updatePatientProfile,
        deletePatientProfile,
        listPatientProfiles,
        setCurrentPatientProfile,
        clearError,
        refreshPatientProfile,
        refreshPatientProfiles,
    ]);

    return returnValue;
};

export default usePatientProfileManager;
