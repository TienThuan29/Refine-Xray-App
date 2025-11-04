using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PatientService.Web.Requests
{
    public class BlogRequest
    {
        [Required]
        [JsonPropertyName("create_by")]
        public string CreateBy { get; set; } = string.Empty;

        [Required]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("image_urls")]
        public List<string>? ImageUrls { get; set; }

        [JsonPropertyName("subtitle")]
        public string? Subtitle { get; set; }

        [Required]
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }
}

