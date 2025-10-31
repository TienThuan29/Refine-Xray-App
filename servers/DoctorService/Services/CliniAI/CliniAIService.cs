using DoctorService.Web.Responses;
using System.Text.Json;
using System.Linq;

namespace DoctorService.Services.CliniAI
{
    public class CliniAiService : ICliniAiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CliniAiService> _logger;

        private readonly string _analyzeUrl = "/radiology/analyze-only";
        private readonly string _gradCamAnalysisUrl = "/radiology/gradcam-llm";
        private readonly string _xrayDetectionUrl = "/xray/detect";

        public CliniAiService(
            HttpClient httpClient,
            ILogger<CliniAiService> logger
        ){
            _httpClient = httpClient;
            _logger = logger;
            // BaseUrl is now set in HttpClient configuration, so we don't need to store it here
        }

        public async Task<bool> IsServiceAvailableAsync()
        {
            try
            {
                _logger.LogInformation("Checking CliniAI service availability at: {BaseAddress}/health", _httpClient.BaseAddress);
                var response = await _httpClient.GetAsync("/health");
                _logger.LogInformation("Health check response: {StatusCode}", response.StatusCode);
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed for CliniAI service");
                return false;
            }
        }

        public async Task<CliniAiResponse?> GetAnalyzeResultAsync(byte[] xrayImage)
        {
            Console.WriteLine("Getting analyze result from CliniAI ....");
            
            // First check if service is available
            var isAvailable = await IsServiceAvailableAsync();
            if (!isAvailable)
            {
                _logger.LogError("CliniAI service is not available");
                return null;
            }
            
            try
            {
                var hyperParams = GetHyperParams();
                // Create multipart form data
                using var formData = new MultipartFormDataContent();
                // Add the image file
                var imageContent = new ByteArrayContent(xrayImage);
                imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/png");
                formData.Add(imageContent, "image", "xray_image.png");
                
                // Add a cancellation token with timeout
                using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(25));
                var response = await _httpClient.PostAsync(_analyzeUrl, formData, cts.Token);
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("CliniAI API error: {StatusCode} - {ErrorContent}", response.StatusCode, errorContent);
                    return null;
                }
                
                var responseContent = await response.Content.ReadAsStringAsync();
                if (string.IsNullOrEmpty(responseContent))
                {
                    _logger.LogError("CliniAI response content is null or empty");
                    return null;
                }
                
                _logger.LogInformation("CliniAI raw response length: {Length} characters", responseContent.Length);
                
                // Log just the gradcam_analyses section for debugging (might be very long)
                try
                {
                    using (var jsonDoc = JsonDocument.Parse(responseContent))
                    {
                        if (jsonDoc.RootElement.TryGetProperty("gradcam_analyses", out var gradcamElement))
                        {
                            var gradcamKeys = gradcamElement.EnumerateObject().Select(p => p.Name).ToList();
                            _logger.LogInformation("Found gradcam_analyses with {Count} keys: {Keys}", gradcamKeys.Count, string.Join(", ", gradcamKeys));
                        }
                        else
                        {
                            _logger.LogWarning("gradcam_analyses property not found in response!");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error parsing JSON for debugging");
                }
                
                var cliniAiResponse = JsonSerializer.Deserialize<CliniAiResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (cliniAiResponse == null)
                {
                    _logger.LogError("Failed to deserialize CliniAI response");
                    return null;
                }
                
                // Log gradcam_analyses to debug
                if (cliniAiResponse.GradcamAnalyses != null)
                {
                    var dynamicKeysCount = cliniAiResponse.GradcamAnalyses.DynamicKeys?.Count ?? 0;
                    _logger.LogInformation("CliniAI GradcamAnalyses - DynamicKeys count: {Count}", dynamicKeysCount);
                    if (cliniAiResponse.GradcamAnalyses.DynamicKeys != null)
                    {
                        foreach (var key in cliniAiResponse.GradcamAnalyses.DynamicKeys.Keys)
                        {
                            _logger.LogInformation("GradcamAnalyses key: {Key}", key);
                        }
                    }
                }
                
                _logger.LogInformation("CliniAI analysis completed successfully");
                return cliniAiResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling CliniAI service");
                return null;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Request timeout calling CliniAI service");
                return null;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error for CliniAI response");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error calling CliniAI service");
                return null;
            }
        }

        private HyperParams GetHyperParams()
        {
            return new HyperParams
            {
                ConfidenceThreshold = 0.4,
            };
        }

        private class HyperParams
        {
            public double ConfidenceThreshold { get; set; }
            public string ModelPath { get; set; } = string.Empty;
        }
    }
}
