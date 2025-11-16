using System.Net.Http.Json;
using System.Text.Json;
using PatientService.Libs;
using Microsoft.Extensions.Logging;

namespace PatientService.Services.Identity
{
    public class IdentityService : IIdentityService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<IdentityService> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public IdentityService(HttpClient httpClient, ILogger<IdentityService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        public async Task<string?> GetUserFullnameByEmailAsync(string email)
        {
            try
            {
                if (string.IsNullOrEmpty(email))
                {
                    return null;
                }

                _logger.LogInformation("Fetching user fullname for email: {Email}", email);

                var request = new { Email = email };
                var response = await _httpClient.PostAsJsonAsync("api/v1/internal/users/by-email", request, _jsonOptions);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch user for email {Email}: {StatusCode}", email, response.StatusCode);
                    return null;
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(_jsonOptions);
                
                if (apiResponse?.Success == true && apiResponse.DataResponse != null)
                {
                    return apiResponse.DataResponse.Fullname;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user fullname for email: {Email}", email);
                return null;
            }
        }

        public async Task<string?> GetUserFullnameByIdAsync(string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return null;
                }

                _logger.LogInformation("Fetching user fullname for ID: {UserId}", userId);

                var request = new { Id = userId };
                // Use internal endpoint that accepts system secret
                var response = await _httpClient.PostAsJsonAsync("api/v1/internal/users/by-id", request, _jsonOptions);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to fetch user for ID {UserId}: {StatusCode}", userId, response.StatusCode);
                    return null;
                }

                var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponse<UserProfileResponse>>(_jsonOptions);
                
                if (apiResponse?.Success == true && apiResponse.DataResponse != null)
                {
                    return apiResponse.DataResponse.Fullname;
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user fullname for ID: {UserId}", userId);
                return null;
            }
        }

        public async Task<string?> GetUserFullnameAsync(string createBy)
        {
            // Check if createBy is an email (contains @) or a GUID/ID
            if (string.IsNullOrEmpty(createBy))
            {
                return null;
            }

            // Check if it's an email address
            if (createBy.Contains("@"))
            {
                return await GetUserFullnameByEmailAsync(createBy);
            }
            else
            {
                // Assume it's a user ID/GUID
                return await GetUserFullnameByIdAsync(createBy);
            }
        }

        private class UserProfileResponse
        {
            public string Id { get; set; } = string.Empty;
            public string Email { get; set; } = string.Empty;
            public string Fullname { get; set; } = string.Empty;
            public string? Phone { get; set; }
            public DateTime? DateOfBirth { get; set; }
            public string Role { get; set; } = string.Empty;
            public bool IsEnable { get; set; }
            public DateTime? LastLoginDate { get; set; }
            public DateTime? CreatedDate { get; set; }
            public DateTime? UpdatedDate { get; set; }
        }
    }
}

