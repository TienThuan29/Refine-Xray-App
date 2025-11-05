using Microsoft.AspNetCore.Mvc;
using DoctorService.Services.Report;
using DoctorService.Web.Requests;
using DoctorService.Libs;
using DoctorService.Models;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/reports")]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;
        private readonly ILogger<ReportController> _logger;

        public ReportController(
            IReportService reportService,
            ILogger<ReportController> logger)
        {
            _reportService = reportService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<Report>>> CreateReport([FromBody] CreateReportRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Content))
                {
                    return ResponseUtil.Error<Report>("Content is required", 400);
                }

                var report = await _reportService.CreateReportAsync(request);
                if (report == null)
                {
                    return ResponseUtil.Error<Report>("Failed to create report", 500);
                }

                return ResponseUtil.Success(report, "Report created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report");
                return ResponseUtil.Error<Report>("Internal Server Error", 500);
            }
        }

        [HttpGet("{reportId}")]
        public async Task<ActionResult<ApiResponse<Report>>> GetReportById([FromRoute] string reportId)
        {
            try
            {
                var report = await _reportService.GetReportByIdAsync(reportId);
                if (report == null)
                {
                    return ResponseUtil.Error<Report>("Report not found", 404);
                }

                return ResponseUtil.Success(report, "Report found successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report by ID: {ReportId}", reportId);
                return ResponseUtil.Error<Report>("Internal Server Error", 500);
            }
        }

        [HttpGet("chat-session/{chatSessionId}")]
        public async Task<ActionResult<ApiResponse<List<Report>>>> GetReportsByChatSessionId([FromRoute] string chatSessionId)
        {
            try
            {
                var reports = await _reportService.GetReportsByChatSessionIdAsync(chatSessionId);
                if (reports == null)
                {
                    return ResponseUtil.Error<List<Report>>("Failed to retrieve reports", 500);
                }

                return ResponseUtil.Success(reports, "Reports retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reports by chat session ID: {ChatSessionId}", chatSessionId);
                return ResponseUtil.Error<List<Report>>("Internal Server Error", 500);
            }
        }

        [HttpGet("patient/{patientEmail}")]
        public async Task<ActionResult<ApiResponse<List<Report>>>> GetReportsByPatientEmail([FromRoute] string patientEmail)
        {
            try
            {
                var reports = await _reportService.GetReportsByPatientEmailAsync(patientEmail);
                if (reports == null)
                {
                    return ResponseUtil.Error<List<Report>>("Failed to retrieve reports", 500);
                }

                return ResponseUtil.Success(reports, "Reports retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting reports by patient email: {PatientEmail}", patientEmail);
                return ResponseUtil.Error<List<Report>>("Internal Server Error", 500);
            }
        }

        [HttpPut("{reportId}")]
        public async Task<ActionResult<ApiResponse<Report>>> UpdateReport(
            [FromRoute] string reportId,
            [FromBody] UpdateReportRequest request)
        {
            try
            {
                var report = await _reportService.UpdateReportAsync(reportId, request);
                if (report == null)
                {
                    return ResponseUtil.Error<Report>("Report not found or cannot be updated", 404);
                }

                return ResponseUtil.Success(report, "Report updated successfully", 200);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Cannot update report: {ReportId}", reportId);
                return ResponseUtil.Error<Report>(ex.Message, 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report: {ReportId}", reportId);
                return ResponseUtil.Error<Report>("Internal Server Error", 500);
            }
        }

        [HttpPost("{reportId}/send")]
        public async Task<ActionResult<ApiResponse<Report>>> SendReport([FromRoute] string reportId)
        {
            try
            {
                var report = await _reportService.SendReportAsync(reportId);
                if (report == null)
                {
                    return ResponseUtil.Error<Report>("Report not found", 404);
                }

                return ResponseUtil.Success(report, "Report sent successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending report: {ReportId}", reportId);
                return ResponseUtil.Error<Report>("Internal Server Error", 500);
            }
        }

        [HttpDelete("{reportId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteReport([FromRoute] string reportId)
        {
            try
            {
                var deleted = await _reportService.DeleteReportAsync(reportId);
                if (!deleted)
                {
                    return ResponseUtil.Error<object>("Report not found or deletion failed", 404);
                }

                return ResponseUtil.Success((object)new { deleted = true }, "Report deleted successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report: {ReportId}", reportId);
                return ResponseUtil.Error<object>("Internal Server Error", 500);
            }
        }
    }
}
