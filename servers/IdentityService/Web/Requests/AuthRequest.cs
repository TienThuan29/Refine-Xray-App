using IdentityService.Models;
using System.Text.Json.Serialization;

namespace IdentityService.Web.Requests
{
    public class LoginCredentials
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterData
    {
        public string Email { get; set; } = string.Empty;
        public string Fullname { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public Role Role { get; set; }
    }
}

