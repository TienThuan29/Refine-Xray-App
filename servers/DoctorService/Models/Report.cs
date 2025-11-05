using System.ComponentModel.DataAnnotations;

namespace DoctorService.Models
{
    public class Report
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        public string? Title { get; set; }
        
        public string? TemplateId { get; set; }
        
        public string? Content { get; set; } // markdown content
        
        public string? ChatSessionId { get; set; }

        public string? PatientEmail { get; set; } // is user's email

        public bool IsSent { get; set; } = false; // if IsSent is true => doctor cannot edit the report

        public DateTime? SentDate { get; set; }
        
        public DateTime? CreatedDate { get; set; }
        
        public DateTime? UpdatedDate { get; set; }  
    }
}

