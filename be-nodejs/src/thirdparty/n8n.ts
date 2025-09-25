import axios, { AxiosResponse } from 'axios';
import { config } from '../configs/config';
import { ChatSession, Result } from '../models/chatsession.model';

export interface N8NResponse {
    output: string;
}

export interface N8NOutputData {
    summarize_answer: string;
    full_answer: string;
    pubmed_query_url: string;
    pubmed_fetch_url: string;
}

export interface N8NApiResponse {
    output: N8NOutputData;
}

export interface N8NRequestData {
    sessionId: string;
    action: string;
    chatInput: string;
}

export class N8NApiClient {
    private baseUrl: string;
    private timeout: number;

    constructor() {
        this.baseUrl = config.N8N_CHAT_URL;
        this.timeout = 60000; // 30 seconds timeout
    }

    /**
     * Parse the output string from N8N response to extract JSON data
     * @param outputString - The output string containing JSON data
     * @returns Parsed N8N output data
     */
    private parseOutput(outputString: string): N8NOutputData {
        try {
            console.log('Parsing output string length:', outputString.length);
            console.log('First 500 chars:', outputString.substring(0, 500));
            console.log('Last 500 chars:', outputString.substring(Math.max(0, outputString.length - 500)));
            
            // Helper function to clean and escape JSON string
            const cleanJsonString = (jsonStr: string): string => {
                // Remove only problematic control characters, but preserve JSON structure
                return jsonStr
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove problematic control characters
                    .replace(/\r\n/g, '\n') // Normalize line endings
                    .replace(/\r/g, '\n'); // Normalize line endings
            };

            // Try to parse as direct JSON first
            try {
                const cleanedOutput = cleanJsonString(outputString);
                const directParsed = JSON.parse(cleanedOutput);
                if (directParsed.summarize_answer || directParsed.full_answer) {
                    console.log('Successfully parsed as direct JSON');
                    // Use summarize_answer as fallback if full_answer is empty
                    const fullAnswer = directParsed.full_answer || directParsed.summarize_answer || '';
                    return {
                        summarize_answer: directParsed.summarize_answer || '',
                        full_answer: fullAnswer,
                        pubmed_query_url: directParsed.pubmed_query_url || '',
                        pubmed_fetch_url: directParsed.pubmed_fetch_url || ''
                    };
                }
            } catch (directParseError) {
                console.log('Direct JSON parse failed, trying markdown format');
            }

            // Remove markdown code block formatting
            const jsonMatch = outputString.match(/```json\n([\s\S]*?)\n```/);
            if (!jsonMatch) {
                // Try to find JSON without markdown
                const jsonMatch2 = outputString.match(/\{[\s\S]*\}/);
                if (jsonMatch2) {
                    const jsonString = cleanJsonString(jsonMatch2[0]);
                    const parsedData = JSON.parse(jsonString);
                    console.log('Successfully parsed JSON without markdown');
                    // Use summarize_answer as fallback if full_answer is empty
                    const fullAnswer = parsedData.full_answer || parsedData.summarize_answer || '';
                    return {
                        summarize_answer: parsedData.summarize_answer || '',
                        full_answer: fullAnswer,
                        pubmed_query_url: parsedData.pubmed_query_url || '',
                        pubmed_fetch_url: parsedData.pubmed_fetch_url || ''
                    };
                }
                throw new Error('No JSON found in output string');
            }

            const jsonString = cleanJsonString(jsonMatch[1]);
            const parsedData = JSON.parse(jsonString);
            console.log('Successfully parsed JSON from markdown');
            // Use summarize_answer as fallback if full_answer is empty
            const fullAnswer = parsedData.full_answer || parsedData.summarize_answer || '';

            return {
                summarize_answer: parsedData.summarize_answer || '',
                full_answer: fullAnswer,
                pubmed_query_url: parsedData.pubmed_query_url || '',
                pubmed_fetch_url: parsedData.pubmed_fetch_url || ''
            };
        } catch (error) {
            console.error('Failed to parse N8N output:', error);
            console.error('Output string was:', outputString);
            
            // Try a more aggressive cleaning approach as fallback
            try {
                console.log('Attempting fallback parsing with aggressive cleaning...');
                const aggressiveClean = outputString
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove more control characters
                    .replace(/\n/g, ' ') // Replace newlines with spaces
                    .replace(/\r/g, ' ') // Replace carriage returns with spaces
                    .replace(/\t/g, ' ') // Replace tabs with spaces
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .trim();

                const jsonMatch = aggressiveClean.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsedData = JSON.parse(jsonMatch[0]);
                    console.log('Successfully parsed with aggressive cleaning');
                    // Use summarize_answer as fallback if full_answer is empty
                    const fullAnswer = parsedData.full_answer || parsedData.summarize_answer || '';
                    return {
                        summarize_answer: parsedData.summarize_answer || '',
                        full_answer: fullAnswer,
                        pubmed_query_url: parsedData.pubmed_query_url || '',
                        pubmed_fetch_url: parsedData.pubmed_fetch_url || ''
                    };
                }
            } catch (fallbackError) {
                console.error('Fallback parsing also failed:', fallbackError);
            }

            // Final fallback: Try to extract content using regex patterns
            try {
                console.log('Attempting final fallback with regex extraction...');
                
                // Try to extract full_answer using regex
                const fullAnswerMatch = outputString.match(/"full_answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                const summarizeAnswerMatch = outputString.match(/"summarize_answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                const pubmedQueryMatch = outputString.match(/"pubmed_query_url"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                const pubmedFetchMatch = outputString.match(/"pubmed_fetch_url"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/);
                
                if (fullAnswerMatch || summarizeAnswerMatch) {
                    const fullAnswer = fullAnswerMatch ? fullAnswerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
                    const summarizeAnswer = summarizeAnswerMatch ? summarizeAnswerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n') : '';
                    const pubmedQueryUrl = pubmedQueryMatch ? pubmedQueryMatch[1].replace(/\\"/g, '"') : '';
                    const pubmedFetchUrl = pubmedFetchMatch ? pubmedFetchMatch[1].replace(/\\"/g, '"') : '';
                    
                    const finalAnswer = fullAnswer || summarizeAnswer || 'I apologize, but I encountered an issue processing your request. Please try again.';
                    
                    console.log('Successfully extracted content using regex fallback');
                    return {
                        summarize_answer: summarizeAnswer,
                        full_answer: finalAnswer,
                        pubmed_query_url: pubmedQueryUrl,
                        pubmed_fetch_url: pubmedFetchUrl
                    };
                }
            } catch (regexError) {
                console.error('Regex extraction also failed:', regexError);
            }
            
            throw new Error(`Failed to parse N8N output: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send a chat request to N8N API
     * @param sessionId - The session ID from ChatSession
     * @param action - The action type (e.g., 'chat', 'analyze', 'question')
     * @param chatInput - The user's input message
     * @param additionalParams - Additional parameters to include in the request
     * @returns Promise containing the parsed N8N response
     */
    async sendChatRequest(
        sessionId: string,
        action: string,
        chatInput: string,
        additionalParams?: Record<string, any>
    ): Promise<N8NApiResponse> {
        try {
            if (!this.baseUrl) {
                throw new Error('N8N_CHAT_URL is not configured');
            }

            const requestData: N8NRequestData & Record<string, any> = {
                sessionId,
                action,
                chatInput,
                ...additionalParams
            };

            // Log the request data for debugging
            console.log('N8N Request Data:', JSON.stringify(requestData, null, 2));
            console.log('N8N Base URL:', this.baseUrl);

            const response: AxiosResponse<N8NResponse[]> = await axios.post(
                this.baseUrl,
                requestData,
                {
                    timeout: this.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Log the full response for debugging
            console.log('N8N Response Status:', response.status);
            console.log('N8N Response Headers:', response.headers);
            console.log('N8N Response Data:', JSON.stringify(response.data, null, 2));
            console.log('N8N Response Data Type:', typeof response.data);
            console.log('N8N Response Data Is Array:', Array.isArray(response.data));

            if (!response.data) {
                throw new Error('No response data from N8N API');
            }

            if (!Array.isArray(response.data)) {
                console.log('Response is not an array, attempting to handle as single object');
                // Handle case where N8N returns a single object instead of array
                const singleResponse = response.data as any;
                if (singleResponse.output) {
                    const parsedOutput = this.parseOutput(singleResponse.output);
                    return {
                        output: parsedOutput
                    };
                } else {
                    throw new Error(`Invalid response format from N8N API: Expected array or object with 'output' field, got: ${JSON.stringify(response.data)}`);
                }
            }

            if (response.data.length === 0) {
                throw new Error('Empty response array from N8N API');
            }

            const firstResponse = response.data[0];
            if (!firstResponse.output) {
                throw new Error('No output found in N8N response');
            }

            const parsedOutput = this.parseOutput(firstResponse.output);

            return {
                output: parsedOutput
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNABORTED') {
                    throw new Error('N8N API request timeout');
                }
                if (error.response) {
                    // Log detailed error information
                    console.error('N8N API Error Response:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        data: error.response.data,
                        headers: error.response.headers
                    });
                    throw new Error(`N8N API error: ${error.response.status} - ${error.response.statusText}. Response: ${JSON.stringify(error.response.data)}`);
                }
                if (error.request) {
                    console.error('N8N API Request Error:', error.request);
                    throw new Error('N8N API is not reachable');
                }
            }
            console.error('N8N API General Error:', error);
            throw new Error(`N8N API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Send a medical analysis request to N8N
     * @param chatSession - The chat session containing sessionId and result data
     * @param xrayImageData - Base64 encoded X-ray image data
     * @param patientInfo - Optional patient information
     * @returns Promise containing the medical analysis response
     */
    async analyzeXrayImage(
        chatSession: ChatSession,
        xrayImageData: string,
        patientInfo?: {
            age?: number;
            gender?: string;
            symptoms?: string;
            medicalHistory?: string;
        }
    ): Promise<N8NApiResponse> {
        const baseMessage = `Analyze this X-ray image and provide medical diagnosis with references.`;
        // Inject result data into the chatInput string
        const chatInput = this.injectResultIntoMessage(baseMessage, chatSession);

        const additionalParams = {
            image_data: xrayImageData,
            patient_info: patientInfo,
            analysis_type: 'xray_diagnosis'
        };

        return this.sendChatRequest(
            chatSession.sessionId,
            'analyze',
            chatInput,
            additionalParams
        );
    }

    /**
     * Send a general medical query to N8N
     * @param chatSession - The chat session containing sessionId and result data
     * @param query - The medical question or query
     * @param context - Additional context for the query
     * @returns Promise containing the medical response
     */
    async askMedicalQuestion(
        chatSession: ChatSession,
        query: string,
        context?: {
            specialty?: string;
            urgency?: 'low' | 'medium' | 'high';
            includeReferences?: boolean;
        }
    ): Promise<N8NApiResponse> {
        const baseMessage = `Answer this medical question with evidence-based information: ${query}`;
        // Inject result data into the chatInput string
        const chatInput = this.injectResultIntoMessage(baseMessage, chatSession);

        const additionalParams = {
            context,
            query_type: 'medical_question'
        };

        return this.sendChatRequest(
            chatSession.sessionId,
            'question',
            chatInput,
            additionalParams
        );
    }

    /**
     * Start the first chat with N8N bot, injecting ChatSession.id and Result data
     * @param chatSession - The chat session containing sessionId, id, and result data
     * @param initialMessage - The initial message to start the conversation
     * @returns Promise containing the N8N response
     */
    async startFirstChat(chatSession: ChatSession,initialMessage: string): Promise<N8NApiResponse> {
        // Inject result data into the chatInput string
        const chatInput = this.injectResultIntoMessage(initialMessage, chatSession);

        const additionalParams = {
            chat_session_id: chatSession.id, // Inject ChatSession.id
            is_first_chat: true,
            session_type: 'xray_analysis'
        };

        return this.sendChatRequest(
            chatSession.sessionId,
            'start_chat',
            chatInput,
            additionalParams
        );
    }

    /**
     * Continue an existing chat conversation
     * @param chatSession - The chat session containing sessionId and result data
     * @param message - The user's message
     * @returns Promise containing the N8N response
     */
    async continueChat(
        chatSession: ChatSession,
        message: string
    ): Promise<N8NApiResponse> {
        // Inject result data into the chatInput string
        const chatInput = this.injectResultIntoMessage(message, chatSession);

        // const additionalParams = {
        //     chat_session_id: chatSession.id,
        //     is_first_chat: false,
        //     session_type: 'xray_analysis'
        // };

        return this.sendChatRequest(
            chatSession.sessionId,
            'continue_chat',
            chatInput,
            // additionalParams
        );
    }

    /**
     * Inject result data into the message string
     * @param message - The original message
     * @param chatSession - The chat session containing result data
     * @returns Message with injected result data
     */
    private injectResultIntoMessage(message: string, chatSession: ChatSession): string {
        if (!chatSession.result) {
            return message;
        }

        try {
            // Create a summary of the result data for injection
            const resultSummary = {
                chat_session_id: chatSession.id,
                predicted_diseases: chatSession.result.predicted_diseases || [],
                top_5_diseases: chatSession.result.top_5_diseases || [],
                concise_conclusion: chatSession.result.concise_conclusion || '',
                comprehensive_analysis: chatSession.result.comprehensive_analysis || ''
            };

            // Convert to JSON string and inject into message
            const resultDataString = JSON.stringify(resultSummary, null, 2);
            
            const enhancedMessage = `${message}

X-ray Analysis Results:
${resultDataString}

Please provide medical analysis and recommendations based on the above X-ray analysis results.`;

            console.log('Enhanced message with result data:', enhancedMessage);
            return enhancedMessage;
        } catch (error) {
            console.error('Error injecting result data into message:', error);
            return message; // Return original message if injection fails
        }
    }

    /**
     * Get the current N8N API configuration
     * @returns Configuration object
     */
    getConfig(): { baseUrl: string; timeout: number } {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout
        };
    }

    /**
     * Update the N8N API configuration
     * @param newBaseUrl - New base URL for N8N API
     * @param newTimeout - New timeout value in milliseconds
     */
    updateConfig(newBaseUrl?: string, newTimeout?: number): void {
        if (newBaseUrl) {
            this.baseUrl = newBaseUrl;
        }
        if (newTimeout) {
            this.timeout = newTimeout;
        }
    }
}

// Export a singleton instance
export const n8nApiClient = new N8NApiClient();
