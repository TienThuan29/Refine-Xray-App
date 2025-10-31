using AdminService.Libs;
using Microsoft.AspNetCore.Mvc;
using AdminService.Services;
using AdminService.Web.Requests;
using AdminService.Web.Responses;
using System.Security.Claims;

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

        private string? GetAccessToken()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                return null;
            }
            return authHeader.Substring("Bearer ".Length).Trim();
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

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<UserProfileResponse>>>> GetAllUsers()
        {
            try
            {
                var accessToken = GetAccessToken();
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<List<UserProfileResponse>>("Authorization token required", 401);
                }

                var users = await _userService.GetAllUsersAsync(accessToken);
                return ResponseUtil.Success(users, "Users retrieved successfully", 200);
            }
            catch (HttpRequestException ex) when (ex.Data.Contains("StatusCode"))
            {
                var statusCode = (System.Net.HttpStatusCode?)ex.Data["StatusCode"];
                var status = statusCode == System.Net.HttpStatusCode.Unauthorized ? 401 :
                             statusCode == System.Net.HttpStatusCode.Forbidden ? 403 : 500;
                return ResponseUtil.Error<List<UserProfileResponse>>(ex.Message, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return ResponseUtil.Error<List<UserProfileResponse>>("Error getting users", 500, ex.Message);
            }
        }

        [HttpPost("by-email")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> GetUserByEmail([FromBody] GetUserByEmailRequest request)
        {
            try
            {
                var accessToken = GetAccessToken();
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Authorization token required", 401);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var user = await _userService.GetUserByEmailAsync(request.Email, accessToken);
                if (user == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found", 404);
                }

                return ResponseUtil.Success(user, "User retrieved successfully", 200);
            }
            catch (HttpRequestException ex) when (ex.Data.Contains("StatusCode"))
            {
                var statusCode = (System.Net.HttpStatusCode?)ex.Data["StatusCode"];
                var status = statusCode == System.Net.HttpStatusCode.Unauthorized ? 401 :
                             statusCode == System.Net.HttpStatusCode.Forbidden ? 403 :
                             statusCode == System.Net.HttpStatusCode.NotFound ? 404 : 500;
                return ResponseUtil.Error<UserProfileResponse>(ex.Message, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user by email");
                return ResponseUtil.Error<UserProfileResponse>("Error getting user", 500, ex.Message);
            }
        }

        [HttpPut]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUser([FromBody] UpdateUserRequestWithEmail request)
        {
            try
            {
                var accessToken = GetAccessToken();
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Authorization token required", 401);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var updateRequest = new UpdateUserRequest
                {
                    Fullname = request.Fullname,
                    Phone = request.Phone,
                    DateOfBirth = request.DateOfBirth,
                    Password = request.Password
                };

                var updatedUser = await _userService.UpdateUserAsync(request.Email, updateRequest, accessToken);
                if (updatedUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found or update failed", 404);
                }

                return ResponseUtil.Success(updatedUser, "User updated successfully", 200);
            }
            catch (HttpRequestException ex) when (ex.Data.Contains("StatusCode"))
            {
                var statusCode = (System.Net.HttpStatusCode?)ex.Data["StatusCode"];
                var status = statusCode == System.Net.HttpStatusCode.Unauthorized ? 401 :
                             statusCode == System.Net.HttpStatusCode.Forbidden ? 403 :
                             statusCode == System.Net.HttpStatusCode.NotFound ? 404 : 500;
                return ResponseUtil.Error<UserProfileResponse>(ex.Message, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user");
                return ResponseUtil.Error<UserProfileResponse>("Error updating user", 500, ex.Message);
            }
        }

        [HttpDelete]
        public async Task<ActionResult<ApiResponse<object>>> DeleteUser([FromBody] DeleteUserRequest request)
        {
            try
            {
                var accessToken = GetAccessToken();
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<object>("Authorization token required", 401);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<object>("Email is required", 400);
                }

                var deleted = await _userService.DeleteUserAsync(request.Email, accessToken);
                if (!deleted)
                {
                    return ResponseUtil.Error<object>("User not found or deletion failed", 404);
                }

                return ResponseUtil.Success((object)new { deleted = true }, "User deleted successfully", 200);
            }
            catch (HttpRequestException ex) when (ex.Data.Contains("StatusCode"))
            {
                var statusCode = (System.Net.HttpStatusCode?)ex.Data["StatusCode"];
                var status = statusCode == System.Net.HttpStatusCode.Unauthorized ? 401 :
                             statusCode == System.Net.HttpStatusCode.Forbidden ? 403 :
                             statusCode == System.Net.HttpStatusCode.NotFound ? 404 : 500;
                return ResponseUtil.Error<object>(ex.Message, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user");
                return ResponseUtil.Error<object>("Error deleting user", 500, ex.Message);
            }
        }

        [HttpPatch("status")]
        public async Task<ActionResult<ApiResponse<UserProfileResponse>>> UpdateUserStatus([FromBody] UpdateUserStatusRequest request)
        {
            try
            {
                var accessToken = GetAccessToken();
                if (string.IsNullOrEmpty(accessToken))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Authorization token required", 401);
                }

                if (string.IsNullOrEmpty(request.Email))
                {
                    return ResponseUtil.Error<UserProfileResponse>("Email is required", 400);
                }

                var updatedUser = await _userService.UpdateUserStatusAsync(request.Email, request.IsEnable, accessToken);
                if (updatedUser == null)
                {
                    return ResponseUtil.Error<UserProfileResponse>("User not found or update failed", 404);
                }

                return ResponseUtil.Success(updatedUser, "User status updated successfully", 200);
            }
            catch (HttpRequestException ex) when (ex.Data.Contains("StatusCode"))
            {
                var statusCode = (System.Net.HttpStatusCode?)ex.Data["StatusCode"];
                var status = statusCode == System.Net.HttpStatusCode.Unauthorized ? 401 :
                             statusCode == System.Net.HttpStatusCode.Forbidden ? 403 :
                             statusCode == System.Net.HttpStatusCode.NotFound ? 404 : 500;
                return ResponseUtil.Error<UserProfileResponse>(ex.Message, status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status");
                return ResponseUtil.Error<UserProfileResponse>("Error updating user status", 500, ex.Message);
            }
        }
    }

    public class UpdateUserRequestWithEmail : UpdateUserRequest
    {
        public string Email { get; set; } = string.Empty;
    }
}