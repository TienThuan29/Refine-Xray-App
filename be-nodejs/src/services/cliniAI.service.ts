import { config } from "@/configs/config";
import logger from "@/libs/logger";
import { CliniAIResponse } from "@/types/res/clini.res";
import axios from "axios";
import FormData from "form-data";

type HyperParams = {
    confidence_threshold: number;
    model_path: string;
}

export class CliniAIService {

    private baseUrl: string;
    private analyzeUrl: string = '/radiology/analyze';


    constructor() {
        this.baseUrl = config.CLINI_BASE_URL;
        this.getAnalyzeResult = this.getAnalyzeResult.bind(this);
        this.getHyberParams = this.getHyberParams.bind(this);
    }

    public async getAnalyzeResult(xrayImage: Buffer): Promise<CliniAIResponse | null> {
        try {
            const hyperParams = await this.getHyberParams();
            
            // Create FormData for multipart/form-data request
            const formData = new FormData();
            
            // Append the image file
            formData.append('image', xrayImage, {
                filename: 'xray_image.png',
                contentType: 'image/png'
            });
            
            // Append form fields
            formData.append('confidence_threshold', hyperParams.confidence_threshold.toString());
            if (hyperParams.model_path) {
                formData.append('model_path', hyperParams.model_path);
            }
            
            const response = await axios.post(`${this.baseUrl}${this.analyzeUrl}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                },
            });
            
            const cliniAIResponse = response.data as CliniAIResponse;
            console.log('cliniAIResponse', cliniAIResponse);
            return cliniAIResponse;
        }
        catch(error) {
            logger.error('Error getting result from CliniAI:', error);
            return null;
        }
    }


    private async getHyberParams(): Promise<HyperParams> {
        return {
            confidence_threshold: config.CONFIDENCE_THRESHOLD,
            model_path: config.MODEL_PATH
        } as HyperParams;
    }

}
