using System.ComponentModel.DataAnnotations;

namespace MasterServices.Web.Requests
{
    public class FolderRequest
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
    }
}
