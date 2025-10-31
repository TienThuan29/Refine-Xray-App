using Microsoft.OpenApi.Models;
using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using DotNetEnv;
using IdentityService.Repositories.User;
using IdentityService.Services.Auth;
using IdentityService.Utils;
using IdentityService.Web.Middlewares;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

Env.Load();
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

// Add AWS DynamoDB
var awsRegion = builder.Configuration["AWS:Region"] ??
    throw new InvalidOperationException("AWS_REGION is not configured");
var awsAccessKey = builder.Configuration["AWS:AccessKey"] ??
    throw new InvalidOperationException("AWS_ACCESS_KEY is not configured");
var awsSecretKey = builder.Configuration["AWS:SecretKey"] ??
    throw new InvalidOperationException("AWS_SECRET_KEY is not configured");

// Configure AWS credentials from appsettings.json
var regionEndpoint = RegionEndpoint.GetBySystemName(awsRegion);
var awsOptions = new AWSOptions
{
    Region = regionEndpoint
};

// Use BasicAWSCredentials if AccessKey and SecretKey are provided
if (!string.IsNullOrEmpty(awsAccessKey) && !string.IsNullOrEmpty(awsSecretKey))
{
    awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(awsAccessKey, awsSecretKey);
}

builder.Services.AddAWSService<IAmazonDynamoDB>(awsOptions);

// Add repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();

// Add services
builder.Services.AddScoped<JwtUtil>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddHostedService<DynamoWarmupHostedService>();

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
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Identity Services", Version = "v1" });
    
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

// Log AWS DynamoDB configuration on startup
var logger = app.Services.GetRequiredService<ILogger<Program>>();
var userTableName = builder.Configuration["DynamoDB:UserTable"] ?? "";
logger.LogInformation("=== AWS DynamoDB Configuration ===");
logger.LogInformation("Region: {Region} ({RegionDisplayName})", awsRegion, regionEndpoint.DisplayName);
logger.LogInformation("RegionEndpoint SystemName: {RegionEndpoint}", regionEndpoint.SystemName);
logger.LogInformation("UserTable: {UserTable}", string.IsNullOrEmpty(userTableName) ? "Not configured" : userTableName);
logger.LogInformation("====================================");

app.UseCors();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseSwagger();
app.UseSwaggerUI();

// Apply middleware
app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/v1/profile") ||
    (context.Request.Path.StartsWithSegments("/api/v1/users") && 
     !context.Request.Path.StartsWithSegments("/api/v1/users/create-account")),
    appBuilder => 
    {
        appBuilder.UseJwtValidationMiddleware();
        appBuilder.UseRouting();
        appBuilder.UseEndpoints(endpoints => endpoints.MapControllers());
    });

app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/v1/register") ||
    context.Request.Path.StartsWithSegments("/api/v1/users/create-account"),
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

