namespace PatientService.Services.Identity
{
    public interface IIdentityService
    {
        Task<string?> GetUserFullnameByEmailAsync(string email);
        Task<string?> GetUserFullnameByIdAsync(string userId);
        Task<string?> GetUserFullnameAsync(string createBy);
    }
}

