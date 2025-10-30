using PatientService.Models;

namespace PatientService.Web.Responses
{
    public class PatientProfileResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Fullname { get; set; } = string.Empty;
        public Gender Gender { get; set; }
        public string? Phone { get; set; }
        public string? HouseNumber { get; set; }
        public Commune? Commune { get; set; }
        public Province? Province { get; set; }
        public string? Nation { get; set; }
    }
}
