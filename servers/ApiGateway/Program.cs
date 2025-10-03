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
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddOcelot();

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
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

app.MapGet("/health", () => Results.Ok("OK"));

await app.UseOcelot();

app.Run();
