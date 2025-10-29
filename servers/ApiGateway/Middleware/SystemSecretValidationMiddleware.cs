using Microsoft.AspNetCore.Http;

namespace ApiGateway.Middleware
{
    public class SystemSecretValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SystemSecretValidationMiddleware> _logger;
        private readonly IConfiguration _configuration;

        public SystemSecretValidationMiddleware(
            RequestDelegate next, 
            ILogger<SystemSecretValidationMiddleware> logger,
            IConfiguration configuration)
        {
            _next = next;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Check if this is the create-account endpoint
            var path = context.Request.Path.Value?.ToLowerInvariant() ?? string.Empty;
            var isCreateAccountEndpoint = path.Contains("/admin-service/api/v1/users/create-account") &&
                                        context.Request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase);

            if (isCreateAccountEndpoint)
            {
                var expectedSecret = _configuration["SystemSecret:Value"];

                if (string.IsNullOrEmpty(expectedSecret))
                {
                    _logger.LogWarning("SystemSecret not configured in appsettings.json");
                    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                    await context.Response.WriteAsJsonAsync(new { error = "System secret not configured" });
                    return;
                }

                // Check for System Secret in headers (preferred)
                var systemSecret = context.Request.Headers["X-System-Secret"].FirstOrDefault() ??
                                  context.Request.Headers["System-Secret"].FirstOrDefault() ??
                                  context.Request.Query["systemSecret"].FirstOrDefault();

                if (string.IsNullOrEmpty(systemSecret))
                {
                    _logger.LogWarning("System Secret missing for create-account request from {RemoteIp}", 
                        context.Connection.RemoteIpAddress);
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    await context.Response.WriteAsJsonAsync(new { error = "System Secret is required" });
                    return;
                }

                // Validate the secret (use secure comparison to prevent timing attacks)
                if (!SecureCompare(systemSecret, expectedSecret))
                {
                    _logger.LogWarning("Invalid System Secret provided for create-account request from {RemoteIp}", 
                        context.Connection.RemoteIpAddress);
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { error = "Invalid System Secret" });
                    return;
                }

                _logger.LogInformation("System Secret validated successfully for create-account request");
            }

            await _next(context);
        }

        /// <summary>
        /// Securely compare two strings to prevent timing attacks
        /// </summary>
        private static bool SecureCompare(string a, string b)
        {
            if (a == null || b == null || a.Length != b.Length)
                return false;

            int result = 0;
            for (int i = 0; i < a.Length; i++)
            {
                result |= a[i] ^ b[i];
            }
            return result == 0;
        }
    }
}

