using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using DoctorService.Models;
using DoctorService.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DoctorService.Repositories.Report
{
    public class ReportRepository : DynamoRepository, IReportRepository
    {
        private readonly string _reportTableName;

        public ReportRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<ReportRepository> logger
        ) : base(dynamoDbClient, configuration, logger)
        {
            _reportTableName = configuration["DynamoDB:ReportTable"] ?? "Reports";
        }

        public async Task<Models.Report?> CreateReportAsync(Models.Report report)
        {
            try
            {
                if (string.IsNullOrEmpty(report.Id))
                {
                    report.Id = Guid.NewGuid().ToString();
                }

                report.CreatedDate = DateTime.UtcNow;
                report.UpdatedDate = DateTime.UtcNow;
                report.IsSent = false;

                var dynamoItem = ReportMapper.ReportToDynamoItem(report);
                var response = await PutItemAsync(dynamoItem, _reportTableName);

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(report.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating report");
                return null;
            }
        }

        public async Task<Models.Report?> FindByIdAsync(string reportId)
        {
            try
            {
                var key = ReportMapper.CreateKey(reportId);
                var response = await GetItemAsync(key, _reportTableName);

                if (response.Item.Count == 0)
                {
                    return null;
                }

                return ReportMapper.DynamoItemToReport(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding report by ID: {ReportId}", reportId);
                return null;
            }
        }

        public async Task<List<Models.Report>?> FindReportsByChatSessionIdAsync(string chatSessionId)
        {
            try
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _reportTableName,
                    FilterExpression = "chatSessionId = :chatSessionId",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":chatSessionId"] = new AttributeValue { S = chatSessionId }
                    }
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);

                var reports = new List<Models.Report>();
                foreach (var item in response.Items)
                {
                    reports.Add(ReportMapper.DynamoItemToReport(item));
                }

                return reports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding reports by chat session ID: {ChatSessionId}", chatSessionId);
                return null;
            }
        }

        public async Task<List<Models.Report>?> FindReportsByPatientEmailAsync(string patientEmail)
        {
            try
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _reportTableName,
                    FilterExpression = "patientEmail = :patientEmail",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":patientEmail"] = new AttributeValue { S = patientEmail }
                    }
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);

                var reports = new List<Models.Report>();
                foreach (var item in response.Items)
                {
                    reports.Add(ReportMapper.DynamoItemToReport(item));
                }

                return reports;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding reports by patient email: {PatientEmail}", patientEmail);
                return null;
            }
        }

        public async Task<Models.Report?> UpdateReportAsync(Models.Report report)
        {
            try
            {
                // Check if report exists
                var existingReport = await FindByIdAsync(report.Id);
                if (existingReport == null)
                {
                    return null;
                }

                // Ensure IsSent cannot be changed if it was already sent
                if (existingReport.IsSent && !report.IsSent)
                {
                    _logger.LogWarning("Attempted to unsend a report that was already sent: {ReportId}", report.Id);
                    // Don't allow unsending
                    report.IsSent = true;
                }

                // If marking as sent, set SentDate
                if (report.IsSent && !existingReport.IsSent && !report.SentDate.HasValue)
                {
                    report.SentDate = DateTime.UtcNow;
                }

                report.UpdatedDate = DateTime.UtcNow;
                
                // Preserve CreatedDate
                if (!report.CreatedDate.HasValue && existingReport.CreatedDate.HasValue)
                {
                    report.CreatedDate = existingReport.CreatedDate;
                }

                var dynamoItem = ReportMapper.ReportToDynamoItem(report);
                var response = await PutItemAsync(dynamoItem, _reportTableName);

                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(report.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating report: {ReportId}", report.Id);
                return null;
            }
        }

        public async Task<bool> DeleteReportAsync(string reportId)
        {
            try
            {
                var key = ReportMapper.CreateKey(reportId);
                var response = await DeleteItemAsync(key, _reportTableName);

                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting report: {ReportId}", reportId);
                return false;
            }
        }
    }
}
