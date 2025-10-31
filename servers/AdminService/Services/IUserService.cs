using AdminService.Web.Requests;
using AdminService.Web.Responses;

namespace AdminService.Services
{
    public interface IUserService
    {
        Task<AuthResponse?> CreateAccountAsync(RegisterData registerData);
        Task<List<UserProfileResponse>> GetAllUsersAsync(string accessToken);
        Task<UserProfileResponse?> GetUserByEmailAsync(string email, string accessToken);
        Task<UserProfileResponse?> UpdateUserAsync(string email, UpdateUserRequest request, string accessToken);
        Task<bool> DeleteUserAsync(string email, string accessToken);
        Task<UserProfileResponse?> UpdateUserStatusAsync(string email, bool isEnable, string accessToken);
    }
}

