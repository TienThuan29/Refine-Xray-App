using Microsoft.AspNetCore.Mvc;
using IdentityService.Services.Auth;
using IdentityService.Web.Requests;
using IdentityService.Web.Responses;
using IdentityService.Libs;

namespace IdentityService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/users")]
    public class UserController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<UserController> _logger;

        public UserController(IAuthService authService, ILogger<UserController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("create-account")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> CreateAccount([FromBody] RegisterData registerData)
        {
            try
            {
                var authResponse = await _authService.CreateAccountAsync(registerData);
                _logger.LogInformation("Account created successfully for email: {Email}", registerData.Email);
                return ResponseUtil.Success(authResponse, "Account created successfully", 201);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Email already exists"))
            {
                return ResponseUtil.Error<AuthResponse>("Email already exists", 400);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("error occurred while creating"))
            {
                return ResponseUtil.Error<AuthResponse>("An error occurred while creating the account", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Account creation error");
                return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
            }
        }
    }
}