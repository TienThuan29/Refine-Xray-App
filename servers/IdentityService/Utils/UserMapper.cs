using IdentityService.Models;
using IdentityService.Web.Responses;

namespace IdentityService.Utils
{
    public static class UserMapper
    {
        public static UserProfileResponse MapUserToUserProfileResponse(User user, IConfiguration configuration)
        {
            return new UserProfileResponse
            {
                Id = user.Id,
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth,
                Role = user.Role.ToString(),
                IsEnable = user.IsEnable,
                LastLoginDate = user.LastLoginDate,
                CreatedDate = user.CreatedDate,
                UpdatedDate = user.UpdatedDate
            };
        }
    }
}

