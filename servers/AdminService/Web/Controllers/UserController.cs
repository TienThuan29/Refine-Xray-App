using AdminService.Libs;
using Microsoft.AspNetCore.Mvc;
using AdminService.Services;
using AdminService.Web.Requests;
using AdminService.Web.Responses;

namespace AdminService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost("create-account")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> CreateAccount([FromBody] RegisterData registerData)
        {
            try
            {
                var authResponse = await _userService.CreateAccountAsync(registerData);
                if (authResponse == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("Failed to create account", 500);
                }
                return ResponseUtil.Success(authResponse.UserProfile, "Account created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating account");
                return ResponseUtil.Error<UserProfileResponse>("Error creating account", 500, ex.Message);
            }
        }
    }
}