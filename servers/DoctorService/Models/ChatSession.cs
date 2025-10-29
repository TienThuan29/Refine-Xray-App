using System.ComponentModel.DataAnnotations;
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
        public List<DiseasePrediction> PredictedDiseases { get; set; } = new();
        
        public List<DiseasePrediction> Top5Diseases { get; set; } = new();
        
        public GradcamAnalyses GradcamAnalyses { get; set; } = new();
        
        public string AttentionMap { get; set; } = string.Empty; // s3 url
        
        public IndividualAnalyses IndividualAnalyses { get; set; } = new();
        
        public string ConciseConclusion { get; set; } = string.Empty;
        
        public string ComprehensiveAnalysis { get; set; } = string.Empty;
    }

    public class DiseasePrediction
    {
        public string Disease { get; set; } = string.Empty;
        
        public double Confidence { get; set; }
    }

    public class GradcamAnalyses
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

