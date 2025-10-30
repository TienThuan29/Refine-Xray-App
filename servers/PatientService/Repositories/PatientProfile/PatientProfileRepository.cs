using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PatientService.Models;
using PatientService.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PatientService.Repositories.PatientProfile
{
    public class PatientProfileRepository : DynamoRepository, IPatientProfileRepository
    {
        private new readonly string _tableName;
        private readonly ILogger<PatientProfileRepository> _logger;

        public PatientProfileRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<PatientProfileRepository> logger) : base(dynamoDbClient, configuration, logger)
        {
            _tableName = configuration["DynamoDB:PatientProfileTable"] ?? "prm392-patient-profiles";
            _logger = logger;
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
                var key = new Dictionary<string, AttributeValue> { { "id", new AttributeValue { S = patientProfileId } } };
                var response = await GetItemAsync(key, _tableName);
                if (response.Item.Count == 0)
                {
                    return null;
                }
                return DynamoMapper.DynamoItemToPatientProfile(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding patient profile");
                throw;
            }
        }

        public async Task<List<Models.PatientProfile>> FindAllAsync()
        {
            try
            {
                var response = await ScanAsync(_tableName);
                if (response.Items == null || response.Items.Count == 0)
                {
                    return new List<Models.PatientProfile>();
                }

                return response.Items
                    .Select(DynamoMapper.DynamoItemToPatientProfile)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning patient profiles");
                throw;
            }
        }

        public async Task<Models.PatientProfile?> UpdatePatientProfileAsync(Models.PatientProfile patientProfile)
        {
            try
            {
                var existing = await FindByIdAsync(patientProfile.Id);
                if (existing == null)
                {
                    return null;
                }

                var item = DynamoMapper.PatientProfileToDynamoItem(patientProfile);
                var response = await PutItemAsync(item, _tableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(patientProfile.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient profile");
                throw;
            }
        }

        public async Task<bool> DeletePatientProfileAsync(string patientProfileId)
        {
            try
            {
                var key = new Dictionary<string, AttributeValue> { { "id", new AttributeValue { S = patientProfileId } } };
                var response = await DeleteItemAsync(key, _tableName);
                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting patient profile");
                throw;
            }
        }
    }
}
