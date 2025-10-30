'use client';

import { useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Api } from '@/configs/api';

// Types for X-ray detection operations
export interface XrayDetectionResponse {
    is_xray: boolean;
    xray_probability: number;
    confidence_level: 'low' | 'medium' | 'high';
    model_available: boolean;
}

export interface XrayDetectionState {
    isDetecting: boolean;
    error: string | null;
    result: XrayDetectionResponse | null;
}

export interface XrayDetectionActions {
    detectXray: (imageFile: File) => Promise<XrayDetectionResponse | null>;
    clearError: () => void;
    clearResult: () => void;
}

export type UseXrayDetectionReturn = XrayDetectionState & XrayDetectionActions;

const useXrayDetection = (): UseXrayDetectionReturn => {
    // State
    const [state, setState] = useState<XrayDetectionState>({
        isDetecting: false,
        error: null,
        result: null,
    });

    // Helper function to update state
    const updateState = useCallback((updates: Partial<XrayDetectionState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    // Helper function to handle errors
    const handleError = useCallback((error: any, operation: string) => {
        console.error(`Error in ${operation}:`, error);
        const errorMessage = error.response?.data?.message || error.message || `Failed to ${operation}`;
        updateState({ error: errorMessage });
    }, [updateState]);

    // Detect X-ray image
    const detectXray = useCallback(async (imageFile: File): Promise<XrayDetectionResponse | null> => {
        try {
            updateState({ isDetecting: true, error: null, result: null });
            
            // Create FormData and append the image
            const formData = new FormData();
            formData.append('image', imageFile);
            
            // Make the API call using plain axios (no auth needed for X-ray detection)
            const response = await axios.post(
                Api.XrayDetection.DETECT_XRAY,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            
            const detectionResult: XrayDetectionResponse = response.data;
            
            updateState({
                result: detectionResult,
                isDetecting: false,
            });
            
            return detectionResult;
        } catch (error) {
            handleError(error, 'detect X-ray image');
            updateState({ isDetecting: false });
            return null;
        }
    }, [updateState, handleError]);

    // Clear error
    const clearError = useCallback(() => {
        updateState({ error: null });
    }, [updateState]);

    // Clear result
    const clearResult = useCallback(() => {
        updateState({ result: null });
    }, [updateState]);

    // Memoized return value to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // State
        isDetecting: state.isDetecting,
        error: state.error,
        result: state.result,
        
        // Actions
        detectXray,
        clearError,
        clearResult,
    }), [
        state,
        detectXray,
        clearError,
        clearResult,
    ]);

    return returnValue;
};

export default useXrayDetection;

