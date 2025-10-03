using System.ComponentModel.DataAnnotations;

namespace MasterServices.Models
{
    public class TestItem
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
    }
}
