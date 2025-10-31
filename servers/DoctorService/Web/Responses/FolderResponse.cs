using DoctorService.Models;
using System.Text.Json.Serialization;

namespace DoctorService.Web.Responses
{
    public class FolderResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("patientProfileId")]
        public string? PatientProfileId { get; set; }
        
        [JsonPropertyName("chatSessionIds")]
        public List<string>? ChatSessionIds { get; set; }
        
        [JsonPropertyName("chatSessionsInfo")]
        public List<ChatSessionInfo>? ChatSessionsInfo { get; set; }
        
        [JsonPropertyName("createdBy")]
        public string CreatedBy { get; set; } = string.Empty;
        
        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }
        
        [JsonPropertyName("type")]
        public FolderType Type { get; set; } = FolderType.ANALYZE;
        
        [JsonPropertyName("createdDate")]
        public DateTime? CreatedDate { get; set; }
        
        [JsonPropertyName("updatedDate")]
        public DateTime? UpdatedDate { get; set; }
    }

    public class ChatSessionInfo
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public bool IsDeleted { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime? UpdatedDate { get; set; }
    }
}

