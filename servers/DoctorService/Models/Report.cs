using System.ComponentModel.DataAnnotations;

namespace DoctorService.Models
{
    public class ReportTemplate
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Template { get; set; } = string.Empty; // markdown content
        
        [Required]
        public string FileLink { get; set; } = string.Empty;
        
        [Required]
        public string CreateBy { get; set; } = string.Empty;
        
        [Required]
        public bool IsDeleted { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }

    public class Report
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        public bool? IsAccepted { get; set; }
        
        public string? TemplateId { get; set; }
        
        public string? Template { get; set; } // markdown content
        
        public string? ChatSessionId { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }
    }
}

