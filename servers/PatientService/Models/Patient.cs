using System.ComponentModel.DataAnnotations;

namespace PatientService.Models
{
    public class PatientProfile
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Fullname { get; set; } = string.Empty;
        
        [Required]
        public Gender Gender { get; set; }
        
        public string? Phone { get; set; }
        
        public string? HouseNumber { get; set; }
        
        public Commune? Commune { get; set; }
        
        public Province? Province { get; set; }
        
        public string? Nation { get; set; }
    }

    public class Commune
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string EnglishName { get; set; } = string.Empty;
        
        [Required]
        public string AdministrativeLevel { get; set; } = string.Empty;
        
        [Required]
        public string ProvinceCode { get; set; } = string.Empty;
        
        [Required]
        public string ProvinceName { get; set; } = string.Empty;
        
        [Required]
        public string Decree { get; set; } = string.Empty;
    }

    public class Province
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        [Required]
        public string EnglishName { get; set; } = string.Empty;
        
        [Required]
        public string AdministrativeLevel { get; set; } = string.Empty;
        
        [Required]
        public string Decree { get; set; } = string.Empty;
    }

    public enum Gender
    {
        MALE,
        FEMALE,
        OTHER
    }
}

