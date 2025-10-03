using MasterServices.Models;
using MasterServices.Web.Responses;
using MasterServices.Utils;

namespace MasterServices.Utils
{
    public static class UserMapper
    {
        public static UserProfileResponse MapUserToUserProfileResponse(User user, IConfiguration configuration)
        {
            return new UserProfileResponse
            {
                Email = user.Email,
                Fullname = user.Fullname,
                Phone = user.Phone,
                DateOfBirth = user.DateOfBirth,
                Role = HashingUtil.HashString(user.Role.ToString(), configuration),
                IsEnable = user.IsEnable,
                LastLoginDate = user.LastLoginDate,
                CreatedDate = user.CreatedDate,
                UpdatedDate = user.UpdatedDate
            };
        }
    }
}
