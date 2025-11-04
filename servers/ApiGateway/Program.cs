using Microsoft.Extensions.Http;
using Microsoft.OpenApi.Models;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Load Ocelot configuration based on environment
var env = builder.Environment.EnvironmentName;
var ocelotConfigFile = $"ocelot{(env == "Production" ? ".Production" : "")}.json";
builder.Configuration.AddJsonFile(
    ocelotConfigFile,
    optional: false, reloadOnChange: false
);

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "API Gateway", Version = "v1" });
});

// CORS
builder.Services.AddCors(o => o.AddDefaultPolicy(
    p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()
));

builder.Services.Configure<HttpClientFactoryOptions>(options =>
{
    options.HttpClientActions.Add(client =>
    {
        client.Timeout = TimeSpan.FromMinutes(15);
    });
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddOcelot()
    .AddDelegatingHandler<ExtendedTimeoutHandler>()
    .AddDelegatingHandler<OverrideOcelotTimeoutHandler>()
    .AddDelegatingHandler<ApiGateway.Middleware.UserInfoForwardingHandler>();

builder.Services.AddSingleton<Ocelot.Requester.TimeoutDelegatingHandler, DisabledTimeoutHandler>();
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseCors();

// Add routing first
app.UseRouting();

// Add middleware to handle health checks before Ocelot
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/health") || 
        context.Request.Path.StartsWithSegments("/api/health") ||
        context.Request.Path.StartsWithSegments("/api/v1/health"))
    {
        context.Response.StatusCode = 200;
        await context.Response.WriteAsync("OK");
        return;
    }
    
    await next();
});

// System secret validation middleware (exclude Swagger paths)
app.UseWhen(
    context => !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.SystemSecretValidationMiddleware>(); }
);

// doctor service validation middleware (exclude Swagger paths)
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/api/doctors") && 
               !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtDoctorValidationMiddleware>(); }
);

// blog validation middleware - only for POST, PUT, DELETE (exclude Swagger paths)
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/api/patients/v1/blogs") && 
               !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtBlogValidationMiddleware>(); }
// Admin service validation middleware - ADMIN or DOCTOR role for GET report templates
app.UseWhen(
    context => (context.Request.Path.StartsWithSegments("/api/admin/v1/report-templates") ||
                context.Request.Path.StartsWithSegments("/api/admin/api/v1/report-templates")) &&
               (context.Request.Method.Equals("GET", StringComparison.OrdinalIgnoreCase)) &&
               !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtAdminOrDoctorValidationMiddleware>(); }
);

// Admin service validation middleware - ADMIN role only for POST/PUT report templates
app.UseWhen(
    context => (context.Request.Path.StartsWithSegments("/api/admin/v1/report-templates") ||
                context.Request.Path.StartsWithSegments("/api/admin/api/v1/report-templates")) &&
               (context.Request.Method.Equals("POST", StringComparison.OrdinalIgnoreCase) ||
                context.Request.Method.Equals("PUT", StringComparison.OrdinalIgnoreCase)) &&
               !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtAdminValidationMiddleware>(); }
);

// Admin service validation middleware - ADMIN role for all other admin endpoints
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/api/admin") &&
               !context.Request.Path.StartsWithSegments("/api/admin/v1/report-templates") &&
               !context.Request.Path.StartsWithSegments("/api/admin/api/v1/report-templates") &&
               !context.Request.Path.StartsWithSegments("/swagger"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtAdminValidationMiddleware>(); }
);

// Map Swagger endpoints before Ocelot to ensure proper routing
app.MapGet("/health", () => Results.Ok("OK"));

// Swagger configuration - only handle local Swagger endpoint and UI
if (app.Environment.IsDevelopment())
{
    // Only apply Swagger JSON middleware to the local endpoint
    app.MapWhen(
        context => context.Request.Path == "/swagger/v1/swagger.json",
        subApp =>
        {
            subApp.UseSwagger(c =>
            {
                c.RouteTemplate = "swagger/v1/swagger.json";
            });
        }
    );
    
    // Apply SwaggerUI only to UI paths, not JSON endpoints
    app.MapWhen(
        context => context.Request.Path.StartsWithSegments("/swagger") && 
                   !(context.Request.Path.Value?.EndsWith(".json", StringComparison.OrdinalIgnoreCase) ?? false),
        subApp =>
        {
            subApp.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Gateway");
                c.SwaggerEndpoint("/swagger/auth/swagger.json", "Auth Service");
                c.SwaggerEndpoint("/swagger/doctors/swagger.json", "Doctor Service");
                c.SwaggerEndpoint("/swagger/patients/swagger.json", "Patient Service");
                c.SwaggerEndpoint("/swagger/admin/swagger.json", "Admin Service");
                c.RoutePrefix = "swagger";
            });
        }
    );
}

await app.UseOcelot();

app.Run();

public class ExtendedTimeoutHandler : DelegatingHandler
{
    private readonly TimeSpan _timeout = TimeSpan.FromMinutes(15); // 15 minutes

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(_timeout);
        
        try
        {
            return await base.SendAsync(request, timeoutCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.Token.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException($"Request timed out after {_timeout.TotalMinutes} minutes");
        }
    }
}

public class OverrideOcelotTimeoutHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Remove any existing timeout headers that Ocelot might have set
        request.Headers.Remove("Timeout");
        
        // Set our own timeout
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromMinutes(15));
        
        try
        {
            return await base.SendAsync(request, timeoutCts.Token);
        }
        catch (OperationCanceledException) when (timeoutCts.Token.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            throw new TimeoutException("Request timed out after 15 minutes");
        }
    }
}

public class DisabledTimeoutHandler : Ocelot.Requester.TimeoutDelegatingHandler
{
    public DisabledTimeoutHandler() : base(TimeSpan.FromMinutes(15))
    {
    }
}
