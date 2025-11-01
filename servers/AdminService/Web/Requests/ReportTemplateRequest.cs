using System.Text.Json.Serialization;

namespace AdminService.Web.Requests
{
    public class UpdateReportTemplateRequest
    {
        [JsonPropertyName("template")]
        public string? Template { get; set; }
        
        [JsonPropertyName("fileLink")]
        public string? FileLink { get; set; }
        
        [JsonPropertyName("isDeleted")]
        public bool? IsDeleted { get; set; }
    }
}

