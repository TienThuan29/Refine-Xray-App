namespace IdentityService.Web.Middlewares 
{
    public static class MiddlewareExtensions
    {
        public static IApplicationBuilder UseJwtValidationMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<JwtValidationMiddleware>();
        }

        public static IApplicationBuilder UseAuthorizeMiddleware(this IApplicationBuilder builder, params string[] allowedRoles)
        {
            return builder.UseMiddleware<AuthorizeMiddleware>(allowedRoles);
        }

        public static IApplicationBuilder UseSystemSecretMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<SystemSecretMiddleware>();
        }
    }
}

