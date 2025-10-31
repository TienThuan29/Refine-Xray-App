using System.ComponentModel.DataAnnotations;
using DoctorService.Models;

namespace DoctorService.Web.Requests
{
    public class FolderRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public string? CreatedBy { get; set; } // user id

        [Required]
        public FolderType Type { get; set; } = FolderType.ANALYZE;
    }
}

