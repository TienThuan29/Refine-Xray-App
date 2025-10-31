using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using DoctorService.Models;
using DoctorService.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DoctorService.Repositories.Folder
{
    public class FolderRepository : DynamoRepository, IFolderRepository
    {
        private readonly string _folderTableName;

        public FolderRepository(
            IAmazonDynamoDB dynamoDbClient, 
            IConfiguration configuration, 
            ILogger<FolderRepository> logger
        ) : base(dynamoDbClient, configuration, logger)
        {
            _folderTableName = configuration["DynamoDB:FolderTable"] ?? "";
        }

        public async Task<Models.Folder?> CreateFolderAsync(Models.Folder folder)
        {
            try
            {
                folder.Id = Guid.NewGuid().ToString();
                folder.CreatedDate = DateTime.UtcNow;
                folder.UpdatedDate = DateTime.UtcNow;
                folder.IsDeleted = false;

                // Convert to DynamoDB item
                var dynamoItem = DynamoMapper.FolderToDynamoItem(folder);
                
                // Save to DynamoDB
                var response = await PutItemAsync(dynamoItem, _folderTableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(folder.Id);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating folder");
                return null;
            }
        }

        public async Task<Models.Folder?> UpdatePatientProfileIdAsync(string folderId, string patientProfileId)
        {
            try
            {
                var folder = await FindByIdAsync(folderId);
                if (folder == null)
                {
                    return null;
                }

                folder.PatientProfileId = patientProfileId;
                folder.UpdatedDate = DateTime.UtcNow;

                // Convert to DynamoDB item and save
                var dynamoItem = DynamoMapper.FolderToDynamoItem(folder);
                var response = await PutItemAsync(dynamoItem, _folderTableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(folderId);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient profile ID for folder: {FolderId}", folderId);
                return null;
            }
        }

        public async Task<Models.Folder?> FindByIdAsync(string folderId)
        {
            try
            {
                var key = DynamoMapper.CreateKey(folderId);
                var response = await GetItemAsync(key, _folderTableName);
                
                if (response.Item.Count == 0)
                {
                    return null;
                }
                
                return DynamoMapper.DynamoItemToFolder(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding folder by ID: {FolderId}", folderId);
                return null;
            }
        }

        public async Task<List<Models.Folder>?> FindFoldersByCreatedByAsync(string createdBy)
        {
            try
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _folderTableName,
                    FilterExpression = "createdBy = :createdBy AND isDeleted = :isDeleted",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":createdBy"] = new AttributeValue { S = createdBy },
                        [":isDeleted"] = new AttributeValue { BOOL = false }
                    }
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);
                
                var folders = new List<Models.Folder>();
                foreach (var item in response.Items)
                {
                    var folder = DynamoMapper.DynamoItemToFolder(item);
                    
                    // Check if this specific folder doesn't have type field in DynamoDB
                    if (!item.ContainsKey("type") || string.IsNullOrEmpty(item["type"].S))
                    {
                        // Old folder without type field - set default and save back to DB
                        folder.Type = FolderType.ANALYZE; // Ensure default is set
                        
                        // Save the type back to DB to update old folders
                        try
                        {
                            var dynamoItem = DynamoMapper.FolderToDynamoItem(folder);
                            await PutItemAsync(dynamoItem, _folderTableName);
                            _logger.LogInformation("Backfilled type field for folder {FolderId}: {Type}", folder.Id, folder.Type);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to backfill type for folder {FolderId}", folder.Id);
                            // Continue - folder still has default type set
                        }
                    }
                    
                    folders.Add(folder);
                }
                
                return folders;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding folders by created by: {CreatedBy}", createdBy);
                return null;
            }
        }

        public async Task<Models.Folder?> UpdateFolderAsync(string folderId, string title, string? description)
        {
            try
            {
                var folder = await FindByIdAsync(folderId);
                if (folder == null)
                {
                    return null;
                }
                folder.Title = title;
                folder.Description = description;
                folder.UpdatedDate = DateTime.UtcNow;

                var dynamoItem = DynamoMapper.FolderToDynamoItem(folder);
                var response = await PutItemAsync(dynamoItem, _folderTableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(folderId);
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating folder: {FolderId}", folderId);
                return null;
            }
        }

        public async Task<bool> SoftDeleteFolderAsync(string folderId)
        {
            try
            {
                var folder = await FindByIdAsync(folderId);
                if (folder == null)
                {
                    return false;
                }
                folder.IsDeleted = true;
                folder.UpdatedDate = DateTime.UtcNow;
                var dynamoItem = DynamoMapper.FolderToDynamoItem(folder);
                var response = await PutItemAsync(dynamoItem, _folderTableName);
                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error soft-deleting folder: {FolderId}", folderId);
                return false;
            }
        }
    }
}

