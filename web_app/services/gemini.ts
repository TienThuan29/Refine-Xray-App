import { ChatSession } from '@/types/chatsession';
import { ReportTemplate } from '@/hooks/useReportTemplateManagement';
import { config } from '@/configs/config';

const GEMINI_API_KEY = config.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

export interface GenerateReportRequest {
  chatSession: ChatSession;
  template: ReportTemplate;
}

export interface GradcamImage {
  disease: string;
  url: string;
  key: string;
}

export interface GenerateReportResponse {
  reportContent: string;
  gradcamImages: GradcamImage[];
  reportId?: string;
}

/**
 * Generates a markdown report based on chat session analysis results and template
 */
export async function generateReport(
  chatSession: ChatSession,
  template: ReportTemplate
): Promise<GenerateReportResponse> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured');
    }

    if (!chatSession.result) {
      throw new Error('Chat session does not have analysis results');
    }

    // Build the prompt from template and chat session data
    const { prompt, gradcamImages } = buildReportPrompt(chatSession, template);

    // Call Gemini API with text-only prompt (images will be displayed on frontend)
    const response = await fetch(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || 
        `Gemini API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    const reportContent = extractTextFromResponse(data);

    return {
      reportContent,
      gradcamImages,
    };
  } catch (error: any) {
    console.error('Error generating report:', error);
    throw new Error(error.message || 'Failed to generate report');
  }
}

/**
 * Builds the prompt for Gemini API based on template and chat session data
 */
function buildReportPrompt(chatSession: ChatSession, template: ReportTemplate): { prompt: string; gradcamImages: GradcamImage[] } {
  const result = chatSession.result!;
  
  // Extract key information from chat session
  const top5Diseases = result.top5Diseases
    .map((d, index) => `${index + 1}. ${d.disease}: ${(d.confidence * 100).toFixed(2)}% confidence`)
    .join('\n');

  const analysisSummary = result.comprehensiveAnalysis || result.conciseConclusion || 'No detailed analysis available.';
  const conclusion = result.conciseConclusion || 'No conclusion available.';

  // Extract gradcam images with URLs
  const gradcamImages: GradcamImage[] = [];
  let imageReferencesText = '';
  
  if (result.gradcamAnalyses) {
    const gradcamEntries = Object.entries(result.gradcamAnalyses);
    const imageList: string[] = [];
    
    for (const [key, url] of gradcamEntries) {
      if (url && typeof url === 'string' && url.trim() !== '') {
        // Extract disease name from key (e.g., "top1_Hernia" -> "Hernia")
        const diseaseName = key.replace(/^top\d+_/, '');
        gradcamImages.push({ disease: diseaseName, key, url });
        imageList.push(`- ${diseaseName}: ${url}`);
      }
    }

    if (imageList.length > 0) {
      imageReferencesText = `
### GradCAM Analysis Heatmaps:
The following GradCAM (Gradient-weighted Class Activation Mapping) heatmap images are available for visual reference. These images highlight the regions of the X-ray that the AI model identified as most significant for each predicted disease. The heatmaps will be displayed alongside this report.

Available GradCAM Heatmaps:
${imageList.join('\n')}

**Important**: When generating the report, reference these heatmap images when describing:
- Specific anatomical locations of abnormalities
- Areas of concern or pathological findings
- Spatial relationships between different findings
- Confidence regions for each predicted disease

For example, if discussing a Hernia finding, mention that the GradCAM heatmap shows the model's attention on specific regions, and describe what anatomical structures are highlighted.`;
    }
  }

  // Build the enhanced professional prompt
  const prompt = `You are a medical radiologist. Generate ONLY a professional medical radiology report in markdown format. DO NOT include any introductory text, explanations, or meta-commentary. Start directly with the report content.

CRITICAL REQUIREMENTS:
1. Start immediately with the report - NO introductory phrases like "Of course", "I will generate", "Here is", etc.
2. Follow the template structure EXACTLY as provided
3. Output ONLY the report content - nothing before or after
4. Use the template as the primary structure and fill it with the analysis results

## Report Template Structure (MUST FOLLOW THIS EXACTLY):
${template.template}

## Clinical Analysis Results (USE THIS DATA TO FILL THE TEMPLATE):

### Predicted Diseases (Top 5):
${top5Diseases}

### Comprehensive AI Analysis:
${analysisSummary}

### Clinical Conclusion:
${conclusion}
${imageReferencesText}

### Study Information:
- Patient Study ID: ${chatSession.id}
- Study Title: ${chatSession.title}
- X-ray Image: ${chatSession.xrayImageUrl ? 'Available for review' : 'Not available'}

---

## STRICT INSTRUCTIONS:

### **OUTPUT REQUIREMENTS:**
1. **START IMMEDIATELY** with the report content - NO introductory sentences, explanations, or meta-commentary
2. **FOLLOW THE TEMPLATE STRUCTURE EXACTLY** - Use the template provided above as your primary structure
3. **DO NOT** include phrases like:
   - "Of course"
   - "I will generate"
   - "Here is the report"
   - "As a medical expert"
   - "Let me create"
   - Any other introductory or explanatory text
4. **OUTPUT ONLY** the actual report content - nothing else

### **TEMPLATE USAGE:**
- The template structure above is your PRIMARY guide - follow it exactly
- Fill in the template sections with the clinical analysis data provided
- Maintain all sections, headers, and structure from the template
- Add clinical findings from the analysis results into the appropriate template sections

### **FORMATTING GUIDELINES:**
- Use proper markdown heading hierarchy (##, ###, ####)
- Use **bold** for disease names and confidence levels
- Use *italic* for anatomical terms
- Use bullet points (-) for lists
- Use horizontal rules (---) to separate major sections
- Add blank lines between sections for readability

### **CONTENT REQUIREMENTS:**
- Include confidence percentages for all AI predictions: "**Disease Name: XX.X% confidence**"
- Reference GradCAM heatmaps when describing findings: "The GradCAM heatmap indicates..."
- Use professional medical terminology
- Be precise and concise
- Organize by anatomical regions as shown in the template

### **IMPORTANT:**
- Start your response with the first header (##) of the report
- Do NOT include any text before the report starts
- Do NOT include any text after the report ends
- The template structure is mandatory - follow it strictly

Generate the report now, starting immediately with the report content:`;

  return { prompt, gradcamImages };
}

/**
 * Extracts text content from Gemini API response
 */
function extractTextFromResponse(data: any): string {
  try {
    if (data.candidates && data.candidates[0]?.content?.parts) {
      const parts = data.candidates[0].content.parts;
      return parts
        .map((part: any) => part.text || '')
        .join('\n');
    }
    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('Error extracting text from response:', error);
    throw new Error('Failed to parse Gemini API response');
  }
}

