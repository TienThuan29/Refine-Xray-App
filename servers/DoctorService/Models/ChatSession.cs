using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DoctorService.Models
{
    public class ChatSession
    {
        [Required]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string SessionId { get; set; } = string.Empty; // n8n session id
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? FolderId { get; set; } // folder id that contains this chat session
        
        public Result? Result { get; set; }
        
        public string? XrayImageUrl { get; set; }
        
        public List<ChatItem>? ChatItems { get; set; }
        
        public List<Report>? Reports { get; set; }
        
        public bool IsDeleted { get; set; } = false;
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }

    public class Result
    {
        [JsonPropertyName("predictedDiseases")]
        public List<DiseasePrediction> PredictedDiseases { get; set; } = new();
        
        [JsonPropertyName("top5Diseases")]
        public List<DiseasePrediction> Top5Diseases { get; set; } = new();
        
        [JsonPropertyName("gradcamAnalyses")]
        public GradcamAnalyses GradcamAnalyses { get; set; } = new();
        
        [JsonPropertyName("attentionMap")]
        public string AttentionMap { get; set; } = string.Empty; // s3 url
        
        [JsonPropertyName("individualAnalyses")]
        public IndividualAnalyses IndividualAnalyses { get; set; } = new();
        
        [JsonPropertyName("conciseConclusion")]
        public string ConciseConclusion { get; set; } = string.Empty;
        
        [JsonPropertyName("comprehensiveAnalysis")]
        public string ComprehensiveAnalysis { get; set; } = string.Empty;
    }

    public class DiseasePrediction
    {
        [JsonPropertyName("disease")]
        public string Disease { get; set; } = string.Empty;
        
        [JsonPropertyName("confidence")]
        public double Confidence { get; set; }
    }

    public class GradcamAnalyses
    {
        // Use JsonExtensionData to capture ALL dynamic keys like "top1_Hernia", "top2_Cardiomegaly", etc.
        // Since we have no matching properties, all keys from the API will be captured here
        [JsonExtensionData]
        public Dictionary<string, JsonElement> DynamicKeys { get; set; } = new Dictionary<string, JsonElement>();
        
        // Keep fixed properties for backward compatibility but ignore them during JSON serialization
        // to avoid duplication with DynamicKeys
        [System.Text.Json.Serialization.JsonIgnore]
        public string? Top1Pneumothorax { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public string? Top2Atelectasis { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public string? Top3Edema { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public string? Top4Pneumonia { get; set; }
        
        [System.Text.Json.Serialization.JsonIgnore]
        public string? Top5PleuralThickening { get; set; }
    }

    public class IndividualAnalyses
    {
        [JsonPropertyName("top1_Pneumothorax")]
        public string Top1Pneumothorax { get; set; } = string.Empty;
        
        [JsonPropertyName("top2_Atelectasis")]
        public string Top2Atelectasis { get; set; } = string.Empty;
        
        [JsonPropertyName("top3_Edema")]
        public string Top3Edema { get; set; } = string.Empty;
        
        [JsonPropertyName("top4_Pneumonia")]
        public string Top4Pneumonia { get; set; } = string.Empty;
        
        [JsonPropertyName("top5_Pleural_Thickening")]
        public string Top5PleuralThickening { get; set; } = string.Empty;
        
        // Use JsonExtensionData to capture any additional dynamic keys
        [JsonExtensionData]
        public Dictionary<string, JsonElement>? AdditionalData { get; set; }
    }

    public class ChatItem
    {
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public List<string>? ImageUrls { get; set; }
        
        public bool IsBot { get; set; } = false;
        
        public DateTime? CreatedDate { get; set; }
        
        public ChatItemMetaData? MetaData { get; set; }
    }

    public class ChatItemMetaData
    {
        public string? PubmedQueryUrl { get; set; }
        
        public List<string>? PubmedFetchUrl { get; set; }
    }

}

