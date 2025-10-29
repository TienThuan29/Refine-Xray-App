using System.ComponentModel.DataAnnotations;
using DoctorService.Models;

namespace DoctorService.Web.Requests
{
    public class PatientProfileRequest
    {
        [Required]
        public string Fullname { get; set; } = string.Empty;
        
        [Required]
        public Gender Gender { get; set; }
        
        public string? Phone { get; set; }
        
        public string? HouseNumber { get; set; }
        
        public Commune? Commune { get; set; }
        
        public Province? Province { get; set; }
        
        public string? Nation { get; set; }
    }
}

