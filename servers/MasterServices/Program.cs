using Microsoft.OpenApi.Models;
using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using DotNetEnv;
using MasterServices.Repositories;
using MasterServices.Services.Auth;
using MasterServices.Utils;
using MasterServices.Web.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

// Load .env file before building the application
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Add environment variables from .env file
builder.Configuration.AddEnvironmentVariables();

// Add AWS DynamoDB services with proper configuration
var awsRegion = builder.Configuration["AWS:Region"] ?? "us-east-1";
if (string.IsNullOrEmpty(awsRegion) || awsRegion.Contains("${"))
{
    awsRegion = "us-east-1"; // Default fallback
}

builder.Services.AddAWSService<IAmazonDynamoDB>(new AWSOptions
{
    Region = Amazon.RegionEndpoint.GetBySystemName(awsRegion)
});

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Add services
builder.Services.AddScoped<JwtUtil>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Add JWT Authentication
var jwtSecret = builder.Configuration["Jwt:JwtSecret"] ?? throw new InvalidOperationException("JWT_SECRET is not configured");
var key = Encoding.ASCII.GetBytes(jwtSecret);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Master Services", Version = "v1" });
    
    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {   
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(o => 
    o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod())
);

var app = builder.Build();

app.UseCors();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { message = "OK", timestamp = DateTime.UtcNow }));

// Apply middleware
app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/v1/auth/profile") ||
    context.Request.Path.StartsWithSegments("/api/v1/auth/users"),
    appBuilder => 
    {
        appBuilder.UseJwtValidationMiddleware();
        appBuilder.UseRouting();
        appBuilder.UseEndpoints(endpoints => endpoints.MapControllers());
    });

app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/v1/auth/register"),
    appBuilder => 
    {
        appBuilder.UseSystemSecretMiddleware();
        appBuilder.UseRouting();
        appBuilder.UseEndpoints(endpoints => endpoints.MapControllers());
    }
);

// Map all other controllers without JWT validation
app.MapControllers();

app.Run();
