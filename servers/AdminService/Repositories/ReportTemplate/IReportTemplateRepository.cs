using AdminService.Models;

namespace AdminService.Repositories.ReportTemplate
{
    public interface IReportTemplateRepository
    {
        Task<Models.ReportTemplate?> CreateAsync(Models.ReportTemplate reportTemplate);
        Task<Models.ReportTemplate?> FindByIdAsync(string id);
        Task<List<Models.ReportTemplate>> FindAllAsync();
        Task<Models.ReportTemplate?> UpdateAsync(string id, Models.ReportTemplate reportTemplate);
        Task<bool> DeleteAsync(string id);
    }
}

