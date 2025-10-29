using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using DoctorService.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DoctorService.Repositories.PatientProfile
{
    public class PatientProfileRepository : DynamoRepository, IPatientProfileRepository
    {
        private new readonly ILogger<PatientProfileRepository> _logger;
        private new readonly string _tableName;

        public PatientProfileRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<PatientProfileRepository> logger) : base(dynamoDbClient, configuration, logger)
        {
            _logger = logger;
            _tableName = configuration["DynamoDB:PatientProfileTable"] ?? "prm392-patient-profiles";
        }

        public async Task<Models.PatientProfile?> CreatePatientProfileAsync(Models.PatientProfile patientProfile)
        {
            try
            {
                patientProfile.Id = Guid.NewGuid().ToString();
                
                var item = DynamoMapper.PatientProfileToDynamoItem(patientProfile);
                var response = await PutItemAsync(item, _tableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    _logger.LogInformation("Successfully created patient profile with ID: {PatientProfileId}", patientProfile.Id);
                    return await FindByIdAsync(patientProfile.Id);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating patient profile");
                throw;
            }
        }

        public async Task<Models.PatientProfile?> FindByIdAsync(string patientProfileId)
        {
            try
            {
                var key = new Dictionary<string, AttributeValue>
                {
                    ["id"] = new AttributeValue { S = patientProfileId }
                };

                var response = await GetItemAsync(key, _tableName);
                
                if (response.Item.Count == 0)
                {
                    return null;
                }

                return DynamoMapper.DynamoItemToPatientProfile(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error finding patient profile with ID: {patientProfileId}");
                throw;
            }
        }
    }
}

