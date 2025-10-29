using IdentityService.Models;

namespace IdentityService.Web.Requests
{
    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }

    public class GetUserByEmailRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string? Fullname { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public Role? Role { get; set; }
        public bool? IsEnable { get; set; }
        public string? Password { get; set; }
    }

    public class DeleteUserRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateUserStatusRequest
    {
        public string Email { get; set; } = string.Empty;
        public bool IsEnable { get; set; }
    }
}