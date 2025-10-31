using IdentityService.Services.Auth;
using IdentityService.Libs;

namespace IdentityService.Web.Middlewares
{
    public class AuthMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<AuthMiddleware> _logger;

        public AuthMiddleware(RequestDelegate next, ILogger<AuthMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuthService authService)
        {
            try
            {
                var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                Console.WriteLine("AuthHeader: " + authHeader);
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    await WriteErrorResponse(context, "Access token required", 401);
                    return;
                }
                var token = authHeader.Substring(7);
                var decoded = await authService.GetUserByTokenAsync(token);
                if (decoded == null || !decoded.IsEnable)
                {
                    await WriteErrorResponse(context, "User not found or inactive", 401);
                    return;
                }
                // Add user info to context for use in controllers
                context.Items["User"] = decoded;
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Authentication error");
                await WriteErrorResponse(context, "Invalid or expired token", 401);
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, string message, int statusCode)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message
            };
            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    }

    public static class AuthMiddlewareExtensions
    {
        public static IApplicationBuilder UseAuthMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuthMiddleware>();
        }
    }

    public class AuthorizeMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly string[] _allowedRoles;
        private readonly ILogger<AuthorizeMiddleware> _logger;

        public AuthorizeMiddleware(RequestDelegate next, string[] allowedRoles, ILogger<AuthorizeMiddleware> logger)
        {
            _next = next;
            _allowedRoles = allowedRoles;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuthService authService)
        {
            try
            {
                var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    await WriteErrorResponse(context, "Access token required", 401);
                    return;
                }
                var token = authHeader.Substring(7);
                var decoded = await authService.GetUserByTokenAsync(token);
                if (decoded == null || !decoded.IsEnable)
                {
                    await WriteErrorResponse(context, "User not found or inactive", 401);
                    return;
                }
                if (!_allowedRoles.Contains(decoded.Role.ToString()))
                {
                    await WriteErrorResponse(context, "Insufficient permissions", 403);
                    return;
                }
                context.Items["User"] = decoded;
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Authorization error");
                await WriteErrorResponse(context, "Invalid or expired token", 401);
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, string message, int statusCode)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message
            };
            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    }

    public class SystemSecretMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;
        private readonly ILogger<SystemSecretMiddleware> _logger;

        public SystemSecretMiddleware(RequestDelegate next, IConfiguration configuration, ILogger<SystemSecretMiddleware> logger)
        {
            _next = next;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                var systemSecret = context.Request.Headers["x-system-secret"].FirstOrDefault();
                var expectedSecret = _configuration["SystemSecret"];
                if (string.IsNullOrEmpty(systemSecret) || systemSecret != expectedSecret)
                {
                    await WriteErrorResponse(context, "Invalid system secret", 401);
                    return;
                }
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "System secret validation error");
                await WriteErrorResponse(context, "Invalid system secret", 401);
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, string message, int statusCode)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message
            };
            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    }

    public class JwtValidationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtValidationMiddleware> _logger;

        public JwtValidationMiddleware(RequestDelegate next, ILogger<JwtValidationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuthService authService)
        {
            try
            {
                var authHeader = context.Request.Headers.Authorization.FirstOrDefault();
                if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
                {
                    await WriteErrorResponse(context, "Access token required", 401);
                    return;
                }
                var token = authHeader.Substring(7);
                var user = await authService.GetUserByTokenAsync(token);
                if (user == null || !user.IsEnable)
                {
                    await WriteErrorResponse(context, "User not found or inactive", 401);
                    return;
                }
                // Add user info to context for use in controllers
                context.Items["User"] = user;
                context.Items["AccessToken"] = token;
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "JWT validation error");
                await WriteErrorResponse(context, "Invalid or expired token", 401);
            }
        }

        private static async Task WriteErrorResponse(HttpContext context, string message, int statusCode)
        {
            context.Response.StatusCode = statusCode;
            context.Response.ContentType = "application/json";
            var response = new ApiResponse<object>
            {
                Success = false,
                Message = message
            };
            await context.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(response));
        }
    }
}

