using System.Net.Http.Headers;

namespace ApiGateway.Middleware
{
    public class UserInfoForwardingHandler : DelegatingHandler
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public UserInfoForwardingHandler(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext != null)
            {
                var userEmail = httpContext.Items["X-User-Email"] as string;
                var userId = httpContext.Items["X-User-Id"] as string;
                var userRole = httpContext.Items["X-User-Role"] as string;

                if (!string.IsNullOrEmpty(userEmail))
                {
                    request.Headers.Add("X-User-Email", userEmail);
                }
                if (!string.IsNullOrEmpty(userId))
                {
                    request.Headers.Add("X-User-Id", userId);
                }
                if (!string.IsNullOrEmpty(userRole))
                {
                    request.Headers.Add("X-User-Role", userRole);
                }
            }

            return await base.SendAsync(request, cancellationToken);
        }
    }
}

