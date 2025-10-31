using System.ComponentModel.DataAnnotations;

namespace DoctorService.Web.Requests
{
    public class UpdateFolderRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
