using Microsoft.AspNetCore.Mvc;
using PatientService.Libs;
using PatientService.Models;
using PatientService.Services.PatientReport;
using PatientService.Services.Identity;
using PatientService.Web.Requests;
using PatientService.Web.Responses;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/patient-reports")]
    public class PatientReportController : ControllerBase
    {
        private readonly IPatientReportService _patientReportService;
        private readonly IIdentityService _identityService;

        public PatientReportController(
            IPatientReportService patientReportService,
            IIdentityService identityService)
        {
            _patientReportService = patientReportService;
            _identityService = identityService;
        }

        [HttpPost]
        [Consumes("application/json")]
        public async Task<IActionResult> Create([FromBody] PatientReportRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ResponseUtil.Validation("Validation failed", ModelState);
            }

            try
            {
                // Validate patient email exists
                if (!string.IsNullOrEmpty(request.PatientEmail))
                {
                    var userFullname = await _identityService.GetUserFullnameByEmailAsync(request.PatientEmail);
                    if (userFullname == null)
                    {
                        return ResponseUtil.Error<PatientReportResponse>("Patient email not found in the system", 404);
                    }
                }

                var report = MapToModel(request);
                var created = await _patientReportService.CreatePatientReportAsync(report);
                if (created == null)
                {
                    return ResponseUtil.Error<PatientReportResponse>("Failed to create patient report");
                }

                var response = MapToResponse(created);
                return ResponseUtil.Success(response, "Patient report created", 201);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error creating patient report", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _patientReportService.DeletePatientReportAsync(id);
                if (!deleted)
                {
                    return ResponseUtil.Error<PatientReportResponse>("Patient report not found", 404);
                }

                return ResponseUtil.Success(new { }, "Patient report deleted");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error deleting patient report", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpGet("patient/{email}")]
        public async Task<IActionResult> GetByPatientEmail(string email)
        {
            try
            {
                var reports = await _patientReportService.FindByPatientEmailAsync(email);
                var responses = reports.Select(MapToResponse).ToList();
                return ResponseUtil.Success(responses);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching patient reports", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(string id)
        {
            try
            {
                var updated = await _patientReportService.MarkAsReadAsync(id);
                if (updated == null)
                {
                    return ResponseUtil.Error<PatientReportResponse>("Patient report not found", 404);
                }

                var response = MapToResponse(updated);
                return ResponseUtil.Success(response, "Patient report marked as read");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error marking patient report as read", error: ex.Message, stack: ex.StackTrace);
            }
        }

        private static PatientReportResponse MapToResponse(PatientReport report)
        {
            return new PatientReportResponse
            {
                Id = report.Id,
                Title = report.Title,
                Content = report.Content,
                PatientEmail = report.PatientEmail,
                IsSent = report.IsSent,
                SentDate = report.SentDate,
                IsRead = report.IsRead,
                SentById = report.SentById,
                SentByFullname = report.SentByFullname
            };
        }

        private static PatientReport MapToModel(PatientReportRequest request)
        {
            return new PatientReport
            {
                Title = request.Title,
                Content = request.Content,
                PatientEmail = request.PatientEmail,
                IsSent = request.IsSent,
                SentDate = request.SentDate,
                SentById = request.SentById,
                SentByFullname = request.SentByFullname
            };
        }
    }
}

