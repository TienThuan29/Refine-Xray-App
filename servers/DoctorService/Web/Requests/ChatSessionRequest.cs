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
    }

    public class ChatbotRequest
    {
        [Required]
        public string ChatSessionId { get; set; } = string.Empty;
        
        [Required]
        public string Message { get; set; } = string.Empty;
        
        public string? Action { get; set; } // 'start_chat' | 'continue_chat' | 'analyze' | 'question'
        
        public ChatbotContext? Context { get; set; }
    }

    public class ChatbotContext
    {
        // For medical questions
        public string? Specialty { get; set; }
        
        public string? Urgency { get; set; } // 'low' | 'medium' | 'high'
        
        public bool? IncludeReferences { get; set; }
        
        // For X-ray analysis
        public int? Age { get; set; }
        
        public string? Gender { get; set; }
        
        public string? Symptoms { get; set; }
        
        public string? MedicalHistory { get; set; }
    }
}

