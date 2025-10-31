using System.ComponentModel.DataAnnotations;

namespace AdminService.Models
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
}

