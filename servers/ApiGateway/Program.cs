using Microsoft.Extensions.Http;
using Microsoft.OpenApi.Models;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddJsonFile(
    "ocelot.json",
    optional: false, reloadOnChange: true
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

builder.Services.AddOcelot()
    .AddDelegatingHandler<ExtendedTimeoutHandler>()
    .AddDelegatingHandler<OverrideOcelotTimeoutHandler>();

builder.Services.AddSingleton<Ocelot.Requester.TimeoutDelegatingHandler, DisabledTimeoutHandler>();
builder.Services.AddHttpClient();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "API Gateway");
        c.SwaggerEndpoint("/swagger/auth/swagger.json", "Auth Service");
        c.SwaggerEndpoint("/swagger/doctors/swagger.json", "Doctor Service");
        c.SwaggerEndpoint("/swagger/patients/swagger.json", "Patient Service");
        c.SwaggerEndpoint("/swagger/admin/swagger.json", "Admin Service");
        c.RoutePrefix = "swagger";
    });
}

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
// System secret validation middleware
app.UseMiddleware<ApiGateway.Middleware.SystemSecretValidationMiddleware>();

// doctor service validation middleware
app.UseWhen(
    context => context.Request.Path.StartsWithSegments("/api/doctors"),
    subApp => { subApp.UseMiddleware<ApiGateway.Middleware.JwtDoctorValidationMiddleware>(); }
);

app.MapGet("/health", () => Results.Ok("OK"));

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
