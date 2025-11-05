using PatientService.Repositories.PatientReport;
using Microsoft.Extensions.Logging;
using PatientService.Models;

namespace PatientService.Services.PatientReport
{
    public class PatientReportService : IPatientReportService
    {
        private readonly IPatientReportRepository _patientReportRepository;
        private readonly ILogger<PatientReportService> _logger;

        public PatientReportService(
            IPatientReportRepository patientReportRepository,
            ILogger<PatientReportService> logger)
        {
            _patientReportRepository = patientReportRepository;
            _logger = logger;
        }

        public async Task<Models.PatientReport?> CreatePatientReportAsync(Models.PatientReport report)
        {
            try
            {
                var savedReport = await _patientReportRepository.CreatePatientReportAsync(report);
                if (savedReport == null)
                {
                    _logger.LogError("Failed to create patient report");
                    return null;
                }
                _logger.LogInformation("Successfully created patient report {ReportId}", savedReport.Id);
                return savedReport;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating patient report");
                throw;
            }
        }

        public async Task<Models.PatientReport?> FindByIdAsync(string reportId)
        {
            try
            {
                return await _patientReportRepository.FindByIdAsync(reportId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding patient report with ID: {ReportId}", reportId);
                throw;
            }
        }

        public async Task<List<Models.PatientReport>> FindByPatientEmailAsync(string patientEmail)
        {
            try
            {
                return await _patientReportRepository.FindByPatientEmailAsync(patientEmail);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving patient reports for email: {Email}", patientEmail);
                throw;
            }
        }

        public async Task<bool> DeletePatientReportAsync(string reportId)
        {
            try
            {
                var deleted = await _patientReportRepository.DeletePatientReportAsync(reportId);
                if (deleted)
                {
                    _logger.LogInformation("Deleted patient report {ReportId}", reportId);
                }
                else
                {
                    _logger.LogWarning("Attempted to delete patient report {ReportId} but it was not found", reportId);
                }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient report {ReportId}", reportId);
                throw;
            }
        }

        public async Task<Models.PatientReport?> MarkAsReadAsync(string reportId)
        {
            try
            {
                var report = await _patientReportRepository.FindByIdAsync(reportId);
                if (report == null)
                {
                    _logger.LogWarning("Attempted to mark report {ReportId} as read but it was not found", reportId);
                    return null;
                }

                report.IsRead = true;
                var updated = await _patientReportRepository.UpdatePatientReportAsync(report);
                if (updated != null)
                {
                    _logger.LogInformation("Marked patient report {ReportId} as read", reportId);
                }

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking patient report {ReportId} as read", reportId);
                throw;
            }
        }
    }
}

