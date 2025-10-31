using System.ComponentModel.DataAnnotations;
using PatientService.Models;
using System.Text.Json.Serialization;

namespace PatientService.Web.Requests
{
    public class PatientProfileRequest
    {
        [Required]
        [JsonPropertyName("fullname")]
        public string Fullname { get; set; } = string.Empty;
        [Required]
        [JsonPropertyName("gender")]
        public Gender Gender { get; set; }
        [JsonPropertyName("phone")]
        public string? Phone { get; set; }
        [JsonPropertyName("houseNumber")]
        public string? HouseNumber { get; set; }
        [JsonPropertyName("commune")]
        public Commune? Commune { get; set; }
        [JsonPropertyName("province")]
        public Province? Province { get; set; }
        [JsonPropertyName("nation")]
        public string? Nation { get; set; }
    }
}
