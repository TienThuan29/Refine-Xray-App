using Microsoft.AspNetCore.Mvc;
using AdminService.Services.ReportTemplate;
using AdminService.Web.Requests;
using AdminService.Web.Responses;
using AdminService.Libs;

namespace AdminService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/report-templates")]
    public class ReportTemplateController : ControllerBase
    {
        private readonly IReportTemplateService _reportTemplateService;
        private readonly ILogger<ReportTemplateController> _logger;

        public ReportTemplateController(
            IReportTemplateService reportTemplateService,
            ILogger<ReportTemplateController> logger)
        {
            _reportTemplateService = reportTemplateService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<ReportTemplateResponse>>> CreateReportTemplate(IFormFile file, [FromForm] string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("User ID is required", 400);
                }

                if (file == null || file.Length == 0)
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("File is required", 400);
                }

                var created = await _reportTemplateService.CreateAsync(file, userId);
                if (created == null)
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("Failed to create report template", 500);
                }

                return ResponseUtil.Success(created, "Report template created successfully", 201);
            }
            catch (ArgumentException ex)
            {
                return ResponseUtil.Error<ReportTemplateResponse>(ex.Message, 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report template");
                return ResponseUtil.Error<ReportTemplateResponse>("Error creating report template", 500, ex.Message);
            }
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<ReportTemplateResponse>>>> GetAllReportTemplates()
        {
            try
            {
                var templates = await _reportTemplateService.GetAllAsync();
                return ResponseUtil.Success(templates, "Report templates retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all report templates");
                return ResponseUtil.Error<List<ReportTemplateResponse>>("Error getting report templates", 500, ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<ReportTemplateResponse>>> GetReportTemplateById(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("Id is required", 400);
                }

                var template = await _reportTemplateService.GetByIdAsync(id);
                if (template == null)
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("Report template not found", 404);
                }

                return ResponseUtil.Success(template, "Report template retrieved successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report template by ID: {Id}", id);
                return ResponseUtil.Error<ReportTemplateResponse>("Error getting report template", 500, ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<ReportTemplateResponse>>> UpdateReportTemplate(
            string id,
            [FromForm] UpdateReportTemplateRequest? request = null,
            [FromForm] IFormFile? file = null)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("Id is required", 400);
                }

                // If no request body, create empty request
                if (request == null)
                {
                    request = new UpdateReportTemplateRequest();
                }

                // Handle activate/deactivate via IsDeleted field
                // If IsDeleted is explicitly set in form data, use it
                var form = await Request.ReadFormAsync();
                if (form.ContainsKey("isDeleted"))
                {
                    if (bool.TryParse(form["isDeleted"].ToString(), out var isDeleted))
                    {
                        request.IsDeleted = isDeleted;
                    }
                }

                var updated = await _reportTemplateService.UpdateAsync(id, file, request);
                if (updated == null)
                {
                    return ResponseUtil.Error<ReportTemplateResponse>("Report template not found or update failed", 404);
                }

                return ResponseUtil.Success(updated, "Report template updated successfully", 200);
            }
            catch (ArgumentException ex)
            {
                return ResponseUtil.Error<ReportTemplateResponse>(ex.Message, 400);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report template: {Id}", id);
                return ResponseUtil.Error<ReportTemplateResponse>("Error updating report template", 500, ex.Message);
            }
        }
    }
}
