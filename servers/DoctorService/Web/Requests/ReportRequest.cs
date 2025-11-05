using System.ComponentModel.DataAnnotations;

namespace DoctorService.Web.Requests
{
    public class CreateReportRequest
    {
        public string? Title { get; set; }

        public string? TemplateId { get; set; }

        [Required]
        public string Content { get; set; } = string.Empty; // markdown content

        public string? ChatSessionId { get; set; }

        public string? PatientEmail { get; set; } // is user's email
    }

    public class UpdateReportRequest
    {
        public string? Title { get; set; }

        public string? TemplateId { get; set; }

        public string? Content { get; set; } // markdown content

        public string? PatientEmail { get; set; } // is user's email

        public bool? IsSent { get; set; } // Allow updating sent status

        public string? SentDate { get; set; } // Allow updating sent date
    }
}
