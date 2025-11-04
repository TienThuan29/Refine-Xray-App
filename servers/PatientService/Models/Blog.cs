using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PatientService.Models
{
    public class Blog
    {
        [Key]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("create_by")]
        public string CreateBy { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("image_urls")]
        public List<string> ImageUrls { get; set; } = new List<string>();
        
        [JsonPropertyName("subtitle")]
        public string? Subtitle { get; set; }
        
        [Required]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
        
        [JsonPropertyName("is_deleted")]
        public bool IsDeleted { get; set; } = false;
        
        [JsonPropertyName("created_date")]
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
        
        [JsonPropertyName("updated_date")]
        public DateTime UpdatedDate { get; set; } = DateTime.UtcNow;
    }
}

