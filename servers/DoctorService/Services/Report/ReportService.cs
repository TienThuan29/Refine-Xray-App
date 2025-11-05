using DoctorService.Models;
using DoctorService.Repositories.Report;
using DoctorService.Web.Requests;
using Microsoft.Extensions.Logging;

namespace DoctorService.Services.Report
{
    public class ReportService : IReportService
    {
        private readonly IReportRepository _reportRepository;
        private readonly ILogger<ReportService> _logger;

        public ReportService(
            IReportRepository reportRepository,
            ILogger<ReportService> logger)
        {
            _reportRepository = reportRepository;
            _logger = logger;
        }

        public async Task<Models.Report?> CreateReportAsync(CreateReportRequest request)
        {
            try
            {
                var report = new Models.Report
                {
                    Id = Guid.NewGuid().ToString(),
                    Title = request.Title,
                    TemplateId = request.TemplateId,
                    Content = request.Content,
                    ChatSessionId = request.ChatSessionId,
                    PatientEmail = request.PatientEmail,
                    IsSent = false
                };

                return await _reportRepository.CreateReportAsync(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report");
                return null;
            }
        }

        public async Task<Models.Report?> GetReportByIdAsync(string reportId)
        {
            try
            {
                return await _reportRepository.FindByIdAsync(reportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report by ID: {ReportId}", reportId);
                return null;
            }
        }

        public async Task<List<Models.Report>?> GetReportsByChatSessionIdAsync(string chatSessionId)
        {
            try
            {
                return await _reportRepository.FindReportsByChatSessionIdAsync(chatSessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reports by chat session ID: {ChatSessionId}", chatSessionId);
                return null;
            }
        }

        public async Task<List<Models.Report>?> GetReportsByPatientEmailAsync(string patientEmail)
        {
            try
            {
                return await _reportRepository.FindReportsByPatientEmailAsync(patientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reports by patient email: {PatientEmail}", patientEmail);
                return null;
            }
        }

        public async Task<Models.Report?> UpdateReportAsync(string reportId, UpdateReportRequest request)
        {
            try
            {
                var existingReport = await _reportRepository.FindByIdAsync(reportId);
                if (existingReport == null)
                {
                    return null;
                }

                // Check if report is already sent - cannot edit content if IsSent is true
                // But allow updating IsSent and SentDate to handle send/unsend operations
                if (existingReport.IsSent && (request.Content != null || request.Title != null || request.TemplateId != null))
                {
                    _logger.LogWarning("Attempted to update content of a report that was already sent: {ReportId}", reportId);
                    throw new InvalidOperationException("Cannot update content of a report that has already been sent");
                }

                // Update fields
                existingReport.Title = request.Title ?? existingReport.Title;
                existingReport.Content = request.Content ?? existingReport.Content;
                existingReport.TemplateId = request.TemplateId ?? existingReport.TemplateId;
                existingReport.PatientEmail = request.PatientEmail ?? existingReport.PatientEmail;
                
                // Update IsSent and SentDate if provided (for send/unsend operations)
                if (request.IsSent.HasValue)
                {
                    existingReport.IsSent = request.IsSent.Value;
                }
                
                if (request.SentDate != null)
                {
                    if (DateTime.TryParse(request.SentDate, out var sentDate))
                    {
                        existingReport.SentDate = sentDate;
                    }
                }
                else if (request.IsSent.HasValue && !request.IsSent.Value)
                {
                    // If unsetting IsSent, clear SentDate
                    existingReport.SentDate = null;
                }

                return await _reportRepository.UpdateReportAsync(existingReport);
            }
            catch (InvalidOperationException)
            {
                throw; // Re-throw validation exceptions
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report: {ReportId}", reportId);
                return null;
            }
        }

        public async Task<bool> DeleteReportAsync(string reportId)
        {
            try
            {
                return await _reportRepository.DeleteReportAsync(reportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report: {ReportId}", reportId);
                return false;
            }
        }

        public async Task<Models.Report?> SendReportAsync(string reportId)
        {
            try
            {
                var report = await _reportRepository.FindByIdAsync(reportId);
                if (report == null)
                {
                    return null;
                }

                if (report.IsSent)
                {
                    _logger.LogWarning("Attempted to send a report that was already sent: {ReportId}", reportId);
                    return report; // Already sent, return as is
                }

                report.IsSent = true;
                report.SentDate = DateTime.UtcNow;

                return await _reportRepository.UpdateReportAsync(report);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending report: {ReportId}", reportId);
                return null;
            }
        }
    }
}
