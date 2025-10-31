using System.Net.Http.Json;
using System.Text.Json;
using AdminService.Web.Requests;
using AdminService.Web.Responses;
using AdminService.Libs;

namespace AdminService.Services
{
    public class UserService : IUserService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<UserService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public UserService(HttpClient httpClient, ILogger<UserService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
            };
        }

        public async Task<AuthResponse?> CreateAccountAsync(RegisterData registerData)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to create account for email: {Email}", registerData.Email);

                var response = await _httpClient.PostAsJsonAsync("api/v1/users/create-account", registerData, _jsonOptions);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponse>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to create account: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to create account");
                }

                _logger.LogInformation("Account created successfully for email: {Email}", registerData.Email);
                return apiResponse.DataResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating account in IdentityService");
                throw;
            }
        }

        public async Task<List<UserProfileResponse>> GetAllUsersAsync(string accessToken)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to get all users");

                var request = new HttpRequestMessage(HttpMethod.Get, "api/v1/users");
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<List<UserProfileResponse>>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to get users: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to get users");
                }

                _logger.LogInformation("Successfully retrieved {Count} users", apiResponse.DataResponse?.Count ?? 0);
                return apiResponse.DataResponse ?? new List<UserProfileResponse>();
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users from IdentityService");
                throw;
            }
        }

        public async Task<UserProfileResponse?> GetUserByEmailAsync(string email, string accessToken)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to get user by email: {Email}", email);

                var requestData = new { Email = email };
                var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/users/by-email")
                {
                    Content = JsonContent.Create(requestData, options: _jsonOptions)
                };
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to get user: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to get user");
                }

                _logger.LogInformation("Successfully retrieved user: {Email}", email);
                return apiResponse.DataResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user from IdentityService");
                throw;
            }
        }

        public async Task<UserProfileResponse?> UpdateUserAsync(string email, UpdateUserRequest request, string accessToken)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to update user: {Email}", email);

                var requestData = new
                {
                    Email = email,
                    Fullname = request.Fullname,
                    Phone = request.Phone,
                    DateOfBirth = request.DateOfBirth,
                    Password = request.Password
                };

                var httpRequest = new HttpRequestMessage(HttpMethod.Put, "api/v1/users")
                {
                    Content = JsonContent.Create(requestData, options: _jsonOptions)
                };
                httpRequest.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to update user: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to update user");
                }

                _logger.LogInformation("Successfully updated user: {Email}", email);
                return apiResponse.DataResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user in IdentityService");
                throw;
            }
        }

        public async Task<bool> DeleteUserAsync(string email, string accessToken)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to delete user: {Email}", email);

                var requestData = new { Email = email };
                var request = new HttpRequestMessage(HttpMethod.Delete, "api/v1/users")
                {
                    Content = JsonContent.Create(requestData, options: _jsonOptions)
                };
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<object>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to delete user: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to delete user");
                }

                _logger.LogInformation("Successfully deleted user: {Email}", email);
                return true;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user from IdentityService");
                throw;
            }
        }

        public async Task<UserProfileResponse?> UpdateUserStatusAsync(string email, bool isEnable, string accessToken)
        {
            try
            {
                _logger.LogInformation("Calling IdentityService to update user status: {Email}, IsEnable: {IsEnable}", email, isEnable);

                var requestData = new
                {
                    Email = email,
                    IsEnable = isEnable
                };

                var request = new HttpRequestMessage(HttpMethod.Put, "api/v1/users/status")
                {
                    Content = JsonContent.Create(requestData, options: _jsonOptions)
                };
                request.Headers.Add("Authorization", $"Bearer {accessToken}");

                var response = await _httpClient.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("IdentityService returned error: {StatusCode} - {Error}", 
                        response.StatusCode, errorContent);
                    
                    throw new HttpRequestException(
                        $"IdentityService returned error: {response.StatusCode} - {errorContent}",
                        null,
                        response.StatusCode
                    );
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(_jsonOptions);
                
                if (apiResponse == null || !apiResponse.Success)
                {
                    _logger.LogError("Failed to update user status: {Message}", apiResponse?.Message ?? "Unknown error");
                    throw new InvalidOperationException(apiResponse?.Message ?? "Failed to update user status");
                }

                _logger.LogInformation("Successfully updated user status: {Email}, IsEnable: {IsEnable}", email, isEnable);
                return apiResponse.DataResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling IdentityService");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status in IdentityService");
                throw;
            }
        }
    }
}

