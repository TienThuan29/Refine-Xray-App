using AdminService.Web.Requests;
using AdminService.Web.Responses;

namespace AdminService.Services
{
    public interface IUserService
    {
        Task<AuthResponse?> CreateAccountAsync(RegisterData registerData);
    }
}

