using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace DoctorService.Web.Requests
{
    public class ChatSessionRequest
    {
        [Required]
        [FromForm(Name = "folderId")]
        [JsonPropertyName("folderId")]
        public string FolderId { get; set; } = string.Empty;
        
        [Required]
        [FromForm(Name = "title")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [Required]
        [FromForm(Name = "xrayImage")]
        [JsonPropertyName("xrayImage")]
        public IFormFile Image { get; set; } = null!;
        
        [FromForm(Name = "patientProfileId")]
        [JsonPropertyName("patientProfileId")]
        public string? PatientProfileId { get; set; }
    }

    public class ChatbotRequest
    {
        [JsonPropertyName("chatSessionId")]
        public string ChatSessionId { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("message")]
        public string Message { get; set; } = string.Empty;
        
        [JsonPropertyName("action")]
        public string? Action { get; set; } // 'start_chat' | 'continue_chat' | 'analyze' | 'question'
        
        [JsonPropertyName("context")]
        public ChatbotContext? Context { get; set; }
    }

    public class ChatbotContext
    {
        [JsonPropertyName("specialty")]
        public string? Specialty { get; set; }
        
        [JsonPropertyName("urgency")]
        public string? Urgency { get; set; } // 'low' | 'medium' | 'high'
        
        [JsonPropertyName("includeReferences")]
        public bool? IncludeReferences { get; set; }
        
        [JsonPropertyName("age")]
        public int? Age { get; set; }
        
        [JsonPropertyName("gender")]
        public string? Gender { get; set; }
    }

    public class CreateTextChatSessionRequest
    {
        [Required]
        [JsonPropertyName("folderId")]
        public string FolderId { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
    }

    public class PubMedRAGRequest
    {
        [Required]
        public string Question { get; set; } = string.Empty;
        
        // Number of relevant articles (1-10, default: 3)
        public int? NResults { get; set; } = 3; 
        
        public bool? AutoFetch { get; set; } = true;
        
        public int? AutoFetchCount { get; set; } = 30;
    }
}

