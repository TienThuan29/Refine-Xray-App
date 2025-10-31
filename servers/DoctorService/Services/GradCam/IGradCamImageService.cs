using DoctorService.Models;

namespace DoctorService.Services.GradCam
{
    public interface IGradCamImageService
    {
        Task<GradcamAnalyses> ProcessAndUploadGradCamImagesAsync(GradcamAnalyses gradcamAnalyses, string chatSessionId);
        Task<string> ConvertBase64ToImageAndUploadAsync(string base64Image, string fileName, string contentType);
    }
}

