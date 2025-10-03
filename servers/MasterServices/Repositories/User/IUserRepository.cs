using MasterServices.Models;

namespace MasterServices.Repositories.User
{
    public interface IUserRepository
    {
        Task<Models.User?> CreateAsync(Models.User user);
        Task<Models.User?> FindByIdAsync(string userId);
        Task<Models.User?> FindByEmailAsync(string email);
        Task<List<Models.User>> FindAllAsync();
        Task<Models.User?> UpdateAsync(string userId, Models.User updateData);
        Task<bool> DeleteAsync(string userId);
        Task<Models.User?> UpdateStatusAsync(string userId, bool isEnable);
    }
}
