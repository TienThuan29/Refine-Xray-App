using DoctorService.Models;
using System.Text.Json.Serialization;

namespace DoctorService.Web.Responses
{
    public class ChatSessionResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
        [JsonPropertyName("sessionId")]
        public string SessionId { get; set; } = string.Empty;
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("result")]
        public Result? Result { get; set; }
        
        [JsonPropertyName("xrayImageUrl")]
        public string? XrayImageUrl { get; set; }
        
        [JsonPropertyName("chatItems")]
        public List<ChatItem>? ChatItems { get; set; }
        
        [JsonPropertyName("reports")]
        public List<Report>? Reports { get; set; }
        
        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }
        
        [JsonPropertyName("createdDate")]
        public DateTime? CreatedDate { get; set; }
        
        [JsonPropertyName("updatedDate")]
        public DateTime? UpdatedDate { get; set; }
    }

    public class ChatbotResponse
    {
        public string ChatSessionId { get; set; } = string.Empty;
        
        public ChatItem UserChatItem { get; set; } = new();
        
        public ChatItem BotChatItem { get; set; } = new();
        
        public N8NOutputData BotResponse { get; set; } = new();
        
        public DateTime Timestamp { get; set; }
    }

    public class N8NOutputData
    {
        public string SummarizeAnswer { get; set; } = string.Empty;
        
        public string FullAnswer { get; set; } = string.Empty;
        
        public string PubmedQueryUrl { get; set; } = string.Empty;
        
        public string PubmedFetchUrl { get; set; } = string.Empty;
    }

    public class CliniAiResponse
    {
        [JsonPropertyName("predicted_diseases")]
        public List<DiseasePrediction> PredictedDiseases { get; set; } = new();
        
        [JsonPropertyName("top_5_diseases")]
        public List<DiseasePrediction> Top5Diseases { get; set; } = new();
        
        [JsonPropertyName("gradcam_analyses")]
        public GradcamAnalyses? GradcamAnalyses { get; set; } // base64 encoded images
        
        [JsonPropertyName("individual_analyses")]
        public IndividualAnalyses IndividualAnalyses { get; set; } = new();
        
        [JsonPropertyName("concise_conclusion")]
        public string ConciseConclusion { get; set; } = string.Empty;
        
        [JsonPropertyName("comprehensive_analysis")]
        public string ComprehensiveAnalysis { get; set; } = string.Empty;
    }
}

