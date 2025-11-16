using Microsoft.OpenApi.Models;
using Amazon.DynamoDBv2;
using Amazon.S3;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using DotNetEnv;
using DoctorService.Repositories.Folder;
using DoctorService.Repositories.ChatSession;
using DoctorService.Repositories.Report;
using DoctorService.Repositories.S3;
using DoctorService.Services.Folder;
using DoctorService.Services.ChatSession;
using DoctorService.Services.Report;
using DoctorService.Services.CliniAI;
using DoctorService.Services.GradCam;
using System.Text.Json;
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

var awsOptions = new AWSOptions
{
    Region = RegionEndpoint.GetBySystemName(awsRegion)
};

if (!string.IsNullOrEmpty(awsAccessKey) && !string.IsNullOrEmpty(awsSecretKey))
{
    awsOptions.Credentials = new Amazon.Runtime.BasicAWSCredentials(awsAccessKey, awsSecretKey);
}

builder.Services.AddAWSService<IAmazonDynamoDB>(awsOptions);
builder.Services.AddAWSService<IAmazonS3>(awsOptions);
builder.Services.AddScoped<IFolderRepository, FolderRepository>();
builder.Services.AddScoped<IChatSessionRepository, ChatSessionRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IS3Repository, S3Repository>();
builder.Services.AddScoped<IFolderService, FolderService>();
builder.Services.AddScoped<IChatSessionService, ChatSessionService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<ICliniAiService, CliniAiService>();
builder.Services.AddScoped<IGradCamImageService, GradCamImageService>();

builder.Services.AddHttpClient<ICliniAiService, CliniAiService>(client =>
{
    var baseUrl = builder.Configuration["CliniAI:BaseUrl"];
    if (string.IsNullOrEmpty(baseUrl) || baseUrl.Contains("${") || baseUrl == "${CLINI_BASE_URL:}")
    {
        baseUrl = "http://localhost:8000";
    }
    
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

// PubMed RAG API
builder.Services.AddHttpClient("PubMedRAG", client =>
{
    var baseUrl = builder.Configuration["PubMedRAG:BaseUrl"];
    if (string.IsNullOrEmpty(baseUrl) || baseUrl.Contains("${"))
    {
        baseUrl = "http://localhost:8001";
    }
    
    var timeout = builder.Configuration.GetValue("PubMedRAG:Timeout", 300); // 5 minutes default
    
    client.BaseAddress = new Uri(baseUrl);
    client.Timeout = TimeSpan.FromSeconds(timeout);
    client.DefaultRequestHeaders.Add("User-Agent", "DoctorService/1.0");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler()
{
    UseCookies = false,
    AllowAutoRedirect = true
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.WriteIndented = false;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Doctor Services", Version = "v1" });
});
builder.Services.AddHostedService<DoctorService.Utils.DynamoWarmupHostedService>();

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

