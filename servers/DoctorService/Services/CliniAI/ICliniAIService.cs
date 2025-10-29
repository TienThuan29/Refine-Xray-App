using DoctorService.Web.Responses;

namespace DoctorService.Services.CliniAI
{
    public interface ICliniAiService
    {
        Task<bool> IsServiceAvailableAsync();
        Task<CliniAiResponse?> GetAnalyzeResultAsync(byte[] xrayImage);
    }
}

