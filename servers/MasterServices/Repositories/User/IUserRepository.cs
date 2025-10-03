using MasterServices.Models;

namespace MasterServices.Repositories
{
    public interface IUserRepository
    {
        Task<User?> CreateAsync(User user);
        Task<User?> FindByIdAsync(string userId);
        Task<User?> FindByEmailAsync(string email);
        Task<List<User>> FindAllAsync();
        Task<User?> UpdateAsync(string userId, User updateData);
        Task<bool> DeleteAsync(string userId);
        Task<User?> UpdateStatusAsync(string userId, bool isEnable);
    }
}
