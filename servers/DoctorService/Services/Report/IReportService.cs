using DoctorService.Models;
using DoctorService.Web.Requests;

namespace DoctorService.Services.Report
{
    public interface IReportService
    {
        Task<Models.Report?> CreateReportAsync(CreateReportRequest request);
        Task<Models.Report?> GetReportByIdAsync(string reportId);
        Task<List<Models.Report>?> GetReportsByChatSessionIdAsync(string chatSessionId);
        Task<List<Models.Report>?> GetReportsByPatientEmailAsync(string patientEmail);
        Task<Models.Report?> UpdateReportAsync(string reportId, UpdateReportRequest request);
        Task<bool> DeleteReportAsync(string reportId);
        Task<Models.Report?> SendReportAsync(string reportId);
    }
}
