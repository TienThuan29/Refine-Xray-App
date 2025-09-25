export type ChatbotRequest = {
    chatSessionId: string;
    message: string;
    action?: 'start_chat' | 'continue_chat' | 'analyze' | 'question';
    context?: {
        // For medical questions
        specialty?: string;
        urgency?: 'low' | 'medium' | 'high';
        includeReferences?: boolean;
        // For X-ray analysis
        age?: number;
        gender?: string;
        symptoms?: string;
        medicalHistory?: string;
    };
}
