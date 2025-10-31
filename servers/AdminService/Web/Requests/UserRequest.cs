namespace AdminService.Web.Requests
{
    public class GetUserByEmailRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class UpdateUserRequest
    {
        public string? Fullname { get; set; }
        public string? Phone { get; set; }
        public DateTime? DateOfBirth { get; set; }
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

