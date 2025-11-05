using DoctorService.Models;

namespace DoctorService.Repositories.Report
{
    public interface IReportRepository
    {
        Task<Models.Report?> CreateReportAsync(Models.Report report);
        Task<Models.Report?> FindByIdAsync(string reportId);
        Task<List<Models.Report>?> FindReportsByChatSessionIdAsync(string chatSessionId);
        Task<List<Models.Report>?> FindReportsByPatientEmailAsync(string patientEmail);
        Task<Models.Report?> UpdateReportAsync(Models.Report report);
        Task<bool> DeleteReportAsync(string reportId);
    }
}
