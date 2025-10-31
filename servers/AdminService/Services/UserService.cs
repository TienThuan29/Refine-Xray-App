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
    }
}

