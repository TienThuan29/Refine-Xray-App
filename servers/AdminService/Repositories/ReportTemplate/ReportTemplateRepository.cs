using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using AdminService.Models;
using AdminService.Repositories;

namespace AdminService.Repositories.ReportTemplate
{
    public class ReportTemplateRepository : DynamoRepository, IReportTemplateRepository
    {
        private new readonly string _tableName;
        private new readonly ILogger<ReportTemplateRepository> _logger;

        public ReportTemplateRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<ReportTemplateRepository> logger
        ) : base(dynamoDbClient, configuration, logger)
        {
            _tableName = configuration["DynamoDB:ReportTemplateTable"] ?? "prm392-report-templates";
            _logger = logger;
            
            var awsRegion = configuration["AWS:Region"] ?? "Not configured";
            logger.LogInformation("ReportTemplateRepository initialized - Region: {Region}, Table: {Table}", awsRegion, _tableName);
        }

        public async Task<Models.ReportTemplate?> CreateAsync(Models.ReportTemplate reportTemplate)
        {
            try
            {
                reportTemplate.Id = Guid.NewGuid().ToString();
                reportTemplate.CreatedDate = DateTime.UtcNow;
                reportTemplate.UpdatedDate = DateTime.UtcNow;
                reportTemplate.IsDeleted = false;

                var dynamoItem = ReportTemplateMapper.ReportTemplateToDynamoItem(reportTemplate);
                var response = await PutItemAsync(dynamoItem, _tableName);

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(reportTemplate.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report template");
                throw;
            }
        }

        public async Task<Models.ReportTemplate?> FindByIdAsync(string id)
        {
            try
            {
                var key = ReportTemplateMapper.CreateKey(id);
                var response = await GetItemAsync(key, _tableName);

                if (response.Item.Count == 0)
                {
                    return null;
                }

                return ReportTemplateMapper.DynamoItemToReportTemplate(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding report template by ID: {Id}", id);
                throw;
            }
        }

        public async Task<List<Models.ReportTemplate>> FindAllAsync()
        {
            try
            {
                var response = await ScanAsync(_tableName);

                if (response.Items == null || response.Items.Count == 0)
                {
                    return new List<Models.ReportTemplate>();
                }

                return response.Items
                    .Select(ReportTemplateMapper.DynamoItemToReportTemplate)
                    .Where(rt => !rt.IsDeleted)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning report templates");
                throw;
            }
        }

        public async Task<Models.ReportTemplate?> UpdateAsync(string id, Models.ReportTemplate reportTemplate)
        {
            try
            {
                var existing = await FindByIdAsync(id);
                if (existing == null)
                {
                    return null;
                }
                existing.Template = reportTemplate.Template;
                existing.FileLink = reportTemplate.FileLink;
                existing.IsDeleted = reportTemplate.IsDeleted;
                existing.UpdatedDate = DateTime.UtcNow;

                var dynamoItem = ReportTemplateMapper.ReportTemplateToDynamoItem(existing);
                var response = await PutItemAsync(dynamoItem, _tableName);

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report template: {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(string id)
        {
            try
            {
                var existing = await FindByIdAsync(id);
                if (existing == null)
                {
                    return false;
                }

                // Soft delete
                existing.IsDeleted = true;
                existing.UpdatedDate = DateTime.UtcNow;

                var dynamoItem = ReportTemplateMapper.ReportTemplateToDynamoItem(existing);
                var response = await PutItemAsync(dynamoItem, _tableName);

                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report template: {Id}", id);
                throw;
            }
        }
    }
}

