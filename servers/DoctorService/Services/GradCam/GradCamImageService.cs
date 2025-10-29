using DoctorService.Models;
using DoctorService.Repositories.S3;

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
                
                // Log the input data to debug
                _logger.LogInformation("Input GradCam data - Top1Pneumothorax: {Length1}, Top2Atelectasis: {Length2}, Top3Edema: {Length3}, Top4Pneumonia: {Length4}, Top5PleuralThickening: {Length5}", 
                    gradcamAnalyses.Top1Pneumothorax?.Length ?? 0,
                    gradcamAnalyses.Top2Atelectasis?.Length ?? 0,
                    gradcamAnalyses.Top3Edema?.Length ?? 0,
                    gradcamAnalyses.Top4Pneumonia?.Length ?? 0,
                    gradcamAnalyses.Top5PleuralThickening?.Length ?? 0);

                var processedGradcamAnalyses = new GradcamAnalyses();

                // Process each GradCam image
                var tasks = new List<Task<(string Property, string Url)>>();

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top1Pneumothorax))
                {
                    _logger.LogInformation("Processing Top1Pneumothorax image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top1Pneumothorax, $"gradcam/{chatSessionId}/top1_pneumothorax.png", chatSessionId, "Top1Pneumothorax"));
                }
                else
                {
                    _logger.LogWarning("Top1Pneumothorax base64 data is empty for session {ChatSessionId}", chatSessionId);
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top2Atelectasis))
                {
                    _logger.LogInformation("Processing Top2Atelectasis image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top2Atelectasis, $"gradcam/{chatSessionId}/top2_atelectasis.png", chatSessionId, "Top2Atelectasis"));
                }
                else
                {
                    _logger.LogWarning("Top2Atelectasis base64 data is empty for session {ChatSessionId}", chatSessionId);
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top3Edema))
                {
                    _logger.LogInformation("Processing Top3Edema image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top3Edema, $"gradcam/{chatSessionId}/top3_edema.png", chatSessionId, "Top3Edema"));
                }
                else
                {
                    _logger.LogWarning("Top3Edema base64 data is empty for session {ChatSessionId}", chatSessionId);
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top4Pneumonia))
                {
                    _logger.LogInformation("Processing Top4Pneumonia image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top4Pneumonia, $"gradcam/{chatSessionId}/top4_pneumonia.png", chatSessionId, "Top4Pneumonia"));
                }
                else
                {
                    _logger.LogWarning("Top4Pneumonia base64 data is empty for session {ChatSessionId}", chatSessionId);
                }

                if (!string.IsNullOrEmpty(gradcamAnalyses.Top5PleuralThickening))
                {
                    _logger.LogInformation("Processing Top5PleuralThickening image for session {ChatSessionId}", chatSessionId);
                    tasks.Add(ProcessGradCamImageAsync(gradcamAnalyses.Top5PleuralThickening, $"gradcam/{chatSessionId}/top5_pleural_thickening.png", chatSessionId, "Top5PleuralThickening"));
                }
                else
                {
                    _logger.LogWarning("Top5PleuralThickening base64 data is empty for session {ChatSessionId}", chatSessionId);
                }

                // Wait for all uploads to complete
                var results = await Task.WhenAll(tasks);

                // Update the processed GradCam analyses with S3 URLs
                foreach (var (property, url) in results)
                {
                    _logger.LogInformation("Processed {Property}: {Url}", property, url);
                    switch (property)
                    {
                        case "Top1Pneumothorax":
                            processedGradcamAnalyses.Top1Pneumothorax = url;
                            break;
                        case "Top2Atelectasis":
                            processedGradcamAnalyses.Top2Atelectasis = url;
                            break;
                        case "Top3Edema":
                            processedGradcamAnalyses.Top3Edema = url;
                            break;
                        case "Top4Pneumonia":
                            processedGradcamAnalyses.Top4Pneumonia = url;
                            break;
                        case "Top5PleuralThickening":
                            processedGradcamAnalyses.Top5PleuralThickening = url;
                            break;
                    }
                }

                _logger.LogInformation("Successfully processed {Count} GradCam images for chat session: {ChatSessionId}", results.Length, chatSessionId);
                _logger.LogInformation("Final processed GradCam URLs - Top1Pneumothorax: {Url1}, Top2Atelectasis: {Url2}, Top3Edema: {Url3}, Top4Pneumonia: {Url4}, Top5PleuralThickening: {Url5}", 
                    processedGradcamAnalyses.Top1Pneumothorax,
                    processedGradcamAnalyses.Top2Atelectasis,
                    processedGradcamAnalyses.Top3Edema,
                    processedGradcamAnalyses.Top4Pneumonia,
                    processedGradcamAnalyses.Top5PleuralThickening);
                
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

        private async Task<(string Property, string Url)> ProcessGradCamImageAsync(string base64Image, string fileName, string chatSessionId, string propertyName)
        {
            try
            {
                _logger.LogInformation("Starting to process {Property} for session {ChatSessionId}, base64 length: {Length}", propertyName, chatSessionId, base64Image?.Length ?? 0);
                
                var s3Url = await ConvertBase64ToImageAndUploadAsync(base64Image ?? string.Empty, fileName, "image/png");
                
                if (string.IsNullOrEmpty(s3Url))
                {
                    _logger.LogWarning("S3 upload returned empty URL for {Property} in session {ChatSessionId}", propertyName, chatSessionId);
                    return (propertyName, string.Empty);
                }
                
                _logger.LogInformation("Successfully processed GradCam image {Property} for session {ChatSessionId}: {Url}", propertyName, chatSessionId, s3Url);
                return (propertyName, s3Url);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GradCam image {Property} for session {ChatSessionId}: {ErrorMessage}", propertyName, chatSessionId, ex.Message);
                // Return empty string for failed uploads
                return (propertyName, string.Empty);
            }
        }
    }
}
