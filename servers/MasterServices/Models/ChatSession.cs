using System.ComponentModel.DataAnnotations;

namespace MasterServices.Models
{
    public class ChatSession
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string SessionId { get; set; } = string.Empty; // n8n session id
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public Result? Result { get; set; }
        
        public string? XrayImageUrl { get; set; }
        
        public List<ChatItem>? ChatItems { get; set; }
        
        public List<Report>? Reports { get; set; }
        
        [Required]
        public bool IsDeleted { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }

    public class Result
    {
        public List<DiseasePrediction>? PredictedDiseases { get; set; }
        
        public List<DiseasePrediction>? Top5Diseases { get; set; }
        
        public GradcamAnalyses? GradcamAnalyses { get; set; } // s3 urls
        
        public string? AttentionMap { get; set; } // s3 url
        
        public IndividualAnalyses? IndividualAnalyses { get; set; }
        
        public string? ConciseConclusion { get; set; }
        
        public string? ComprehensiveAnalysis { get; set; }
    }

    public class DiseasePrediction
    {
        [Required]
        public string Disease { get; set; } = string.Empty;
        
        [Required]
        public double Confidence { get; set; }
    }

    public class GradcamAnalyses
    {
        public string? Top1Pneumonia { get; set; }
        
        public string? Top2Consolidation { get; set; }
        
        public string? Top3Effusion { get; set; }
        
        public string? Top4Atelectasis { get; set; }
        
        public string? Top5Cardiomegaly { get; set; }
    }

    public class IndividualAnalyses
    {
        public string? Top1Pneumonia { get; set; }
        
        public string? Top2Consolidation { get; set; }
        
        public string? Top3Effusion { get; set; }
        
        public string? Top4Atelectasis { get; set; }
        
        public string? Top5Cardiomegaly { get; set; }
    }

    public class ChatItem
    {
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public List<string>? ImageUrls { get; set; }
        
        public bool? IsBot { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public ChatItemMetaData? MetaData { get; set; }
    }

    public class ChatItemMetaData
    {
        public string? PubmedQueryUrl { get; set; }
        
        public List<string>? PubmedFetchUrl { get; set; }
    }
}
