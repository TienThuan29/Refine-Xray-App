using System.Text.Json.Serialization;
using AdminService.Models;

namespace AdminService.Web.Requests
{
    public class RegisterData
    {
        public string Email { get; set; } = string.Empty;
        public string Fullname { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Role Role { get; set; }
    }
}