using System.ComponentModel.DataAnnotations;

namespace IdentityService.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
        
        [Required]
        public string Fullname { get; set; } = string.Empty;
        
        public string? Phone { get; set; }
        
        public DateTime? DateOfBirth { get; set; }
        
        [Required]
        public Role Role { get; set; }
        
        [Required]
        public bool IsEnable { get; set; }
        
        public DateTime? LastLoginDate { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }

    public enum Role
    {
        PATIENT,
        DOCTOR,
        ADMIN
    }
}

