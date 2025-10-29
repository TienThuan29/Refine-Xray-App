using System.ComponentModel.DataAnnotations;

namespace DoctorService.Models
{
    public class Folder
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? PatientProfileId { get; set; } // patient profile id
        
        public List<string>? ChatSessionIds { get; set; }
        
        [Required]
        public string CreatedBy { get; set; } = string.Empty; // user id
        
        [Required]
        public bool IsDeleted { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }
}

