using System.Text.Json.Serialization;

namespace AdminService.Web.Responses
{
    public class ReportTemplateResponse
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
        [JsonPropertyName("template")]
        public string Template { get; set; } = string.Empty;
        
        [JsonPropertyName("fileLink")]
        public string FileLink { get; set; } = string.Empty;
        
        [JsonPropertyName("createBy")]
        public string CreateBy { get; set; } = string.Empty;
        
        [JsonPropertyName("isDeleted")]
        public bool IsDeleted { get; set; }
        
        [JsonPropertyName("createdDate")]
        public DateTime? CreatedDate { get; set; }
        
        [JsonPropertyName("updatedDate")]
        public DateTime? UpdatedDate { get; set; }
    }
}

