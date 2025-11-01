using AdminService.Models;
using AdminService.Repositories.ReportTemplate;
using AdminService.Repositories.S3;
using AdminService.Utils;
using AdminService.Web.Requests;
using AdminService.Web.Responses;

namespace AdminService.Services.ReportTemplate
{
    public class ReportTemplateService : IReportTemplateService
    {
        private readonly IReportTemplateRepository _repository;
        private readonly IS3Repository _s3Repository;
        private readonly ILogger<ReportTemplateService> _logger;

        public ReportTemplateService(
            IReportTemplateRepository repository,
            IS3Repository s3Repository,
            ILogger<ReportTemplateService> logger)
        {
            _repository = repository;
            _s3Repository = s3Repository;
            _logger = logger;
        }

        public async Task<ReportTemplateResponse?> CreateAsync(IFormFile file, string createBy)
        {
            try
            {
                // Validate file
                if (file == null || file.Length == 0)
                {
                    throw new ArgumentException("File is required");
                }

                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (extension != ".docx" && extension != ".pdf")
                {
                    throw new ArgumentException("Only .docx and .pdf files are supported");
                }

                // Read file bytes
                byte[] fileBytes;
                using (var memoryStream = new MemoryStream())
                {
                    await file.CopyToAsync(memoryStream);
                    fileBytes = memoryStream.ToArray();
                }

                // Convert to markdown
                var markdownTemplate = MarkDownConverter.ConvertToMarkdown(fileBytes, file.FileName);

                // Upload file to S3
                var fileName = $"report-templates/{Guid.NewGuid()}{extension}";
                var contentType = extension == ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
                var fileLink = await _s3Repository.UploadFileAsync(fileBytes, fileName, contentType);

                // Create report template
                var reportTemplate = new Models.ReportTemplate
                {
                    Template = markdownTemplate,
                    FileLink = fileLink,
                    CreateBy = createBy,
                    IsDeleted = false
                };

                var created = await _repository.CreateAsync(reportTemplate);
                if (created == null)
                {
                    return null;
                }

                return MapToResponse(created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report template");
                throw;
            }
        }

        public async Task<List<ReportTemplateResponse>> GetAllAsync()
        {
            try
            {
                var templates = await _repository.FindAllAsync();
                return templates.Select(MapToResponse).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all report templates");
                throw;
            }
        }

        public async Task<ReportTemplateResponse?> GetByIdAsync(string id)
        {
            try
            {
                var template = await _repository.FindByIdAsync(id);
                if (template == null)
                {
                    return null;
                }

                return MapToResponse(template);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting report template by ID: {Id}", id);
                throw;
            }
        }

        public async Task<ReportTemplateResponse?> UpdateAsync(string id, IFormFile? file, UpdateReportTemplateRequest request)
        {
            try
            {
                var existing = await _repository.FindByIdAsync(id);
                if (existing == null)
                {
                    return null;
                }

                var updateTemplate = new Models.ReportTemplate
                {
                    Template = existing.Template,
                    FileLink = existing.FileLink
                };

                // If file is provided, process it
                if (file != null && file.Length > 0)
                {
                    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                    if (extension != ".docx" && extension != ".pdf")
                    {
                        throw new ArgumentException("Only .docx and .pdf files are supported");
                    }

                    // Read file bytes
                    byte[] fileBytes;
                    using (var memoryStream = new MemoryStream())
                    {
                        await file.CopyToAsync(memoryStream);
                        fileBytes = memoryStream.ToArray();
                    }

                    // Convert to markdown
                    var markdownTemplate = MarkDownConverter.ConvertToMarkdown(fileBytes, file.FileName);
                    updateTemplate.Template = markdownTemplate;

                    // Delete old file from S3 if exists
                    if (!string.IsNullOrEmpty(existing.FileLink))
                    {
                        try
                        {
                            var oldFileName = existing.FileLink.Split('/').Last();
                            await _s3Repository.DeleteFileAsync($"report-templates/{oldFileName}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to delete old file from S3");
                        }
                    }

                    // Upload new file to S3
                    var fileName = $"report-templates/{Guid.NewGuid()}{extension}";
                    var contentType = extension == ".docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : "application/pdf";
                    var fileLink = await _s3Repository.UploadFileAsync(fileBytes, fileName, contentType);
                    updateTemplate.FileLink = fileLink;
                }
                else
                {
                    // Use provided values or keep existing
                    updateTemplate.Template = request.Template ?? existing.Template;
                    updateTemplate.FileLink = request.FileLink ?? existing.FileLink;
                }

                // Update IsDeleted if provided, otherwise keep existing value
                if (request.IsDeleted.HasValue)
                {
                    updateTemplate.IsDeleted = request.IsDeleted.Value;
                }
                else
                {
                    updateTemplate.IsDeleted = existing.IsDeleted;
                }

                var updated = await _repository.UpdateAsync(id, updateTemplate);
                if (updated == null)
                {
                    return null;
                }

                return MapToResponse(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report template: {Id}", id);
                throw;
            }
        }

        private ReportTemplateResponse MapToResponse(Models.ReportTemplate template)
        {
            return new ReportTemplateResponse
            {
                Id = template.Id,
                Template = template.Template,
                FileLink = template.FileLink,
                CreateBy = template.CreateBy,
                IsDeleted = template.IsDeleted,
                CreatedDate = template.CreatedDate,
                UpdatedDate = template.UpdatedDate
            };
        }
    }
}

