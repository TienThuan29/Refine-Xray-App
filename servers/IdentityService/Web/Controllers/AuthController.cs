using Microsoft.AspNetCore.Mvc;
using IdentityService.Services.Auth;
using IdentityService.Web.Requests;
using IdentityService.Web.Responses;
using IdentityService.Libs;
using IdentityService.Models;
using Microsoft.AspNetCore.Authorization;

namespace IdentityService.Web.Controllers
{
    [ApiController]
    [Route("api/v1")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> Authenticate([FromBody] LoginCredentials credentials)
        {
            try
            {
                var authResponse = await _authService.AuthenticateAsync(credentials);
                return ResponseUtil.Success(authResponse, "Login successful", 200);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid email or password"))
            {
                return ResponseUtil.Error<AuthResponse>("Invalid email or password", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Authentication error");
                return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
            }
        }

        [HttpPost("refresh")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.RefreshToken))
                {
                    return ResponseUtil.Error<AuthResponse>("Refresh token required", 400);
                }

                var authResponse = await _authService.RefreshTokenAsync(request.RefreshToken);
                return ResponseUtil.Success(authResponse, "Token refreshed successfully", 200);
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("Invalid") || ex.Message.Contains("expired"))
            {
                return ResponseUtil.Error<AuthResponse>("Invalid or expired token", 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token refresh error");
                return ResponseUtil.Error<AuthResponse>("Internal Server Error", 500);
            }
        }

        [HttpGet("profile")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetProfile()
        {
            try
            {
                // Get access token from context, set by JwtValidationMiddleware
                var accessToken = HttpContext.Items["AccessToken"] as string;
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
                }

                var profile = await _authService.GetProfileAsync(accessToken);
                return ResponseUtil.Success(profile, "Profile retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get profile error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }

        [HttpPost("register/patient")]
        public async Task<ActionResult<ApiResponse<AuthResponse>>> CreateAccount([FromBody] RegisterData registerData)
        {
            try
            {
                var authResponse = await _authService.CreateAccountAsync(registerData);
                _logger.LogInformation("Register response: {Response}", System.Text.Json.JsonSerializer.Serialize(authResponse));
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
        

        [HttpGet("users")]
        public async Task<ActionResult<ApiResponse<List<UserProfileResponse>>>> GetAllUsers()
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var user = HttpContext.Items["User"] as User;
                if (user == null)
                {
                    return ResponseUtil.Error<List<UserProfileResponse>>("User not authenticated", 401);
                }

                // Verify user has admin role
                if (user.Role != Role.ADMIN)
                {
                    return ResponseUtil.Error<List<UserProfileResponse>>("Insufficient permissions", 403);
                }

                var users = await _authService.GetAllUsersAsync();
                return ResponseUtil.Success(users, "Users retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get all users error");
                return ResponseUtil.Error<List<UserProfileResponse>>("Internal Server Error", 500);
            }
        }

        [HttpPost("users/by-email")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetUserByEmail([FromBody] GetUserByEmailRequest request)
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var currentUser = HttpContext.Items["User"] as User;
                if (currentUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var user = await _authService.GetUserByEmailAsync(request.Email);
                if (user == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found", 404);
                }

                return ResponseUtil.Success(user, "User retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get user by email error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }

        [HttpPost("internal/users/by-email")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetUserByEmailInternal([FromBody] GetUserByEmailRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var user = await _authService.GetUserByEmailAsync(request.Email);
                if (user == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found", 404);
                }

                return ResponseUtil.Success(user, "User retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get user by email (internal) error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }

        [HttpPost("internal/users/by-id")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetUserByIdInternal([FromBody] GetUserByIdRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Id))
                {
                    return ResponseUtil.Error<UserProfileResponse>("User ID is required", 400);
                }

                var user = await _authService.GetUserByIdAsync(request.Id);
                if (user == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found", 404);
                }

                return ResponseUtil.Success(user, "User retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Get user by ID (internal) error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }

        [HttpPut("users")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUser([FromBody] UpdateUserRequest request)
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var currentUser = HttpContext.Items["User"] as User;
                if (currentUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
                }

                if (currentUser.Role != Role.ADMIN)
                {
                    return ResponseUtil.Error<UserProfileResponse>("Insufficient permissions", 403);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var updateData = new User
                {
                    Email = request.Email,
                    Fullname = request.Fullname ?? string.Empty,
                    Phone = request.Phone,
                    DateOfBirth = request.DateOfBirth,
                    Role = request.Role ?? Role.PATIENT,
                    IsEnable = request.IsEnable ?? true,
                    Password = request.Password ?? string.Empty
                };

                var updatedUser = await _authService.UpdateUserByEmailAsync(request.Email, updateData);
                if (updatedUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found or update failed", 404);
                }

                return ResponseUtil.Success(updatedUser, "User updated successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update user error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }

        [HttpDelete("users")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteUser([FromBody] DeleteUserRequest request)
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var currentUser = HttpContext.Items["User"] as User;
                if (currentUser == null)
                {
                    return ResponseUtil.Error<object>("User not authenticated", 401);
                }

                if (currentUser.Role != Role.ADMIN)
                {
                    return ResponseUtil.Error<object>("Insufficient permissions", 403);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<object>("Email is required", 400);
                }

                if (currentUser.Email == request.Email)
                {
                    return ResponseUtil.Error<object>("Cannot delete your own account", 400);
                }

                var deleted = await _authService.DeleteUserByEmailAsync(request.Email);
                if (!deleted)
                {
                    return ResponseUtil.Error<object>("User not found or deletion failed", 404);
                }

                return ResponseUtil.Success((object)new { deleted = true }, "User deleted successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Delete user error");
                return ResponseUtil.Error<object>("Internal Server Error", 500);
            }
        }

        [HttpPut("users/status")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUserStatus([FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var currentUser = HttpContext.Items["User"] as User;
                if (currentUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not authenticated", 401);
                }

                if (currentUser.Role != Role.ADMIN)
                {
                    return ResponseUtil.Error<UserProfileResponse>("Insufficient permissions", 403);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                if (typeof(bool) != request.IsEnable.GetType())
                {
                    return ResponseUtil.Error<UserProfileResponse>("isEnable must be a boolean value", 400);
                }

                if (currentUser.Email == request.Email)
                {
                    return ResponseUtil.Error<UserProfileResponse>("Cannot change your own status", 400);
                }

                var updatedUser = await _authService.UpdateUserStatusByEmailAsync(request.Email, request.IsEnable);
                if (updatedUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found or update failed", 404);
                }

                return ResponseUtil.Success(updatedUser, "User status updated successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Update user status error");
                return ResponseUtil.Error<UserProfileResponse>("Internal Server Error", 500);
            }
        }
    }

}

