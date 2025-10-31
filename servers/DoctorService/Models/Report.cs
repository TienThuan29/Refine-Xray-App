using System.ComponentModel.DataAnnotations;

namespace DoctorService.Models
{
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

