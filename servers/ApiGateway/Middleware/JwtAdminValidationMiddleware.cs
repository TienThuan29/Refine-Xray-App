using Microsoft.Extensions.Primitives;
using System.Text.Json;
using ApiGateway.Libs;

namespace ApiGateway.Middleware
{
    public class JwtAdminValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtAdminValidationMiddleware> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _identityServiceUrl;

        public JwtAdminValidationMiddleware(RequestDelegate next, ILogger<JwtAdminValidationMiddleware> logger, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            // Must match IdentityService profile endpoint
            _identityServiceUrl = configuration["IdentityService:Url"]?.TrimEnd('/') + "/api/v1/profile";
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // List of public API endpoints for admin service
            var publicPaths = new[]
            {
                "/api/admin/v1/health",
                "/api/admin/health"
            };
            if (publicPaths.Any(p => context.Request.Path.Equals(p, StringComparison.OrdinalIgnoreCase)))
            {
                await _next(context);
                return;
            }

            // Only validate routes that start with /api/admin
            if (context.Request.Path.StartsWithSegments("/api/admin"))
            {
                if (!context.Request.Headers.TryGetValue("Authorization", out StringValues authHeader) || 
                    string.IsNullOrEmpty(authHeader) || 
                    !authHeader[0].StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                        "Missing or invalid Authorization header", 401)));
                    return;
                }

                var token = authHeader[0].Substring("Bearer ".Length).Trim();

                try
                {
                    var client = _httpClientFactory.CreateClient();
                    client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
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
                    var role = dataResponse.ValueKind == JsonValueKind.Object && 
                               dataResponse.TryGetProperty("role", out var r) ? r.GetString() : null;
                    var email = dataResponse.ValueKind == JsonValueKind.Object && 
                                dataResponse.TryGetProperty("email", out var e) ? e.GetString() : null;
                    var userId = dataResponse.ValueKind == JsonValueKind.Object && 
                                 dataResponse.TryGetProperty("id", out var id) ? id.GetString() : null;

                    if (string.IsNullOrEmpty(role) || !role.Equals("ADMIN", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/json";
                        await context.Response.WriteAsync(JsonSerializer.Serialize(ResponseUtil.Error<object>(
                            "ADMIN role required", 403)));
                        return;
                    }

                    // Store user info in context items for forwarding to downstream services
                    if (!string.IsNullOrEmpty(email))
                    {
                        context.Items["X-User-Email"] = email;
                    }
                    if (!string.IsNullOrEmpty(userId))
                    {
                        context.Items["X-User-Id"] = userId;
                    }
                    context.Items["X-User-Role"] = role;
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

