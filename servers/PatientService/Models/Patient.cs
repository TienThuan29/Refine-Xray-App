using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PatientService.Models
{
    public class PatientProfile
    {
        [Key]
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;
        
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

    public class Commune
    {
        [Key]
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("englishName")]
        public string EnglishName { get; set; } = string.Empty;
        
        [JsonPropertyName("administrativeLevel")]
        public string AdministrativeLevel { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("provinceCode")]
        public string ProvinceCode { get; set; } = string.Empty;
        
        [JsonPropertyName("provinceName")]
        public string ProvinceName { get; set; } = string.Empty;

        [JsonPropertyName("decree")]
        public string Decree { get; set; } = string.Empty;
    }

    public class Province
    {
        [Key]
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("englishName")]
        public string EnglishName { get; set; } = string.Empty;
        
        [JsonPropertyName("administrativeLevel")]
        public string AdministrativeLevel { get; set; } = string.Empty;
        
        [JsonPropertyName("decree")]
        public string Decree { get; set; } = string.Empty;
    }

    public enum Gender
    {
        MALE,
        FEMALE,
        OTHER
    }
}

