using AdminService.Models;
using AdminService.Web.Requests;
using AdminService.Web.Responses;

namespace AdminService.Services.ReportTemplate
{
    public interface IReportTemplateService
    {
        Task<ReportTemplateResponse?> CreateAsync(IFormFile file, string createBy, string? name = null);
        Task<List<ReportTemplateResponse>> GetAllAsync();
        Task<ReportTemplateResponse?> GetByIdAsync(string id);
        Task<ReportTemplateResponse?> UpdateAsync(string id, IFormFile? file, UpdateReportTemplateRequest request);
    }
}

