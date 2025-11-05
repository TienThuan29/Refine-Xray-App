using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PatientService.Models;
using PatientService.Repositories;

namespace PatientService.Repositories.PatientReport
{
    public class PatientReportRepository : DynamoRepository, IPatientReportRepository
    {
        private new readonly string _tableName;
        private readonly ILogger<PatientReportRepository> _logger;

        public PatientReportRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<PatientReportRepository> logger) : base(dynamoDbClient, configuration, logger)
        {
            _tableName = configuration["DynamoDB:PatientReportTable"] ?? "prm392-patient-reports";
            _logger = logger;
        }

        public async Task<Models.PatientReport?> CreatePatientReportAsync(Models.PatientReport report)
        {
            try
            {
                report.Id = Guid.NewGuid().ToString();
                var item = PatientReportDynamoMapper.PatientReportToDynamoItem(report);
                var response = await PutItemAsync(item, _tableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(report.Id);
                }
                return null;
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
                var key = new Dictionary<string, AttributeValue> { { "id", new AttributeValue { S = reportId } } };
                var response = await GetItemAsync(key, _tableName);
                if (response.Item.Count == 0)
                {
                    return null;
                }
                return PatientReportDynamoMapper.DynamoItemToPatientReport(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding patient report");
                throw;
            }
        }

        public async Task<List<Models.PatientReport>> FindByPatientEmailAsync(string patientEmail)
        {
            try
            {
                var filterExpression = "patient_email = :email";
                var expressionAttributeValues = new Dictionary<string, AttributeValue>
                {
                    [":email"] = new AttributeValue { S = patientEmail }
                };

                var request = new ScanRequest
                {
                    TableName = _tableName,
                    FilterExpression = filterExpression,
                    ExpressionAttributeValues = expressionAttributeValues
                };

                var response = await _dynamoDBClient.ScanAsync(request);
                if (response.Items == null || response.Items.Count == 0)
                {
                    return new List<Models.PatientReport>();
                }

                return response.Items
                    .Select(PatientReportDynamoMapper.DynamoItemToPatientReport)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding patient reports by email");
                throw;
            }
        }

        public async Task<bool> DeletePatientReportAsync(string reportId)
        {
            try
            {
                var key = new Dictionary<string, AttributeValue> { { "id", new AttributeValue { S = reportId } } };
                var response = await DeleteItemAsync(key, _tableName);
                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient report");
                throw;
            }
        }

        public async Task<Models.PatientReport?> UpdatePatientReportAsync(Models.PatientReport report)
        {
            try
            {
                var existing = await FindByIdAsync(report.Id);
                if (existing == null)
                {
                    return null;
                }

                var item = PatientReportDynamoMapper.PatientReportToDynamoItem(report);
                var response = await PutItemAsync(item, _tableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(report.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient report");
                throw;
            }
        }
    }
}

