using DoctorService.Web.Responses;
using System.Text.Json;

namespace DoctorService.Services.CliniAI
{
    public class CliniAiService : ICliniAiService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<CliniAiService> _logger;

        private readonly string _analyzeUrl = "/radiology/analyze";
        private readonly string _xrayDetectionUrl = "/xray/detect";

        public CliniAiService(
            HttpClient httpClient,
            ILogger<CliniAiService> logger
        ){
            _httpClient = httpClient;
            _logger = logger;
            // BaseUrl is now set in HttpClient configuration, so we don't need to store it here
        }

        // public async Task<CliniAiResponse?> GetXrayDetectionResultAsync(byte[] xrayImage)
        // {
            
        // }

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
                
                _logger.LogInformation("Image size: {ImageSize} bytes", xrayImage.Length);
                
                // Add form fields
                // formData.Add(
                //     new StringContent(
                //         hyperParams.ConfidenceThreshold.ToString(
                //             System.Globalization.CultureInfo.InvariantCulture)
                //         ), 
                //         "confidence_threshold"
                // );
                if (!string.IsNullOrEmpty(hyperParams.ModelPath))
                {
                    formData.Add(new StringContent(hyperParams.ModelPath), "model_path");
                }
                _logger.LogInformation("Making request to CliniAI: {Url}", _analyzeUrl);
                _logger.LogInformation("Form data content type: {ContentType}", formData.Headers.ContentType);
                _logger.LogInformation("Form data boundary: {Boundary}", formData.Headers.ContentType?.Parameters?.FirstOrDefault(p => p.Name == "boundary")?.Value);
                _logger.LogInformation("HttpClient timeout: {Timeout}", _httpClient.Timeout);
                _logger.LogInformation("HttpClient BaseAddress: {BaseAddress}", _httpClient.BaseAddress);
                
                // Add a cancellation token with timeout
                using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(25));
                _logger.LogInformation("Starting HTTP request to CliniAI service...");
                
                var response = await _httpClient.PostAsync(_analyzeUrl, formData, cts.Token);
                
                _logger.LogInformation("HTTP request completed successfully");
                
                _logger.LogInformation("CliniAI response status: {StatusCode}", response.StatusCode);
                _logger.LogInformation("CliniAI response headers: {Headers}", string.Join(", ", response.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}")));
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("CliniAI API error: {StatusCode} - {ErrorContent}", response.StatusCode, errorContent);
                    return null;
                }
                
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("CliniAI response received: {ResponseLength} characters", responseContent.Length);
                
                var cliniAiResponse = JsonSerializer.Deserialize<CliniAiResponse>(responseContent, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (cliniAiResponse == null)
                {
                    _logger.LogError("Failed to deserialize CliniAI response");
                    return null;
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
                ModelPath = string.Empty
            };
        }

        private class HyperParams
        {
            public double ConfidenceThreshold { get; set; }
            public string ModelPath { get; set; } = string.Empty;
        }
    }
}
