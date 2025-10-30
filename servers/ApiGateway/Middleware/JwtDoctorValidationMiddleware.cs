using Microsoft.Extensions.Primitives;
using System.Text.Json;
using ApiGateway.Libs;

namespace ApiGateway.Middleware
{
    public class JwtDoctorValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtDoctorValidationMiddleware> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _identityServiceUrl;

        public JwtDoctorValidationMiddleware(RequestDelegate next, ILogger<JwtDoctorValidationMiddleware> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            // Must match IdentityService profile endpoint
            _identityServiceUrl = configuration["IdentityService:Url"]?.TrimEnd('/') + "/api/v1/profile";
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // List of public API endpoints for doctor service
            var publicPaths = new[]
            {   
                "/api/doctors/v1/health",
                "/api/doctors/health"
            };
            if (publicPaths.Any(p => context.Request.Path.Equals(p, StringComparison.OrdinalIgnoreCase)))
            {
                await _next(context);
                return;
            }

            if (context.Request.Path.StartsWithSegments("/api/doctors"))
            {
                if (!context.Request.Headers.TryGetValue("Authorization", out StringValues authHeader) || string.IsNullOrEmpty(authHeader) || !authHeader[0].StartsWith("Bearer "))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                        "Missing or invalid Authorization header", 401)));
                    return;
                }
                var token = authHeader[0][7..];
                Console.WriteLine($"Token: {token}");

                try
                {
                    var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
                    Console.WriteLine($"IdentityServiceUrl: {_identityServiceUrl}");
                    var resp = await client.GetAsync(_identityServiceUrl);
                    if (!resp.IsSuccessStatusCode)
                    {
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                            "Invalid token or cannot fetch user profile", 401)));
                        return;
                    }
                    var body = await resp.Content.ReadAsStringAsync();
                    var profile = JsonDocument.Parse(body).RootElement;
                    var dataResponse = profile.TryGetProperty("dataResponse", out var d) ? d : default;
                    var role = dataResponse.ValueKind == JsonValueKind.Object && dataResponse.TryGetProperty("role", out var r) ? r.GetString() : null;
                    var userId = dataResponse.ValueKind == JsonValueKind.Object && dataResponse.TryGetProperty("id", out var id) ? id.GetString() : null;

                    Console.WriteLine($"Role: {role}");
                    Console.WriteLine($"UserId: {userId}");
                    Console.WriteLine($"Profile: {profile}");

                    if (string.IsNullOrEmpty(role) || !role.Equals("DOCTOR", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                            "Doctor role required", 403)));
                        return;
                    }
                    // if (!string.IsNullOrEmpty(userId))
                    // {
                    //     context.Items["CreatedBy"] = userId;
                    //     Console.WriteLine($"Request body: {context.Request.Body}");
                    // }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "JWT validation or user fetch failed");
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                        "Authentication error", 401, ex.Message, ex.StackTrace)));
                    return;
                }
            }
            await _next(context);
        }
    }
}
