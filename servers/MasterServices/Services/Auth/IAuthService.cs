using MasterServices.Models;
using MasterServices.Web.Requests;
using MasterServices.Web.Responses;

namespace MasterServices.Services.Auth
{
    public interface IAuthService
    {
        Task<UserProfileResponse> GetProfileAsync(string accessToken);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
        Task<AuthResponse> AuthenticateAsync(LoginCredentials credentials);
        Task<AuthResponse> CreateAccountAsync(RegisterData registerData);
        Task<User?> GetUserByTokenAsync(string accessToken);
        Task<List<UserProfileResponse>> GetAllUsersAsync();
        Task<UserProfileResponse?> UpdateUserAsync(string userId, User updateData);
        Task<UserProfileResponse?> GetUserByEmailAsync(string email);
        Task<UserProfileResponse?> UpdateUserByEmailAsync(string email, User updateData);
        Task<bool> DeleteUserByEmailAsync(string email);
        Task<UserProfileResponse?> UpdateUserStatusByEmailAsync(string email, bool isEnable);
    }
}
