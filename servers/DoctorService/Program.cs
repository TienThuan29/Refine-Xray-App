using Microsoft.OpenApi.Models;
using Amazon.DynamoDBv2;
using Amazon.S3;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using DotNetEnv;
using DoctorService.Repositories.Folder;
using DoctorService.Repositories.PatientProfile;
using DoctorService.Repositories.ChatSession;
using DoctorService.Repositories.S3;
using DoctorService.Services.Folder;
using DoctorService.Services.PatientProfile;
using DoctorService.Services.ChatSession;
using DoctorService.Services.CliniAI;
using DoctorService.Services.GradCam;
using System.Text.Json.Serialization;

Env.Load();
var builder = WebApplication.CreateBuilder(args);
builder.Configuration.AddEnvironmentVariables();

var awsRegion = builder.Configuration["AWS:Region"] ?? "us-east-1";
var awsAccessKey = builder.Configuration["AWS:AccessKey"];
var awsSecretKey = builder.Configuration["AWS:SecretKey"];

if (string.IsNullOrEmpty(awsRegion) || awsRegion.Contains("${"))
{
    awsRegion = "us-east-1"; 
}

// Configure AWS credentials from appsettings.json
var awsOptions = new AWSOptions
{
    Region = RegionEndpoint.GetBySystemName(awsRegion)
};

// Use BasicAWSCredentials if AccessKey and SecretKey are provided
if (!string.IsNullOrEmpty(awsAccessKey) && !string.IsNullOrEmpty(awsSecretKey))
{
    awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(awsAccessKey, awsSecretKey);
}

builder.Services.AddAWSService<IAmazonDynamoDB>(awsOptions);
builder.Services.AddAWSService<IAmazonS3>(awsOptions);

// Add repositories
builder.Services.AddScoped<IFolderRepository, FolderRepository>();
builder.Services.AddScoped<IPatientProfileRepository, PatientProfileRepository>();
builder.Services.AddScoped<IChatSessionRepository, ChatSessionRepository>();
builder.Services.AddScoped<IS3Repository, S3Repository>();

// Add services
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<IPatientProfileService, PatientProfileService>();
builder.Services.AddScoped<IChatSessionService, ChatSessionService>();
builder.Services.AddScoped<ICliniAiService, CliniAiService>();
builder.Services.AddScoped<IGradCamImageService, GradCamImageService>();

// Add HTTP client for CliniAI service
builder.Services.AddHttpClient<ICliniAiService, CliniAiService>(client =>
{
    var baseUrl = builder.Configuration["CliniAI:BaseUrl"] ?? "http://localhost:8000";
    var timeout = builder.Configuration.GetValue("CliniAI:Timeout", 1200); // 20 minutes default
    
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(timeout);
    client.DefaultRequestHeaders.Add("User-Agent", "DoctorService/1.0");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("Connection", "keep-alive");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler()
{
    UseCookies = false,
    AllowAutoRedirect = true,
    MaxRequestContentBufferSize = 1024 * 1024 * 100 // 100MB buffer
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Doctor Services", Version = "v1" });
});

builder.Services.AddCors(o => 
    o.AddDefaultPolicy(p => p.AllowAnyOrigin()
    .AllowAnyHeader()
    .AllowAnyMethod()
));

var app = builder.Build();

app.UseCors();
app.UseRouting();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();

app.Run();

