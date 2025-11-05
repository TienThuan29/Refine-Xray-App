using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PatientService.Web.Requests
{
    public class PatientReportRequest
    {
        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("content")]
        public string? Content { get; set; }

        [Required]
        [JsonPropertyName("patient_email")]
        public string PatientEmail { get; set; } = string.Empty;

        [JsonPropertyName("is_sent")]
        public bool IsSent { get; set; } = false;

        [JsonPropertyName("sent_date")]
        public DateTime? SentDate { get; set; }

        [JsonPropertyName("sent_by_id")]
        public string? SentById { get; set; }

        [JsonPropertyName("sent_by_fullname")]
        public string? SentByFullname { get; set; }
    }
}

