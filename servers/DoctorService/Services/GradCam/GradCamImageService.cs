using DoctorService.Models;
using DoctorService.Repositories.S3;
using System.Text.Json;

namespace DoctorService.Services.GradCam
{
    public class GradCamImageService : IGradCamImageService
    {
        private readonly IS3Repository _s3Repository;
        private readonly ILogger<GradCamImageService> _logger;

        public GradCamImageService(
            IS3Repository s3Repository,
            ILogger<GradCamImageService> logger)
        {
            _s3Repository = s3Repository;
            _logger = logger;
        }

        public async Task<GradcamAnalyses> ProcessAndUploadGradCamImagesAsync(GradcamAnalyses gradcamAnalyses, string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Processing GradCam images for chat session: {ChatSessionId}", chatSessionId);
                
                var processedGradcamAnalyses = new GradcamAnalyses
                {
                    DynamicKeys = new Dictionary<string, JsonElement>()
                };

                // Process each GradCam image
                var tasks = new List<Task<(string Key, string Url)>>();

                // Process dynamic keys from JsonExtensionData (e.g., "top1_Hernia", "top2_Cardiomegaly", etc.)
                if (gradcamAnalyses.DynamicKeys != null && gradcamAnalyses.DynamicKeys.Any())
                {
                    _logger.LogInformation("Processing {Count} dynamic GradCam keys for session {ChatSessionId}", gradcamAnalyses.DynamicKeys.Count, chatSessionId);
                    
                    foreach (var kvp in gradcamAnalyses.DynamicKeys.OrderBy(k => k.Key))
                    {
                        var base64Value = kvp.Value.GetString();
                        if (!string.IsNullOrEmpty(base64Value))
                        {
                            var fileName = $"gradcam/{chatSessionId}/{kvp.Key.ToLower()}.png";
                            
                            _logger.LogInformation("Processing {Key} image for session {ChatSessionId}", kvp.Key, chatSessionId);
                            tasks.Add(ProcessGradCamImageAsync(base64Value, fileName, chatSessionId, kvp.Key));
                        }
                    }
                }

                // Also process fixed properties for backward compatibility
                if (!string.IsNullOrEmpty(gradcamAnalyses.Top1Pneumothorax))
                {
                    _logger.LogInformation("Processing Top1Pneumothorax image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top1Pneumothorax, $"gradcam/{chatSessionId}/top1_pneumothorax.png", chatSessionId, "top1_Pneumothorax"));
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top2Atelectasis))
                {
                    _logger.LogInformation("Processing Top2Atelectasis image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top2Atelectasis, $"gradcam/{chatSessionId}/top2_atelectasis.png", chatSessionId, "top2_Atelectasis"));
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top3Edema))
                {
                    _logger.LogInformation("Processing Top3Edema image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top3Edema, $"gradcam/{chatSessionId}/top3_edema.png", chatSessionId, "top3_Edema"));
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top4Pneumonia))
                {
                    _logger.LogInformation("Processing Top4Pneumonia image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top4Pneumonia, $"gradcam/{chatSessionId}/top4_pneumonia.png", chatSessionId, "top4_Pneumonia"));
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top5PleuralThickening))
                {
                    _logger.LogInformation("Processing Top5PleuralThickening image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top5PleuralThickening, $"gradcam/{chatSessionId}/top5_pleural_thickening.png", chatSessionId, "top5_Pleural_Thickening"));
                }

                // Wait for all uploads to complete
                var results = await Task.WhenAll(tasks);

                // Update the processed GradCam analyses with S3 URLs
                foreach (var (key, url) in results)
                {
                    _logger.LogInformation("Processed {Key}: {Url}", key, url);
                    
                    // Store in DynamicKeys dictionary only
                    if (processedGradcamAnalyses.DynamicKeys == null)
                    {
                        processedGradcamAnalyses.DynamicKeys = new Dictionary<string, JsonElement>();
                    }
                    // Convert URL string to JsonElement and store in DynamicKeys
                    // Note: We store as a string value, not as JsonElement containing a string
                    processedGradcamAnalyses.DynamicKeys[key] = JsonSerializer.SerializeToElement(url);
                    
                    // Don't populate fixed properties to avoid duplication in DynamoDB
                    // All data is stored in DynamicKeys dictionary
                }

                _logger.LogInformation("Successfully processed {Count} GradCam images for chat session: {ChatSessionId}", results.Length, chatSessionId);
                
                return processedGradcamAnalyses;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GradCam images for chat session: {ChatSessionId}", chatSessionId);
                throw;
            }
        }

        public async Task<string> ConvertBase64ToImageAndUploadAsync(string base64Image, string fileName, string contentType)
        {
            try
            {
                if (string.IsNullOrEmpty(base64Image))
                {
                    _logger.LogWarning("Base64 image data is null or empty for file: {FileName}", fileName);
                    throw new ArgumentException("Base64 image data cannot be null or empty", nameof(base64Image));
                }

                _logger.LogInformation("Processing base64 image for file: {FileName}, base64 length: {Length}", fileName, base64Image.Length);

                // Remove data URL prefix if present (e.g., "data:image/png;base64,")
                var base64Data = base64Image.Contains(',') 
                    ? base64Image.Split(',')[1] 
                    : base64Image;

                _logger.LogInformation("Base64 data after prefix removal: {Length} characters", base64Data.Length);

                // Convert base64 to byte array
                var imageBytes = Convert.FromBase64String(base64Data);
                
                _logger.LogInformation("Converted base64 to image bytes: {Size} bytes", imageBytes.Length);

                if (imageBytes.Length == 0)
                {
                    _logger.LogWarning("Image bytes array is empty for file: {FileName}", fileName);
                    return string.Empty;
                }

                // Upload to S3
                _logger.LogInformation("Starting S3 upload for file: {FileName}", fileName);
                var s3Url = await _s3Repository.UploadFileAsync(imageBytes, fileName, contentType);
                
                if (string.IsNullOrEmpty(s3Url))
                {
                    _logger.LogError("S3 upload returned empty URL for file: {FileName}", fileName);
                    return string.Empty;
                }

                _logger.LogInformation("Successfully uploaded image to S3: {FileName} -> {Url}", fileName, s3Url);
                return s3Url;
            }
            catch (ArgumentException ex)
            {
                _logger.LogError(ex, "Invalid base64 data for file: {FileName}", fileName);
                return string.Empty;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting base64 image to file and uploading: {FileName}, Error: {ErrorMessage}", fileName, ex.Message);
                return string.Empty; // Return empty string instead of throwing to prevent breaking the entire process
            }
        }

        private async Task<(string Key, string Url)> ProcessGradCamImageAsync(string base64Image, string fileName, string chatSessionId, string key)
        {
            try
            {
                _logger.LogInformation("Starting to process {Key} for session {ChatSessionId}, base64 length: {Length}", key, chatSessionId, base64Image?.Length ?? 0);
                
                var s3Url = await ConvertBase64ToImageAndUploadAsync(base64Image ?? string.Empty, fileName, "image/png");
                
                if (string.IsNullOrEmpty(s3Url))
                {
                    _logger.LogWarning("S3 upload returned empty URL for {Key} in session {ChatSessionId}", key, chatSessionId);
                    return (key, string.Empty);
                }
                
                _logger.LogInformation("Successfully processed GradCam image {Key} for session {ChatSessionId}: {Url}", key, chatSessionId, s3Url);
                return (key, s3Url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GradCam image {Key} for session {ChatSessionId}: {ErrorMessage}", key, chatSessionId, ex.Message);
                // Return empty string for failed uploads
                return (key, string.Empty);
            }
        }
    }
}
