using Microsoft.OpenApi.Models;
using Amazon.DynamoDBv2;
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using DotNetEnv;
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
builder.Services.AddAWSService<Amazon.S3.IAmazonS3>(awsOptions);

// Add HTTP client for IdentityService
builder.Services.AddHttpClient();
builder.Services.AddScoped<AdminService.Repositories.ReportTemplate.IReportTemplateRepository, AdminService.Repositories.ReportTemplate.ReportTemplateRepository>();
builder.Services.AddScoped<AdminService.Repositories.S3.IS3Repository, AdminService.Repositories.S3.S3Repository>();
builder.Services.AddScoped<AdminService.Services.ReportTemplate.IReportTemplateService, AdminService.Services.ReportTemplate.ReportTemplateService>();
builder.Services.AddHttpClient<AdminService.Services.IUserService   , AdminService.Services.UserService>(client =>
{
    var baseUrl = builder.Configuration["UserService:BaseUrl"] ?? "http://localhost:8082";
    client.BaseAddress = new Uri(baseUrl);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
    client.DefaultRequestHeaders.Add("x-system-secret", builder.Configuration["SystemSecret:Value"]);
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Admin Services", Version = "v1" });
});
builder.Services.AddHostedService<AdminService.Utils.DynamoWarmupHostedService>();

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

