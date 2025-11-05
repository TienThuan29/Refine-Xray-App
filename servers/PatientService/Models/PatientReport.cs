using System.ComponentModel.DataAnnotations;

namespace PatientService.Models
{
    public class PatientReport
    {
        [Key]
        public string Id { get; set; } = string.Empty;

        public string? Title { get; set; }
        
        public string? Content { get; set; } // markdown content

        public string? PatientEmail { get; set; } // is user's email

        public bool IsSent { get; set; } = false; // if IsSent is true => doctor cannot edit the report

        public DateTime? SentDate { get; set; }

        public bool IsRead { get; set; } = false;

        public string? SentById { get; set; }

        public string? SentByFullname { get; set; }
    }
}